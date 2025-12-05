import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { YourPlanCard } from '../YourPlanCard';
import { ChangePassword } from '../ChangePassword';

const API_BASE = import.meta.env.VITE_API_URL || '';

type ModuleType = 'overview' | 'artist' | 'designer' | 'gallery';
type GroupType = 'general' | 'artist' | 'designer' | 'gallery';

interface ModuleConfig {
  id: ModuleType;
  label: string;
  entitlement: 'artist_access' | 'designer_access' | 'gallery_access' | null;
  icon: React.ReactNode;
  description: string;
  price: string;
  unlockCta: string;
  unlockSubtext: string;
  tooltipText: string;
  group: GroupType;
}

const MODULES: ModuleConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    entitlement: null,
    group: 'general',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    description: 'Account overview and settings',
    price: 'Free',
    unlockCta: '',
    unlockSubtext: '',
    tooltipText: '',
  },
  {
    id: 'artist',
    label: 'Artist Studio',
    entitlement: 'artist_access',
    group: 'artist',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: 'Manage artworks, embed widgets',
    price: '€9/mo',
    unlockCta: '€9/mo \u2022 Unlock \u2192',
    unlockSubtext: 'Upgrade to unlock Artist Tools',
    tooltipText: 'Unlock this tool with the Artist Plan',
  },
  {
    id: 'designer',
    label: 'Designer Tools',
    entitlement: 'designer_access',
    group: 'designer',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    description: 'Projects, client room uploads',
    price: '€29/mo',
    unlockCta: '€29/mo \u2022 Unlock \u2192',
    unlockSubtext: 'Upgrade to unlock Designer Tools',
    tooltipText: 'Unlock this tool with the Designer Plan',
  },
  {
    id: 'gallery',
    label: 'Gallery Hub',
    entitlement: 'gallery_access',
    group: 'gallery',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
    description: 'Collections, multi-artist curation',
    price: '€49/mo',
    unlockCta: '€49/mo \u2022 Unlock \u2192',
    unlockSubtext: 'Upgrade to unlock Gallery Tools',
    tooltipText: 'Unlock this tool with the Gallery Plan',
  },
];

const GROUP_TITLES: Record<GroupType, string> = {
  general: '',
  artist: 'ARTIST TOOLS',
  designer: 'DESIGNER TOOLS',
  gallery: 'GALLERY TOOLS',
};

