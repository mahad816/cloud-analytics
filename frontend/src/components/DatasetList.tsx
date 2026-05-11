import type { Dataset } from '../types';

interface Props {
  datasets: Dataset[];
  onSelect: (d: Dataset) => void;
  selectedId?: number;
  loading: boolean;
}

const STATUS: Record<string, string> = {
  completed: '#10b981',
  processing: '#f59e0b',
  queued:     '#3b82f6',
  failed:     '#ef4444',
};

function CsvIcon({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

export default function DatasetList({ datasets, onSelect, selectedId, loading }: Props) {
  const color = (s: string) => STATUS[s] ?? '#475569';

  if (loading) {
    return (
      <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
        {/* skeleton rows */}
        {[1,2].map(i => (
          <div key={i} style={{
            height: '62px',
            borderRadius: '12px',
            marginBottom: i < 2 ? '10px' : 0,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            animation: 'shimmer 1.6s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        <style>{`
          @keyframes shimmer {
            0%,100% { opacity: 0.5; }
            50%      { opacity: 0.9; }
          }
        `}</style>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="panel" style={{ padding: '30px 20px', textAlign: 'center' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px', margin: '0 auto 12px',
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.14)',
          display: 'grid', placeItems: 'center',
        }}>
          <CsvIcon color="#3b82f6" />
        </div>
        <p style={{ fontWeight: 700, color: '#475569', fontSize: '13px', margin: '0 0 5px' }}>
          No datasets yet
        </p>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
          Upload a CSV file above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '16px' }}>
      {/* list header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>
          Files
        </span>
        <span style={{
          padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
          background: 'rgba(59,130,246,0.10)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.18)',
        }}>
          {datasets.length}
        </span>
      </div>

      <div style={{ maxHeight: '430px', overflowY: 'auto', paddingRight: '3px' }}>
        {datasets.map((d) => {
          const sel = selectedId === d.id;
          const c   = color(d.status);
          return (
            <button
              key={d.id}
              type="button"
              className="dataset-button"
              onClick={() => onSelect(d)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px',
                marginBottom: '7px',
                borderRadius: '13px',
                cursor: 'pointer',
                border: `1px solid ${sel ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.05)'}`,
                background: sel
                  ? 'linear-gradient(135deg,rgba(37,99,235,0.16),rgba(6,182,212,0.08))'
                  : 'rgba(255,255,255,0.025)',
                boxShadow: sel ? '0 0 0 1px rgba(59,130,246,0.22), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                {/* file icon */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                  background: sel ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${sel ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.07)'}`,
                  display: 'grid', placeItems: 'center',
                }}>
                  <CsvIcon color={sel ? '#60a5fa' : '#475569'} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <p style={{
                      margin: 0, fontSize: '12.5px', fontWeight: 600,
                      color: sel ? '#e2e8f0' : '#94a3b8',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {d.filename}
                    </p>
                    <span style={{
                      flexShrink: 0,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '9.5px', fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: `${c}18`,
                      color: c,
                      border: `1px solid ${c}35`,
                    }}>
                      {d.status}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 0', fontSize: '10.5px', color: '#475569' }}>
                    {new Date(d.created_at).toLocaleString()}
                  </p>

                  {d.row_count != null && (
                    <p style={{ margin: '3px 0 0', fontSize: '10.5px', color: '#475569' }}>
                      {d.row_count.toLocaleString()} rows · {d.column_count} cols
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
