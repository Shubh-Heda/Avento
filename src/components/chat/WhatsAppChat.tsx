import React, { useState, useEffect, useRef } from 'react';
import { enhancedGroupChatService } from '../../services/enhancedGroupChatService';
import { directMessageBackend } from '../../services/directMessageBackend';
import { firebaseAuth, usersService } from '../../services/firebaseService';
import { Send, Phone, Video, Search, MoreVertical, Paperclip, Plus, X } from 'lucide-react';
import './WhatsAppChat.css';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  created_at: string;
  is_read: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  last_seen?: string;
  is_online: boolean;
  status?: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group'; // 1-1 or group chat
  name: string;
  avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  members?: ChatUser[];
  created_at: string;
}

interface WhatsAppChatProps {
  selectedConversationId?: string;
  onClose?: () => void;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ selectedConversationId, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = firebaseAuth.getCurrentUser();
        if (user) {
          // Get user profile from Firestore
          const userProfile = await usersService.getUserProfile(user.id);
          setCurrentUser({
            id: user.id,
            name: user.displayName || 'You',
            avatar: userProfile?.avatar_url,
            is_online: true,
            status: 'Active now',
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);
  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const user = firebaseAuth.getCurrentUser();
        if (!user) return;

        // Load 1-1 conversations with real user data
        const dmConversations = await directMessageBackend.getUserConversations(user.id);
        const dmChats: Conversation[] = await Promise.all(
          dmConversations.map(async conv => {
            const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
            const otherUserResult = await usersService.getUserProfile(otherId);
            const otherUser = otherUserResult.data as any;
            return {
              id: conv.id,
              type: 'direct' as const,
              name: otherUser?.displayName || otherUser?.email || otherId,
              avatar: otherUser?.photoURL,
              last_message: conv.last_message,
              last_message_time: conv.last_message_at,
              unread_count: 0,
              members: [
                {
                  id: user.id,
                  name: currentUser?.name || 'You',
                  avatar: currentUser?.avatar,
                  is_online: true,
                },
                {
                  id: otherId,
                  name: otherUser?.displayName || otherUser?.email || otherId,
                  avatar: otherUser?.photoURL,
                  is_online: true,
                },
              ],
              created_at: conv.created_at,
            };
          })
        );

        // Load group chats with real user data and member info
        const groupChats: Conversation[] = [
          // TODO: Query Firestore for group_chats collection
          // For now, this uses the new enhancedGroupChatService
        ];

        // Example of how to load group chats when implemented:
        // const groupChatSnapshot = await getDocs(
        //   query(
        //     collection(db, 'group_chats'),
        //     where('members', 'array-contains', user.id)
        //   )
        // );
        // const groupChats: Conversation[] = await Promise.all(
        //   groupChatSnapshot.docs.map(async (doc) => {
        //     const chatData = doc.data() as GroupChatWithUsers;
        //     return {
        //       id: doc.id,
        //       type: 'group' as const,
        //       name: chatData.name,
        //       avatar: chatData.avatar_url,
        //       last_message: chatData.last_message,
        //       last_message_time: chatData.last_message_at,
        //       unread_count: 0,
        //       members: chatData.members.map(m => ({
        //         id: m.user_id,
        //         name: m.user_name,
        //         avatar: m.user_avatar,
        //         is_online: true,
        //       })),
        //       created_at: chatData.created_at,
        //     };
        //   })
        // );

        setConversations([...dmChats, ...groupChats]);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  // Select conversation from prop
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const chat = conversations.find(c => c.id === selectedConversationId);
      if (chat) {
        selectChat(chat);
      }
    }
  }, [selectedConversationId, conversations]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const loadMessages = async () => {
      try {
        const user = firebaseAuth.getCurrentUser();
        if (!user) return;

        if (selectedChat.type === 'direct') {
          // Load 1-1 messages with real sender data
          const msgs = await directMessageBackend.getMessages(selectedChat.id);
          const chatMessages: ChatMessage[] = await Promise.all(
            msgs.map(async msg => {
              const senderResult = await usersService.getUserProfile(msg.sender_id);
              const sender = senderResult.data as any;
              return {
                id: msg.id,
                sender_id: msg.sender_id,
                sender_name: sender?.displayName || sender?.email || msg.sender_id,
                sender_avatar: sender?.photoURL,
                content: msg.content,
                message_type: 'text',
                created_at: msg.created_at,
                is_read: msg.is_read,
              };
            })
          );
          setMessages(chatMessages);

          // Subscribe to new messages with real sender data
          messageUnsubscribeRef.current = directMessageBackend.subscribeToMessages(
            selectedChat.id,
            async (newMessages) => {
              const updated: ChatMessage[] = await Promise.all(
                newMessages.map(async msg => {
                  const senderResult = await usersService.getUserProfile(msg.sender_id);
                  const sender = senderResult.data as any;
                  return {
                    id: msg.id,
                    sender_id: msg.sender_id,
                    sender_name: sender?.displayName || sender?.email || msg.sender_id,
                    sender_avatar: sender?.photoURL,
                    content: msg.content,
                    message_type: 'text',
                    created_at: msg.created_at,
                    is_read: msg.is_read,
                  };
                })
              );
              setMessages(updated);
            }
          );

          // Mark as read
          await directMessageBackend.markAsRead(selectedChat.id, user.id);
        } else if (selectedChat.type === 'group') {
          // Load group chat messages with real sender data
          const groupMsgs = await enhancedGroupChatService.getGroupChatMessages(selectedChat.id);
          const chatMessages: ChatMessage[] = groupMsgs.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            sender_avatar: msg.sender_avatar,
            content: msg.content,
            message_type: msg.message_type as any,
            created_at: msg.created_at,
            is_read: msg.read_by?.includes(user.id) || false,
          }));
          setMessages(chatMessages);

