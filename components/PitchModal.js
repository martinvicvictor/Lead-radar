import { useState, useEffect } from 'react';
import useStore from '../lib/store';

export default function PitchModal({ lead, onClose }) {
  const { templates, config, pitchLead, addOutreach, addFollowUp } = useStore();
  const [selectedTpl, setSelectedTpl] = useState(0);
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [followUpNote, setFollowUpNote] = useState('');

  const fillTemplate = (tpl, l) => {
    if (!tpl || !l) return '';
    return tpl.body
      .replace(/{name}/g, l.handle || 'there')
      .replace(/{platform}/g, l.source || 'a platform')
      .replace(/{excerpt}/g, (l.excerpt || '').slice(0, 80) + '...')
      .replace(/{service}/g, 'web design')
      .replace(/{businessName}/g, config.businessName || 'martinvic.com.ng');
  };

  useEffect(() => {
    if (templates[selectedTpl] && lead) {
      setBody(fillTemplate(templates[selectedTpl], lead));
    }
  }, [selectedTpl, lead, templates]);

  const logSent = () => {
    pitchLead(lead.id);
    addOutreach({
      leadId: lead.id,
      handle: lead.handle,
      source: lead.source,
      region: lead.region,
      score: lead.score,
      pitchPreview: body.slice(0, 120) + '...',
      template: templates[selectedTpl]?.name,
      sentAt: new Date().toISOString(),
    });
    if (showFollowUp) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + followUpDays);
      addFollowUp({
        id: `fu-${Date.now()}`,
        leadId: lead.id,
        handle: lead.handle,
        source: lead.source,
        note: followUpNote || `Follow up with ${lead.handle} — pitched via ${lead.source}`,
        dueDate: dueDate.toISOString(),
        done: false,
        createdAt: new Date().toISOString(),
      });
    }
    setSent(true);
    setTimeout(onClose, 1800);
  };

  const handleSend = (channel) => {
    if (channel === 'whatsapp') {
      const num = (config.waNumber || '').replace(/\D/g, '');
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(body)}`, '_blank');
    } else if (channel === 'email') {
      const email = lead?.contact?.email || config.email;
      window.open(`mailto:${email}?subject=Website Design for Your Business&body=${encodeURIComponent(body)}`, '_blank');
    }
    logSent();
  };

  if (!lead) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 580,
        maxHeight: '92vh', overflow: 'auto',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              {sent ? '✅ Pitch logged!' : '✉️ Craft your pitch'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              → {lead.source} · {lead.handle}
              {lead.region && <span style={{ marginLeft: 6, opacity: 0.7 }}>· {lead.region}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Lead excerpt */}
          <div style={{
            background: 'var(--bg3)', padding: '10px 12px', borderRadius: 8,
            fontSize: 12, color: 'var(--text2)', marginBottom: 14,
            borderLeft: '2px solid var(--accent)', fontStyle: 'italic', lineHeight: 1.6,
          }}>
            "{(lead.excerpt || '').slice(0, 150)}{lead.excerpt?.length > 150 ? '...' : ''}"
          </div>

          {/* Template picker */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Template</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map((tpl, i) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTpl(i)}
                  className={selectedTpl === i ? 'btn btn-primary' : 'btn'}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editable pitch */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="input"
            style={{ minHeight: 190, resize: 'vertical', lineHeight: 1.75, fontSize: 13 }}
          />

          {/* Follow-up toggle */}
          <div style={{
            marginTop: 12, background: 'var(--bg3)', borderRadius: 8,
            padding: '10px 14px', border: '1px solid var(--border)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showFollowUp}
                onChange={e => setShowFollowUp(e.target.checked)}
              />
              <span>Set a follow-up reminder</span>
            </label>
            {showFollowUp && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Follow up in</div>
                  <select
                    className="input"
                    value={followUpDays}
                    onChange={e => setFollowUpDays(Number(e.target.value))}
                    style={{ padding: '6px 8px' }}
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                  </select>
                </div>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Note (optional)</div>
                  <input
                    className="input"
                    value={followUpNote}
                    onChange={e => setFollowUpNote(e.target.value)}
                    placeholder={`E.g. "They seemed interested, ask about budget"`}
                    style={{ padding: '6px 8px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={() => handleSend('whatsapp')} style={{ flex: 1 }}>
              📱 Open WhatsApp
            </button>
            {(lead.contact?.email || config.email) && (
              <button className="btn btn-primary" onClick={() => handleSend('email')} style={{ flex: 1 }}>
                📧 Open Email
              </button>
            )}
            <button
              className="btn"
              onClick={() => navigator.clipboard?.writeText(body).then(() => {})}
              style={{ flex: 1 }}
            >
              📋 Copy text
            </button>
          </div>

          {lead.contact?.url && (
            <a href={lead.contact.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8 }}>
              <button className="btn" style={{ width: '100%', fontSize: 12, color: 'var(--text3)' }}>
                ↗ View original post before pitching
              </button>
            </a>
          )}

          <button
            className="btn"
            onClick={logSent}
            style={{ width: '100%', marginTop: 8, color: 'var(--text3)', fontSize: 12 }}
          >
            ✓ Mark as sent (without opening app)
          </button>
        </div>
      </div>
    </div>
  );
}
