import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Calendar, Filter, FileSpreadsheet, Download } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function ExportModule() {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('PO'); // 'PO' or 'PR'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleExport = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams({
        type: exportType,
        startDate: startDate || '',
        endDate: endDate || '',
        status: statusFilter || 'ALL'
      });

      const downloadUrl = `${API_BASE}/export/download-excel?${params.toString()}`;
      
      console.log("Triggering download from:", downloadUrl);

      // Method 1: Simple window.location for best reliability
      // This will trigger the browser's native download handler
      window.location.href = downloadUrl;

      // Give some feedback
      alert(`已發送匯出請求，請查看瀏覽器下載列。\nExport request sent. Please check your browser's download bar.`);

    } catch (err) {
      console.error('Export error:', err);
      alert(`匯出失敗 / Export Failed: ${err.message}`);
    } finally {
      // We set a timeout because window.location.href doesn't "finish" in a way we can catch
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div className="card" style={{ padding: '2.5rem', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '12px' }}>
            <FileSpreadsheet color="#fff" size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e3a8a' }}>採購總表匯出中心</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Export Center /採購汇总导出</p>
          </div>
        </div>

        {/* Export Type Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <button 
            onClick={() => setExportType('PO')}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: exportType === 'PO' ? '#fff' : 'transparent', color: exportType === 'PO' ? '#1e3a8a' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: exportType === 'PO' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            採購總表 (PO Summary)
          </button>
          <button 
            onClick={() => setExportType('PR')}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: exportType === 'PR' ? '#fff' : 'transparent', color: exportType === 'PR' ? '#1e3a8a' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: exportType === 'PR' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            請購總表 (PR Summary)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="filter-group">
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#475569' }}>
              <Calendar size={14} style={{ marginRight: '4px' }} /> 起始日期 Start Date
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#475569' }}>
              <Calendar size={14} style={{ marginRight: '4px' }} /> 結束日期 End Date
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>
          <div className="filter-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#475569' }}>
              <Filter size={14} style={{ marginRight: '4px' }} /> 訂單狀態 Status Filter
            </label>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#fff' }}
            >
              <option value="ALL">全部 (ALL)</option>
              {exportType === 'PO' ? (
                <>
                  <option value="APPROVED">已核准 (APPROVED)</option>
                  <option value="PENDING">待簽核 (PENDING)</option>
                  <option value="DRAFT">草稿 (DRAFT)</option>
                  <option value="REJECTED">已退回 (REJECTED)</option>
                </>
              ) : (
                <>
                  <option value="APPROVED">已核准 (APPROVED)</option>
                  <option value="PENDING">待審核 (PENDING)</option>
                  <option value="CONVERTED">已轉 PO (CONVERTED)</option>
                  <option value="DRAFT">草稿 (DRAFT)</option>
                  <option value="REJECTED">已駁回 (REJECTED)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a' }}>預設導出格式說明：</h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#64748b', fontSize: '0.85rem', lineHeight: '1.6' }}>
            <li>包含所有明細資料 ({exportType === 'PO' ? 'PO No, PR No, Supplier, etc.' : 'PR No, Requester, Department, etc.'})</li>
            <li>自動根據您的篩選條件進行過濾。</li>
            <li>格式已對齊公司標準會計報表格式。</li>
          </ul>
        </div>
        <button 
          onClick={handleExport} 
          disabled={loading}
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s', background: loading ? '#94a3b8' : 'var(--primary)' }}
        >
          {loading ? (
            '正在處理中 Processing...'
          ) : (
            <>
              <Download size={20} /> 立即匯出{exportType === 'PO' ? '採購' : '請購'}總表 (Export to Excel)
            </>
          )}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'right', color: '#cbd5e1', fontSize: '0.75rem' }}>
          System Engine: v2.5 - Backend Export Mode
        </div>
      </div>
    </div>
  );
}
