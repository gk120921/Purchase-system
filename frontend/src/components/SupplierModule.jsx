import React from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function SupplierModule({ suppliers, onRefresh, onEdit }) {
  return (
    <div className="card">
      <div style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '1rem' }}>
        Total {suppliers.length} Qualified Suppliers / 共 {suppliers.length} 家合格供應商
      </div>
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ minWidth: '1000px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #1e3a8a' }}>
              <th style={{ padding: '1rem' }}>供應商編碼<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Supplier Code</span></th>
              <th style={{ padding: '1rem' }}>供應商名稱<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Supplier Name</span></th>
              <th style={{ padding: '1rem' }}>統一編號<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Tax ID</span></th>
              <th style={{ padding: '1rem' }}>供應商類別<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Category</span></th>
              <th style={{ padding: '1rem' }}>聯絡人 / 電話<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Contact / Phone</span></th>
              <th style={{ padding: '1rem' }}>電子郵件 / 地址<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Email / Address</span></th>
              <th style={{ padding: '1rem', width: '220px' }}>狀態與操作<br/><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Status & Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontWeight: 700 }}>{s.supplier_code || '-'}</td>
                <td style={{ padding: '1rem', fontWeight: 900, color: '#1e3a8a' }}>{s.name}</td>
                <td style={{ padding: '1rem' }}>{s.tax_id || '-'}</td>
                <td style={{ padding: '1rem' }}>{s.category || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700 }}>{s.contact || '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.phone || '-'}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={s.email}>{s.email || '-'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '200px' }}>{s.address || '-'}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <span className="status-badge status-approved" style={{ margin: 0, padding: '4px 8px', fontSize: '0.75rem' }}>
                      {s.status === 'qualified' ? '合格 (Pass)' : s.status}
                    </span>
                    <button 
                      style={{ border: 'none', background: '#eef2ff', color: '#4f46e5', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }} 
                      onClick={() => onEdit(s)}
                    >
                      Edit / 修改
                    </button>
                    <button 
                      style={{ border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }} 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this supplier? / 確定要刪除這家供應商嗎？')) {
                          axios.delete(`${API_BASE}/suppliers/${s.id}`).then(() => onRefresh());
                        }
                      }}
                    >
                      Del / 刪除
                    </button>
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
