import React, { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, onSend }) {
    const [message, setMessage] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSend(message.trim());
        setMessage('');
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="glass rounded-xl flex flex-col h-full">
            <div className="px-4 py-3 border-b border-dark-border flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <h3 className="text-sm font-semibold text-white">Live Chat</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-surface-500 text-sm">No messages yet. Say hello! 👋</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`animate-fadeIn ${msg.type === 'system' ? 'text-center' : ''}`}>
                        {msg.type === 'system' ? (
                            <p className="text-xs text-surface-500 py-1 flex items-center justify-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-surface-600"></span>
                                {msg.message}
                                <span className="w-1 h-1 rounded-full bg-surface-600"></span>
                            </p>
                        ) : (
                            <div className="flex items-start gap-2.5 group">
                                <img
                                    src={msg.avatar || `https://ui-avatars.com/api/?name=${msg.username}&size=24`}
                                    alt=""
                                    className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-semibold text-primary-300">{msg.username}</span>
                                        <span className="text-xs text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <p className="text-sm text-surface-200 break-words leading-relaxed">{msg.message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-dark-border flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                    id="chat-input"
                    maxLength={500}
                />
                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    id="chat-send-btn"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
    );
}
