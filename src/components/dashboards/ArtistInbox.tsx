import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Message {
  id: string | number;
  senderId?: number;
  senderEmail: string;
  senderName: string;
  senderRole: string;
  artworkId?: number;
  artworkTitle?: string;
  artworkImage?: string;
  projectName?: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  isPublicContact?: boolean;
}

interface ArtistInboxProps {
  onUnreadCountChange?: (count: number) => void;
  isFreePlan?: boolean;
}

export function ArtistInbox({ onUnreadCountChange, isFreePlan }: ArtistInboxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | number | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const [inboxRes, contactsRes] = await Promise.all([
        fetch(`${API_URL}/api/messages/inbox`, { credentials: 'include' }),
        fetch(`${API_URL}/api/messages/inbox/public-contacts`, { credentials: 'include' })
      ]);

      let regularMessages: Message[] = [];
      if (inboxRes.ok) {
        const data = await inboxRes.json();
        regularMessages = (data.messages || []).map((m: any) => ({ ...m, isPublicContact: false }));
      } else if (inboxRes.status !== 403) {
        console.error('Failed to fetch inbox messages');
      }

      let publicContacts: Message[] = [];
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        publicContacts = data.contacts || [];
      }

      const allMessages = [...regularMessages, ...publicContacts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setMessages(allMessages);
      const unreadCount = allMessages.filter(m => !m.isRead).length;
      onUnreadCountChange?.(unreadCount);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setMessages([]);
      onUnreadCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);

    if (!message.isRead) {
      try {
        if (message.isPublicContact) {
          const numericId = String(message.id).replace('pc-', '');
          await fetch(`${API_URL}/api/messages/inbox/public-contacts/${numericId}/read`, {
            method: 'PUT',
            credentials: 'include'
          });
        } else {
          await fetch(`${API_URL}/api/messages/inbox/${message.id}/read`, {
            method: 'PUT',
            credentials: 'include'
          });
        }

        setMessages(prev =>
          prev.map(m => m.id === message.id ? { ...m, isRead: true } : m)
        );

        const newUnreadCount = messages.filter(m => !m.isRead && m.id !== message.id).length;
        onUnreadCountChange?.(newUnreadCount);
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };

  const handleDelete = async (messageId: string | number) => {
    try {
      const message = messages.find(m => m.id === messageId);
      let url: string;

      if (message?.isPublicContact) {
        const numericId = String(messageId).replace('pc-', '');
        url = `${API_URL}/api/messages/inbox/public-contacts/${numericId}`;
      } else {
        url = `${API_URL}/api/messages/inbox/${messageId}`;
      }

      const response = await fetch(url, { method: 'DELETE', credentials: 'include' });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      setShowDeleteConfirm(null);

      const newUnreadCount = messages.filter(m => !m.isRead && m.id !== messageId).length;
      onUnreadCountChange?.(newUnreadCount);
    } catch (err: any) {
      console.error('Error deleting message:', err);
      setError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const publicContactIds = messages
        .filter(m => m.isPublicContact && !m.isRead)
        .map(m => String(m.id).replace('pc-', ''));

      await Promise.all([
        fetch(`${API_URL}/api/messages/inbox/mark-all-read`, {
          method: 'PUT',
          credentials: 'include'
        }),
        ...publicContactIds.map(id =>
          fetch(`${API_URL}/api/messages/inbox/public-contacts/${id}/read`, {
            method: 'PUT',
            credentials: 'include'
          })
        )
      ]);

      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      onUnreadCountChange?.(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getRoleBadge = (role: string, isPublicContact?: boolean) => {
    if (isPublicContact) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          Public
        </span>
      );
    }
    const styles: Record<string, string> = {
      designer: 'bg-blue-100 text-blue-700',
      gallery: 'bg-rv-primary/10 text-rv-primary',
      user: 'bg-gray-100 text-gray-700'
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.user}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rv-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-rvMd text-red-700">
        {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 bg-rv-surface rounded-rvLg border border-rv-neutral">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rv-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-rv-text mb-2">No messages yet</h3>
        {isFreePlan ? (
          <>
            <p className="text-rv-textMuted max-w-md mx-auto mb-2">
              Messages sent through your public artist profile will appear here.
            </p>
            <p className="text-sm text-rv-textMuted max-w-md mx-auto mb-5">
              Direct messages from designers and galleries on RoomVibe are available on Artist and Artist Pro plans.
            </p>
            <a
              href="#/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors text-sm font-semibold"
            >
              Upgrade
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </>
        ) : (
          <>
            <p className="text-rv-textMuted max-w-md mx-auto mb-4">
              Messages from visitors via your public profile, and from designers or galleries, will appear here.
            </p>
            <p className="text-sm text-rv-textMuted">
              Tip: Enable visibility to designers and galleries in your profile to receive inquiries.
            </p>
          </>
        )}
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden">
          <div className="p-4 border-b border-rv-neutral flex items-center justify-between">
            <div>
              <h3 className="font-bold text-rv-text">Inbox</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-rv-textMuted">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-rv-primary hover:text-rv-primaryHover font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-rv-neutral max-h-[600px] overflow-y-auto">
            {messages.map(message => (
              <button
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={`w-full p-4 text-left hover:bg-rv-surface transition-colors ${
                  selectedMessage?.id === message.id ? 'bg-rv-primary/5' : ''
                } ${!message.isRead ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    message.isRead ? 'bg-transparent' : 'bg-rv-primary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-sm truncate ${
                        message.isRead ? 'text-rv-text' : 'text-rv-primary'
                      }`}>
                        {message.senderName}
                      </span>
                      {getRoleBadge(message.senderRole, message.isPublicContact)}
                    </div>
                    <p className={`text-sm truncate ${
                      message.isRead ? 'text-rv-textMuted' : 'text-rv-text font-medium'
                    }`}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-rv-textMuted mt-1 truncate">
                      {message.body.substring(0, 60)}{message.body.length > 60 ? '...' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-rv-textMuted flex-shrink-0">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedMessage ? (
          <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral overflow-hidden relative">
            <div className="p-4 border-b border-rv-neutral">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-rv-text mb-1">{selectedMessage.subject}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-rv-textMuted">From:</span>
                    <span className="font-semibold text-rv-text">{selectedMessage.senderName}</span>
                    {getRoleBadge(selectedMessage.senderRole, selectedMessage.isPublicContact)}
                  </div>
                  <p className="text-xs text-rv-textMuted mt-1">
                    {selectedMessage.senderEmail}
                  </p>
                  <p className="text-xs text-rv-textMuted">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(selectedMessage.id)}
                  className="p-2 text-rv-textMuted hover:text-red-500 transition-colors"
                  title="Delete message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedMessage.artworkId && (
              <div className="p-4 bg-rv-surface border-b border-rv-neutral">
                <p className="text-xs text-rv-textMuted mb-2">Regarding artwork:</p>
                <div className="flex items-center gap-3">
                  {selectedMessage.artworkImage && (
                    <img
                      src={selectedMessage.artworkImage.startsWith('http') ? selectedMessage.artworkImage : `${API_URL}${selectedMessage.artworkImage}`}
                      alt={selectedMessage.artworkTitle}
                      className="w-12 h-12 object-cover rounded-rvMd"
                    />
                  )}
                  <span className="font-semibold text-rv-text">{selectedMessage.artworkTitle}</span>
                </div>
              </div>
            )}

            {selectedMessage.projectName && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-sm">
                  <span className="text-blue-600 font-medium">Project:</span>{' '}
                  <span className="text-blue-800">{selectedMessage.projectName}</span>
                </p>
              </div>
            )}

            <div className="p-6">
              <div className="prose prose-sm max-w-none text-rv-text whitespace-pre-wrap">
                {selectedMessage.body}
              </div>
            </div>

            <div className="p-4 border-t border-rv-neutral bg-rv-surface">
              <a
                href={`mailto:${selectedMessage.senderEmail}?subject=Re: ${selectedMessage.subject}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors font-semibold text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-6 9 6-9 6-9-6zm9 8v-8" />
                </svg>
                Reply via Email
              </a>
            </div>

            {showDeleteConfirm === selectedMessage.id && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-rvLg p-6 max-w-sm w-full">
                  <h4 className="text-lg font-bold text-rv-text mb-2">Delete Message?</h4>
                  <p className="text-sm text-rv-textMuted mb-4">
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-rvMd hover:bg-red-600 transition-colors font-semibold text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 border border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rv-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-rv-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-rv-textMuted">Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
