import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { cn, getBasePath } from '@/lib/utils';
import { Icon } from '../ui/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiTextArea } from './AiTextArea';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeBlock, InlineCode } from '../ui/code-block';

const API_BASE_URL = ''; // local mode — no external API

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  links?: { title: string; url: string; slug: string }[];
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  primaryColor: string;
  isDark: boolean;
  portalName?: string;
  subdomainUrl?: string | null;
  initialQuery?: string;
}

export function AIChatPanel({
  isOpen,
  onClose,
  projectId,
  primaryColor,
  isDark,
  portalName = 'Help Center',
  subdomainUrl,
  initialQuery,
}: AIChatPanelProps) {

  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'thinking' | 'searching' | 'found'>('thinking');
  const [shouldShowSteps, setShouldShowSteps] = useState(false);
  const [foundArticles, setFoundArticles] = useState<{ title: string; url: string; slug: string }[]>([]);
  const [showFoundArticles, setShowFoundArticles] = useState(false);
  const [searchProcessVisible, setSearchProcessVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'like' | 'dislike'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cache keys for localStorage
  const CACHE_KEY_MESSAGES = `ai-chat-messages-${projectId}`;
  const CACHE_KEY_SEARCH = `ai-chat-search-${projectId}`;
  const CACHE_KEY_FEEDBACK = `ai-chat-feedback-${projectId}`;

  // Load cached data on mount
  useEffect(() => {
    try {
      // Load messages
      const cachedMessages = localStorage.getItem(CACHE_KEY_MESSAGES);
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }

      // Load search data
      const cachedSearch = localStorage.getItem(CACHE_KEY_SEARCH);
      if (cachedSearch) {
        const searchData = JSON.parse(cachedSearch);
        setFoundArticles(searchData.foundArticles || []);
        setSearchProcessVisible(searchData.searchProcessVisible || false);
      }

      // Load feedback data
      const cachedFeedback = localStorage.getItem(CACHE_KEY_FEEDBACK);
      if (cachedFeedback) {
        setFeedbackGiven(JSON.parse(cachedFeedback));
      }
    } catch (error) {
      console.warn('Failed to load cached chat data:', error);
    }
  }, [projectId]);

  // Save messages to cache whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(messages));
      } catch (error) {
        console.warn('Failed to cache messages:', error);
      }
    }
  }, [messages, CACHE_KEY_MESSAGES]);

  // Save search data to cache
  useEffect(() => {
    try {
      const searchData = {
        foundArticles,
        searchProcessVisible
      };
      localStorage.setItem(CACHE_KEY_SEARCH, JSON.stringify(searchData));
    } catch (error) {
      console.warn('Failed to cache search data:', error);
    }
  }, [foundArticles, searchProcessVisible, CACHE_KEY_SEARCH]);

  // Save feedback to cache
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY_FEEDBACK, JSON.stringify(feedbackGiven));
    } catch (error) {
      console.warn('Failed to cache feedback:', error);
    }
  }, [feedbackGiven, CACHE_KEY_FEEDBACK]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && initialQuery && messages.length === 0) {
      // Only auto-send initial query if there are no cached messages
      const cachedMessages = localStorage.getItem(CACHE_KEY_MESSAGES);
      if (!cachedMessages) {
        setInput(initialQuery);
        setTimeout(() => handleSend(initialQuery), 100);
      }
    }
  }, [isOpen, initialQuery, messages.length]);

  // Check for AI query in URL parameters
  useEffect(() => {
    if (isOpen) {
      const url = new URL(window.location.href);
      const aiQuery = url.searchParams.get('ai_query');
      
      if (aiQuery && aiQuery.trim()) {
        // Clear the URL parameter
        url.searchParams.delete('ai_query');
        window.history.replaceState({}, '', url.toString());
        
        // Auto-send the query
        setTimeout(() => handleSend(aiQuery), 100);
      }
    }
  }, [isOpen]);

  // Clear URL parameter when chat is closed
  useEffect(() => {
    if (!isOpen) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('ai_query')) {
        url.searchParams.delete('ai_query');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isOpen]);

  // Remove the welcome message effect - we'll show empty state instead

  // Function to determine if we should show loading steps
  const shouldShowLoadingSteps = (text: string): boolean => {
    const trimmedText = text.trim().toLowerCase();
    
    // Short responses that don't need article search
    const shortResponses = [
      'thanks', 'thank you', 'ty', 'thx',
      'nice', 'good', 'great', 'awesome', 'cool',
      'ok', 'okay', 'yes', 'no', 'yep', 'nope',
      'hi', 'hello', 'hey', 'bye', 'goodbye',
      'lol', 'haha', 'wow', 'oh', 'ah',
      'sure', 'fine', 'alright', 'got it',
      '👍', '👌', '😊', '😄', '🙂', '😀'
    ];
    
    // Check if it's a short response
    if (shortResponses.some(response => trimmedText === response)) {
      return false;
    }
    
    // Check if it's very short (less than 3 words and under 15 characters)
    const wordCount = trimmedText.split(/\s+/).length;
    if (wordCount <= 2 && trimmedText.length < 15) {
      return false;
    }
    
    // Check if it's just punctuation or emojis
    if (/^[^\w\s]*$/.test(trimmedText) || /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\s]*$/u.test(trimmedText)) {
      return false;
    }
    
    return true;
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Determine if we should show loading steps
    const showSteps = shouldShowLoadingSteps(text);
    setShouldShowSteps(showSteps);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingStage('thinking');
    setFoundArticles([]);

    let searchingTimeout: NodeJS.Timeout | undefined;

    // Only show progressive steps for substantial questions
    if (showSteps) {
      // Change to searching stage after 1 second
      searchingTimeout = setTimeout(() => {
        setLoadingStage('searching');
      }, 1000);
    }
    try {
      // Local search — find relevant articles by matching keywords in title/excerpt/content
      const query = text.toLowerCase();
      const words = query.split(/\s+/).filter(w => w.length > 2);

      // Dynamically import local data (avoids SSR issues)
      const { articles: rawArticles } = await import('@/data/index');

      const scored = rawArticles
        .filter(a => a.is_published)
        .map(a => {
          const haystack = `${a.title} ${a.excerpt || ''} ${a.content}`.toLowerCase();
          const score = words.reduce((s, w) => s + (haystack.split(w).length - 1), 0);
          return { ...a, score };
        })
        .filter(a => a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Build a simple answer from the top results
      let answer = '';
      if (scored.length === 0) {
        answer = "I couldn't find any articles matching your question. Try browsing the categories or rephrasing your search.";
      } else {
        const top = scored[0];
        // Strip HTML for a plain-text excerpt
        const plain = top.content
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 400);
        answer = `Based on **${top.title}**:\n\n${plain}${plain.length === 400 ? '…' : ''}\n\n`;
        if (scored.length > 1) {
          answer += `**Related articles:**\n${scored.slice(1).map(a => `- [${a.title}](/article/${a.slug})`).join('\n')}`;
        }
      }

      if (scored.length > 0) {
        setSearchProcessVisible(true);
        setFoundArticles(scored.map(a => ({
          title: a.title,
          slug: a.slug,
          url: getArticleUrl(a.slug),
        })));
      }

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        links: scored.map(a => ({ title: a.title, url: getArticleUrl(a.slug), slug: a.slug })),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I\'m sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      }]);
    } finally {
      if (searchingTimeout) clearTimeout(searchingTimeout);
      setIsLoading(false);
      setLoadingStage('thinking');
      // Don't clear foundArticles if we want to keep them visible
      if (!showSteps) {
        setFoundArticles([]);
        setSearchProcessVisible(false);
      }
      setShowFoundArticles(false);
      setShouldShowSteps(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }));
  };

  const handleRetry = (messageContent: string) => {
    handleSend(messageContent);
  };

  const clearChat = () => {
    setMessages([]);
    // Clear search process when clearing chat
    setSearchProcessVisible(false);
    setFoundArticles([]);
    setFeedbackGiven({});
    
    // Clear cached data
    try {
      localStorage.removeItem(CACHE_KEY_MESSAGES);
      localStorage.removeItem(CACHE_KEY_SEARCH);
      localStorage.removeItem(CACHE_KEY_FEEDBACK);
    } catch (error) {
      console.warn('Failed to clear cached data:', error);
    }
  };

  const getArticleUrl = (slug: string) => {
    // If a sub-path is configured (e.g. usegately.com/docs), use the public-facing origin + sub-path
    const subPath = (window as any).__projectContext?.subPath;
    if (subPath) {
      return `${window.location.origin}${subPath}/article/${slug}`;
    }
    // Fall back to subdomain URL if available, otherwise relative path
    if (subdomainUrl) {
      return `${subdomainUrl.replace(/\/$/, '')}/article/${slug}`;
    }
    return `${getBasePath()}/article/${slug}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "w-96 flex-shrink-0 flex flex-col h-screen border-l",
        "border-border/30"
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, transparent 50%, ${primaryColor}05 100%)`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
        <div 
          className={cn(
            "flex items-center justify-between px-4 border-b flex-shrink-0 border-border/50"
          )}
          style={{ 
            height: '62px', 
            background: `linear-gradient(90deg, ${primaryColor}12 0%, ${primaryColor}08 100%)`
          }}
        >
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-sm text-foreground">
              AI Assistant
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent"
              onClick={clearChat}
              title="Clear chat"
            >
              <Icon icon="hugeicons:delete-02" className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent"
              onClick={onClose}
            >
              <Icon icon="hugeicons:cancel-01" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 pb-0 space-y-4 w-full">
            {messages.length === 0 ? (
              /* Empty State */
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Icon icon="hugeicons:magic-wand-01" className="h-8 w-8" style={{ color: primaryColor }} />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="text-lg font-semibold mb-2 text-foreground"
                >
                  AI Assistant
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="text-sm text-muted-foreground max-w-sm"
                >
                  Hi! I'm your AI assistant for {portalName}. I can help you find information from our help articles. Ask me anything!
                </motion.p>
              </motion.div>
            ) : (
              <>
                {/* Messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full max-w-full",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      message.role === 'user' 
                        ? "max-w-[85%] rounded-xl px-3 py-2 text-white break-words"
                        : "w-full max-w-full rounded-xl px-3 py-2 text-foreground overflow-hidden"
                    )}
                    style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
                    >
                      {message.role === 'assistant' ? (
                        <div className="w-full">
                          {/* Search Process Card - Show for the last assistant message if visible */}
                          {searchProcessVisible && message.id === messages.filter(m => m.role === 'assistant').slice(-1)[0]?.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-4 w-full"
                            >
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="search-results" className="border-0">
                                  <AccordionTrigger className="flex items-center gap-2 text-xs text-muted-foreground p-3 w-full hover:bg-muted/50 transition-colors rounded-2xl border border-border/50 bg-card hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Icon icon="hugeicons:search-01" className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      <Icon icon="hugeicons:checkmark-01" className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      <span className="truncate">Found {foundArticles.length} article{foundArticles.length !== 1 ? 's' : ''}</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="w-full p-3 pt-0 border-t border-border/50 mt-3">
                                    <div className="space-y-1 w-full">
                                      {foundArticles.map((article, index) => (
                                        <motion.div
                                          key={index}
                                          initial={{ x: -10, opacity: 0 }}
                                          animate={{ x: 0, opacity: 1 }}
                                          transition={{ delay: index * 0.05, duration: 0.2 }}
                                          className="w-full"
                                        >
                                          <a
                                            href={getArticleUrl(article.slug)}
                                            className="flex items-start gap-1.5 p-2 text-xs w-full min-w-0 group hover:bg-muted/30 rounded-lg transition-colors"
                                            style={{ color: primaryColor }}
                                          >
                                            <Icon icon="hugeicons:file-02" className="h-2.5 w-2.5 flex-shrink-0 mt-0.5" />
                                            <span 
                                              className="flex-1 min-w-0 text-left leading-relaxed group-hover:underline"
                                              title={article.title}
                                              style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                wordBreak: 'break-word',
                                                hyphens: 'auto'
                                              }}
                                            >
                                              {article.title}
                                            </span>
                                          </a>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </motion.div>
                          )}

                          {/* Assistant Response */}
                          <div className="prose prose-sm max-w-none dark:prose-invert text-sm prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-table:table-auto prose-th:border prose-td:border prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 w-full">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table({ children }) {
                          return (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border-collapse border border-border rounded-lg">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({ children }) {
                          return (
                            <thead className="bg-muted/50">
                              {children}
                            </thead>
                          );
                        },
                        th({ children }) {
                          return (
                            <th className="border border-border px-4 py-3 text-left font-medium text-foreground bg-muted/30">
                              {children}
                            </th>
                          );
                        },
                        td({ children }) {
                          return (
                            <td className="border border-border px-4 py-3 text-sm text-foreground">
                              {children}
                            </td>
                          );
                        },
                        blockquote({ children }) {
                          return (
                            <blockquote 
                              className="border-l-4 pl-4 py-3 my-4 bg-muted/20 rounded-r-lg"
                              style={{ borderLeftColor: primaryColor }}
                            >
                              <div className="text-foreground/90 italic leading-relaxed">
                                {children}
                              </div>
                            </blockquote>
                          );
                        },
                        h1({ children }) {
                          return <h1 className="text-xl font-semibold text-foreground mt-6 mb-3 leading-tight">{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className="text-lg font-medium text-foreground mt-5 mb-2 leading-tight">{children}</h2>;
                        },
                        h3({ children }) {
                          return <h3 className="text-base font-medium text-foreground mt-4 mb-2 leading-snug">{children}</h3>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc list-inside space-y-1.5 my-3 ml-2">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal list-inside space-y-1.5 my-3 ml-2">{children}</ol>;
                        },
                        li({ children }) {
                          return <li className="text-sm text-foreground leading-relaxed">{children}</li>;
                        },
                        p({ children }) {
                          return <p className="text-sm text-foreground mb-3 leading-relaxed text-balance">{children}</p>;
                        },
                        strong({ children }) {
                          return <strong className="font-semibold text-foreground">{children}</strong>;
                        },
                        em({ children }) {
                          return <em className="italic text-foreground/90">{children}</em>;
                        },
                        hr() {
                          return <hr className="border-border my-6" />;
                        },
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          
                          if (!inline) {
                            return (
                              <CodeBlock 
                                primaryColor={primaryColor}
                                language={match?.[1]}
                              >
                                {codeString}
                              </CodeBlock>
                            );
                          }
                          
                          return (
                            <InlineCode>
                              {codeString}
                            </InlineCode>
                          );
                        },
                        a({ href, children }) {
                          return (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline inline-flex items-center gap-1 font-medium"
                              style={{ color: primaryColor }}
                            >
                              {children}
                              <Icon icon="hugeicons:link-square-02" className="h-3 w-3" />
                            </a>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    
                    {message.links && message.links.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Related articles:</p>
                        <div className="space-y-1">
                          {message.links.map((link, idx) => (
                            <div key={idx}>
                              <a
                                href={getArticleUrl(link.slug)}
                                className="text-sm hover:underline"
                                style={{ color: primaryColor }}
                              >
                                {link.title}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(message.content, message.id)}
                        title="Copy"
                      >
                        {copiedId === message.id ? (
                          <Icon icon="hugeicons:checkmark-01" className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Icon icon="hugeicons:copy-01" className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleFeedback(message.id, 'like')}
                        title="Like"
                      >
                        <Icon 
                          icon="hugeicons:thumbs-up" 
                          className={cn(
                            "h-3.5 w-3.5",
                            feedbackGiven[message.id] === 'like' ? "text-green-500" : "text-muted-foreground"
                          )} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleFeedback(message.id, 'dislike')}
                        title="Dislike"
                      >
                        <Icon 
                          icon="hugeicons:thumbs-down" 
                          className={cn(
                            "h-3.5 w-3.5",
                            feedbackGiven[message.id] === 'dislike' ? "text-red-500" : "text-muted-foreground"
                          )} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const userMessage = messages[messages.findIndex(m => m.id === message.id) - 1];
                          if (userMessage) handleRetry(userMessage.content);
                        }}
                        title="Retry"
                      >
                        <Icon icon="hugeicons:refresh" className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          
          {isLoading && (
            <div className="flex w-full">
              <div className="rounded-xl px-3 py-1.5 bg-card border border-border/50 w-full">
                <div className="flex items-center gap-2">
                  <Icon 
                    icon={
                      !shouldShowSteps ? "hugeicons:loading-03" :
                      loadingStage === 'thinking' ? "hugeicons:loading-03" : 
                      "hugeicons:search-01"
                    } 
                    className={cn(
                      "h-3.5 w-3.5",
                      (!shouldShowSteps || loadingStage === 'thinking') ? "animate-spin" : "animate-pulse"
                    )} 
                    style={{ color: primaryColor }} 
                  />
                  <span className="text-xs text-muted-foreground">
                    {!shouldShowSteps ? 'Responding...' :
                     loadingStage === 'thinking' ? 'Thinking...' : 
                     'Searching relevant articles...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div 
        className="p-4 pt-0 flex-shrink-0 relative"
        style={{
          background: `linear-gradient(to top, ${primaryColor}08 0%, transparent 100%)`
        }}
      >
        <AiTextArea
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          placeholder="Ask, search, explain..."
          title="Ask Ai"
          primaryColor={primaryColor}
          disabled={isLoading}
          minRows={1}
          maxRows={3}
          variant="auto"
          isDark={isDark}
        />
      </div>
    </div>
  );
}
