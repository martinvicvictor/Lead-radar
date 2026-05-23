import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useStore from '../lib/store';

// Dynamically import all components — prevents SSR/build errors
const Sidebar      = dynamic(() => import('../components/Sidebar'),      { ssr: false });
const MobileNav    = dynamic(() => import('../components/MobileNav'),    { ssr: false });
const LeadsPage    = dynamic(() => import('../components/LeadsPage'),    { ssr: false });
const KeywordsPage = dynamic(() => import('../components/KeywordsPage'), { ssr: false });
const OutreachPage = dynamic(() => import('../components/OtherPages').then(m => ({ default: m.OutreachPage })),  { ssr: false });
const AnalyticsPage= dynamic(() => import('../components/OtherPages').then(m => ({ default: m.AnalyticsPage })), { ssr: false });
const ConfigPage   = dynamic(() => import('../components/OtherPages').then(m => ({ default: m.ConfigPage })),    { ssr: false });
const TemplatesPage= dynamic(() => import('../components/OtherPages').then(m => ({ default: m.TemplatesPage })), { ssr: false });

const PAGE_TITLES = {
  leads:     '⚡ Live Leads',
  keywords:  '🔍 Keyword Research',
  outreach:  '📤 Outreach Log',
  analytics: '📊 Analytics',
  config:    '⚙️ Scraper Config',
  templates: '✏️ Pitch Templates',
};

function PageContent({ tab }) {
  if (tab === 'leads')     return <LeadsPage />;
  if (tab === 'keywords')  return <KeywordsPage />;
  if (tab === 'outreach')  return <OutreachPage />;
  if (tab === 'analytics') return <AnalyticsPage />;
  if (tab === 'config')    return <ConfigPage />;
  if (tab === 'templates') return <TemplatesPage />;
  return <LeadsPage />;
}

export default function Home() {
  const { activeTab } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      <style>{`
        .sidebar-wrapper  { display: none; }
        .mobile-nav-wrapper { display: block; }
        @media (min-width: 769px) {
          .sidebar-wrapper  { display: block !important; }
          .mobile-nav-wrapper { display: none !important; }
        }
      `}</style>

      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', paddingBottom: '100px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {PAGE_TITLES[activeTab] || '⚡ Dashboard'}
          </h1>
        </div>
        <PageContent tab={activeTab} />
      </main>

      <div className="mobile-nav-wrapper">
        <MobileNav />
      </div>
    </div>
  );
}
