import React, { useState } from 'react';
import { Plus, Trash2, GitMerge } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:3001/api';

export default function DeptModule({ departments, onRefresh }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({ dept_code: '', name: '', parent_id: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/departments`, newDept);
      setNewDept({ dept_code: '', name: '', parent_id: '' });
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      alert('新增失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此部門嗎？這可能會影響相關的簽核流程。')) {
      await axios.delete(`${API_BASE}/departments/${id}`);
      onRefresh();
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitMerge size={20} color="var(--primary)" /> 組織架構維護 (Organization Structure)
        </h3>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> {showAddForm ? '取消新增' : '新增部門 Unit'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>部門代碼 Code</label>
              <input className="form-control" placeholder="例如: T130" value={newDept.dept_code} onChange={e => setNewDept({...newDept, dept_code: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>部門名稱 Name</label>
              <input className="form-control" placeholder="例如: 採購課" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>上級部門 Parent Unit</label>
              <select className="form-control" value={newDept.parent_id} onChange={e => setNewDept({...newDept, parent_id: e.target.value})}>
                <option value="">(無上級 - 頂層部門)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.dept_code} - {d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>儲存組織單元 SAVE UNIT</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>代碼 Code</th>
            <th>部門名稱 Name</th>
            <th>上級部門 Parent</th>
            <th>操作 Action</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(dept => (
            <tr key={dept.id}>
              <td style={{ fontWeight: 'bold' }}>{dept.dept_code}</td>
              <td>{dept.name}</td>
              <td>
                {dept.parent_name ? (
                  <span style={{ color: '#64748b' }}>{dept.parent_name}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(Root)</span>
                )}
              </td>
              <td>
                <button onClick={() => handleDelete(dept.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
