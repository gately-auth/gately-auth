import { useEffect, useRef } from 'react';

interface NavigationLoadingBarProps {
  primaryColor?: string;
}

export function NavigationLoadingBar({ primaryColor = '#3b82f6' }: NavigationLoadingBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let rightEdge = 0;
    let leftEdge = 0;
    const barWidth = 50; // Wider bar - right reaches end before left follows

    const startLoading = () => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      rightEdge = 0;
      leftEdge = 0;
      
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
      }

      // Continuous left to right animation with trailing effect
      const animate = () => {
        rightEdge += 2;
        
        // When right edge reaches 100%, start moving left edge
        if (rightEdge > barWidth) {
          leftEdge = rightEdge - barWidth;
        }
        
        // Reset both when left edge reaches 100%
        if (leftEdge >= 100) {
          rightEdge = 0;
          leftEdge = 0;
        }
        
        if (barRef.current) {
          barRef.current.style.width = (rightEdge - leftEdge) + '%';
          barRef.current.style.marginLeft = leftEdge + '%';
        }
        
        if (isNavigatingRef.current) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    const completeLoading = () => {
      if (!isNavigatingRef.current) return;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Jump to 100% immediately
      if (barRef.current) {
        barRef.current.style.width = '100%';
      }

      // Fade out after a brief moment
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
        }
      }, 300);

      // Reset for next navigation
      setTimeout(() => {
        if (barRef.current) {
          barRef.current.style.width = '0%';
        }
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
        }
        isNavigatingRef.current = false;
      }, 600);
    };

    // Listen for navigation start - fires immediately when user clicks
    document.addEventListener('astro:before-preparation', startLoading);
    
    // Listen for navigation complete - fires when page is ready
    document.addEventListener('astro:after-preparation', completeLoading);

    return () => {
      document.removeEventListener('astro:before-preparation', startLoading);
      document.removeEventListener('astro:after-preparation', completeLoading);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 right-0 h-0.5 z-50"
      style={{
        opacity: 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        ref={barRef}
        style={{
          width: '0%',
          height: '100%',
          backgroundColor: primaryColor,
          boxShadow: `0 0 10px ${primaryColor}`,
          transition: 'width 0.05s linear',
        }}
      />
    </div>
  );
}
