import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:3001/api';

export default function SubjectModule({ subjects, onEdit, onRefresh }) {
  const handleImport = async () => {
    if (!window.confirm('確定要從指定 Excel 檔案匯入會計科目嗎？這將會更新現有科目。')) return;
    try {
      const res = await axios.post(`${API_BASE}/import-subjects`);
      alert(`匯入成功！共處理 ${res.data.count} 筆資料。`);
      onRefresh();
    } catch (err) {
      alert('匯入失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此會計科目嗎？')) return;
    try {
      await axios.delete(`${API_BASE}/subjects/${id}`);
      onRefresh();
    } catch (err) {
      alert('刪除失敗');
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>共 {subjects.length} 筆會計科目資料 (Total Accounting Subjects)</span>
        <button className="btn btn-secondary" onClick={handleImport} style={{ fontSize: '0.85rem' }}>
          從 Excel 匯入 (Import from Excel)
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '60px' }}>No</th>
            <th style={{ width: '120px' }}>科目代碼 (Code)</th>
            <th>中文名稱 (Chinese Name)</th>
            <th>英文名稱 (English Name)</th>
            <th style={{ width: '100px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s, idx) => (
            <tr key={s.id}>
              <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{idx + 1}</td>
              <td style={{ fontWeight: 900, color: '#1e293b' }}>{s.code}</td>
              <td style={{ fontWeight: 700, color: '#334155' }}>{s.name}</td>
              <td style={{ color: 'var(--secondary)', fontWeight: 500 }}>
                {s.english_name || '-'}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => onEdit(s)} title="編輯">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(s.id)} style={{ color: '#ef4444' }} title="刪除">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
