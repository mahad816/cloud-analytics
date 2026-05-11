'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import DatasetUploader from '../components/DatasetUploader';
import DatasetList from '../components/DatasetList';
import Dashboard from '../components/Dashboard';
import type { Dataset } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [datasets, setDatasets]         = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);

  const totalRows = datasets
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + (d.row_count ?? 0), 0);

  const fetchDatasets = useCallback(async () => {
    try {
      const response = await axios.get<Dataset[]>(`${API_URL}/datasets`);
      setLoadError(null);
      setDatasets(response.data);
    } catch {
      setLoadError('Backend offline — start FastAPI on localhost:8000');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
    const id = setInterval(fetchDatasets, 5000);
    return () => clearInterval(id);
  }, [fetchDatasets]);

  const handleUpload = useCallback((newDataset: Dataset) => {
    setDatasets((cur) => [newDataset, ...cur.filter((d) => d.id !== newDataset.id)]);
    setSelectedDataset(newDataset);
  }, []);

  return (
    <>
      {/* moving ambient glow blobs */}
      <div className="ambient-bg" aria-hidden="true" />

      <div className="app-shell">
        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-row">
            {/* ── left: branding ── */}
            <div className="header-left">
              <p className="header-eyebrow">Analytics Workspace</p>

              <div className="header-wordmark">
                <div className="header-logo">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h1 className="app-title">Cloud Analytics</h1>
              </div>

              <p className="app-subtitle">
                Upload any CSV and get instant visual insights — column statistics, distributions, and missing-data analysis in seconds.
              </p>

            </div>

            {/* ── right: live stats ── */}
            <div className="header-right">
              <div className={`status-chip${loadError ? ' offline' : ''}`}>
                <span className="status-dot" />
                {loadError ? 'Offline' : 'Live'}
              </div>

              {!loading && (
                <div className="header-stats">
                  <div className="header-stat">
                    <span className="header-stat-value">{datasets.length}</span>
                    <span className="header-stat-label">Datasets</span>
                  </div>
                  <div className="header-stat-divider" />
                  <div className="header-stat">
                    <span className="header-stat-value">
                      {totalRows > 0 ? totalRows.toLocaleString() : '—'}
                    </span>
                    <span className="header-stat-label">Rows analyzed</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main grid ── */}
        <div className="app-grid">
          {/* left: uploader + list */}
          <div>
            <DatasetUploader onUpload={handleUpload} apiUrl={API_URL} />
            <DatasetList
              datasets={datasets}
              onSelect={setSelectedDataset}
              selectedId={selectedDataset?.id}
              loading={loading}
            />
          </div>

          {/* right: dashboard */}
          <div>
            <Dashboard dataset={selectedDataset} apiUrl={API_URL} />
          </div>
        </div>
      </div>
    </>
  );
}
