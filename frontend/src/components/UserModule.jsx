import React from 'react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function UserModule({ users, onRefresh, onEdit }) {
  const moduleNames = {
    'dashboard': '儀表板',
    'pr': '請購管理 (PR)',
    'approvals': '待簽核',
    'po': '採購訂單 (PO)',
    'subjects': '會計科目',
    'materials': '物料清單 (BOM)',
    'suppliers': '供應商名冊',
    'users': '人員管理',
    'export': '總表匯出'
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>共 {users.length} 位系統使用者</div>
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>帳號</th>
            <th>密碼</th>
            <th>部門 (代碼)</th>
            <th>角色權限</th>
            <th>可存取模組</th>
            <th>註冊日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {(users || []).map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>{u.name}</td>
              <td style={{ fontWeight: 'bold', color: '#64748b' }}>{u.username}</td>
              <td>••••••••</td>
              <td>
                <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{u.display_dept_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.display_dept_code}</div>
              </td>
              <td>
                <span className="status-badge" style={{ 
                  background: u.role === 'admin' ? '#fee2e2' : u.role === 'manager' ? '#fef3c7' : '#dcfce7', 
                  color: u.role === 'admin' ? '#991b1b' : u.role === 'manager' ? '#92400e' : '#166534',
                  fontWeight: '900',
                  padding: '0.25rem 0.75rem'
                }}>
                  {u.role.toUpperCase()}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                  {Array.isArray(u.allowed_modules) && u.allowed_modules.map(m => (
                    <span key={m} style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', border: '1px solid #e2e8f0' }}>
                      {moduleNames[m] || m}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div style={{ fontSize: '0.8rem' }}>
                  <div style={{ color: u.proxy_name ? '#1e3a8a' : '#94a3b8', fontWeight: u.proxy_name ? 'bold' : 'normal' }}>
                    代理: {u.proxy_name || '無'}
                  </div>
                  {u.proxy_start && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{u.proxy_start.split('T')[0]}</div>}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm" style={{ background: 'var(--secondary)', color: '#000' }} onClick={() => onEdit(u)}>修改</button>
                  <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }} onClick={() => {
                    if (window.confirm('確定要刪除這名使用者嗎？')) {
                      axios.delete(`${API_BASE}/users/${u.id}`).then(() => onRefresh());
                    }
                  }}>刪除</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
