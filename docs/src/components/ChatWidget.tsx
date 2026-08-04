import { useEffect } from 'react';

interface ChatWidgetProps {
  projectId: string;
  primaryColor?: string;
  darkMode?: boolean;
}

export default function ChatWidget({ projectId, primaryColor = '#f04438', darkMode = false }: ChatWidgetProps) {
  useEffect(() => {
    // Load the Gately widget script
    const script = document.createElement('script');
    script.src = 'https://57d8b48f.gately-widget.pages.dev/gately-widget.iife.js';
    script.async = true;
    script.type = 'module';
    
    script.onload = () => {
      // Initialize the widget
      const widgetElement = document.createElement('gately-chat-widget');
      widgetElement.setAttribute('project-id', projectId);
      document.body.appendChild(widgetElement);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      const widget = document.querySelector('gately-chat-widget');
      if (widget) {
        widget.remove();
      }
      script.remove();
    };
  }, [projectId]);
  
  return null; // Widget renders itself
}
