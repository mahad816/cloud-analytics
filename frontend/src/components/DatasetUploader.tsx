'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Dataset } from '../types';

interface Props {
  onUpload: (dataset: Dataset) => void;
  apiUrl: string;
}

export default function DatasetUploader({ onUpload, apiUrl }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMsg({ ok: false, text: 'Only .csv files are supported.' });
      return;
    }
    setUploading(true);
    setProgress(0);
    setMsg(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const { data } = await axios.post<Dataset>(`${apiUrl}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
      });
      onUpload(data);
      setMsg(data.status === 'failed'
        ? { ok: false, text: data.error_message || 'Analysis failed.' }
        : { ok: true,  text: 'Analyzed successfully — select it to view charts.' }
      );
    } catch {
      setMsg({ ok: false, text: 'Upload failed. Is the backend running?' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [apiUrl, onUpload]);

  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop      = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files[0]) await uploadFile(e.dataTransfer.files[0]);
  }, [uploadFile]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await uploadFile(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload CSV file"
      className={`upload-card${isDragging ? ' dragging' : ''}`}
      style={{ cursor: uploading ? 'wait' : 'pointer' }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !uploading && document.getElementById('csv-input')?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !uploading && document.getElementById('csv-input')?.click()}
    >
      <input id="csv-input" type="file" accept=".csv" onChange={onFile} style={{ display: 'none' }} />

      {uploading ? (
        /* ── uploading state ── */
        <div style={{ padding: '6px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
            {/* spinner */}
            <div style={{
              width: '18px', height: '18px',
              border: '2.5px solid rgba(59,130,246,0.2)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 600 }}>
              Analyzing… {progress}%
            </span>
          </div>
          {/* progress track */}
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`, height: '100%', borderRadius: '2px',
              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
              boxShadow: '0 0 12px rgba(37,99,235,0.55)',
              transition: 'width 0.25s ease',
            }} />
          </div>
        </div>
      ) : (
        /* ── idle state ── */
        <>
          <div className="upload-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p style={{ margin: '0 0 5px', fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
            {isDragging ? 'Drop to analyze' : 'Drop a CSV here'}
          </p>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
            or click to browse&nbsp;·&nbsp;analysis runs instantly
          </p>
        </>
      )}

      {/* feedback message */}
      {msg && (
        <div style={{
          marginTop: '14px',
          padding: '9px 14px',
          borderRadius: '10px',
          fontSize: '12.5px',
          fontWeight: 500,
          background: msg.ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
          border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.28)' : 'rgba(239,68,68,0.28)'}`,
          color: msg.ok ? '#6ee7b7' : '#fca5a5',
        }}>
          {msg.ok ? '✓ ' : '⚠ '}{msg.text}
        </div>
      )}
    </div>
  );
}
