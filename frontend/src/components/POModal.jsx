import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function POModal({ user, editData, isPreview, onClose, suppliers, materials, onSuccess }) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  
  const dateStr = editData ? new Date(editData.created_at).toLocaleDateString() : `${yyyy}/${mm}/${dd}`;
  
  const [formData, setFormData] = useState({
    po_number: editData ? editData.po_number : `PO-${Date.now()}`,
    pr_number: editData ? editData.pr_number : '',
    requester: editData ? editData.requester : user.name,
    department: editData ? editData.department : user.dept_name,
    remarks: editData ? editData.remarks : '採購單系統產生',
    supplier_id: editData ? editData.display_supplier : '',
    currency: editData?.currency || 'INR',
    exchange_rate: editData?.exchange_rate || 1.0,
    items: [{ material_number: '', description: '', quantity: 0, unit: 'PCS', demand_day: '', unit_price: 0, total: 0, manufacturer: '', date_of_purchase: '', remark_zh: '', remark_en: '' }]
  });

  useEffect(() => {
    if (editData) {
      axios.get(`${API_BASE}/po/${editData.id}/items`).then(res => {
        setFormData({
          po_number: editData.po_number,
          pr_number: editData.pr_number || '',
          requester: editData.requester || user.name,
          department: editData.department || user.dept_name,
          remarks: editData.remarks || '',
          supplier_id: editData.display_supplier || '',
          currency: editData.currency || 'INR',
          exchange_rate: editData.exchange_rate || 1.0,
          items: res.data.length > 0 ? res.data.map(i => ({
            ...i,
            material_number: i.material_number || i.description // Fallback if material_number is empty
          })) : formData.items
        });
      });
    }
  }, [editData]);

  const handleSubmit = async (e, status = 'pending') => {
    if (e) e.preventDefault();
    try {
      // Find actual supplier ID if from list
      let supId = formData.supplier_id;
      const foundSup = suppliers.find(s => (`${s.supplier_code} - ${s.name}`) === supId);
      if (foundSup) supId = foundSup.id;

      const payload = {
        requester: formData.requester,
        department: formData.department,
        supplier_id: supId,
        remarks: formData.remarks,
        status,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        items: formData.items.map(i => ({
          ...i,
          quantity: parseFloat(i.quantity) || 0,
          unit_price: parseFloat(i.unit_price) || 0,
          total: (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0)
        }))
      };

      await axios.put(`${API_BASE}/po/${editData.id}`, payload);
      onSuccess();
    } catch (err) {
      console.error('PO Submit error:', err);
      alert('更新採購單失敗');
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, i) => sum + (parseFloat(i.quantity) * parseFloat(i.unit_price) || 0), 0);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem 0' }}>
      <div className="card" style={{ width: '1200px', maxHeight: 'none', padding: '2rem', background: '#fff', color: '#000', borderRadius: '0', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <X style={{ cursor: 'pointer', color: '#333' }} onClick={onClose} />
        </div>
        <form onSubmit={(e) => handleSubmit(e, 'pending')}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Times New Roman, serif' }}>KST TERMINALS (INDIA) MANUFACTURING PRIVATE LIMITE</div>
            <div style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'Microsoft JhengHei, sans-serif' }}>採購訂單</div>
            <div style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Times New Roman, serif' }}>Purchase Order</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>訂單編號 PO No.</label>
              <input value={formData.po_number} disabled style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>請購單號 PR No.</label>
              <input value={formData.pr_number} disabled style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>供應商 Supplier</label>
              <input 
                list="supplier-datalist" 
                value={formData.supplier_id} 
                disabled={isPreview}
                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>建立日期 Date</label>
              <input value={dateStr} disabled style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>採購人員 Buyer</label>
              <input value={formData.requester} disabled={isPreview} onChange={(e) => setFormData({...formData, requester: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>部門 Dept</label>
              <input value={formData.department} disabled={isPreview} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>備註 Remarks</label>
              <input value={formData.remarks} disabled={isPreview} onChange={(e) => setFormData({...formData, remarks: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>幣別 Currency</label>
              <select 
                value={formData.currency} 
                disabled={isPreview} 
                onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="TWD">TWD - Taiwan Dollar</option>
                <option value="CNY">CNY - Chinese Yuan</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>匯率 Exchange Rate</label>
              <input 
                type="number" 
                step="0.0001" 
                value={formData.exchange_rate} 
                disabled={isPreview} 
                onChange={(e) => setFormData({...formData, exchange_rate: e.target.value})} 
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '1rem', textAlign: 'center' }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '12%' }}>料號 Item</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '8%' }}>數量 Qty</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '6%' }}>單位 Unit</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '10%' }}>單價 Price</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '10%' }}>金額 Total</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '10%' }}>進貨日 Delivery</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '10%' }}>廠商 Mfg</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '15%' }}>備註 Remark</th>
                {!isPreview && <th style={{ border: '1px solid #000', padding: '0.5rem', width: '4%' }}></th>}
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input 
                      list="material-datalist" 
                      value={item.material_number} 
                      disabled={isPreview}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].material_number = e.target.value;
                        setFormData({...formData, items: newItems});
                      }}
                      style={{ width: '100%', border: 'none', padding: '0.5rem', background: isPreview ? '#f3f4f6' : 'transparent' }} 
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input type="number" step="0.01" value={item.quantity} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].quantity = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input value={item.unit} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input type="number" step="0.01" value={item.unit_price} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit_price = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                    {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} {(parseFloat(item.quantity) * parseFloat(item.unit_price) || 0).toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input type="date" value={item.date_of_purchase} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].date_of_purchase = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input list="supplier-datalist" value={item.manufacturer} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].manufacturer = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <input value={item.remark_zh} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].remark_zh = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  {!isPreview && (
                    <td style={{ border: '1px solid #000', textAlign: 'center' }}>
                      <button type="button" onClick={() => { if(formData.items.length > 1) { const newItems = formData.items.filter((_, i) => i !== index); setFormData({...formData, items: newItems}); } }} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td colSpan="4" style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>總計 Total Amount:</td>
                <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right', fontSize: '1.1rem' }}>
                  {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} {calculateTotal(formData.items).toLocaleString()}
                </td>
                <td colSpan={isPreview ? 3 : 4} style={{ border: '1px solid #000' }}></td>
              </tr>
            </tbody>
          </table>

          {!isPreview && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={(e) => handleSubmit(e, 'draft')} style={{ flex: 1, padding: '1rem', fontWeight: 900, background: '#64748b' }}>
                暫存草稿 (SAVE DRAFT)
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1rem', fontWeight: 900, background: '#1e3a8a' }}>
                送出簽核 (SUBMIT FOR SIGNING)
              </button>
            </div>
          )}
          {isPreview && (
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: '#64748b' }}>
              關閉預覽 (CLOSE PREVIEW)
            </button>
          )}
        </form>

        <datalist id="material-datalist">
          {materials.map(m => <option key={m.id} value={`${m.material_number} - ${m.name || ''}`} />)}
        </datalist>
        <datalist id="supplier-datalist">
          {suppliers.map(s => <option key={s.id} value={`${s.supplier_code} - ${s.name}`} />)}
        </datalist>
      </div>
    </div>
  );
}
