import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import './index.css'; // Make sure your CSS file includes the model-option styles

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedModels, setSelectedModels] = useState(['chatgpt', 'claude', 'gemini', 'perplexity', 'azure']);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const webhookUrl = 'https://uxlad.app.n8n.cloud/webhook/af8056aa-e08b-40bb-95fe-681ff3a05ccd';

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          models: selectedModels.length ? selectedModels : ['chatgpt', 'claude', 'gemini', 'perplexity', 'azure'],
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const contentType = response.headers.get('content-type');
      let botText = '';

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        botText =
          data.output ||
          data.response ||
          data.message ||
          data.text ||
          data.data ||
          data.result ||
          JSON.stringify(data);

        if (!botText || botText === '[No output]' || botText === '{}') {
          const findStringValue = (obj) => {
            if (typeof obj === 'string') return obj;
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                const value = obj[key];
                if (typeof value === 'string' && value.trim()) return value;
                if (typeof value === 'object') {
                  const found = findStringValue(value);
                  if (found) return found;
                }
              }
            }
            return null;
          };
          const foundText = findStringValue(data);
          if (foundText) botText = foundText;
        }
      } else {
        botText = await response.text();
      }

      let cleanHtml = botText || '[Empty response]';
      const iframeMatch = cleanHtml.match(/<iframe[^>]*srcdoc="([^"]*)"[^>]*>/i);
      if (iframeMatch) {
        const srcdocContent = iframeMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'");
        cleanHtml = srcdocContent;
      } else {
        cleanHtml = cleanHtml.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
      }

      cleanHtml = cleanHtml.trim();
      toast.success('✅ Response received');
      const botMsg = { sender: 'bot', text: cleanHtml };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('⚠️ Error contacting server.');
      const botMsg = { sender: 'bot', text: '⚠️ Error contacting server.' };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const modelOptions = [
    { id: 'chatgpt', label: 'ChatGPT' },
    { id: 'claude', label: 'Claude' },
    { id: 'gemini', label: 'Gemini' },
    { id: 'perplexity', label: 'Perplexity' },
    { id: 'azure', label: 'Copilot' },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-6 flex flex-col h-[80vh] border border-white/30">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">💬 LLMx</h2>

        <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-none space-y-3 mb-4 px-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble px-4 py-3 rounded-2xl max-w-[75%] whitespace-pre-wrap break-words ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white self-end ml-auto'
                  : 'bg-gray-200 text-gray-800 self-start'
              }`}
            >
              {msg.sender === 'user' ? (
                <span>{msg.text}</span>
              ) : (
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: (msg.text || '[No content]')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                  }}
                />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble px-4 py-3 rounded-2xl max-w-[75%] bg-gray-200 text-gray-800 self-start">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex flex-wrap gap-2">
            {modelOptions.map(({ id, label }) => {
              const isChecked = selectedModels.includes(id);
              return (
                <label key={id} className={`model-option ${id} ${isChecked ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setSelectedModels((prev) =>
                        e.target.checked
                          ? [...prev, id]
                          : prev.filter((model) => model !== id)
                      );
                    }}
                  />
                  {label}
                </label>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
