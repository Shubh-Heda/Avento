import React, { useState, useEffect } from 'react';
import { directMessageBackend as directMessageService } from '../../services/directMessageBackend';
import { firebaseAuth } from '../../services/firebaseService';
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
  last_message?: string;
  last_message_at?: string;
  other_user?: {
    id: string;
    name: string;
    photo?: string;
  };
}

interface DirectMessageThreadProps {
  conversationId: string;
  onNavigate?: (page: string) => void;
}

export const DirectMessageThread: React.FC<DirectMessageThreadProps> = ({ conversationId, onNavigate }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const user = firebaseAuth.getCurrentUser();
      if (!isMounted) return;
      setCurrentUserId(user?.uid ?? null);
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load initial conversation and messages
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoading(true);
        if (!conversationId) return;

        // Load conversation metadata
        const conv = await directMessageService.getConversation(conversationId);
        if (conv) {
          setConversation(conv);
        }

        // Get messages
        const msgs = await directMessageService.getMessages(conversationId);
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

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = directMessageService.subscribeToMessages(
      conversationId,
      (msgs: DirectMessage[]) => {
        setMessages(msgs);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [conversationId]);

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
      const msgs = await directMessageService.getMessages(conversationId);
      if (msgs.length > 0) {
        setMessages(msgs);
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
