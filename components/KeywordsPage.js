import { useState } from 'react';
import { getKeywords, diffColor, diffLabel, INTENT } from '../lib/keywords';
import useStore from '../lib/store';

export default function KeywordsPage() {
  const { savedKeywords, saveKeywordIdea, removeSavedKeyword, addKeyword, config } = useStore();
  const [seed, setSeed] = useState('web design Nigeria');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [intentFilter, setIntentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('diff'); // diff | vol | alpha

  const search = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setResults(getKeywords(seed));
    setLoading(false);
  };

  const filtered = (results || []).filter((k) =>
    intentFilter === 'all' || k.intent === intentFilter
  ).sort((a, b) => {
    if (sortBy === 'diff')  return a.diff - b.diff;
    if (sortBy === 'vol')   return b.vol - a.vol;
    if (sortBy === 'alpha') return a.keyword.localeCompare(b.keyword);
    return 0;
  });

  const isSaved = (kw) => savedKeywords.some((k) => k.keyword === kw);
  const isInConfig = (kw) => config.keywords.includes(kw);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>🔍 Keyword Research</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          Find low-competition keywords to write blogs or YouTube videos on — building your inbound leads over time.
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          className="input"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Enter a topic, e.g. 'web design Lagos', 'freelance developer Nigeria'..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={search} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
          {loading ? '⏳ Searching...' : '🔍 Find keywords'}
        </button>
      </div>

      {/* Intent explainer */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(INTENT).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setIntentFilter(intentFilter === key ? 'all' : key)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: intentFilter === key ? val.bg : 'var(--bg2)',
              color: intentFilter === key ? val.color : 'var(--text3)',
              border: `1px solid ${intentFilter === key ? val.color+'44' : 'var(--border)'}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {val.label}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', marginLeft: 4 }}>
          Filter by intent
        </span>
      </div>

      {results && (
        <>
          {/* Sort + count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filtered.length} keywords found</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>Sort:</span>
              {[['diff','Easiest first'],['vol','Highest volume'],['alpha','A–Z']].map(([k,l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={sortBy === k ? 'btn btn-primary' : 'btn'}
                  style={{ fontSize: 11, padding: '4px 10px' }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '3fr 80px 120px 120px 180px 120px',
              padding: '8px 14px',
              borderBottom: '1px solid var(--border)',
              fontSize: 10, fontWeight: 700, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.5px', gap: 8,
            }}>
              <span>Keyword</span>
              <span>Vol/mo</span>
              <span>Difficulty</span>
              <span>Intent</span>
              <span>Content idea</span>
              <span>Actions</span>
            </div>
            {filtered.map((kw, i) => {
              const intent = INTENT[kw.intent] || INTENT.informational;
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 80px 120px 120px 180px 120px',
                  padding: '10px 14px', gap: 8,
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{kw.keyword}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
                    {kw.vol.toLocaleString()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${kw.diff}%`, background: diffColor(kw.diff), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: diffColor(kw.diff), fontWeight: 600, minWidth: 28 }}>
                        {kw.diff}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: diffColor(kw.diff), marginTop: 2 }}>{diffLabel(kw.diff)}</div>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 20, background: intent.bg, color: intent.color,
                    }}>{intent.label}</span>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{intent.tip}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>
                    {kw.contentIdea}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      className="btn"
                      style={{ fontSize: 10, padding: '3px 8px', color: isSaved(kw.keyword) ? '#22c55e' : 'var(--text2)' }}
                      onClick={() => isSaved(kw.keyword) ? removeSavedKeyword(kw.keyword) : saveKeywordIdea(kw)}
                    >
                      {isSaved(kw.keyword) ? '✓ Saved' : '💾 Save'}
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 10, padding: '3px 8px', color: isInConfig(kw.keyword) ? '#22c55e' : 'var(--text2)' }}
                      onClick={() => addKeyword(kw.keyword)}
                    >
                      {isInConfig(kw.keyword) ? '✓ In radar' : '📡 Add to radar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Saved keywords */}
      {savedKeywords.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💾 Saved content ideas ({savedKeywords.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedKeywords.map((kw) => {
              const intent = INTENT[kw.intent] || INTENT.informational;
              return (
                <div key={kw.keyword} style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{kw.keyword}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{kw.contentIdea}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: intent.bg, color: intent.color, fontWeight: 600 }}>
                    {intent.label}
                  </span>
                  <span style={{ fontSize: 11, color: diffColor(kw.diff), fontWeight: 600 }}>Diff: {kw.diff}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{kw.vol?.toLocaleString()} vol</span>
                  <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => removeSavedKeyword(kw.keyword)}>Remove</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!results && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14 }}>Enter a topic and click "Find keywords"</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Focus on low difficulty (green) + transactional intent for fastest results</div>
        </div>
      )}
    </div>
  );
}