function SectionHeader({ title, collapsed }: { title: string; collapsed: boolean }) {
  if (!title || collapsed) return null;
  return (
    <div 
      className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-1.5 ml-[18px]"
      style={{ color: '#7D8CB5', marginTop: '20px' }}
    >
      {title}
    </div>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UpgradeModal({ 
  isOpen, 
  onClose, 
  planType 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  planType: 'artist' | 'designer' | 'gallery';
}) {
  if (!isOpen) return null;

  const planDetails = {
    artist: { name: 'Artist', price: '€9/mo', features: ['Artwork management', 'Embed widgets', 'Basic analytics'] },
    designer: { name: 'Designer', price: '€29/mo', features: ['Client room uploads', 'Project management', 'Premium rooms', 'PDF exports'] },
    gallery: { name: 'Gallery', price: '€49/mo', features: ['Multi-artist collections', 'Virtual exhibitions', 'Advanced curation', 'Custom branding'] },
  };

  const plan = planDetails[planType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-rv-textMuted hover:text-rv-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-rv-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-rv-primary">Unlock {plan.name} Tools</h3>
          <p className="text-rv-textMuted mt-2">{plan.price}</p>
        </div>

        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-rv-text">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <a
          href="#/pricing"
          className="block w-full text-center px-5 py-3 rounded-lg text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
        >
          View Pricing
        </a>
      </div>
    </div>
  );
}

export function UnifiedDashboard() {
  const { user, hasEntitlement, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; planType: 'artist' | 'designer' | 'gallery' }>({ open: false, planType: 'artist' });
  const [hoveredModule, setHoveredModule] = useState<ModuleType | null>(null);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const handleModuleClick = (module: ModuleConfig) => {
    const isLocked = module.entitlement && !hasEntitlement(module.entitlement) && !isAdmin;
    if (isLocked && module.id !== 'overview') {
      setUpgradeModal({ open: true, planType: module.id as 'artist' | 'designer' | 'gallery' });
      return;
    }
    setActiveModule(module.id);
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'artist':
        return <ArtistDashboardContent />;
      case 'designer':
        return <DesignerDashboardContent />;
      case 'gallery':
        return <GalleryDashboardContent />;
      case 'overview':
      default:
        return <OverviewContent />;
    }
  };

  const getModuleStatus = (module: ModuleConfig): 'active' | 'locked' | 'available' => {
    if (!module.entitlement) return 'available';
    if (isAdmin) return 'available';
    if (hasEntitlement(module.entitlement)) return 'active';
    return 'locked';
  };

  const shouldShowGroup = (group: GroupType): boolean => {
    if (group === 'general') return true;
    if (group === 'artist') {
      return isAdmin || hasEntitlement('artist_access');
    }
    return true;
  };

  const groupedModules = MODULES.reduce((acc, module) => {
    if (!acc[module.group]) acc[module.group] = [];
    acc[module.group].push(module);
    return acc;
  }, {} as Record<GroupType, ModuleConfig[]>);

  const groupOrder: GroupType[] = ['general', 'artist', 'designer', 'gallery'];

  return (
    <div className="min-h-screen bg-rv-surface flex">
      <UpgradeModal 
        isOpen={upgradeModal.open} 
        onClose={() => setUpgradeModal({ ...upgradeModal, open: false })}
        planType={upgradeModal.planType}
      />

      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-rv-neutral flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-rv-neutral flex items-center justify-between">
          {sidebarOpen && (
            <a href="#/" className="flex items-center">
              <img 
                src="/roomvibe-logo-transparent.png" 
                alt="RoomVibe" 
                className="h-12 w-auto"
              />
            </a>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-rv-surface transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg className="w-5 h-5 text-rv-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex-1 pt-4 px-3 space-y-0.5 overflow-y-auto" style={{ paddingTop: '16px' }}>
          {groupOrder.map((group) => {
            if (!shouldShowGroup(group)) return null;
            const modules = groupedModules[group];
            if (!modules || modules.length === 0) return null;

            return (
              <div key={group}>
                <SectionHeader title={GROUP_TITLES[group]} collapsed={!sidebarOpen} />
                
                {modules.map((module) => {
                  const status = getModuleStatus(module);
                  const isActive = activeModule === module.id;
                  const isLocked = status === 'locked';
                  const isHovered = hoveredModule === module.id;

                  return (
                    <div key={module.id} className="relative group">
                      <button
                        onClick={() => handleModuleClick(module)}
                        onMouseEnter={() => setHoveredModule(module.id)}
                        onMouseLeave={() => setHoveredModule(null)}
                        className={`w-full flex items-center rounded-lg text-left transition-all ${
                          isActive
                            ? 'bg-rv-primary text-white'
                            : isLocked
                            ? 'opacity-[0.55] cursor-pointer hover:bg-[rgba(40,53,147,0.06)]'
                            : 'text-rv-text hover:bg-rv-surface'
                        }`}
                        style={{ padding: '12px 18px', gap: '10px' }}
                        title={sidebarOpen ? undefined : module.label}
                      >
                        <div className={`flex-shrink-0 ${isActive ? 'text-white' : isLocked ? 'text-rv-textMuted' : 'text-rv-accent'}`} style={{ width: '20px', height: '20px' }}>
                          {module.icon}
                        </div>
                        {sidebarOpen && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-medium truncate ${isLocked ? 'text-rv-textMuted' : ''}`}>{module.label}</span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {status === 'active' && module.entitlement && (
                                  <span className="px-1.5 py-0.5 text-[11px] font-medium bg-rv-primary text-white rounded-md">
                                    Active
                                  </span>
                                )}
                                {isLocked && (
                                  <LockIcon className="w-4 h-4 md:w-[18px] md:h-[18px] text-rv-textMuted" />
                                )}
                              </div>
                            </div>
                            {isLocked && module.unlockSubtext && (
                              <div className="mt-0.5">
                                <span className="text-xs text-rv-textMuted">{module.unlockSubtext}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </button>

                      {isLocked && isHovered && sidebarOpen && (
                        <div 
                          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-rv-primary text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
                          style={{ maxWidth: '200px' }}
                        >
                          {module.tooltipText}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-rv-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-rv-neutral space-y-2">
          {sidebarOpen && (
            <>
              <div className="px-3 py-2 text-sm text-rv-textMuted">
                <div className="font-medium text-rv-text truncate">{user?.email}</div>
                <div className="text-xs">{user?.effectivePlan || user?.subscriptionPlan || 'Free'} Plan</div>
              </div>
              <a
                href="#/studio"
                className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#264C61] hover:bg-[#1D3A4A] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Open Studio</span>
              </a>
              <a
                href="#/billing"
                className="flex items-center gap-2 px-3 py-2 text-sm text-rv-textMuted hover:text-rv-text hover:bg-rv-surface rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Billing</span>
              </a>
              <a
                href="#/pricing"
                className="flex items-center gap-2 px-3 py-2 text-sm text-rv-accent hover:bg-rv-surface rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Upgrade</span>
              </a>
            </>
          )}
          <a
            href="#/studio"
            className={`flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#264C61] hover:bg-[#1D3A4A] rounded-lg transition-colors ${sidebarOpen ? 'hidden' : 'justify-center'}`}
            title="Open Studio"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </a>
          <button
            onClick={logout}
            className={`flex items-center gap-2 px-3 py-2 text-sm text-rv-textMuted hover:text-rv-text hover:bg-rv-surface rounded-lg transition-colors ${sidebarOpen ? 'w-full' : 'justify-center'}`}
            title={sidebarOpen ? undefined : 'Sign Out'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {renderModuleContent()}
        </div>
      </main>
    </div>
  );
}

function OverviewContent() {
  const { user } = useAuth();
  
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-rv-primary mb-2">Welcome back!</h1>
        <p className="text-rv-textMuted">{user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h2 className="text-xl font-bold mb-2 text-rv-primary">Studio</h2>
          <p className="text-rv-textMuted mb-5 leading-relaxed">
            Visualize artwork in room environments with true-to-scale rendering.
          </p>
          <a
            href="#/studio"
            className="inline-block px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all shadow-rvSoft hover:shadow-rvElevated"
          >
            Open Studio
          </a>
        </div>

        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h2 className="text-xl font-bold mb-2 text-rv-primary">My Favorites</h2>
          <p className="text-rv-textMuted mb-5 leading-relaxed">
            Save your favorite artwork combinations for later.
          </p>
          <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
            View Favorites
          </button>
        </div>

        <div className="p-6 bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral">
          <h2 className="text-xl font-bold mb-2 text-rv-primary">Recent Visualizations</h2>
          <p className="text-rv-textMuted mb-5 leading-relaxed">
            View your recently created room visualizations.
          </p>
          <button className="px-5 py-2.5 border-2 border-rv-neutral rounded-rvMd hover:bg-rv-surface transition-colors font-semibold text-rv-text">
            View History
          </button>
        </div>
      </div>

      <YourPlanCard />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-rv-primary/5 rounded-rvLg border border-rv-primary/20">
          <h3 className="text-lg font-bold mb-3 text-rv-primary">Account Information</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold text-rv-text">Email:</span> <span className="text-rv-textMuted">{user?.email}</span></p>
            <p><span className="font-semibold text-rv-text">Account Type:</span> <span className="text-rv-textMuted">{user?.role}</span></p>
            <p>
              <span className="font-semibold text-rv-text">Email Confirmed:</span>{' '}
              {user?.emailConfirmed ? (
                <span className="text-green-600 font-semibold">Verified</span>
              ) : (
                <span className="text-amber-600 font-semibold">Pending</span>
              )}
            </p>
          </div>
        </div>

        <ChangePassword />
      </div>
    </div>
  );
}

function WidgetEmbedSection() {
  const [widgetToken, setWidgetToken] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/widget/token`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWidgetToken(data.widgetToken);
        setEmbedCode(data.embedCode);
      }
    } catch (err) {
      console.error('Failed to fetch widget token:', err);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const generateToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/widget/token/generate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWidgetToken(data.widgetToken);
        setEmbedCode(data.embedCode);
      } else {
        setError('Failed to generate widget token');
      }
    } catch (err) {
      setError('Failed to generate widget token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-rv-accent/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-rv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-rv-primary">Widget Embed Code</h3>
          <p className="text-sm text-rv-textMuted mt-1">
            Add this code to your website to let customers visualize your art in their space.
          </p>
        </div>
      </div>

      {!widgetToken ? (
        <div className="mt-4">
          <button
            onClick={generateToken}
            disabled={loading}
            className="px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Widget Token'}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="relative">
            <pre className="bg-rv-surface border border-rv-neutral rounded-lg p-4 pr-24 sm:pr-20 text-[12px] sm:text-[13px] leading-relaxed overflow-x-auto text-rv-text font-mono whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 sm:h-8 px-3 text-[13px] font-medium rounded-md bg-rv-primary text-white hover:bg-rv-primaryHover transition-colors z-10 min-w-[70px]"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={generateToken}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-rvMd border border-rv-neutral text-rv-textMuted hover:bg-rv-surface transition-colors disabled:opacity-50"
            >
              {loading ? 'Regenerating...' : 'Regenerate Token'}
            </button>
            <p className="text-xs text-rv-textMuted">
              Regenerating will invalidate the old widget code.
            </p>
          </div>

          <div className="p-4 bg-rv-accent/5 border border-rv-accent/20 rounded-lg">
            <h4 className="text-sm font-semibold text-rv-text mb-2">How to use:</h4>
            <ol className="text-sm text-rv-textMuted space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it into your website HTML (before the closing <code className="bg-rv-surface px-1 rounded">&lt;/body&gt;</code> tag)</li>
              <li>The "See in your room" button will appear automatically</li>
              <li>Works on Shopify, Wix, Squarespace, WordPress, and custom HTML sites</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function ArtistDashboardContent() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-rv-primary mb-2">Artist Studio</h1>
        <p className="text-rv-textMuted">Manage your artworks and embed widgets on your website.</p>
      </div>

      <div className="space-y-6">
        <WidgetEmbedSection />

        <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral p-6">
          <h3 className="text-lg font-bold text-rv-primary mb-4">Artwork Management</h3>
          <p className="text-rv-textMuted mb-4">
            Upload and manage your artworks. Each artwork can be displayed in the widget.
          </p>
          <a 
            href="#/dashboard/artist" 
            className="inline-block px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
          >
            Manage Artworks
          </a>
        </div>
      </div>
    </div>
  );
}

function DesignerDashboardContent() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-rv-primary mb-2">Designer Tools</h1>
        <p className="text-rv-textMuted">Manage projects and upload client room photos.</p>
      </div>
      <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral p-6">
        <p className="text-rv-textMuted">
          Designer dashboard content will be integrated here. Use the sidebar navigation to access your designer tools.
        </p>
        <a 
          href="#/dashboard/designer" 
          className="mt-4 inline-block px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
        >
          Open Full Designer Dashboard
        </a>
      </div>
    </div>
  );
}

function GalleryDashboardContent() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-rv-primary mb-2">Gallery Hub</h1>
        <p className="text-rv-textMuted">Curate collections and manage multi-artist exhibitions.</p>
      </div>
      <div className="bg-white rounded-rvLg shadow-rvSoft border border-rv-neutral p-6">
        <p className="text-rv-textMuted">
          Gallery dashboard content will be integrated here. Use the sidebar navigation to access your gallery tools.
        </p>
        <a 
          href="#/dashboard/gallery" 
          className="mt-4 inline-block px-5 py-2.5 rounded-rvMd text-white font-semibold bg-rv-primary hover:bg-rv-primaryHover transition-all"
        >
          Open Full Gallery Dashboard
        </a>
      </div>
    </div>
  );
}
