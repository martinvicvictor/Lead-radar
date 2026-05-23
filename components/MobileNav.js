import useStore from '../lib/store';

const ITEMS = [
  { id: 'leads',     icon: '⚡', label: 'Leads' },
  { id: 'keywords',  icon: '🔍', label: 'Keywords' },
  { id: 'outreach',  icon: '📤', label: 'Log' },
  { id: 'analytics', icon: '📊', label: 'Stats' },
  { id: 'config',    icon: '⚙️', label: 'Config' },
];

export default function MobileNav() {
  const { activeTab, setActiveTab, leads, dismissed, followUps } = useStore();
  const activeCount = leads.filter(l => !dismissed.includes(l.id)).length;
  const pendingFU   = (followUps || []).filter(f => !f.done).length;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg2)', borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {ITEMS.map(item => {
        const isActive = activeTab === item.id;
        const badge = item.id === 'leads' && activeCount > 0
          ? activeCount
          : item.id === 'outreach' && pendingFU > 0
          ? pendingFU
          : null;

        return (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '10px 4px 8px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: isActive ? 'var(--accent2)' : 'var(--text3)',
            fontFamily: 'inherit', position: 'relative',
            borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            {badge && (
              <span style={{
                position: 'absolute', top: 5, right: '50%', transform: 'translateX(10px)',
                background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700,
                borderRadius: 10, padding: '0 4px', minWidth: 14, textAlign: 'center', lineHeight: '14px',
              }}>{badge > 9 ? '9+' : badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
