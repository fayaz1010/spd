'use client';

/**
 * Enhanced ChatbotWidget v2 - With Settings Integration
 * This version fetches settings from the backend
 * Once tested, can replace the original ChatbotWidget.tsx
 */

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Loader2,
  Bot,
  User
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  roofAnalysis?: any; // Roof analysis data if available
}

interface ChatbotWidgetProps {
  context?: 'website' | 'portal';
  customerId?: string;
  leadId?: string;
}

interface ChatSettings {
  enabled: boolean;
  aiName: string;
  welcomeMessage: string | null;
  position: string;
  showOnMobile: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
}

// Helper to format message content with clickable links
function formatMessageContent(content: string) {
  let formatted = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
  if (formatted.includes('<li>')) {
    formatted = formatted.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => 
      `<ul class="list-disc ml-4 my-2 space-y-1">${match}</ul>`
    );
  }
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+|www\.[^\s<]+)/g,
    (url) => {
      const href = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">${url}</a>`;
    }
  );
  return formatted;
}

export default function ChatbotWidgetV2({ context = 'website', customerId, leadId }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat settings from backend
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    enabled: true,
    aiName: 'Solar Assistant',
    welcomeMessage: null,
    position: 'bottom-right',
    showOnMobile: true,
    autoOpen: false,
    autoOpenDelay: 5,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch chat settings on mount
  useEffect(() => {
    fetchChatSettings();
  }, []);

  const fetchChatSettings = async () => {
    try {
      const res = await fetch('/api/public/chat-settings');
      const data = await res.json();
      setChatSettings(data);
      setSettingsLoaded(true);

      // Set initial welcome message
      const welcomeMsg = data.welcomeMessage || (
        context === 'portal'
          ? `Hi! I'm ${data.aiName}. I can help you with questions about your quote, installation, or solar in general. How can I help you today?`
          : `Hi! I'm ${data.aiName}. I can help you learn about solar, get a quote, or answer any questions. What would you like to know?`
      );

      setMessages([{
        id: '1',
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to fetch chat settings:', error);
      setSettingsLoaded(true);
      // Use defaults
      setMessages([{
        id: '1',
        role: 'assistant',
        content: context === 'portal'
          ? "Hi! I'm your solar assistant. I can help you with questions about your quote, installation, or solar in general. How can I help you today?"
          : "Hi! I'm the Sun Direct Power assistant. I can help you learn about solar, get a quote, or answer any questions. What would you like to know?",
        timestamp: new Date(),
      }]);
    }
  };

  // Auto-open functionality
  useEffect(() => {
    if (settingsLoaded && chatSettings.autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, chatSettings.autoOpenDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [settingsLoaded, chatSettings.autoOpen, chatSettings.autoOpenDelay, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = context === 'portal' ? localStorage.getItem('customer_token') : null;
      
      // Use v2 API endpoint (now the main endpoint)
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: input,
          context,
          customerId,
          leadId,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      // Check if response includes roof analysis data
      let roofAnalysisData = null;
      if (data.toolCalls) {
        const roofAnalysisTool = data.toolCalls.find((call: any) => call.name === 'get_roof_analysis');
        if (roofAnalysisTool && roofAnalysisTool.result && roofAnalysisTool.result.success) {
          roofAnalysisData = roofAnalysisTool.result;
        }
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        roofAnalysis: roofAnalysisData, // Attach roof data to message
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.showLeadForm) {
        console.log('🎯 AI requested lead form:', data.leadFormData);
        setShowLeadForm(true);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact us directly at 08 6156 6747 or sales@sundirectpower.com.au.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = context === 'portal'
    ? [
        "What's my installation status?",
        "When is my installation scheduled?",
        "How do I pay my deposit?",
        "Who is my installation team?",
      ]
    : [
        "How much does solar cost?",
        "What rebates are available?",
        "How long does installation take?",
        "Get a free quote",
      ];

  const handleQuickQuestion = (question: string) => {
    if (question === "Get a free quote") {
      setShowLeadForm(true);
    } else {
      setInput(question);
    }
  };

  const handleLeadSubmit = async () => {
    if (!leadFormData.email) {
      return;
    }

    try {
      const response = await fetch('/api/chatbot/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadFormData,
          message: 'Quote request from chatbot',
          source: 'CHATBOT',
        }),
      });

      if (response.ok) {
        setShowLeadForm(false);
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Thanks ${leadFormData.name || 'there'}! I've captured your details. One of our solar consultants will contact you within 24 hours with a personalized quote. In the meantime, feel free to ask me any questions about solar!`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setLeadFormData({ name: '', email: '', phone: '' });
      }
    } catch (error) {
      console.error('Failed to capture lead:', error);
    }
  };

  // Don't show if disabled
  if (!chatSettings.enabled) {
    return null;
  }

  // Hide on mobile if setting is disabled
  if (!chatSettings.showOnMobile && typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  // Determine position classes
  const positionClass = chatSettings.position === 'bottom-left' 
    ? 'bottom-6 left-6' 
    : 'bottom-6 right-6';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClass} bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 group`}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          1
        </span>
        <span className={`absolute bottom-full ${chatSettings.position === 'bottom-left' ? 'left-0' : 'right-0'} mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
          Need help? Chat with us!
        </span>
      </button>
    );
  }

  return (
    <Card
      className={`fixed z-50 shadow-2xl transition-all ${positionClass} ${
        isMinimized
          ? 'w-80 h-16'
          : 'w-96 h-[600px] md:w-[420px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{chatSettings.aiName}</h3>
            <p className="text-xs text-white/80">
              {loading ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(600px-64px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`flex-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {/* Roof Analysis Card */}
                  {message.roofAnalysis && message.roofAnalysis.success && (
                    <div className="mb-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-md">
                      {/* Roof Photo */}
                      {message.roofAnalysis.roofPhoto?.url && (
                        <div className="relative">
                          <img 
                            src={message.roofAnalysis.roofPhoto.url} 
                            alt="Roof Analysis" 
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            📡 Satellite View
                          </div>
                        </div>
                      )}
                      
                      {/* Roof Data */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-lg">🏠</span>
                          Roof Analysis Results
                        </h4>
                        
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xs text-blue-600 font-medium mb-1">System Size</div>
                            <div className="text-xl font-bold text-blue-900">
                              {message.roofAnalysis.solarPotential.estimatedSystemSize}kW
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs text-green-600 font-medium mb-1">Max Panels</div>
                            <div className="text-xl font-bold text-green-900">
                              {message.roofAnalysis.roofData.maxPanelCount}
                            </div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-xs text-purple-600 font-medium mb-1">Roof Area</div>
                            <div className="text-xl font-bold text-purple-900">
                              {message.roofAnalysis.solarPotential.usableRoofArea}m²
                            </div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-xs text-orange-600 font-medium mb-1">Annual Output</div>
                            <div className="text-xl font-bold text-orange-900">
                              {(message.roofAnalysis.solarPotential.annualProduction / 1000).toFixed(1)}MWh
                            </div>
                          </div>
                        </div>
                        
                        {/* Address */}
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                          📍 {message.roofAnalysis.address}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Regular Message */}
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div 
                      className="text-sm whitespace-pre-wrap prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-gray-700" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length > 1 && messages.length <= 3 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-white flex-shrink-0">
              <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lead Form */}
          {showLeadForm && (
            <div className="p-4 border-t border-gray-200 bg-blue-50 flex-shrink-0">
              <h4 className="font-semibold text-gray-900 mb-3">Get Your Free Quote</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Your name"
                  value={leadFormData.name}
                  onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                  className="bg-white"
                />
                <Input
                  placeholder="Email address *"
                  type="email"
                  value={leadFormData.email}
                  onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                  className="bg-white"
                  required
                />
                <Input
                  placeholder="Phone number"
                  type="tel"
                  value={leadFormData.phone}
                  onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleLeadSubmit}
                    disabled={!leadFormData.email}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Get Free Quote
                  </Button>
                  <Button
                    onClick={() => setShowLeadForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          {!showLeadForm && (
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by AI • Responses may vary
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
