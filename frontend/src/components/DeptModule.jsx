import React, { useState } from 'react';
import { Plus, Trash2, GitMerge } from 'lucide-react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function DeptModule({ departments, onRefresh, lang }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({ dept_code: '', name: '', name_en: '', parent_id: '', manager: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ dept_code: '', name: '', name_en: '', parent_id: '', manager: '' });

  React.useEffect(() => {
    const handleToggle = () => setShowAddForm(prev => !prev);
    window.addEventListener('toggle-add-dept', handleToggle);
    return () => window.removeEventListener('toggle-add-dept', handleToggle);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/departments`, newDept);
      setNewDept({ dept_code: '', name: '', name_en: '', parent_id: '', manager: '' });
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      alert('新增失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStartEdit = (dept) => {
    setEditingId(dept.id);
    setEditForm({ 
      dept_code: dept.dept_code, 
      name: dept.name, 
      name_en: dept.name_en || '',
      parent_id: dept.parent_id || '', 
      manager: dept.manager || '' 
    });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_BASE}/departments/${id}`, editForm);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      alert('更新失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此部門嗎？這可能會影響相關的簽核流程。')) {
      await axios.delete(`${API_BASE}/departments/${id}`);
      onRefresh();
    }
  };

  const formatName = (dept) => {
    if (lang === 'CN') return dept.name || dept.name_en;
    if (lang === 'EN') return dept.name_en || dept.name;
    return `${dept.name || ''} (${dept.name_en || ''})`;
  };

  const formatParentName = (dept) => {
    if (lang === 'CN') return dept.parent_name || dept.parent_name_en;
    if (lang === 'EN') return dept.parent_name_en || dept.parent_name;
    if (!dept.parent_name && !dept.parent_name_en) return null;
    return `${dept.parent_name || ''} (${dept.parent_name_en || ''})`;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitMerge size={20} color="var(--primary)" /> 
          {lang === 'CN' ? '組織架構維護' : lang === 'EN' ? 'Organization Structure' : '組織架構維護 (Organization Structure)'}
        </h3>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> 
          {showAddForm 
            ? (lang === 'CN' ? '取消新增' : lang === 'EN' ? 'Cancel' : '取消新增 (Cancel)')
            : (lang === 'CN' ? '新增部門' : lang === 'EN' ? 'Add Unit' : '新增部門 Unit')}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{lang === 'CN' ? '部門代碼' : lang === 'EN' ? 'Dept Code' : '部門代碼 Code'}</label>
              <input className="form-control" placeholder="T130" value={newDept.dept_code} onChange={e => setNewDept({...newDept, dept_code: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>{lang === 'CN' ? '中文名稱' : 'CN Name'}</label>
              <input className="form-control" placeholder="採購課" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>{lang === 'EN' ? 'English Name' : '英文名稱'}</label>
              <input className="form-control" placeholder="Purchase Section" value={newDept.name_en} onChange={e => setNewDept({...newDept, name_en: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>{lang === 'CN' ? '負責人' : lang === 'EN' ? 'Manager' : '負責人 Manager'}</label>
              <input className="form-control" placeholder="Joseph" value={newDept.manager} onChange={e => setNewDept({...newDept, manager: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{lang === 'CN' ? '上級部門' : lang === 'EN' ? 'Parent Unit' : '上級部門 Parent'}</label>
              <select className="form-control" value={newDept.parent_id} onChange={e => setNewDept({...newDept, parent_id: e.target.value})}>
                <option value="">(Root)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.dept_code} - {formatName(d)}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {lang === 'CN' ? '儲存組織單元' : lang === 'EN' ? 'SAVE UNIT' : '儲存組織單元 SAVE UNIT'}
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>{lang === 'CN' ? '代碼' : lang === 'EN' ? 'Code' : '代碼 Code'}</th>
            <th>{lang === 'CN' ? '部門名稱' : lang === 'EN' ? 'Name' : '部門名稱 Name'}</th>
            <th>{lang === 'CN' ? '負責人' : lang === 'EN' ? 'Manager' : '負責人 Manager'}</th>
            <th>{lang === 'CN' ? '上級部門' : lang === 'EN' ? 'Parent' : '上級部門 Parent'}</th>
            <th>{lang === 'CN' ? '操作' : lang === 'EN' ? 'Action' : '操作 Action'}</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(dept => (
            <tr key={dept.id}>
              {editingId === dept.id ? (
                <>
                  <td>
                    <input className="form-control" style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }} value={editForm.dept_code} onChange={e => setEditForm({...editForm, dept_code: e.target.value})} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <input className="form-control" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} placeholder="中文名稱" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      <input className="form-control" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} placeholder="English Name" value={editForm.name_en} onChange={e => setEditForm({...editForm, name_en: e.target.value})} />
                    </div>
                  </td>
                  <td>
                    <input className="form-control" style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }} value={editForm.manager} onChange={e => setEditForm({...editForm, manager: e.target.value})} />
                  </td>
                  <td>
                    <select className="form-control" style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }} value={editForm.parent_id} onChange={e => setEditForm({...editForm, parent_id: e.target.value})}>
                      <option value="">(Root)</option>
                      {departments.filter(d => d.id !== dept.id).map(d => (
                        <option key={d.id} value={d.id}>{d.dept_code} - {formatName(d)}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleUpdate(dept.id)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        {lang === 'CN' ? '儲存' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        {lang === 'CN' ? '取消' : 'Cancel'}
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ fontWeight: 'bold' }}>{dept.dept_code}</td>
                  <td>{formatName(dept)}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{dept.manager || '-'}</td>
                  <td>
                    {formatParentName(dept) ? (
                      <span style={{ color: '#64748b' }}>{formatParentName(dept)}</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(Root)</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => handleStartEdit(dept)} style={{ border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer' }}>
                        {lang === 'CN' ? '修改' : lang === 'EN' ? 'Edit' : '修改 (Edit)'}
                      </button>
                      <button onClick={() => handleDelete(dept.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
