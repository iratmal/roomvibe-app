import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ConnectStats {
  totalArtworks: number;
  unreadMessages: number;
  visibleToDesigners: boolean;
  visibleToGalleries: boolean;
}

interface ArtistConnectWidgetProps {
  onViewInbox?: () => void;
  onEditProfile?: () => void;
}

export function ArtistConnectWidget({ onViewInbox, onEditProfile }: ArtistConnectWidgetProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ConnectStats | null>(null);
  const [loading, setLoading] = useState(true);

  const hasArtistAccess = user?.entitlements?.artist_access || user?.effectivePlan === 'artist' || user?.effectivePlan === 'artist_pro';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/profile/connect-stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching connect stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-rv-primary/20 rounded w-1/3"></div>
          <div className="h-4 bg-rv-primary/10 rounded w-2/3"></div>
          <div className="h-16 bg-rv-primary/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rv-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-rv-primary">Artist Connect</h3>
            <p className="text-sm text-rv-textMuted">
              Get discovered by designers and galleries
            </p>
          </div>
        </div>
        
        {stats && stats.unreadMessages > 0 && (
          <button
            onClick={onViewInbox}
            className="relative px-3 py-1.5 bg-rv-primary text-white rounded-full text-sm font-semibold hover:bg-rv-primaryHover transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {stats.unreadMessages} new
            </span>
          </button>
        )}
      </div>

      {!hasArtistAccess ? (
        <div className="p-4 bg-white/60 rounded-rvMd border border-rv-primary/20">
          <p className="text-sm text-rv-text mb-3">
            Upgrade to the Artist plan to join Artist Connect and receive inquiries from designers and galleries.
          </p>
          <a
            href="#/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors text-sm font-semibold"
          >
            View Plans
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/60 rounded-rvMd">
              <p className="text-2xl font-bold text-rv-primary">{stats?.totalArtworks || 0}</p>
              <p className="text-xs text-rv-textMuted">Artworks</p>
            </div>
            <div className="p-3 bg-white/60 rounded-rvMd">
              <p className="text-2xl font-bold text-rv-primary">{stats?.unreadMessages || 0}</p>
              <p className="text-xs text-rv-textMuted">Unread Messages</p>
            </div>
          </div>

          <div className="p-3 bg-white/60 rounded-rvMd">
            <p className="text-xs font-semibold text-rv-primary mb-2">Visibility Status</p>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                stats?.visibleToDesigners 
                  ? 'bg-[#C9A24A]/15 text-[#C9A24A]' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {stats?.visibleToDesigners ? 'Visible to Designers' : 'Hidden from Designers'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                stats?.visibleToGalleries 
                  ? 'bg-[#C9A24A]/15 text-[#C9A24A]' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {stats?.visibleToGalleries ? 'Visible to Galleries' : 'Hidden from Galleries'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onEditProfile}
              className="flex-1 px-4 py-2 bg-white text-rv-primary border border-rv-primary/30 rounded-rvMd hover:bg-rv-primary/5 transition-colors text-sm font-semibold"
            >
              Edit Profile
            </button>
            <button
              onClick={onViewInbox}
              className="flex-1 px-4 py-2 bg-rv-primary text-white rounded-rvMd hover:bg-rv-primaryHover transition-colors text-sm font-semibold"
            >
              View Inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
