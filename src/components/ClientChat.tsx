'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender: 'client' | 'admin';
  message: string;
  createdAt: string;
}

interface ClientChatProps {
  appointmentId: string;
}

export default function ClientChat({ appointmentId }: ClientChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [appointmentId]);

  // Poll messages every 3 seconds for instant chat experience
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'client',
          message: newMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '400px',
        width: '100%',
        marginTop: '24px',
        textAlign: 'left',
      }}
    >
      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        💬 Chat with AutoFlow
      </h3>

      {/* Messages List Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              textAlign: 'center',
              margin: 'auto 0',
            }}
          >
            Send a message to start the conversation with AutoFlow.
          </div>
        ) : (
          messages.map((msg) => {
            const isClient = msg.sender === 'client';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isClient ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    borderBottomRightRadius: isClient ? '0' : 'var(--radius-md)',
                    borderBottomLeftRadius: !isClient ? '0' : 'var(--radius-md)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    backgroundColor: isClient ? 'var(--primary)' : 'var(--bg-primary)',
                    color: isClient ? '#ffffff' : 'var(--text-primary)',
                    border: isClient ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {msg.message}
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    alignSelf: isClient ? 'flex-end' : 'flex-start',
                    marginTop: '2px',
                    padding: '0 4px',
                  }}
                >
                  {isClient ? 'You' : 'AutoFlow'} •{' '}
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message to AutoFlow..."
          className="input-field"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
