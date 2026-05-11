import React from 'react';

export default function PRFooter({ 
  formData, 
  setFormData, 
  inputMode, 
  isPreview, 
  onClose, 
  handleSubmit 
}) {
  return (
    <>
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>單據備註 (General PR Remarks)</div>
        <textarea 
          className="no-print"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical' }}
          placeholder="請輸入此筆請購單的整體備註... Enter general remarks for this PR..."
          value={formData.remarks}
          disabled={isPreview}
          onChange={(e) => setFormData({...formData, remarks: e.target.value})}
        />
        <div className="print-only" style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
            {formData.remarks || '(無備註 No remarks)'}
        </div>
      </div>
      
      {!isPreview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setFormData({...formData, items: [...formData.items, { material_number: '', demand: '', unit: (inputMode === 'ACCOUNTING' ? 'PCS' : 'KG'), demand_day: '', purchase_quantity: '', manufacturer: '', date_of_purchase: '', remark_zh: '', remark_en: '', subject_id: '' }]})} 
            style={{ border: '1px dashed #64748b', background: '#f8fafc', padding: '0.75rem', cursor: 'pointer', borderRadius: '8px', color: '#64748b', fontWeight: 'bold', transition: 'all 0.2s' }} 
            onMouseEnter={e => {e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.color = '#1e3a8a';}} 
            onMouseLeave={e => {e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#64748b'; e.currentTarget.style.color = '#64748b';}}
          >
            + 新增一列 (Add Row)
          </button>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={(e) => handleSubmit(e, 'draft')} style={{ flex: 1, padding: '1rem', fontWeight: 900, background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              暫存草稿 (SAVE DRAFT)
            </button>
            <button type="submit" style={{ flex: 2, padding: '1rem', fontWeight: 900, background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.3)' }}>
              送出審核 (SUBMIT FOR APPROVAL)
            </button>
          </div>
        </div>
      )}
      {isPreview && (
        <button type="button" onClick={onClose} style={{ width: '100%', padding: '1rem', marginTop: '1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          關閉預覽 (CLOSE PREVIEW)
        </button>
      )}
    </>
  );
}
