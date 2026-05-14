import React, { useState } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function UnitModule({ units, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.description && u.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    const name = prompt('Enter Unit Name (e.g. PCS, KG) / 輸入單位名稱:');
    if (!name) return;
    const desc = prompt('Enter Description (Optional) / 輸入描述 (選填):');
    axios.post(`${API_BASE}/units`, { name, description: desc }).then(() => onRefresh());
  };

  const handleEdit = (u) => {
    const newName = prompt('Edit Unit Name / 修改單位名稱:', u.name);
    if (!newName) return;
    const newDesc = prompt('Edit Description / 修改描述:', u.description || '');
    axios.put(`${API_BASE}/units/${u.id}`, { name: newName, description: newDesc }).then(() => onRefresh());
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this unit? / 確定要刪除此單位嗎？')) {
      axios.delete(`${API_BASE}/units/${id}`).then(() => onRefresh());
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>單位管理 / Unit Management</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total {units.length} units defined / 共有 {units.length} 個單位</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              placeholder="Search units..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', width: '200px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> 新增單位 Add Unit
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', width: '80px' }}>ID</th>
              <th style={{ padding: '1rem' }}>單位名稱 (Unit Name)</th>
              <th style={{ padding: '1rem' }}>描述 (Description)</th>
              <th style={{ padding: '1rem', width: '150px' }}>操作 (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>{u.id}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#eef2ff', color: '#4f46e5', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>{u.name}</span>
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>{u.description || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(u)} style={{ border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUnits.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No units found / 找不到單位</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
