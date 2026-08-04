import { useEffect, useRef, useState } from 'react';

interface CustomScalarReferenceProps {
  projectId: string;
  isDark?: boolean;
  primaryColor?: string;
  headingFont?: string | null;
  bodyFont?: string | null;
}

/**
 * Custom Scalar API Reference with Gately branding
 * Uses @scalar/api-reference with custom configuration
 */
export function CustomScalarReference({
  projectId,
  isDark = false,
  primaryColor = '#f04438',
  headingFont,
  bodyFont,
}: CustomScalarReferenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scalarAppRef = useRef<any>(null);

  console.log('[CustomScalarReference] Component mounted with projectId:', projectId);

  useEffect(() => {
    console.log('[CustomScalarReference] useEffect triggered');
    console.log('[CustomScalarReference] containerRef.current:', containerRef.current);
    
    if (!containerRef.current) {
      console.log('[CustomScalarReference] No container ref yet, will retry on next render');
      return;
    }
    
    let mounted = true;

    // Initialize Scalar with custom configuration
    const initScalar = async () => {
      console.log('[CustomScalarReference] Container ref exists, proceeding with initialization');

      // Construct the OpenAPI spec URL
      const apiBaseUrl = import.meta.env.PUBLIC_API_URL || 'https://api.usegately.com/api';
      const specUrl = `${apiBaseUrl}/public/projects/${projectId}/openapi`;

      console.log('[CustomScalarReference] Loading Scalar with spec URL:', specUrl);
      console.log('[CustomScalarReference] Config:', { isDark, primaryColor, headingFont, bodyFont });

      try {
        console.log('[CustomScalarReference] Starting dynamic import...');
        const module = await import('@scalar/api-reference');
        console.log('[CustomScalarReference] Import successful, module keys:', Object.keys(module));

        const config = {
          url: specUrl,
          theme: isDark ? 'dark' : 'light',
        layout: 'modern',
        customCss: `
        /* Gately Custom Styling */
        :root {
          --scalar-color-1: ${primaryColor};
          --scalar-color-2: ${primaryColor};
          --scalar-color-3: ${primaryColor};
          --scalar-color-accent: ${primaryColor};
          
          /* Fonts */
          ${headingFont ? `--scalar-font-heading: ${headingFont}, system-ui, sans-serif;` : ''}
          ${bodyFont ? `--scalar-font: ${bodyFont}, system-ui, sans-serif;` : ''}
          
          /* Border radius */
          --scalar-radius: 0.75rem;
          --scalar-radius-lg: 1rem;
          --scalar-radius-xl: 1.5rem;
        }
        
        ${isDark ? `
          /* Dark mode colors */
          .light-mode {
            --scalar-background-1: #09090b;
            --scalar-background-2: #18181b;
            --scalar-background-3: #27272a;
            --scalar-background-accent: ${primaryColor}15;
            
            --scalar-color-1: #fafafa;
            --scalar-color-2: #e4e4e7;
            --scalar-color-3: #a1a1aa;
            --scalar-color-muted: #71717a;
            
            --scalar-border-color: #3f3f46;
          }
        ` : `
          /* Light mode colors */
          .light-mode {
            --scalar-background-1: #ffffff;
            --scalar-background-2: #fafafa;
            --scalar-background-3: #f4f4f5;
            --scalar-background-accent: ${primaryColor}10;
            
            --scalar-color-1: #09090b;
            --scalar-color-2: #18181b;
            --scalar-color-3: #52525b;
            --scalar-color-muted: #71717a;
            
            --scalar-border-color: #e4e4e7;
          }
        `}
        
        /* Hide Scalar branding */
        .scalar-app-footer,
        .scalar-powered-by,
        [data-testid="scalar-footer"] {
          display: none !important;
        }
        
        /* Smooth scrolling */
        .scalar-app {
          scroll-behavior: smooth;
        }
        
        /* Method badges styling */
        .http-method {
          font-weight: 700;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
        }
        
        /* Request/Response panels */
        .scalar-card {
          border-radius: var(--scalar-radius-lg);
          border: 1px solid var(--scalar-border-color);
        }
        
        /* Code blocks */
        .scalar-code-block,
        pre {
          border-radius: var(--scalar-radius);
          font-family: 'Geist Mono', 'Monaco', 'Courier New', monospace;
        }
        
        /* Sidebar */
        .scalar-sidebar {
          border-right: 1px solid var(--scalar-border-color);
        }
        
        /* Try it button */
        .scalar-button-primary,
        button[data-variant="solid"] {
          background: ${primaryColor} !important;
          border-radius: var(--scalar-radius);
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .scalar-button-primary:hover,
        button[data-variant="solid"]:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        /* Search */
        .scalar-search-input {
          border-radius: var(--scalar-radius);
          border: 1px solid var(--scalar-border-color);
        }
        
        /* Headers */
        h1, h2, h3, h4, h5, h6 {
          ${headingFont ? `font-family: ${headingFont}, system-ui, sans-serif;` : ''}
        }
        
        /* Links */
        a {
          color: ${primaryColor};
        }
        
        a:hover {
          opacity: 0.8;
        }
        
        /* Active sidebar item */
        .scalar-sidebar-item--active {
          background: ${primaryColor}15;
          color: ${primaryColor};
          border-left: 2px solid ${primaryColor};
        }
        
        /* Response status badges */
        .status-code-200,
        .status-code-201,
        .status-code-204 {
          background: #22c55e1a;
          color: #16a34a;
          border: 1px solid #22c55e40;
        }
        
        .status-code-400,
        .status-code-401,
        .status-code-403,
        .status-code-404 {
          background: #f59e0b1a;
          color: #d97706;
          border: 1px solid #f59e0b40;
        }
        
        .status-code-500,
        .status-code-502,
        .status-code-503 {
          background: #ef44441a;
          color: #dc2626;
          border: 1px solid #ef444440;
        }
      `,
      hiddenClients: [], // Show all HTTP clients
      defaultHttpClient: {
        targetKey: 'shell',
        clientKey: 'curl',
      },
      servers: [
        {
          url: 'https://api.usegately.com/api/v1',
          description: 'Production',
        },
      ],
      authentication: {
        preferredSecurityScheme: 'bearerAuth',
      },
    } as const;

        // Try to find the correct export - use createApiReference
        const createScalarReference = (module as any).createApiReference || (module as any).ApiReference;
        
        if (!createScalarReference) {
          throw new Error('Could not find createApiReference export in module');
        }
        
        console.log('[CustomScalarReference] Initializing Scalar with container...');
        console.log('[CustomScalarReference] Using function:', createScalarReference.name);
        
        // Call the Scalar initialization function
        if (containerRef.current && mounted) {
          scalarAppRef.current = createScalarReference(containerRef.current, config);
          console.log('[CustomScalarReference] Scalar initialized successfully');
          if (mounted) {
            setIsLoading(false);
          }
        } else {
          throw new Error('Container ref lost during initialization');
        }
      } catch (err) {
        console.error('[CustomScalarReference] Error:', err);
        if (mounted) {
          setError(`Failed to load API documentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };
    
    // Start initialization
    initScalar();
    
    // Cleanup function
    return () => {
      mounted = false;
      console.log('[CustomScalarReference] Cleaning up');
      // Don't try to unmount Scalar - let it manage its own lifecycle
    };
  }, [projectId, isDark, primaryColor, headingFont, bodyFont]);

  return (
    <div 
      ref={containerRef} 
      className={`scalar-api-reference-container min-h-screen ${isDark ? 'dark' : 'light'}`}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {error && (
        <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <div className="text-center max-w-md mx-auto px-6">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: headingFont || undefined }}>
              Error Loading API Reference
            </h2>
            <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
              {error}
            </p>
          </div>
        </div>
      )}
      
      {isLoading && !error && (
        <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className="mb-8">
              <svg
                className="w-16 h-16 mx-auto mb-4 animate-pulse"
                style={{ color: primaryColor }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: headingFont || undefined }}>
                Loading API Reference
              </h1>
              <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Preparing interactive API documentation...
              </p>
            </div>
            
            <div className="animate-pulse">
              <div className={`h-2 rounded-full w-48 mx-auto ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
