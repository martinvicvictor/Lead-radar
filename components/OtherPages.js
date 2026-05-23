import { useState } from 'react';
import useStore, { DEFAULT_SOURCES } from '../lib/store';
import { heatLevel, heatColor } from '../lib/scoring';

/* ════════════════════════════════════════
   OUTREACH LOG
════════════════════════════════════════ */
export function OutreachPage() {
  const { outreachLog, followUps, completeFollowUp, deleteFollowUp } = useStore();
  const [tab, setTab] = useState('log');

  const pending = (followUps || []).filter(f => !f.done).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  const done    = (followUps || []).filter(f => f.done);

  const fmt = iso => { try { return new Date(iso).toLocaleString(); } catch { return '—'; } };
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return '—'; } };
  const isOverdue = iso => new Date(iso) < new Date();

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 8, padding: 3, marginBottom: 20, border: '1px solid var(--border)', width: 'fit-content' }}>
        {[['log','📤 Outreach Log'], ['followup','⏰ Follow-ups']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '6px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            border: 'none', fontWeight: tab === id ? 600 : 400,
            background: tab === id ? 'var(--bg3)' : 'transparent',
            color: tab === id ? 'var(--text)' : 'var(--text2)',
            fontFamily: 'inherit',
          }}>
            {label}
            {id === 'followup' && pending.length > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '0 5px' }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* OUTREACH LOG */}
      {tab === 'log' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>{outreachLog.length} pitches sent total</div>
          {!outreachLog.length ? (
            <Empty icon="📤" text="No outreach yet. Pitch a lead to log it here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {outreachLog.map((entry, i) => (
                <div key={i} style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 14px',
                  borderLeft: `3px solid ${heatColor(entry.score || 50)}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{entry.handle}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>via {entry.source}</span>
                      {entry.region && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>· {entry.region}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt(entry.sentAt)}</span>
                      {entry.template && <Chip label={entry.template} color="var(--accent2)" bg="rgba(99,102,241,0.12)" />}
                      <Chip label="Sent ✓" color="#22c55e" bg="rgba(34,197,94,0.12)" />
                    </div>
                  </div>
                  {entry.pitchPreview && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{entry.pitchPreview}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* FOLLOW-UPS */}
      {tab === 'followup' && (
        <>
          {!followUps?.length ? (
            <Empty icon="⏰" text="No follow-ups scheduled. When you pitch a lead, tick 'Set a follow-up reminder'." />
          ) : (
            <>
              {pending.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                    Pending ({pending.length})
                  </div>
                  {pending.map(f => (
                    <div key={f.id} style={{
                      background: 'var(--bg2)', border: `1px solid ${isOverdue(f.dueDate) ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 8,
                      borderLeft: `3px solid ${isOverdue(f.dueDate) ? '#ef4444' : '#f59e0b'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.handle}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{f.note}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                            background: isOverdue(f.dueDate) ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: isOverdue(f.dueDate) ? '#ef4444' : '#f59e0b',
                          }}>
                            {isOverdue(f.dueDate) ? '⚠️ Overdue' : `Due ${fmtDate(f.dueDate)}`}
                          </span>
                          <button className="btn btn-success" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => completeFollowUp(f.id)}>✓ Done</button>
                          <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => deleteFollowUp(f.id)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {done.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                    Completed ({done.length})
                  </div>
                  {done.map(f => (
                    <div key={f.id} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px', marginBottom: 6, opacity: 0.6,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{f.handle}</span>
                          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{f.note}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Chip label="✓ Done" color="#22c55e" bg="rgba(34,197,94,0.12)" />
                          <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => deleteFollowUp(f.id)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ANALYTICS
════════════════════════════════════════ */
export function AnalyticsPage() {
  const { leads, dismissed, pitched, outreachLog, config, followUps } = useStore();
  const active    = leads.filter(l => !dismissed.includes(l.id));
  const hotLeads  = active.filter(l => heatLevel(l.score) === 'hot');
  const warmLeads = active.filter(l => heatLevel(l.score) === 'warm');
  const coldLeads = active.filter(l => heatLevel(l.score) === 'cold');
  const ngLeads   = active.filter(l => (l.region||'').includes('Nigeria'));
  const intlLeads = active.filter(l => !(l.region||'').includes('Nigeria'));
  const convRate  = active.length ? Math.round((pitched.length / active.length) * 100) : 0;
  const pendingFU = (followUps||[]).filter(f => !f.done).length;

  const srcMap = {};
  active.forEach(l => { const s = l.source||'Unknown'; srcMap[s] = (srcMap[s]||0)+1; });
  const topSources = Object.entries(srcMap).sort((a,b) => b[1]-a[1]).slice(0, 6);

  const kwMap = {};
  active.forEach(l => { if(l.keyword){ kwMap[l.keyword] = (kwMap[l.keyword]||0)+1; } });
  const topKeywords = Object.entries(kwMap).sort((a,b) => b[1]-a[1]).slice(0, 6);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📊 Analytics</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        <StatBox label="Total leads" value={active.length} />
        <StatBox label="Pitched" value={pitched.length} color="#22c55e" sub={`${convRate}% conversion`} />
        <StatBox label="🔥 Hot leads" value={hotLeads.length} color="#ef4444" sub="Score ≥78" />
        <StatBox label="🇳🇬 Nigeria" value={ngLeads.length} color="#f59e0b" />
        <StatBox label="🌍 International" value={intlLeads.length} color="var(--accent2)" />
        <StatBox label="⏰ Follow-ups" value={pendingFU} color={pendingFU > 0 ? '#ef4444' : 'var(--text)'} sub="pending" />
      </div>

      {/* Heat breakdown */}
      <PanelCard title="Lead temperature">
        {[
          { label: '🔥 Hot',  count: hotLeads.length,  color: '#ef4444' },
          { label: '⚡ Warm', count: warmLeads.length, color: '#f59e0b' },
          { label: '❄️ Cold', count: coldLeads.length, color: '#3b82f6' },
        ].map(item => (
          <BarRow key={item.label} label={item.label} count={item.count} total={active.length} color={item.color} />
        ))}
      </PanelCard>

      {/* Top sources */}
      <PanelCard title="Top lead sources">
        {topSources.length === 0
          ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>Run a scan to populate</div>
          : topSources.map(([src, count]) => (
              <BarRow key={src} label={src} count={count} total={active.length} color="var(--accent)" />
            ))
        }
      </PanelCard>

      {/* Top keywords */}
      <PanelCard title="Top performing keywords">
        {topKeywords.length === 0
          ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No keyword data yet</div>
          : topKeywords.map(([kw, count]) => (
              <BarRow key={kw} label={kw} count={count} total={active.length} color="#22c55e" />
            ))
        }
      </PanelCard>
    </div>
  );
}

/* ════════════════════════════════════════
   CONFIG
════════════════════════════════════════ */
export function ConfigPage() {
  const { config, setConfig, addKeyword, removeKeyword, toggleSource } = useStore();
  const [newKw, setNewKw]   = useState('');
  const [saved, setSaved]   = useState(false);
  const [pbOpen, setPbOpen] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const sources = config.sources || DEFAULT_SOURCES;
  const freeSources   = sources.filter(s => s.free);
  const paidSources   = sources.filter(s => !s.free);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>⚙️ Scraper Configuration</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>All settings persist across sessions and sync to your backend scraper.</div>

      {/* Contact details */}
      <Section title="Your contact details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="WhatsApp number">
            <input className="input" value={config.waNumber} onChange={e => setConfig({ waNumber: e.target.value })} placeholder="+234XXXXXXXXXX" />
          </Field>
          <Field label="Email address">
            <input className="input" value={config.email} onChange={e => setConfig({ email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <Field label="Business name">
            <input className="input" value={config.businessName} onChange={e => setConfig({ businessName: e.target.value })} />
          </Field>
          <Field label="Location filter">
            <select className="input" value={config.locationFilter} onChange={e => setConfig({ locationFilter: e.target.value })}>
              <option value="both">Both (Nigeria + International)</option>
              <option value="nigeria">Nigeria only</option>
              <option value="intl">International only</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Keywords */}
      <Section title="Scan keywords">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {(config.keywords || []).map(kw => (
            <span key={kw} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(99,102,241,0.12)', color: 'var(--accent2)',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20,
              fontSize: 12, padding: '3px 10px',
            }}>
              {kw}
              <button onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input" value={newKw}
            onChange={e => setNewKw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newKw.trim()) { addKeyword(newKw.trim()); setNewKw(''); } }}
            placeholder="Add keyword and press Enter..."
          />
          <button className="btn btn-primary" onClick={() => { if (newKw.trim()) { addKeyword(newKw.trim()); setNewKw(''); } }}>+ Add</button>
        </div>
      </Section>

      {/* Free sources */}
      <Section title="✅ Free sources — active now">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {freeSources.map(src => (
            <label key={src.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: src.enabled ? 'rgba(34,197,94,0.06)' : 'var(--bg3)',
              border: `1px solid ${src.enabled ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
              borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={src.enabled} onChange={() => toggleSource(src.id)} style={{ cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{src.label}</div>
                <div style={{ fontSize: 10, color: '#22c55e', marginTop: 1 }}>{src.note}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* PhantomBuster sources */}
      <Section title="🔑 Premium sources — connect when ready">
        <div style={{
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8, padding: '12px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--accent2)' }}>How PhantomBuster works</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
            PhantomBuster is a cloud tool that scrapes LinkedIn, Facebook Groups, Instagram and Quora for you. You create one account, set up agents for each platform, then paste your API key below. Each source stays dormant until you enable it.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Steps to activate:</strong><br />
            1. Sign up at <a href="https://phantombuster.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)' }}>phantombuster.com</a> (~$15–30/mo)<br />
            2. Create an agent for each platform you want (LinkedIn Search, Facebook Group Scraper, etc.)<br />
            3. Copy your API key from PhantomBuster dashboard → Settings → API<br />
            4. In Vercel → your project → Settings → Environment Variables, add:<br />
            &nbsp;&nbsp;<code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>PHANTOMBUSTER_API_KEY</code> = your key<br />
            &nbsp;&nbsp;<code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>PB_LINKEDIN_AGENT_ID</code> = agent ID<br />
            &nbsp;&nbsp;<code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>PB_FACEBOOK_AGENT_ID</code> = agent ID<br />
            &nbsp;&nbsp;<code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>PB_INSTAGRAM_AGENT_ID</code> = agent ID<br />
            5. Then come back here and enable the sources below
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {paidSources.map(src => (
            <label key={src.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', cursor: 'pointer', opacity: 0.75,
            }}>
              <input type="checkbox" checked={src.enabled} onChange={() => toggleSource(src.id)} style={{ cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{src.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{src.note}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Custom domain info */}
      <Section title="🌐 Custom domain">
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
          To use <strong style={{ color: 'var(--text)' }}>radar.martinvic.com.ng</strong> (or any domain you own):
          <ol style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>In Vercel dashboard → your project → <strong>Settings → Domains</strong></li>
            <li>Type <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>radar.martinvic.com.ng</code> and click Add</li>
            <li>Vercel shows you a <strong>CNAME record</strong> to add (e.g. <code style={{ fontSize: 11 }}>cname.vercel-dns.com</code>)</li>
            <li>Go to wherever you manage martinvic.com.ng's DNS (usually your domain registrar or Namecheap/GoDaddy)</li>
            <li>Add that CNAME record pointing <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>radar</code> to the value Vercel gave you</li>
            <li>Wait 5–30 minutes — your app is now live at your custom domain!</li>
          </ol>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent2)' }}>
            ✅ SSL/HTTPS is automatic — Vercel handles it free of charge.
          </div>
        </div>
      </Section>

      {/* Scan settings */}
      <Section title="Scan settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Auto-scan interval">
            <select className="input" value={config.scanInterval} onChange={e => setConfig({ scanInterval: Number(e.target.value) })}>
              <option value={1}>Every 1 hour</option>
              <option value={3}>Every 3 hours</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Once daily</option>
            </select>
          </Field>
          <Field label={`Minimum lead score: ${config.minScore}`}>
            <input
              type="range" min={0} max={90} value={config.minScore}
              onChange={e => setConfig({ minScore: Number(e.target.value) })}
              style={{ width: '100%', marginTop: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
              <span>Show all</span><span>Hot only</span>
            </div>
          </Field>
        </div>
      </Section>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? '✅ Saved!' : '💾 Save configuration'}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════
   TEMPLATES
════════════════════════════════════════ */
export function TemplatesPage() {
  const { templates, updateTemplate, addTemplate, deleteTemplate } = useStore();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft]     = useState({});

  const startEdit = tpl => { setEditing(tpl.id); setDraft({ ...tpl }); };
  const cancelEdit = ()  => { setEditing(null); setDraft({}); };
  const saveEdit = ()    => { updateTemplate(editing, draft); setEditing(null); setDraft({}); };

  const newTpl = () => {
    const id = 'custom-' + Date.now();
    addTemplate({ id: id, name: "New template", channel: "any", body: "Hi {name}, I saw your post on {platform}. I can help with that - tell me more about what you need." });
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>✏️ Pitch Templates</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
            Available variables:
            {['{name}', '{platform}', '{excerpt}', '{businessName}', '{service}'].map(v => (
              <code key={v} style={{ background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4, marginLeft: 4, fontSize: 11 }}>{v}</code>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={newTpl}>+ New template</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {templates.map(tpl => (
          <div key={tpl.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            {editing === tpl.id ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input className="input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ flex: 1, minWidth: 160 }} placeholder="Template name" />
                  <select className="input" value={draft.channel} onChange={e => setDraft({ ...draft, channel: e.target.value })} style={{ width: 130 }}>
                    <option value="any">Any channel</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="dm">DM</option>
                  </select>
                </div>
                <textarea className="input" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} style={{ minHeight: 180, resize: 'vertical', lineHeight: 1.75 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={saveEdit}>✓ Save</button>
                  <button className="btn" onClick={cancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{tpl.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 20 }}>{tpl.channel}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => startEdit(tpl)}>✏️ Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => deleteTemplate(tpl.id)}>🗑</button>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)',
                  padding: '10px 12px', borderRadius: 8, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', maxHeight: 110, overflow: 'hidden', position: 'relative',
                }}>
                  {tpl.body}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   SHARED SUB-COMPONENTS
════════════════════════════════════════ */
function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function BarRow({ label, count, total, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{count}</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3 }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: total ? `${(count / total) * 100}%` : '0%',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

function Chip({ label, color, bg }) {
  return (
    <span style={{ fontSize: 10, background: bg, color, padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>{label}</span>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}
