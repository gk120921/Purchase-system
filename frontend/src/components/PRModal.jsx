import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Clock } from 'lucide-react';
import axios from 'axios';
import PRHeader from './PRModal/PRHeader';
import PRTable from './PRModal/PRTable';
import PRFooter from './PRModal/PRFooter';

const API_BASE = 'http://127.0.0.1:3001/api';

export default function PRModal({ mode, user, editData, isPreview, onClose, suppliers, subjects, materials, onSuccess }) {
  // ... existing date logic ...
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = editData ? new Date(editData.created_at).toLocaleDateString() : `${yyyy}/${mm}/${dd}`;
  const prNumberStr = editData ? editData.pr_number : `${yyyy}${mm}${dd}001`;

  const [inputMode, setInputMode] = useState(editData?.input_mode || (mode === 'subject' ? 'ACCOUNTING' : 'BOM'));
  const [formData, setFormData] = useState({
    pr_number: prNumberStr,
    requester: editData ? editData.requester : user.name,
    department: editData ? editData.department : ((user.dept_code ? user.dept_code + ' ' : '') + (user.dept_name || 'T120 生管課')),
    category: '一般 General',
    remarks: editData ? editData.remarks : '',
    currency: editData?.currency || 'INR',
    exchange_rate: editData?.exchange_rate || 1.0,
    items: [{ material_number: '', demand: '', unit: (mode === 'subject' ? 'PCS' : 'KG'), demand_day: '', purchase_quantity: '', manufacturer: '', date_of_purchase: '', remark_zh: '', remark_en: '', unit_price: '', subject_id: '' }]
  });

  // 簽核進度條組件
  const ApprovalStepper = () => {
    if (!editData) return null;
    
    // 模擬從後端獲取的流轉路徑
    const flow = (editData.total_amount > 50000) ? ['課長 Head', '經理 Manager', '總經理 GM'] : 
                 (editData.total_amount > 10000) ? ['課長 Head', '經理 Manager'] : ['課長 Head'];
    
    const currentIndex = editData.current_step_index || 0;
    const isApproved = editData.status === 'approved' || editData.status === 'converted';
    const isRejected = editData.status === 'rejected';

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>提交 (Apply)</span>
        </div>
        
        {flow.map((step, idx) => {
          const isDone = idx < currentIndex || isApproved;
          const isCurrent = idx === currentIndex && !isApproved && !isRejected;
          
          return (
            <React.Fragment key={idx}>
              <div style={{ height: '2px', width: '40px', background: isDone ? '#10b981' : '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDone ? '#10b981' : isCurrent ? '#1e3a8a' : '#94a3b8' }}>
                {isDone ? <CheckCircle2 size={20} /> : isCurrent ? <Clock size={20} className="animate-spin-slow" /> : <Circle size={20} />}
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{step}</span>
              </div>
            </React.Fragment>
          );
        })}
        
        <div style={{ height: '2px', width: '40px', background: isApproved ? '#10b981' : '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#94a3b8' }}>
          {isApproved ? <CheckCircle2 size={20} /> : isRejected ? <X size={20} /> : <Circle size={20} />}
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{isApproved ? '完成 (Done)' : '結束 (End)'}</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (editData) {
      axios.get(`${API_BASE}/pr/${editData.id}/items`).then(res => {
        setFormData({
          pr_number: editData.pr_number,
          requester: editData.requester,
          department: editData.department,
          category: '一般 General',
          remarks: editData.remarks || '',
          currency: editData.currency || 'INR',
          exchange_rate: editData.exchange_rate || 1.0,
          items: res.data.length > 0 ? res.data.map(i => ({
            ...i,
            material_number: i.description,
            demand: i.quantity,
            unit_price: i.unit_price || ''
          })) : [{ material_number: '', demand: '', unit: (mode === 'subject' ? 'PCS' : 'KG'), demand_day: '', purchase_quantity: '', manufacturer: '', date_of_purchase: '', remark_zh: '', remark_en: '', unit_price: '', subject_id: '' }]
        });
        if (editData.input_mode) setInputMode(editData.input_mode);
      });
    }
  }, [editData]);

  const handleTranslate = async (text, direction) => {
    if (!text) return '';
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${direction}`);
      const data = await res.json();
      return data.responseData.translatedText;
    } catch (e) {
      console.error('Translate error', e);
      return '';
    }
  };

  const handleSubmit = async (e, status = 'pending') => {
    if (e) e.preventDefault();
    try {
      const payload = {
        requester: formData.requester,
        department: formData.department,
        remarks: formData.remarks || '',
        input_mode: inputMode,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        status,
        items: formData.items.map(i => ({
          ...i,
          description: i.material_number || '未填寫',
          quantity: parseFloat(i.demand) || 0,
          unit_price: parseFloat(i.unit_price) || 0,
          subject_id: i.subject_id || null
        }))
      };

      if (editData) await axios.put(`${API_BASE}/pr/${editData.id}`, payload);
      else await axios.post(`${API_BASE}/pr`, payload);
      onSuccess();
    } catch (err) { alert('送出失敗'); }
  };

  const getSubjectName = (id) => {
    const s = subjects.find(sub => sub.id === parseInt(id));
    return s ? `${s.code} ${s.english_name || s.name}` : '';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem 0' }}>
      <div className="card" style={{ width: '1200px', maxWidth: '98vw', maxHeight: 'none', padding: '2.5rem', background: '#fff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <X style={{ cursor: 'pointer', color: '#64748b' }} onClick={onClose} />
        </div>
        
        <form onSubmit={handleSubmit}>
          <PRHeader formData={formData} dateStr={dateStr} />
          
          <ApprovalStepper />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem', background: '#f1f5f9', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.625rem 1.25rem', borderRadius: '12px', transition: 'all 0.3s', background: inputMode === 'BOM' ? '#fff' : 'transparent', boxShadow: inputMode === 'BOM' ? 'var(--shadow)' : 'none' }}>
              <input type="radio" checked={inputMode === 'BOM'} onChange={() => setInputMode('BOM')} disabled={isPreview} />
              <span style={{ fontWeight: 'bold', color: inputMode === 'BOM' ? 'var(--primary)' : 'var(--text-muted)' }}>BOM 物料模式</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.625rem 1.25rem', borderRadius: '12px', transition: 'all 0.3s', background: inputMode === 'ACCOUNTING' ? '#fff' : 'transparent', boxShadow: inputMode === 'ACCOUNTING' ? 'var(--shadow)' : 'none' }}>
              <input type="radio" checked={inputMode === 'ACCOUNTING'} onChange={() => setInputMode('ACCOUNTING')} disabled={isPreview} />
              <span style={{ fontWeight: 'bold', color: inputMode === 'ACCOUNTING' ? 'var(--primary)' : 'var(--text-muted)' }}>會計科目模式</span>
            </label>
          </div>

          <PRTable formData={formData} setFormData={setFormData} inputMode={inputMode} isPreview={isPreview} subjects={subjects} handleTranslate={handleTranslate} getSubjectName={getSubjectName} />
          <PRFooter formData={formData} setFormData={setFormData} inputMode={inputMode} isPreview={isPreview} onClose={onClose} handleSubmit={handleSubmit} />
        </form>
      </div>
    </div>
  );
}
