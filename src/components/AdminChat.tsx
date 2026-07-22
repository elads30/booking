'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender: 'client' | 'admin';
  message: string;
  createdAt: string;
}

interface AdminChatProps {
  appointmentId: string;
}

export default function AdminChat({ appointmentId }: AdminChatProps) {
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

  // Poll messages every 3 seconds
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
          sender: 'admin',
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
      style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '20px',
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '280px',
      }}
    >
      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
        💬 Chat with Client
      </label>

      {/* Messages list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
          marginBottom: '12px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto 0' }}>
            No messages yet. Send a message to start chatting.
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    borderBottomRightRadius: isAdmin ? '0' : 'var(--radius-sm)',
                    borderBottomLeftRadius: !isAdmin ? '0' : 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    backgroundColor: isAdmin ? 'var(--primary)' : 'var(--bg-primary)',
                    color: isAdmin ? '#ffffff' : 'var(--text-primary)',
                    border: isAdmin ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {msg.message}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                    marginTop: '2px',
                    padding: '0 4px',
                  }}
                >
                  {isAdmin ? 'You' : 'Client'} •{' '}
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

      {/* Reply Form */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Reply to client..."
          className="input-field"
          style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
