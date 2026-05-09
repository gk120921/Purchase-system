import React from 'react';
import { X, Languages, RefreshCw } from 'lucide-react';

export default function PRTable({ 
  formData, 
  setFormData, 
  inputMode, 
  isPreview, 
  subjects, 
  handleTranslate,
  getSubjectName 
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '1.5rem', textAlign: 'center', tableLayout: 'fixed' }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #1e3a8a' }}>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '14%' }}>
            {inputMode === 'ACCOUNTING' ? '會計科目' : '料品編號'}
            <br/><span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>{inputMode === 'ACCOUNTING' ? 'Account Subject' : 'Material number'}</span>
          </th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '6%' }}>數量<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>Qty</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '5%' }}>單位<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>Unit</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '8%' }}>單價<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>Price</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '8%' }}>總額<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>Total</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '8%' }}>需求日<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>Req. Day</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '8%' }}>廠商<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>Supplier</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '13%' }}>中文備註<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>ZH Remark</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '13%' }}>英文備註<br/><span style={{ fontSize: '0.65rem', color: '#64748b' }}>EN Remark</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.25rem', width: '4%' }}></th>
        </tr>
      </thead>
      <tbody>
        {formData.items.map((item, index) => (
          <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              {inputMode === 'ACCOUNTING' ? (
                <select 
                  style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white', cursor: isPreview ? 'default' : 'pointer' }} 
                  value={item.subject_id || ''} 
                  disabled={isPreview}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].subject_id = e.target.value;
                    newItems[index].material_number = getSubjectName(e.target.value);
                    newItems[index].unit = 'PCS';
                    setFormData({...formData, items: newItems});
                  }}
                >
                  <option value="">(Select Subject)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code}{ (s.english_name || s.name) && (s.english_name || s.name) !== s.code ? ` - ${s.english_name || s.name}` : '' } {s.english_name && s.english_name !== s.name ? `(${s.name})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white' }} 
                  list="material-datalist"
                  value={item.material_number} 
                  disabled={isPreview}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].material_number = e.target.value;
                    setFormData({...formData, items: newItems});
                  }}
                  placeholder="Type Material..."
                />
              )}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <input style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'white' }} value={item.demand} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].demand = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <input style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'white' }} value={item.unit} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <input style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'white' }} type="number" step="0.01" value={item.unit_price} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit_price = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', fontSize: '0.8rem', textAlign: 'right', fontWeight: 'bold', background: '#f8fafc' }}>
              {(parseFloat(item.demand) * parseFloat(item.unit_price) || 0).toLocaleString()}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <input type="date" style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white' }} value={item.demand_day} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].demand_day = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <input 
                style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white' }} 
                list="supplier-datalist"
                value={item.manufacturer} 
                disabled={isPreview}
                onChange={(e) => {
                  const newItems = [...formData.items];
                  newItems[index].manufacturer = e.target.value;
                  setFormData({...formData, items: newItems});
                }}
                placeholder="Supplier..."
              />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  style={{ flex: 1, border: '1px solid #e2e8f0', padding: '0.25rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white', borderRadius: '4px' }} 
                  value={item.remark_zh} 
                  disabled={isPreview} 
                  onChange={(e) => { 
                    const newItems = [...formData.items]; 
                    newItems[index].remark_zh = e.target.value; 
                    setFormData({...formData, items: newItems}); 
                  }}
                  onBlur={async (e) => {
                    if (e.target.value && !item.remark_en) {
                      const en = await handleTranslate(e.target.value, 'zh|en');
                      const newItems = [...formData.items];
                      newItems[index].remark_en = en;
                      setFormData({...formData, items: newItems});
                    }
                  }}
                />
                {!isPreview && (
                  <button 
                    type="button"
                    onClick={async () => {
                      if (item.remark_zh) {
                        const en = await handleTranslate(item.remark_zh, 'zh|en');
                        const newItems = [...formData.items];
                        newItems[index].remark_en = en;
                        setFormData({...formData, items: newItems});
                      }
                    }}
                    style={{ border: 'none', background: '#eef2ff', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                    title="Translate to EN"
                  >
                    <Languages size={14} color="#6366f1" />
                  </button>
                )}
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  style={{ flex: 1, border: '1px solid #e2e8f0', padding: '0.25rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white', borderRadius: '4px' }} 
                  value={item.remark_en} 
                  disabled={isPreview} 
                  onChange={(e) => { 
                    const newItems = [...formData.items]; 
                    newItems[index].remark_en = e.target.value; 
                    setFormData({...formData, items: newItems}); 
                  }}
                  onBlur={async (e) => {
                    if (e.target.value && !item.remark_zh) {
                      const zh = await handleTranslate(e.target.value, 'en|zh');
                      const newItems = [...formData.items];
                      newItems[index].remark_zh = zh;
                      setFormData({...formData, items: newItems});
                    }
                  }}
                />
                {!isPreview && (
                  <button 
                    type="button"
                    onClick={async () => {
                      if (item.remark_en) {
                        const zh = await handleTranslate(item.remark_en, 'en|zh');
                        const newItems = [...formData.items];
                        newItems[index].remark_zh = zh;
                        setFormData({...formData, items: newItems});
                      }
                    }}
                    style={{ border: 'none', background: '#ecfdf5', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                    title="Translate to ZH"
                  >
                    <RefreshCw size={14} color="#10b981" />
                  </button>
                )}
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <button type="button" disabled={isPreview} onClick={() => { if(formData.items.length > 1) { const newItems = formData.items.filter((_, i) => i !== index); setFormData({...formData, items: newItems}); } }} style={{ border: 'none', background: 'none', color: isPreview ? '#ccc' : '#ef4444', cursor: isPreview ? 'default' : 'pointer', fontSize: '1.25rem' }}>
                <X size={18} />
              </button>
            </td>
          </tr>
        ))}
        <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
          <td colSpan="4" style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right' }}>總計 (Total Amount):</td>
          <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem', textAlign: 'right', color: '#1e3a8a' }}>
            {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} 
            {formData.items.reduce((sum, i) => sum + (parseFloat(i.demand) * parseFloat(i.unit_price) || 0), 0).toLocaleString()}
          </td>
          <td colSpan="5" style={{ border: '1px solid #cbd5e1' }}></td>
        </tr>
      </tbody>
    </table>
  );
}
