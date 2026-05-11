'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { AnalysisData, Dataset } from '../types';

interface Props { dataset: Dataset | null; apiUrl: string; }

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316'];
const TOP_N = 6;

function prepareDonut(vals: Record<string, number>) {
  const sorted = Object.entries(vals).sort(([, a], [, b]) => b - a);
  if (sorted.length <= TOP_N) return sorted.map(([name, value]) => ({ name, value }));
  const top   = sorted.slice(0, TOP_N).map(([name, value]) => ({ name, value }));
  const other = sorted.slice(TOP_N).reduce((s, [, v]) => s + v, 0);
  return [...top, { name: 'Other', value: other }];
}

function DonutCard({ col, vals }: { col: string; vals: Record<string, number> }) {
  const chartData = prepareDonut(vals);
  const total     = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{
      marginBottom: '20px',
      padding: '16px',
      borderRadius: '14px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* column label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#8b5cf6', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', flex: 1 }}>{col}</span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>{total.toLocaleString()} entries</span>
      </div>

      {/* donut + legend */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {/* donut */}
        <div style={{ position: 'relative', width: '154px', height: '154px', flexShrink: 0 }}>
          <ResponsiveContainer width={154} height={154}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={46} outerRadius={68}
                dataKey="value"
                strokeWidth={0}
                paddingAngle={2}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          {/* center label */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>
              {total.toLocaleString()}
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '3px' }}>
              total
            </span>
          </div>
        </div>

        {/* legend */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {chartData.map((item, i) => {
            const pct = total > 0 ? (item.value / total * 100) : 0;
            const c   = PIE_COLORS[i % PIE_COLORS.length];
            return (
              <div key={item.name} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: c, flexShrink: 0 }} />
                  <span style={{
                    fontSize: '12px', color: '#94a3b8', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700, flexShrink: 0, minWidth: '36px', textAlign: 'right' }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                {/* mini progress bar */}
                <div style={{
                  height: '3px', borderRadius: '2px', marginLeft: '15px',
                  background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '2px',
                    background: c, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: '#0d1a30',
  border: '1px solid rgba(59,130,246,0.18)',
  borderRadius: '10px',
  color: '#cbd5e1',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
};

function Tip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#93c5fd', fontSize: '11px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: 0, color: p.color }}>
          {p.name}&nbsp;
          <strong>{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ── small icon helpers ── */
function IconRows()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>; }
function IconCols()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>; }
function IconNum()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>; }
function IconBar()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function IconWarn()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconPie()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>; }

export default function Dashboard({ dataset, apiUrl }: Props) {
  const [data, setData]   = useState<AnalysisData | null>(null);
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState<string | null>(null);

  useEffect(() => {
    if (dataset?.status !== 'completed') { setData(null); setErr(null); return; }
    let live = true;
    setBusy(true); setErr(null);

    (async () => {
      try {
        const { data: d } = await axios.get<AnalysisData>(`${apiUrl}/datasets/${dataset.id}/download`);
        if (live) setData(d);
      } catch {
        if (dataset.processing_result) {
          try { if (live) setData(JSON.parse(dataset.processing_result)); return; } catch { /* fall */ }
        }
        if (live) setErr('Could not load results — is the backend running?');
      } finally {
        if (live) setBusy(false);
      }
    })();

    return () => { live = false; };
  }, [apiUrl, dataset]);

  /* ── empty / non-ready screens ── */
  if (!dataset) return (
    <div className="empty-state">
      <svg width="56" height="56" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 18, opacity: 0.25 }}>
        <rect x="8"  y="44" width="10" height="14" rx="2" fill="#3b82f6"/>
        <rect x="27" y="28" width="10" height="30" rx="2" fill="#3b82f6"/>
        <rect x="46" y="16" width="10" height="42" rx="2" fill="#3b82f6"/>
      </svg>
      <p style={{ fontWeight: 700, color: '#94a3b8', margin: '0 0 6px', fontSize: '14px' }}>No dataset selected</p>
      <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Select a file from the sidebar to see analytics</p>
    </div>
  );

  if (dataset.status === 'failed') return (
    <div className="empty-state" style={{ borderColor: 'rgba(239,68,68,0.18)' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(239,68,68,0.10)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <p style={{ fontWeight: 700, color: '#f87171', margin: '0 0 8px', fontSize: '14px' }}>Analysis failed</p>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: 340, lineHeight: 1.6 }}>
        {dataset.error_message || 'Could not process the CSV. Try a valid UTF-8 file.'}
      </p>
    </div>
  );

  if (dataset.status !== 'completed') return (
    <div className="empty-state">
      <div style={{
        width: '40px', height: '40px',
        border: '2.5px solid rgba(59,130,246,0.15)', borderTopColor: '#3b82f6',
        borderRadius: '50%', animation: 'spin 0.85s linear infinite', marginBottom: 14,
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, margin: 0 }}>Processing…</p>
    </div>
  );

  if (busy) return (
    <div className="empty-state">
      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Loading results…</p>
    </div>
  );

  if (err) return (
    <div className="empty-state" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
      <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{err}</p>
    </div>
  );

  /* ── main dashboard ── */
  return (
    <div>
      {/* file info bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '16px', padding: '12px 18px',
        borderRadius: '14px',
        background: 'rgba(7,14,30,0.65)',
        border: '1px solid rgba(59,130,246,0.14)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.9)',
        }}/>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dataset.filename}
        </span>
        {data?.shape && (
          <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
            {data.shape.rows?.toLocaleString()} rows · {data.shape.columns} cols
          </span>
        )}
        <span style={{
          padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          background: 'rgba(16,185,129,0.10)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)',
        }}>
          completed
        </span>
      </div>

      {data ? (
        <>
          {/* ── Metric cards ── */}
          <div className="metric-grid">
            {/* rows */}
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                <IconRows />
              </div>
              <div>
                <p style={{
                  margin: '0 0 2px', fontSize: '24px', fontWeight: 700, lineHeight: 1,
                  background: 'linear-gradient(135deg,#60a5fa,#34d399)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {data.shape?.rows?.toLocaleString() ?? '—'}
                </p>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>
                  Total rows
                </p>
              </div>
            </div>

            {/* columns */}
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                <IconCols />
              </div>
              <div>
                <p style={{
                  margin: '0 0 2px', fontSize: '24px', fontWeight: 700, lineHeight: 1,
                  background: 'linear-gradient(135deg,#a78bfa,#38bdf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {data.shape?.columns ?? '—'}
                </p>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>
                  Columns
                </p>
              </div>
            </div>

            {/* numeric cols */}
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <IconNum />
              </div>
              <div>
                <p style={{
                  margin: '0 0 2px', fontSize: '24px', fontWeight: 700, lineHeight: 1,
                  background: 'linear-gradient(135deg,#fbbf24,#f97316)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {data.statistics ? Object.keys(data.statistics).length : '—'}
                </p>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>
                  Numeric cols
                </p>
              </div>
            </div>
          </div>

          {/* ── Statistics chart ── */}
          {data.statistics && Object.keys(data.statistics).length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-header-icon"><IconBar /></div>
                <span className="chart-title">Column Statistics — Mean &amp; Std Dev</span>
              </div>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart
                  data={Object.entries(data.statistics).map(([name, v]) => ({ name, mean: v.mean, std: v.std }))}
                  margin={{ top: 4, right: 6, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="mean" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={40} />
                  <Bar dataKey="std"  fill="#10b981" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Missing data ── */}
          {data.missing_data && Object.values(data.missing_data).some(v => v > 0) && (
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-header-icon"><IconWarn /></div>
                <span className="chart-title">Missing Values by Column</span>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={Object.entries(data.missing_data)
                    .filter(([, v]) => v > 0)
                    .map(([name, missing]) => ({ name, missing }))}
                  margin={{ top: 4, right: 6, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="missing" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Categorical distributions ── */}
          {data.categorical_summary && Object.keys(data.categorical_summary).length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-header-icon"><IconPie /></div>
                <span className="chart-title">Categorical Distributions</span>
              </div>
              {Object.entries(data.categorical_summary).map(([col, vals]) => (
                <DonutCard key={col} col={col} vals={vals} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No analysis data found.</p>
        </div>
      )}
    </div>
  );
}
