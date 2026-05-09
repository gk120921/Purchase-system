import React, { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

export default function POList({ pos, onEdit, onDelete, onPreview }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');

  const filteredPos = pos
    .filter(po => {
      const status = po.status || 'draft';
      const matchStatus = filterStatus === 'ALL' || status.toUpperCase() === filterStatus;
      const matchSearch = 
        po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.pr_number && po.pr_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.display_supplier && po.display_supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });

  const statusLabels = {
    'ALL': { zh: '全部', en: 'ALL' },
    'DRAFT': { zh: '草稿', en: 'DRAFT' },
    'PENDING': { zh: '待簽核', en: 'PENDING' },
    'APPROVED': { zh: '已核准', en: 'APPROVED' },
    'REJECTED': { zh: '已退回', en: 'REJECTED' },
    'CLOSED': { zh: '已結案', en: 'CLOSED' }
  };

  const getCount = (status) => {
    if (status === 'ALL') return pos.length;
    return pos.filter(po => (po.status || 'draft').toUpperCase() === status).length;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          <input 
            type="text" 
            placeholder="快速搜尋 PO單號、PR單號或供應商... Search PO, PR or Supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', flexWrap: 'wrap' }}>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button 
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{ 
                padding: '0.5rem 0.75rem', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '70px',
                background: filterStatus === key ? '#fff' : 'transparent',
                color: filterStatus === key ? 'var(--primary)' : '#64748b',
                boxShadow: filterStatus === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{label.en}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {label.zh}
                <span style={{ 
                  background: filterStatus === key ? 'var(--primary)' : '#e2e8f0', 
                  color: filterStatus === key ? '#fff' : '#64748b',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '0.65rem'
                }}>
                  {getCount(key)}
                </span>
              </div>
            </button>
          ))}
        </div>
        <button 
          onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#64748b', whiteSpace: 'nowrap' }}
        >
          <ArrowUpDown size={16} /> {sortOrder === 'DESC' ? '由新到舊 Newest' : '由舊到新 Oldest'}
        </button>
      </div>

      <div className="card">
        <table style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
          <thead>
            <tr>
              <th>PO 單號 No.</th>
              <th>關聯 PR No.</th>
              <th>分類 Classification</th>
              <th>供應商 Supplier</th>
              <th>金額 Amount</th>
              <th>狀態 Status</th>
              <th>建立日期 Date</th>
              <th style={{ textAlign: 'right' }}>操作 Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPos.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>找不到符合條件的採購單</td></tr>
            ) : filteredPos.map(po => (
              <tr key={po.id} style={{ background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <td style={{ fontWeight: 900, color: 'var(--primary)', padding: '1rem' }}>{po.po_number}</td>
                <td style={{ color: 'var(--text-muted)' }}>{po.pr_number || '手動建立'}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold',
                    background: po.input_mode === 'ACCOUNTING' ? '#ecfdf5' : '#eff6ff',
                    color: po.input_mode === 'ACCOUNTING' ? '#059669' : '#2563eb',
                    border: po.input_mode === 'ACCOUNTING' ? '1px solid #10b981' : '1px solid #3b82f6'
                  }}>
                    {po.input_mode === 'ACCOUNTING' ? '會計科目 / ACC' : '物料清單 / BOM'}
                  </span>
                </td>
                <td>{po.display_supplier}</td>
                <td style={{ fontWeight: 'bold' }}>${po.total_amount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${po.status || 'draft'}`}>{(po.status || 'draft').toUpperCase()}</span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => onPreview(po)}
                        style={{ border: 'none', background: '#6366f1', color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span>預覽</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>PREVIEW</span>
                      </button>
                      {(po.status === 'draft' || po.status === 'pending' || po.status === 'rejected' || !po.status) && (
                        <>
                          <button 
                            onClick={() => onEdit(po)}
                            style={{ border: 'none', background: 'var(--primary)', color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span>修正</span>
                            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>EDIT</span>
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('確定要刪除這筆採購單嗎？ Confirm Delete?')) onDelete(po.id); }}
                            style={{ border: 'none', background: 'var(--danger)', color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span>刪除</span>
                            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>DELETE</span>
                          </button>
                        </>
                      )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
