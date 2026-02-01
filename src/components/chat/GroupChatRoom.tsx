import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { groupChatService } from '../../services/groupChatService';
import { supabaseClient } from '../../services/supabaseClient';
import './GroupChatRoom.css';

interface GroupChatMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_name?: string;
}

interface GroupChatMember {
  id: string;
  user_id: string;
  share_amount: number;
  payment_status: 'pending' | 'paid';
  user_name?: string;
}

interface GroupChat {
  id: string;
  name: string;
  total_cost: number;
  currency: string;
  member_count: number;
}

export const GroupChatRoom: React.FC = () => {
  const { groupChatId } = useParams<{ groupChatId: string }>();
  const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [members, setMembers] = useState<GroupChatMember[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = localStorage.getItem('userId'); // Get from your auth system

  // Load initial data
  useEffect(() => {
    const loadGroupChat = async () => {
      try {
        setLoading(true);
        if (!groupChatId) return;

        // Get group chat details
        const details = await groupChatService.getGroupChatDetails(groupChatId);
        setGroupChat(details);
        setMessages(details.messages || []);
        setMembers(details.members || []);
      } catch (err) {
        console.error('Error loading group chat:', err);
        setError('Failed to load group chat');
      } finally {
        setLoading(false);
      }
    };

    loadGroupChat();
  }, [groupChatId]);

  // Real-time message subscription
  useEffect(() => {
    if (!groupChatId) return;

    const channel = supabaseClient
      .channel(`group_${groupChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_chat_id=eq.${groupChatId}`
        },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [groupChatId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !groupChatId || !currentUserId) return;

    try {
      await groupChatService.sendGroupMessage(
        groupChatId,
        currentUserId,
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

  const handleMarkPaymentDone = async (memberId: string) => {
    if (!groupChatId || !currentUserId) return;

    try {
      await groupChatService.markPaymentDone(groupChatId, currentUserId);
      // Refresh members
      const details = await groupChatService.getGroupChatDetails(groupChatId);
      setMembers(details.members || []);
    } catch (err) {
      console.error('Error marking payment:', err);
      setError('Failed to mark payment');
    }
  };

  if (loading) {
    return <div className="group-chat-loading">Loading group chat...</div>;
  }

  if (error) {
    return <div className="group-chat-error">{error}</div>;
  }

  if (!groupChat) {
    return <div className="group-chat-empty">Group chat not found</div>;
  }

  return (
    <div className="group-chat-container">
      <div className="group-chat-header">
        <h1>{groupChat.name}</h1>
        <div className="group-info">
          <span>{groupChat.member_count} members</span>
          <span>Total: {groupChat.currency} {groupChat.total_cost}</span>
        </div>
      </div>

      <div className="group-chat-content">
        {/* Members Panel */}
        <div className="members-panel">
          <h3>Members</h3>
          <div className="members-list">
            {members.map(member => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <div className="member-name">{member.user_name || 'User'}</div>
                  <div className="member-share">
                    Share: {groupChat.currency} {member.share_amount.toFixed(2)}
                  </div>
                  <div className={`payment-status ${member.payment_status}`}>
                    {member.payment_status === 'paid' ? '✓ Paid' : '○ Pending'}
                  </div>
                </div>
                {member.payment_status === 'pending' && member.user_id === currentUserId && (
                  <button
                    className="mark-paid-btn"
                    onClick={() => handleMarkPaymentDone(member.id)}
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messages Panel */}
        <div className="messages-panel">
          <div className="messages-list">
            {messages.map(message => (
              <div
                key={message.id}
                className={`message ${message.sender_id === currentUserId ? 'sent' : 'received'}`}
              >
                {message.sender_id !== currentUserId && (
                  <div className="message-sender">{message.sender_name || 'User'}</div>
                )}
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="message-input-area">
            <input
              type="text"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="message-input"
            />
            <button onClick={handleSendMessage} className="send-btn">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatRoom;
