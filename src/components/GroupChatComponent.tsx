import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthProvider';
import { realGroupChatService, RealGroupChat, ChatMessage, ChatMember, ChatInvite } from '../services/groupChatServiceReal';
import { Send, Users, Plus, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GroupChatComponentProps {
  chatId: string;
  onClose?: () => void;
}

export default function GroupChatComponent({ chatId, onClose }: GroupChatComponentProps) {
  const { user } = useAuth();
  const [chat, setChat] = useState<RealGroupChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<ChatInvite[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial load
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load chat
        const chatData = await realGroupChatService.getGroupChat(chatId);
        if (chatData) {
          setChat(chatData);
        }

        // Load messages
        const msgs = await realGroupChatService.getMessages(chatId);
        setMessages(msgs);

        // Load members
        const mbrs = await realGroupChatService.getMembers(chatId);
        setMembers(mbrs);

        // Load pending invites
        const invites = await realGroupChatService.getPendingInvites(chatId);
        setPendingInvites(invites);

        // Subscribe to real-time updates
        const unsubscribeMessages = realGroupChatService.subscribeToMessages(
          chatId,
          (newMessages) => {
            setMessages(newMessages);
          }
        );

        const unsubscribeMembers = realGroupChatService.subscribeToMembers(
          chatId,
          (newMembers) => {
            setMembers(newMembers);
          }
        );

        return () => {
          unsubscribeMessages();
          unsubscribeMembers();
        };
      } catch (error) {
        console.error('Failed to load chat:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId, user]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !user) {
      return;
    }

    try {
      await realGroupChatService.sendMessage(
        chatId,
        user.id,
        user.name || user.email || 'Anonymous',
        messageInput.trim(),
        'text',
        user.avatar
      );

      setMessageInput('');
      toast.success('Message sent! ✓');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  // Send invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim() || !user) {
      return;
    }

    try {
      setInviteLoading(true);

      const invite = await realGroupChatService.sendInvite(
        chatId,
        inviteEmail.trim(),
        user.id
      );

      const link = `${window.location.origin}/?invite=${invite.token}`;
      setInviteLink(link);

      setInviteEmail('');
      setShowInviteModal(false);

      // Reload pending invites
      const invites = await realGroupChatService.getPendingInvites(chatId);
      setPendingInvites(invites);

      toast.success(`Invite sent to ${inviteEmail}! 📧`);
    } catch (error) {
      console.error('Failed to send invite:', error);
      toast.error('Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied');
    } catch (error) {
      console.error('Failed to copy invite link:', error);
      toast.error('Failed to copy invite link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Chat not found</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAdmin = chat.created_by === user?.id;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{chat.name}</h2>
          {chat.description && (
            <p className="text-sm text-gray-500">{chat.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setInviteLink('');
                setShowInviteModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              title="Invite members"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}

          <button
            onClick={() => setShowMembersPanel(!showMembersPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{members.length}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Messages Section */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet. Start the conversation! 💬</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;
                const isSystemMessage = message.message_type === 'system';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    {isSystemMessage ? (
                      <div className="max-w-xs mx-auto text-center px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg italic">
                        {message.content}
                      </div>
                    ) : (
                      <div
                        className={`max-w-xs ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white rounded-bl-lg'
                            : 'bg-gray-200 text-gray-900 rounded-br-lg'
                        } rounded-lg px-4 py-2 shadow-sm`}
                      >
                        {!isCurrentUser && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="text-sm break-words">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t bg-white p-4 flex gap-2 sticky bottom-0"
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message... 💭"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>

        {/* Members Panel */}
        {showMembersPanel && (
          <div className="w-80 border-l bg-white flex flex-col overflow-hidden shadow-lg">
            <div className="p-4 border-b flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-lg">Members ({members.length})</h3>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">
                      {member.user_name}
                    </p>
                    <p className="text-xs text-gray-500">{member.user_email}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      {member.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          Admin
                        </span>
                      )}
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="border-t p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Pending Invites
                </h4>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded text-xs"
                    >
                      <span className="text-gray-700 truncate">{invite.invited_email}</span>
                      <Clock className="w-3 h-3 text-yellow-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slideUp">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invite Members
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={inviteLoading}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  They'll receive an email invite and can join the group chat.
                </p>
              </div>

              {inviteLink && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
                  <p className="text-blue-800 mb-2">Invite link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-lg bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  disabled={inviteLoading || !inviteEmail.trim()}
                >
                  <Mail className="w-4 h-4" />
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
