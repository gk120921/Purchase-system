import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function UserModal({ editData, onClose, onSuccess, departments: initialDepts = [], allUsers }) {
  const [departments, setDepartments] = useState(initialDepts);
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    username: editData?.username || '',
    password: editData?.password || '',
    role: editData?.role || 'purchaser',
    dept_id: editData?.dept_id || '',
    allowed_modules: typeof editData?.allowed_modules === 'string' ? JSON.parse(editData.allowed_modules) : (editData?.allowed_modules || []),
    proxy_user_id: editData?.proxy_user_id || '',
    proxy_start: editData?.proxy_start ? editData.proxy_start.split('T')[0] : '',
    proxy_end: editData?.proxy_end ? editData.proxy_end.split('T')[0] : ''
  });

  // 雙重保險：如果外部沒傳部門，內部自己抓
  React.useEffect(() => {
    if (initialDepts.length === 0) {
      axios.get(`${API_BASE}/departments`).then(res => setDepartments(res.data));
    } else {
      setDepartments(initialDepts);
    }
  }, [initialDepts]);

  const availableModules = [
    { key: 'dashboard', label: '儀表板' },
    { key: 'pr', label: '請購管理' },
    { key: 'approvals', label: '待簽核' },
    { key: 'po', label: '採購訂單' },
    { key: 'subjects', label: '會計科目' },
    { key: 'materials', label: '物料清單' },
    { key: 'departments', label: '組織架構' },
    { key: 'suppliers', label: '供應商' },
    { key: 'users', label: '人員管理' },
    { key: 'export', label: '總表匯出' }
  ];

  const toggleModule = (mod) => {
    setFormData(prev => {
      const mods = prev.allowed_modules.includes(mod) 
        ? prev.allowed_modules.filter(m => m !== mod)
        : [...prev.allowed_modules, mod];
      return { ...prev, allowed_modules: mods };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        allowed_modules: JSON.stringify(formData.allowed_modules)
      };
      if (editData) {
        await axios.put(`${API_BASE}/users/${editData.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/users`, payload);
      }
      onSuccess();
    } catch (err) {
      alert(`儲存失敗: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem 0' }}>
      <div className="card" style={{ width: '700px', padding: '2.5rem', borderRadius: '24px', maxHeight: 'none', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--primary)', fontWeight: 900, margin: 0 }}>{editData ? '修改使用者 Profile' : '新增系統使用者 User'}</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} color="#64748b" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* ... existing fields ... */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>登入帳號 Username</label>
              <input className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={!!editData} />
            </div>
            <div className="form-group">
              <label>密碼 Password</label>
              <input className="form-control" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editData} placeholder={editData ? "留空表示不修改" : ""} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>姓名 Full Name</label>
              <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>角色 Role</label>
              <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                <option value="purchaser">一般採購 Purchaser</option>
                <option value="supervisor">課長/主管 Supervisor</option>
                <option value="manager">經理 Manager</option>
                <option value="admin">管理員/GM Admin</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>所屬部門 Unit Selection</label>
            <select className="form-control" value={formData.dept_id} onChange={e => setFormData({...formData, dept_id: e.target.value})} required>
              <option value="">(請選擇部門 Select Department)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.dept_code} - {d.name}</option>
              ))}
            </select>
          </div>

          <div style={{ background: '#fffbeb', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fef3c7', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontWeight: 'bold', marginBottom: '1rem' }}>
              <ShieldAlert size={18} /> 代理人設定 Proxy Settings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem' }}>代理人 Proxy User</label>
                <select className="form-control" value={formData.proxy_user_id} onChange={e => setFormData({...formData, proxy_user_id: e.target.value})}>
                  <option value="">(無代理人 None)</option>
                  {allUsers.filter(u => u.id !== editData?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem' }}>開始 Start</label>
                <input type="date" className="form-control" value={formData.proxy_start} onChange={e => setFormData({...formData, proxy_start: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem' }}>結束 End</label>
                <input type="date" className="form-control" value={formData.proxy_end} onChange={e => setFormData({...formData, proxy_end: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ marginBottom: '0.75rem', display: 'block' }}>存取權限 Modules</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {availableModules.map(am => (
                <label key={am.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.allowed_modules.includes(am.key)} onChange={() => toggleModule(am.key)} />
                  {am.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ flex: 1, padding: '1rem', background: '#f1f5f9', color: '#475569' }}>
              取消 CANCEL
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1rem' }}>
              儲存人員資料 SAVE USER PROFILE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
