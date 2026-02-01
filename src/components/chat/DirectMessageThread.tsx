import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { directMessageService } from '../../services/directMessageService';
import { supabaseClient } from '../../services/supabaseClient';
import './DirectMessageThread.css';

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string;
  last_message_at: string;
  other_user?: {
    id: string;
    name: string;
    photo?: string;
  };
}

export const DirectMessageThread: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const currentUserId = localStorage.getItem('userId');

  // Load initial conversation and messages
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoading(true);
        if (!conversationId) return;

        // Get messages
        const msgs = await directMessageService.getMessages(
          conversationId,
          50,
          0
        );
        setMessages(msgs);

        // Mark as read
        if (currentUserId) {
          await directMessageService.markAsRead(conversationId, currentUserId);
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, currentUserId]);

  // Real-time message subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabaseClient
      .channel(`dm_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new]);
          // Mark as read if we're the receiver
          if (
            currentUserId &&
            payload.new.receiver_id === currentUserId
          ) {
            directMessageService.markAsRead(
              conversationId,
              currentUserId
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId || !currentUserId) return;

    try {
      // Determine receiver
      if (!conversation) return;
      const receiverId = conversation.user1_id === currentUserId
        ? conversation.user2_id
        : conversation.user1_id;

      await directMessageService.sendMessage(
        conversationId,
        currentUserId,
        receiverId,
        messageInput,
        'text'
      );
      setMessageInput('');
      // Message will appear via real-time subscription
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleLoadMore = async () => {
    if (!conversationId) return;

    try {
      const nextPage = page + 1;
      const msgs = await directMessageService.getMessages(
        conversationId,
        50,
        nextPage * 50
      );
      if (msgs.length > 0) {
        setMessages(prev => [...msgs, ...prev]); // prepend older messages
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    }
  };

  if (loading) {
    return <div className="dm-loading">Loading conversation...</div>;
  }

  if (error) {
    return <div className="dm-error">{error}</div>;
  }

  const otherUserId = conversation
    ? conversation.user1_id === currentUserId
      ? conversation.user2_id
      : conversation.user1_id
    : null;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <div className="header-content">
          <h1>{conversation?.other_user?.name || 'User'}</h1>
          <div className="header-status">
            <span className="status-indicator online"></span>
            Active now
          </div>
        </div>
      </div>

      <div className="dm-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            Start a conversation with this person
          </div>
        ) : (
          <>
            {page > 0 && (
              <button className="load-more-btn" onClick={handleLoadMore}>
                Load earlier messages
              </button>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`dm-message ${
                  message.sender_id === currentUserId ? 'sent' : 'received'
                }`}
              >
                <div className="message-bubble">
                  {message.content}
                </div>
                <div className="message-meta">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {message.sender_id === currentUserId && message.is_read && (
                    <span className="read-indicator">✓✓</span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="dm-input-area">
        <input
          type="text"
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          className="dm-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          className="dm-send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default DirectMessageThread;
