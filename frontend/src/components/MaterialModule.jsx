import React from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:3001/api';

export default function MaterialModule({ materials, onRefresh }) {
  return (
    <div className="card">
      <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
        Total {materials.length} Material Records / 共 {materials.length} 筆物料資料
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '60px' }}>No</th>
            <th>料品編號 (Material Number)</th>
            <th style={{ width: '150px' }}>單位 (Unit)</th>
            <th style={{ width: '180px' }}>Actions / 操作</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, idx) => (
            <tr key={m.id}>
              <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{idx + 1}</td>
              <td style={{ fontWeight: 600 }}>{m.material_number}</td>
              <td style={{ fontWeight: 700 }}>{m.unit}</td>
              <td>
                <button 
                  style={{ border: 'none', background: '#e2e8f0', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', marginRight: '8px', fontSize: '0.85rem' }} 
                  onClick={() => {
                    const newUnit = prompt('Edit Unit / 修改單位:', m.unit);
                    if (newUnit) {
                      axios.put(`${API_BASE}/materials/${m.id}`, { material_number: m.material_number, unit: newUnit }).then(() => onRefresh());
                    }
                  }}
                >
                  Edit / 修改
                </button>
                <button 
                  style={{ border: 'none', background: '#ff8080', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem' }} 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this material? / 確定要刪除這筆物料嗎？')) {
                      axios.delete(`${API_BASE}/materials/${m.id}`).then(() => onRefresh());
                    }
                  }}
                >
                  Delete / 刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
