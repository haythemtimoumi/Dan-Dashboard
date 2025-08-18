'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export default function Chatbot() {
  const { language } = useSettings();
  const { user } = useAuth();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: language === 'fr' ? 'Nouvelle conversation' : 'New Chat',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, [language]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatbot-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastActivity: new Date(s.lastActivity),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      })));
    }
    
    // Create initial session if none exists
    if (!currentSessionId) {
      createNewSession();
    }
  }, [currentSessionId, createNewSession, language]);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatbot-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentSessionMessages = getCurrentSession()?.messages;
  useEffect(() => {
    scrollToBottom();
  }, [currentSessionMessages]);



  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title } : s
    ));
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const clearAllChats = () => {
    setSessions([]);
    localStorage.removeItem('chatbot-sessions');
    createNewSession();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      source: pathname
    };

    // Update session with user message
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage],
            lastActivity: new Date(),
            title: s.messages.length === 0 ? (input.length > 30 ? input.substring(0, 30) + '...' : input) : s.title
          }
        : s
    ));

    setInput('');
    setLoading(true);
    setIsTyping(true);
    
    const typingMessages = [
      language === 'fr' ? '🔍 Analyse en cours...' : '🔍 Analyzing...',
      language === 'fr' ? '🧠 Réflexion...' : '🧠 Thinking...',
      language === 'fr' ? '✨ Génération de la réponse...' : '✨ Generating response...'
    ];
    
    let messageIndex = 0;
    setTypingText(typingMessages[0]);
    
    const typingInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % typingMessages.length;
      setTypingText(typingMessages[messageIndex]);
    }, 1500);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: {
            currentPage: pathname,
            ticker: pathname.includes('/portfolio/') ? pathname.split('/portfolio/')[1]?.split('/')[0] : null
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      setTimeout(() => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          source: 'AI Assistant'
        };

        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { 
                ...s, 
                messages: [...s.messages, assistantMessage],
                lastActivity: new Date()
              }
            : s
        ));

        setIsTyping(false);
        
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }, 800);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: language === 'fr' ? 'Désolé, une erreur est survenue.' : 'Sorry, an error occurred.',
        timestamp: new Date(),
        source: 'System'
      };
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { 
              ...s, 
              messages: [...s.messages, errorMessage],
              lastActivity: new Date()
            }
          : s
      ));
      setIsTyping(false);
    } finally {
      clearInterval(typingInterval);
      setLoading(false);
      setTypingText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRecentMessages = () => {
    const currentSession = getCurrentSession();
    if (!currentSession) return [];
    return currentSession.messages.slice(-6); // Last 3 Q&A pairs
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative group">
            <button
              onClick={() => {
                setIsOpen(true);
                setUnreadCount(0);
              }}
              className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-110 hover:rotate-3"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
              
              <svg className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 animate-ping opacity-20"></div>
              
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div className="absolute bottom-0 right-0 w-[440px] h-[720px] transform animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="relative w-full h-full bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
              
              {/* Header */}
              <div className="relative flex items-center justify-between p-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900">
                      <div className="w-full h-full bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {language === 'fr' ? 'Assistant IA' : 'AI Assistant'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                      {language === 'fr' ? 'En ligne' : 'Online'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-8 h-8 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 flex items-center justify-center transition-all duration-200 hover:scale-105"
                    title={language === 'fr' ? 'Historique des conversations' : 'Chat History'}
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat History Sidebar */}
              {showHistory && (
                <div className="absolute top-16 left-0 w-full h-[calc(100%-4rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-10 border-r border-gray-200/60 dark:border-gray-700/60">
                  <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {language === 'fr' ? 'Conversations' : 'Chat History'}
                      </h4>
                      <button
                        onClick={createNewSession}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      >
                        {language === 'fr' ? '+ Nouveau' : '+ New'}
                      </button>
                    </div>
                    
                    <button
                      onClick={clearAllChats}
                      className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg transition-colors border border-red-200 dark:border-red-800"
                    >
                      {language === 'fr' ? '🗑️ Supprimer tout' : '🗑️ Clear All'}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group p-3 rounded-xl cursor-pointer transition-all ${
                          currentSessionId === session.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {session.messages.length} {language === 'fr' ? 'messages' : 'messages'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {session.lastActivity.toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-all"
                          >
                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[520px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {getCurrentSession()?.messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="relative mx-auto w-16 h-16 mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl opacity-20 animate-pulse"></div>
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {language === 'fr' ? 'Nouvelle conversation' : 'New Conversation'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                      {language === 'fr' ? 'Commencez une conversation avec votre assistant IA' : 'Start a conversation with your AI assistant'}
                    </p>
                  </div>
                )}

                {getCurrentSession()?.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`max-w-[300px] relative ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-2 shadow-md">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className={`text-xs opacity-60 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {message.source && (
                            <button
                              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                message.role === 'user' 
                                  ? 'bg-white/20 text-white/80 hover:bg-white/30' 
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              }`}
                              title={language === 'fr' ? 'Cliquez pour voir la source' : 'Click to view source'}
                            >
                              📍 {message.source === pathname ? (language === 'fr' ? 'Page actuelle' : 'Current page') : message.source}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {typingText}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="relative p-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/80">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={language === 'fr' ? 'Tapez votre message...' : 'Type your message...'}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm"
                      disabled={loading}
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                
                {/* Recent Messages Preview */}
                {getRecentMessages().length > 0 && !showHistory && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {language === 'fr' ? 'Derniers messages:' : 'Recent messages:'} {getRecentMessages().length / 2} {language === 'fr' ? 'échanges' : 'exchanges'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}