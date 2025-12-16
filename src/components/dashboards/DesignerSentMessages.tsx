import { useState, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface SentMessage {
  id: number;
  recipientId: number;
  recipientEmail: string;
  recipientName: string;
  senderRole: string;
  artworkId?: number;
  artworkTitle?: string;
  artworkImage?: string;
  projectName?: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function DesignerSentMessages() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SentMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/designer/sent-messages`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#264C61]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Sent Messages
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          View your inquiries and messages sent to artists
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#264C61] border-t-transparent"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 px-8 bg-white rounded-2xl border border-slate-100">
          <div className="mb-4 mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No messages sent yet</h3>
          <p className="text-slate-500 text-sm">
            When you contact artists about their work, your messages will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {messages.map((message) => (
              <div
                key={message.id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start gap-4">
                  {message.artworkImage ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      <img
                        src={message.artworkImage}
                        alt={message.artworkTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#264C61] flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-slate-800 truncate">
                        To: {message.recipientName}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 truncate">{message.subject}</p>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{message.body}</p>
                    {message.artworkTitle && (
                      <p className="text-xs text-[#D8B46A] mt-1">
                        Re: {message.artworkTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {message.isRead ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Read
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sent</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMessage && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#264C61]">Message Details</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {selectedMessage.artworkImage && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={selectedMessage.artworkImage}
                      alt={selectedMessage.artworkTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">To</p>
                  <p className="font-medium text-slate-800">{selectedMessage.recipientName}</p>
                  <p className="text-sm text-slate-500">{selectedMessage.recipientEmail}</p>
                </div>
              </div>

              {selectedMessage.artworkTitle && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Regarding Artwork</p>
                  <p className="text-sm font-medium text-slate-800">{selectedMessage.artworkTitle}</p>
                </div>
              )}

              {selectedMessage.projectName && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Project</p>
                  <p className="text-sm font-medium text-slate-800">{selectedMessage.projectName}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 mb-1">Subject</p>
                <p className="font-medium text-slate-800">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Message</p>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Sent on {new Date(selectedMessage.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
                {selectedMessage.isRead && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Read by recipient
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
