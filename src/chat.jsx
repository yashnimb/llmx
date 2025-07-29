import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedModels, setSelectedModels] = useState(['chatgpt']);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const webhookUrl = 'https://y4sh20.app.n8n.cloud/webhook/91b3d6c6-86a7-451a-8cf5-9f4be900bd1c';

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          models: selectedModels.length ? selectedModels : ['chatgpt'],
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
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-6 flex flex-col h-[80vh] border border-white/30">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">💬 LLMx</h2>

        {/* Messages */}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input section */}
        <div className="flex gap-2 mt-auto relative">
          {/* Model Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="border border-gray-300 rounded-xl px-3 py-2 bg-white/80 backdrop-blur-md text-sm text-gray-700 w-40 text-left"
            >
              {selectedModels.length > 0 ? selectedModels.join(', ') : 'Select LLMs'}
            </button>

            {dropdownOpen && (
  <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto no-scrollbar z-50">
    {['chatgpt', 'claude', 'gemini', 'perplexity'].map((model) => (
      <label key={model} className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">
        <input
          type="checkbox"
          checked={selectedModels.includes(model)}
          onChange={(e) => {
            setSelectedModels((prev) =>
              e.target.checked
                ? [...prev, model]
                : prev.filter((m) => m !== model)
            );
          }}
          className="mr-2 accent-blue-600"
        />
        {model.charAt(0).toUpperCase() + model.slice(1)}
      </label>
    ))}
  </div>
)}

          </div>

          {/* Message Input */}
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Send Button */}
          <button
            onClick={() => {
              setDropdownOpen(false);
              sendMessage();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