          // Subscribe to group message updates
          const unsubscribe = enhancedGroupChatService.subscribeToGroupMessages(
            selectedChat.id,
            (newMessages) => {
              const updated: ChatMessage[] = newMessages.map(msg => ({
                id: msg.id,
                sender_id: msg.sender_id,
                sender_name: msg.sender_name,
                sender_avatar: msg.sender_avatar,
                content: msg.content,
                message_type: msg.message_type as any,
                created_at: msg.created_at,
                is_read: msg.read_by?.includes(user.id) || false,
              }));
              setMessages(updated);
            }
          );
          messageUnsubscribeRef.current = unsubscribe;

          // Mark as read
          await enhancedGroupChatService.markMessagesAsRead(selectedChat.id, user.id);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    return () => {
      if (messageUnsubscribeRef.current) {
        messageUnsubscribeRef.current();
      }
    };
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChat = (chat: Conversation) => {
    setSelectedChat(chat);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !currentUser) return;

    try {
      setSendingMessage(true);

      if (selectedChat.type === 'direct') {
        // Get the other user ID
        const parts = selectedChat.id.split('_');
        const otherUserId = parts[0] === currentUser.id ? parts[1] : parts[0];

        await directMessageBackend.sendMessage(
          selectedChat.id,
          currentUser.id,
          otherUserId,
          messageInput.trim(),
          'text'
        );
      } else {
        // Send group message
        // TODO: Implement group message sending
      }

      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="whatsapp-chat-container">
      {/* Sidebar */}
      <div className="whatsapp-sidebar">
        <div className="sidebar-header">
          <h1>Messages</h1>
          <div className="header-actions">
            <button className="icon-button" title="New chat">
              <Plus size={20} />
            </button>
            <button className="icon-button" title="More options">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Conversations List */}
        <div className="conversations-list">
          {loading ? (
            <div className="loading-state">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
              <p className="text-sm text-gray-400">Start a new chat to begin</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedChat?.id === conv.id ? 'active' : ''}`}
                onClick={() => selectChat(conv)}
              >
                <div className="conversation-avatar">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conv.type === 'group' && <span className="group-badge">👥</span>}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{conv.name}</h3>
                    <span className="last-message-time">
                      {conv.last_message_time && formatTime(conv.last_message_time)}
                    </span>
                  </div>
                  <p className="last-message">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="unread-badge">{conv.unread_count}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="whatsapp-chat-area">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  {selectedChat.avatar ? (
                    <img src={selectedChat.avatar} alt={selectedChat.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="chat-details">
                  <h2>{selectedChat.name}</h2>
                  <p className="chat-status">Active now</p>
                </div>
              </div>
              <div className="chat-actions">
                <button className="icon-button" title="Voice call">
                  <Phone size={20} />
                </button>
                <button className="icon-button" title="Video call">
                  <Video size={20} />
                </button>
                <button className="icon-button" title="More options">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-icon">💬</div>
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender_id === currentUser?.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      <div className="message-sender-name">{msg.sender_name}</div>
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-area">
              <button className="icon-button attachment-btn" title="Attach file">
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="message-input"
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendingMessage}
                title="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-state-large">
              <div className="emoji">💬</div>
              <h2>Select a conversation</h2>
              <p>Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Close button for mobile */}
      {onClose && (
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
      )}
    </div>
  );
};
