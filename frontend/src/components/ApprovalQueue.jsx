import React, { useState } from 'react';
import { CheckCircle, X, Search } from 'lucide-react';

export default function ApprovalQueue({ items, onApprove, onPreview }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const safeItems = items || [];
  const filteredItems = safeItems
    .filter(item => {
      const matchType = filterType === 'ALL' || item.type === filterType;
      const id = item.type === 'PO' ? item.po_number : item.pr_number;
      const matchSearch = 
        (id && id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.subject_name && item.subject_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.display_supplier && item.display_supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.items_summary && item.items_summary.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchType && matchSearch;
    });

  const getCount = (type) => {
    if (type === 'ALL') return safeItems.length;
    return safeItems.filter(i => i.type === type).length;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          <input 
            type="text" 
            placeholder="搜尋單號、項目、供應商、料號或備註... Search No, Item, Supplier, Material or Remark..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          {['ALL', 'PR', 'PO'].map(type => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              style={{ 
                padding: '0.5rem 1rem', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: filterType === type ? '#fff' : 'transparent',
                color: filterType === type ? 'var(--primary)' : '#64748b',
                boxShadow: filterType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {type}
              <span style={{ 
                background: filterType === type ? 'var(--primary)' : '#e2e8f0', 
                color: filterType === type ? '#fff' : '#64748b',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.65rem'
              }}>
                {getCount(type)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {filteredItems.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>找不到符合條件的待簽核申請 No Pending Approvals Found</p> : (
          <table>
            <thead>
              <tr>
                <th>類型 Type</th>
                <th>單號 No.</th>
                <th>品項摘要與備註 Item Summary & Remarks</th>
                <th>金額 Amount</th>
                <th style={{ textAlign: 'right' }}>審查操作 Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={`${item.type}-${item.id}`}>
                  <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.type}</td>
                  <td style={{ fontWeight: 900 }}>
                    {item.type === 'PO' ? item.po_number : item.pr_number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {item.type === 'PR' ? `${item.subject_name} | ` : ''}
                      {item.items_summary || '無品項資料 No Item Data'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                      <span style={{ fontWeight: 'bold' }}>備註 Remarks:</span> {item.remarks || 'None'}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>${(item.total_amount || 0).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', background: '#6366f1', color: '#fff', border: 'none', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => onPreview(item, item.type)}>
                        <span>預覽</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>PREVIEW</span>
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => onApprove(item.id, 'approved', item.type)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> <span>核准</span>
                        </div>
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>APPROVE</span>
                      </button>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', background: '#ef4444', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => onApprove(item.id, 'rejected', item.type)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <X size={14} /> <span>退回</span>
                        </div>
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>REJECT</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
