import React, { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';
import axios from 'axios';
import { Calendar, Filter, FileSpreadsheet, Download } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

export default function ExportModule() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/export/po-details`);
      let data = res.data;

      // Local filtering
      if (startDate) {
        data = data.filter(d => new Date(d.po_date) >= new Date(startDate));
      }
      if (endDate) {
        data = data.filter(d => new Date(d.po_date) <= new Date(endDate));
      }
      if (statusFilter !== 'ALL') {
        data = data.filter(d => (d.status || 'draft').toUpperCase() === statusFilter);
      }

      if (data.length === 0) {
        alert('此篩選條件下無資料可匯出 / No data found for selected filters.');
        setLoading(false);
        return;
      }

      // Format for Excel according to screenshot
      const excelData = data.map((row, index) => ({
        'S.No': index + 1,
        'PO 建立 Date': new Date(row.po_date).toLocaleDateString(),
        'PO No': row.po_number,
        'PR No': row.pr_number || '-',
        '供應商名稱 Name': row.supplier_name || '-',
        '供應商代碼 Supplies Code': row.supplier_code || '-',
        'Details': `${row.material_number || ''} ${row.description || ''}`.trim(),
        'UNIT': row.unit || '-',
        'QTY': row.quantity || 0,
        '單價': row.unit_price || 0,
        '科目代碼 (Code)': row.subject_code || '-',
        'REMARKS': row.remark_zh || '-',
        '狀態': (row.status || 'draft').toUpperCase()
      }));

      const ws = xlsx.utils.json_to_sheet(excelData);
      
      // Auto-size columns (rough estimate)
      const colWidths = Object.keys(excelData[0]).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Procurement_Summary");
      
      const fileName = `KST_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
      xlsx.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export error:', err);
      const msg = err.response?.data?.message || err.message;
      alert(`匯出失敗 / Export Failed: ${msg}`);
    } finally {
      setLoading(false);
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
              <option value="APPROVED">已核准 (APPROVED)</option>
              <option value="PENDING">待簽核 (PENDING)</option>
              <option value="DRAFT">草稿 (DRAFT)</option>
              <option value="REJECTED">已退回 (REJECTED)</option>
            </select>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a' }}>預設導出格式說明：</h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#64748b', fontSize: '0.85rem', lineHeight: '1.6' }}>
            <li>包含所有明細資料 (S.No, Date, PO/PR No, Supplier, Details, Qty, Price, Account Subject, etc.)</li>
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
              <Download size={20} /> 立即匯出總表 (Export to Excel)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
