import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import LeadCard from './LeadCard';
import PitchModal from './PitchModal';
import { getRandomDemoLead, DEMO_LEADS } from '../lib/demoLeads';
import { heatLevel } from '../lib/scoring';

function exportCSV(leads) {
  const headers = ['Handle','Source','Region','Score','Heat','Keyword','Excerpt','URL','Date'];
  const rows = leads.map(l => [
    `"${(l.handle||'').replace(/"/g,'')}"`,
    `"${l.source||''}"`,
    `"${l.region||''}"`,
    l.score||0,
    heatLevel(l.score),
    `"${(l.keyword||'').replace(/"/g,'')}"`,
    `"${(l.excerpt||'').replace(/"/g,'').slice(0,100)}"`,
    `"${l.contact?.url||''}"`,
    `"${l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}"`,
  ]);
  const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function LeadsPage() {
  const { leads, dismissed, pitched, isScanning, scanProgress,
          addLeads, setScanning, setScanProgress, config } = useStore();

  const [filter,      setFilter]      = useState('all');
  const [pitchTarget, setPitchTarget] = useState(null);
  const [scanMsg,     setScanMsg]     = useState('');
  const [scanError,   setScanError]   = useState('');
  const [newCount,    setNewCount]    = useState(0);

  const visible = leads.filter(l => {
    if (dismissed.includes(l.id))  return false;
    if (l.score < (config.minScore||0)) return false;
    if (filter === 'hot')       return heatLevel(l.score) === 'hot';
    if (filter === 'warm')      return heatLevel(l.score) === 'warm';
    if (filter === 'cold')      return heatLevel(l.score) === 'cold';
    if (filter === 'ng')        return (l.region||'').includes('Nigeria');
    if (filter === 'intl')      return !(l.region||'').includes('Nigeria');
    if (filter === 'unpitched') return !pitched.includes(l.id);
    return true;
  });

  const allActive    = leads.filter(l => !dismissed.includes(l.id));
  const hotCount     = allActive.filter(l => heatLevel(l.score) === 'hot').length;

  const runScan = async () => {
    if (isScanning) return;
    setScanning(true);
    setScanProgress(0);
    setScanError('');
    setNewCount(0);

    const STEPS = [
      'Scanning Reddit threads...',
      'Scanning Nairaland forums...',
      'Checking Twitter / X...',
      'Scoring and ranking results...',
    ];

    const enabledSources = (config.sources||[]).filter(s=>s.enabled).map(s=>s.id);

    let step = 0;
    setScanMsg(STEPS[0]);
    const ticker = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1);
      setScanMsg(STEPS[step]);
      setScanProgress(Math.round(((step+1)/STEPS.length)*80));
    }, 900);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: config.keywords || [],
          sources:  enabledSources,
          existingIds: leads.map(l => l.id),
        }),
      });
      clearInterval(ticker);

      if (!res.ok) throw new Error('Server error ' + res.status);

      const data  = await res.json();
      const fresh = data.leads || [];
      setScanProgress(100);
      setScanMsg('Done! Found ' + fresh.length + ' new leads.');
      setNewCount(fresh.length);
      if (fresh.length > 0) addLeads(fresh);

    } catch (err) {
      clearInterval(ticker);
      setScanError('Could not reach scanner — showing demo leads instead.');
      const fallback = [];
      const used = new Set(leads.map(l=>l.id));
      for (let i=0;i<3;i++){const l=getRandomDemoLead([...used]);if(l){fallback.push(l);used.add(l.id);}}
      if (fallback.length) addLeads(fallback);
      setNewCount(fallback.length);
      setScanMsg('Loaded ' + fallback.length + ' demo leads.');
    }

    setTimeout(() => { setScanning(false); setScanProgress(0); setScanMsg(''); }, 2500);
  };

  useEffect(() => {
    if (leads.length === 0) addLeads(DEMO_LEADS);
  }, []); // eslint-disable-line

  const FILTERS = [
    {id:'all',label:'All'},
    {id:'hot',label:'🔥 Hot'},
    {id:'warm',label:'⚡ Warm'},
    {id:'cold',label:'❄️ Cold'},
    {id:'ng',label:'🇳🇬 Nigeria'},
    {id:'intl',label:'🌍 International'},
    {id:'unpitched',label:'📬 Unpitched'},
  ];

  return (
    <div style={{maxWidth:800,margin:'0 auto'}}>

      {/* Metrics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          {label:'Active leads', value:allActive.length,          color:'var(--accent2)'},
          {label:'🔥 Hot',       value:hotCount,                   color:'#ef4444'},
          {label:'Pitched',      value:pitched.length,             color:'#22c55e'},
          {label:'Keywords',     value:(config.keywords||[]).length,color:'#f59e0b'},
        ].map(m => (
          <div key={m.label} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:m.color,lineHeight:1}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Scan progress */}
      {isScanning && (
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 16px',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:13,color:'var(--text2)'}}>⚡ {scanMsg}</span>
            <span style={{fontSize:13,color:'var(--accent2)',fontWeight:600}}>{scanProgress}%</span>
          </div>
          <div style={{height:4,background:'var(--bg3)',borderRadius:2}}>
            <div style={{height:'100%',width:`${scanProgress}%`,background:'var(--accent)',borderRadius:2,transition:'width 0.5s ease'}}/>
          </div>
        </div>
      )}

      {/* New leads banner */}
      {!isScanning && newCount > 0 && (
        <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:13,color:'#22c55e'}}>✅ {newCount} new lead{newCount>1?'s':''} added!</span>
          <button onClick={()=>setNewCount(0)} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:18}}>×</button>
        </div>
      )}

      {/* Error banner */}
      {scanError && (
        <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:12,color:'#ef4444'}}>⚠️ {scanError}</span>
          <button onClick={()=>setScanError('')} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:18}}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:15,fontWeight:600}}>
          Incoming leads
          {config.lastScan && <span style={{fontSize:11,color:'var(--text3)',fontWeight:400,marginLeft:8}}>Last scan: {new Date(config.lastScan).toLocaleTimeString()}</span>}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={runScan} disabled={isScanning} style={{fontSize:12}}>
            {isScanning ? '⏳ Scanning...' : '🔄 Scan now'}
          </button>
          <button className="btn" onClick={()=>{const l=getRandomDemoLead(leads.map(x=>x.id));if(l)addLeads([l]);}} style={{fontSize:12}}>
            ➕ Simulate
          </button>
          <button className="btn" onClick={()=>exportCSV(visible)} style={{fontSize:12}}>⬇️ CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:4,background:'var(--bg2)',borderRadius:8,padding:3,marginBottom:16,flexWrap:'wrap',border:'1px solid var(--border)'}}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{padding:'5px 12px',borderRadius:6,fontSize:12,cursor:'pointer',border:'none',fontWeight:filter===f.id?600:400,background:filter===f.id?'var(--bg3)':'transparent',color:filter===f.id?'var(--text)':'var(--text2)',fontFamily:'inherit',transition:'all 0.15s'}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {visible.length === 0 ? (
          <div style={{textAlign:'center',padding:'48px 20px',color:'var(--text3)'}}>
            <div style={{fontSize:40,marginBottom:10}}>📡</div>
            <div style={{fontSize:14,marginBottom:6}}>No leads match this filter</div>
            <div style={{fontSize:12,marginBottom:16}}>Click "Scan now" to pull real leads or "Simulate" for demo data</div>
            <button className="btn btn-primary" onClick={runScan} disabled={isScanning}>🔄 Scan now</button>
          </div>
        ) : (
          visible.map(lead => <LeadCard key={lead.id} lead={lead} onPitch={l=>setPitchTarget(l)} />)
        )}
      </div>

      {pitchTarget && <PitchModal lead={pitchTarget} onClose={()=>setPitchTarget(null)} />}
    </div>
  );
}
