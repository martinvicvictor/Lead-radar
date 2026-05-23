import useStore from '../lib/store';

const NAV = [
  { id: 'leads',     icon: '⚡', label: 'Live Leads' },
  { id: 'keywords',  icon: '🔍', label: 'Keywords' },
  { id: 'outreach',  icon: '📤', label: 'Outreach Log' },
  { id: 'config',    icon: '⚙️', label: 'Scraper Config' },
  { id: 'templates', icon: '✏️', label: 'Pitch Templates' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, leads, dismissed, pitched, isScanning } = useStore();
  const activeLead = leads.filter((l) => !dismissed.includes(l.id)).length;

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--bg2)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>📡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>Lead Radar</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>martinvic.com.ng</div>
          </div>
        </div>

        {/* Scan status */}
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: isScanning ? '#22c55e' : 'var(--text3)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isScanning ? '#22c55e' : 'var(--text3)',
            animation: isScanning ? 'pulse 2s infinite' : 'none',
          }} />
          {isScanning ? 'Scanning sources...' : 'Radar active'}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 0', flex: 1, overflow: 'auto' }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 16px', background: activeTab === item.id
                ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: 'none', borderLeft: activeTab === item.id
                ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === item.id ? 'var(--accent2)' : 'var(--text2)',
              fontSize: 13, fontWeight: activeTab === item.id ? 600 : 400,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'leads' && activeLead > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                borderRadius: 20, minWidth: 18, textAlign: 'center',
              }}>{activeLead}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom stats */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>This session</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{activeLead}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>leads</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{pitched.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>pitched</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
