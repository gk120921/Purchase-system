import React from 'react';
import { X, Languages, RefreshCw } from 'lucide-react';

export default function PRTable({ 
  formData, 
  setFormData, 
  inputMode, 
  isPreview, 
  subjects, 
  suppliers = [],
  handleTranslate,
  getSubjectName,
  materials = [],
  units = []
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '1.5rem', textAlign: 'center', tableLayout: 'fixed' }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #1e3a8a' }}>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '13%' }}>
            {inputMode === 'ACCOUNTING' ? '會計科目' : '料品編號'}
            <br/><span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 'bold' }}>{inputMode === 'ACCOUNTING' ? 'Account' : 'Material'}</span>
          </th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '8%' }}>數量<br/><span style={{ fontSize: '0.6rem' }}>Qty</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '7%' }}>單位<br/><span style={{ fontSize: '0.6rem' }}>Unit</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '8%' }}>單價<br/><span style={{ fontSize: '0.6rem' }}>Price</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '10%' }}>總額<br/><span style={{ fontSize: '0.6rem' }}>Total</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '11%' }}>需求日<br/><span style={{ fontSize: '0.6rem' }}>Req. Day</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '16%' }}>廠商<br/><span style={{ fontSize: '0.6rem' }}>Supplier</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '13%' }}>中文備註<br/><span style={{ fontSize: '0.6rem' }}>ZH Remark</span></th>
          <th style={{ border: '1px solid #cbd5e1', padding: '0.75rem 0.1rem', width: '14%' }}>英文備註<br/><span style={{ fontSize: '0.6rem' }}>EN Remark</span></th>
          <th className="no-print" style={{ width: '0%', display: 'none' }}></th>
        </tr>
      </thead>
      <tbody>
        {formData.items.map((item, index) => (
          <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <td style={{ border: '1px solid #cbd5e1', padding: '0', position: 'relative' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', textAlign: 'left', wordBreak: 'break-all', fontSize: '0.7rem' }}>
                {inputMode === 'ACCOUNTING' ? getSubjectName(item.subject_id) : item.material_number}
              </div>
              {inputMode === 'ACCOUNTING' ? (
                <select 
                  className="no-print"
                  style={{ width: '100%', border: 'none', padding: '0.4rem', fontSize: '0.7rem', background: isPreview ? '#f3f4f6' : 'white', cursor: isPreview ? 'default' : 'pointer' }} 
                  value={item.subject_id || ''} 
                  disabled={isPreview}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].subject_id = e.target.value;
                    newItems[index].material_number = getSubjectName(e.target.value);
                    newItems[index].unit = 'NOS';
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
                  className="no-print"
                  style={{ width: '100%', border: 'none', padding: '0.4rem', fontSize: '0.7rem', background: isPreview ? '#f3f4f6' : 'white' }} 
                  list="material-datalist"
                  value={item.material_number} 
                  disabled={isPreview}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newItems = [...formData.items];
                    newItems[index].material_number = val;
                    
                    // 解析 "料號 - 品名" 格式
                    const matNumber = val.split(' - ')[0];
                    const matchedMat = materials.find(m => m.material_number === matNumber);
                    if (matchedMat && matchedMat.unit) {
                      newItems[index].unit = matchedMat.unit;
                    }
                    setFormData({...formData, items: newItems});
                  }}
                  placeholder="Type Material..."
                />
              )}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem' }}>{item.demand}</div>
              <input className="no-print" style={{ width: '100%', border: 'none', padding: '0.4rem', fontSize: '0.7rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'white' }} value={item.demand} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].demand = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem' }}>{item.unit}</div>
              <input 
                className="no-print"
                style={{ width: '100%', border: 'none', padding: '0.4rem', fontSize: '0.7rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'white' }} 
                list="unit-datalist"
                value={item.unit} 
                disabled={isPreview} 
                onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit = e.target.value; setFormData({...formData, items: newItems}); }} 
              />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem' }}>{item.unit_price}</div>
              <input className="no-print" style={{ width: '100%', border: 'none', padding: '0.4rem', fontSize: '0.7rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'white' }} type="number" step="0.01" value={item.unit_price} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit_price = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0.4rem', fontSize: '0.7rem', textAlign: 'right', fontWeight: 'bold', background: '#f8fafc' }}>
              <div>{Math.round((parseFloat(item.demand) * parseFloat(item.unit_price) || 0) * 100) / 100}</div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem', wordBreak: 'break-all' }}>{item.demand_day}</div>
              <input className="no-print" type="date" style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.8rem', background: isPreview ? '#f3f4f6' : 'white' }} value={item.demand_day} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].demand_day = e.target.value; setFormData({...formData, items: newItems}); }} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              {/* 列印與預覽共用的格式化顯示 */}
              <div className={isPreview ? "" : "print-only"} style={{ 
                display: isPreview ? 'block' : 'none', 
                padding: '0.4rem', 
                fontSize: '0.65rem', 
                textAlign: 'left',
                background: isPreview ? '#f3f4f6' : 'transparent',
                lineHeight: '1.2',
                overflowWrap: 'anywhere'
              }}>
                {(() => {
                  const s = suppliers.find(sup => sup.name === item.manufacturer || sup.supplier_code === item.manufacturer);
                  return s ? `${s.supplier_code} - ${s.name}` : item.manufacturer;
                })()}
              </div>
              
              {!isPreview && (
                <input 
                  className="no-print"
                  style={{ width: '100%', border: 'none', padding: '0.5rem', fontSize: '0.65rem', background: 'white' }} 
                  list="supplier-datalist"
                  value={item.manufacturer} 
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].manufacturer = e.target.value;
                    setFormData({...formData, items: newItems});
                  }}
                  placeholder="Supplier..."
                />
              )}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.65rem', textAlign: 'left', wordBreak: 'break-all', lineHeight: '1.2' }}>{item.remark_zh}</div>
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem' }}>
                <input 
                  style={{ flex: 1, border: '1px solid #e2e8f0', padding: '0.25rem', fontSize: '0.65rem', background: isPreview ? '#f3f4f6' : 'white', borderRadius: '4px' }} 
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
                    style={{ border: 'none', background: '#eef2ff', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    title="Translate to EN"
                  >
                    <Languages size={12} color="#6366f1" />
                  </button>
                )}
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
              <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.65rem', textAlign: 'left', wordBreak: 'break-all', lineHeight: '1.2' }}>{item.remark_en}</div>
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem' }}>
                <input 
                  style={{ flex: 1, border: '1px solid #e2e8f0', padding: '0.25rem', fontSize: '0.65rem', background: isPreview ? '#f3f4f6' : 'white', borderRadius: '4px' }} 
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
                    style={{ border: 'none', background: '#ecfdf5', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    title="Translate to ZH"
                  >
                    <RefreshCw size={12} color="#10b981" />
                  </button>
                )}
              </div>
            </td>
            <td className="no-print" style={{ border: '1px solid #cbd5e1', padding: '0', textAlign: 'center' }}>
              {!isPreview && (
                <button 
                  type="button"
                  onClick={() => {
                    const newItems = formData.items.filter((_, i) => i !== index);
                    setFormData({...formData, items: newItems});
                  }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </td>
          </tr>
        ))}
        <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
          <td colSpan="4" style={{ border: '1px solid #cbd5e1', padding: '0.4rem', textAlign: 'right', fontSize: '0.75rem' }}>總計 (Total Amount):</td>
          <td style={{ border: '1px solid #cbd5e1', padding: '0.4rem', textAlign: 'right', color: '#1e3a8a', fontSize: '0.7rem' }}>
            {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} 
            {(() => {
              const total = formData.items.reduce((sum, i) => sum + (parseFloat(i.demand) * parseFloat(i.unit_price) || 0), 0);
              return (Math.round(total * 100) / 100).toLocaleString();
            })()}
          </td>
          <td colSpan="4" style={{ border: '1px solid #cbd5e1' }}></td>
        </tr>
      </tbody>
    </table>
  );
}
