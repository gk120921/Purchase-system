import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function SubjectModal({ editData, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    english_name: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        code: editData.code || '',
        name: editData.name || '',
        english_name: editData.english_name || '',
        category: editData.category || '',
        description: editData.description || ''
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        await axios.put(`${API_BASE}/subjects/${editData.id}`, formData);
      } else {
        await axios.post(`${API_BASE}/subjects`, formData);
      }
      onSuccess();
    } catch (err) {
      alert('儲存失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>{editData ? '編輯會計科目' : '新增會計科目'}</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label>科目代碼 (Code)</label>
            <input 
              type="text" 
              required 
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="例如: 5311"
            />
          </div>
          
          <div className="form-group">
            <label>中文名稱 (Chinese Name)</label>
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 製造-租金支出"
            />
          </div>

          <div className="form-group">
            <label>英文名稱 (English Name)</label>
            <input 
              type="text" 
              value={formData.english_name}
              onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
              placeholder="例如: Manufacturing - Rent Expense"
            />
          </div>

          <div className="form-group">
            <label>類別 (Category)</label>
            <input 
              type="text" 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="例如: 製造費用"
            />
          </div>

          <div className="form-group">
            <label>說明 (Description)</label>
            <textarea 
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="備註說明..."
            ></textarea>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>取消</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={18} /> 儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
