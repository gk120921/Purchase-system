import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function SupplierModal({ editData, suppliers, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    supplier_code: editData?.supplier_code || '',
    name: editData?.name || '',
    tax_id: editData?.tax_id || '',
    category: editData?.category || '',
    contact: editData?.contact || '',
    phone: editData?.phone || '',
    email: editData?.email || '',
    address: editData?.address || ''
  });

  const categoryOptions = [
    { code: 'SA', zh: '五金耗材、五金加工工具', en: 'Hardware Consumables & Tooling' },
    { code: 'SB', zh: '原料、金屬材料(銅帶/板材)', en: 'Raw Material - Metal (Copper Strip)' },
    { code: 'SC', zh: '塑膠類製品、塑膠原料', en: 'Plastic Products & Raw Material' },
    { code: 'SD', zh: '委外加工', en: 'Outsourcing - Processing' },
    { code: 'SE', zh: '塑膠盒(袋)、泡殼包裝類', en: 'Plastic Box / Blister Packaging' },
    { code: 'SF', zh: '印刷、紙類包材', en: 'Printing & Paper Packaging' },
    { code: 'SG', zh: '包裝耗材', en: 'Packaging Consumables' },
    { code: 'SH', zh: '外購品(成品轉購)', en: 'Purchased Finished Goods' },
    { code: 'SI', zh: '工具類', en: 'Tools & Jigs' },
    { code: 'SJ', zh: '五金電料', en: 'Electrical Hardware' },
    { code: 'SK', zh: '五金氣液體類、機械設備(維修)', en: 'Pneumatic/Hydraulic & Maint. Equipment' },
    { code: 'SL', zh: '委外表面處理', en: 'Outsourcing - Surface Treatment' },
    { code: 'SM', zh: '行政用品', en: 'Administrative Supplies' },
    { code: 'SN', zh: '交通運輸', en: 'Transportation & Logistics' },
    { code: 'SP', zh: '總務', en: 'General Affairs' },
    { code: 'SQ', zh: '財務相關', en: 'Finance Related' },
    { code: 'SR', zh: 'IT 資訊服務', en: 'IT & Software Services' },
    { code: 'SZ', zh: '其他(未分類)', en: 'Others - Unclassified' }
  ];

  const handleCategoryChange = (val) => {
    const opt = categoryOptions.find(c => (c.zh + ' ' + c.en) === val);
    const code = opt ? opt.code : '';
    let nextCode = formData.supplier_code;

    if (code && !editData) {
      const sameCatSuppliers = suppliers.filter(s => s.supplier_code && s.supplier_code.startsWith(code));
      let maxSeq = 0;
      sameCatSuppliers.forEach(s => {
        const seqStr = s.supplier_code.substring(code.length);
        if (/^\d+$/.test(seqStr)) {
          const num = parseInt(seqStr, 10);
          if (num > maxSeq) maxSeq = num;
        }
      });
      nextCode = `${code}${String(maxSeq + 1).padStart(3, '0')}`;
    }

    setFormData({
      ...formData,
      category: val,
      supplier_code: nextCode
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        await axios.put(`${API_BASE}/suppliers/${editData.id}`, formData);
      } else {
        await axios.post(`${API_BASE}/suppliers`, formData);
      }
      onSuccess();
    } catch (err) {
      alert('儲存供應商失敗');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '700px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
          <h3 style={{ fontWeight: 900, color: 'var(--primary)' }}>{editData ? '修改供應商資料' : '新增合格供應商'}</h3>
          <X style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>分類 (Category)</label>
            <select className="form-control" value={formData.category} onChange={e => handleCategoryChange(e.target.value)}>
              <option value="">請選擇類別...</option>
              {categoryOptions.map(c => (
                <option key={c.code} value={c.zh + ' ' + c.en}>
                  {c.code} - {c.zh} / {c.en}
                </option>
              ))}
              {formData.category && !categoryOptions.some(c => (c.zh + ' ' + c.en) === formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group">
              <label>供應商編碼</label>
              <input className="form-control" value={formData.supplier_code} onChange={e => setFormData({...formData, supplier_code: e.target.value})} placeholder="例如: S001" />
            </div>
            <div className="form-group">
              <label>供應商名稱</label>
              <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>統一編號</label>
              <input className="form-control" value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
            </div>
            <div className="form-group">
              <label>電子郵件 (Email)</label>
              <input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="例如: service@example.com" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>聯絡人</label>
              <input className="form-control" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            </div>
            <div className="form-group">
              <label>電話</label>
              <input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>地址</label>
            <input className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '1rem', fontWeight: 900 }}>
            儲存供應商資料
          </button>
        </form>
      </div>
    </div>
  );
}
