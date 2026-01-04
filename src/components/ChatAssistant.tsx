import React, { useState, useRef, useEffect } from 'react';
import { startSyllabusChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Mhoro! I am your ZimEd Assistant. How can I help you with your curriculum planning today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat session
  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = startSyllabusChat();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Sanitizer to remove markdown junk
  const sanitizeText = (text: string): string => {
    return text
      .replace(/\*\*/g, '') // Remove double asterisks (bold)
      .replace(/\*/g, '')   // Remove single asterisks (italic/bullets)
      .replace(/#/g, '')    // Remove hashtags (headers)
      .replace(/`/g, '')    // Remove backticks
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive empty lines
      .trim();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      if (!chatRef.current) chatRef.current = startSyllabusChat();
      
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userText });
      const rawText = response.text || "I'm sorry, I couldn't process that. Can you rephrase?";
      const cleanText = sanitizeText(rawText);
      
      setMessages(prev => [...prev, { role: 'model', text: cleanText }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMsg = "Zvaita sepaipa (Something went wrong). Please check your connection.";
      if (error.message?.includes('canceled')) {
          errorMsg = "The request was interrupted. Please try asking your question again.";
          // Reset chat ref to recover from potentially stalled session
          chatRef.current = null;
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-zim-green text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-zim-yellow"
          aria-label="Open AI Assistant"
        >
          <i className="fas fa-robot text-xl md:text-2xl"></i>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[92vw] md:w-96 h-[75vh] md:h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slide-up fixed bottom-4 right-4 md:static">
          {/* Header */}
          <div className="bg-zim-green text-white p-4 flex justify-between items-center border-b border-zim-yellow shrink-0">
            <div className="flex items-center space-x-2">
              <i className="fas fa-chalkboard-teacher text-zim-yellow"></i>
              <span className="font-bold text-sm md:text-base">ZimEd Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-green-800 p-2 rounded-full h-8 w-8 flex items-center justify-center transition-colors">
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-[13px] md:text-sm shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-zim-green text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-zim-green rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-zim-green rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-zim-green rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about the syllabus..."
                className="flex-grow p-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zim-green transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  !input.trim() || loading ? 'bg-gray-100 text-gray-400' : 'bg-zim-green text-white hover:bg-green-800 active:scale-90 shadow-md'
                }`}
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
