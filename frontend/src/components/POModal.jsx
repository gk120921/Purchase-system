import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Circle, Clock, MessageSquare, CheckCircle, Printer } from 'lucide-react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function POModal({ user, editData, isPreview, onClose, suppliers = [], materials = [], units = [], onSuccess }) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  
  const dateStr = editData ? new Date(editData.created_at).toLocaleDateString() : `${yyyy}/${mm}/${dd}`;
  const round2 = (num) => Math.round((parseFloat(num) || 0) * 100) / 100;
  
  const [formData, setFormData] = useState({
    po_number: editData ? (editData.po_number || editData.number || '') : `PO-${yyyy}${mm}${dd}...`,
    pr_number: editData ? (editData.pr_number || '') : '',
    requester: editData ? editData.requester : user.name,
    department: editData ? editData.department : user.dept_name,
    remarks: editData ? editData.remarks : '採購單系統產生',
    supplier_id: editData ? (editData.display_supplier || editData.supplier_name || '') : '',
    currency: editData?.currency || 'INR',
    exchange_rate: editData?.exchange_rate || 1.0,
    cgst_rate: editData?.cgst_rate !== undefined ? editData.cgst_rate : 9,
    sgst_rate: editData?.sgst_rate !== undefined ? editData.sgst_rate : 9,
    shipping_fee: round2(editData?.shipping_fee),
    shipping_remark_zh: editData?.shipping_remark_zh || '',
    shipping_remark_en: editData?.shipping_remark_en || '',
    excluding_tax_amount: round2(editData?.excluding_tax_amount),
    cgst_amount: round2(editData?.cgst_amount),
    sgst_amount: round2(editData?.sgst_amount),
    total_amount: round2(editData?.total_amount),
    items: [{ material_number: '', description: '', quantity: 0, unit: 'NOS', unit_price: 0, total: 0, remark_zh: '', remark_en: '' }]
  });

  const [approvalHistory, setApprovalHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 移除不再需要的 Ref
  
  useEffect(() => {
    if (!editData) {
      axios.get(`${API_BASE}/po/next-number`)
        .then(res => {
          if (res.data.next) {
            setFormData(prev => ({ ...prev, po_number: res.data.next }));
          }
        })
        .catch(err => console.error('Failed to fetch next PO number', err));
    }
  }, [editData]);

  useEffect(() => {
    console.log('[POModal] Data loaded:', { editData, suppliersCount: suppliers?.length });
    if (editData && editData.id) {
      // 抓取完整資料 (含品項)
      axios.get(`${API_BASE}/po/${editData.id}`).then(fullRes => {
        const fullData = fullRes.data;
        
        const populateData = (items) => {
          setFormData(prev => {
            const next = {
              ...prev,
              po_number: fullData.po_number || editData.number || prev.po_number || '',
              pr_number: fullData.linked_pr_number || fullData.pr_number || prev.pr_number || '',
              requester: fullData.requester || prev.requester || user.name,
              department: fullData.department || prev.department || user.dept_name,
              remarks: (fullData.remarks || prev.remarks || '').replace(/^From PR-[\w\d]+: /, ''),
              supplier_id: fullData.linked_supplier_name || fullData.display_supplier || fullData.supplier_name || prev.supplier_id || '',
              currency: fullData.currency || prev.currency || 'INR',
              exchange_rate: fullData.exchange_rate || prev.exchange_rate || 1.0,
              cgst_rate: fullData.cgst_rate !== undefined ? fullData.cgst_rate : (prev.cgst_rate !== undefined ? prev.cgst_rate : 9),
              sgst_rate: fullData.sgst_rate !== undefined ? fullData.sgst_rate : (prev.sgst_rate !== undefined ? prev.sgst_rate : 9),
              shipping_fee: round2(fullData.shipping_fee || prev.shipping_fee),
              shipping_remark_zh: fullData.shipping_remark_zh || prev.shipping_remark_zh || '',
              shipping_remark_en: fullData.shipping_remark_en || prev.shipping_remark_en || '',
              excluding_tax_amount: round2(fullData.excluding_tax_amount || prev.excluding_tax_amount),
              cgst_amount: round2(fullData.cgst_amount || prev.cgst_amount),
              sgst_amount: round2(fullData.sgst_amount || prev.sgst_amount),
              total_amount: round2(fullData.total_amount || prev.total_amount),
              items: (items && items.length > 0) ? items.map(i => ({
                ...i,
                material_number: i.material_number || i.description || '',
                unit_price: round2(i.unit_price),
                total: round2(i.total),
                remark_zh: i.remark_zh || '',
                remark_en: i.remark_en || ''
              })) : prev.items
            };
            console.log('[POModal] Form data updated:', next);
            return next;
          });
        };

        if (fullData.items) {
          populateData(fullData.items);
        } else {
          // 備援：獨立抓取品項
          axios.get(`${API_BASE}/po/${editData.id}/items`).then(res => {
            populateData(res.data);
          });
        }
      }).catch(err => console.error('Fetch PO details failed', err));

      axios.get(`${API_BASE}/approvals/history/PO/${editData.id}`).then(res => {
        setApprovalHistory(res.data);
      }).catch(err => console.error('Failed to fetch approval history', err));
    }
  }, [editData]);

  const handlePrint = () => {
    window.print();
  };

  const lastApproval = approvalHistory.length > 0 ? approvalHistory[approvalHistory.length - 1] : null;
  const supervisorName = lastApproval && lastApproval.status === 'approved' ? lastApproval.approver : '待核准';

  const handleSubmit = async (e, status = 'pending') => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isSubmitting) return;

    // [DEBUG] 第一階段：確認點擊事件
    console.log('[DEBUG] Submit Clicked. Status:', status);
    
    if (!editData || !editData.id) {
      alert('[錯誤] 找不到該單據的 ID，請重新整理頁面後再試。');
      return;
    }

    setIsSubmitting(true);
    try {
      // [DEBUG] 第二階段：資料驗證
      const subtotalVal = calculateSubtotal(formData.items);
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const shipping = parseFloat(formData.shipping_fee) || 0;
      
      const cgst_amount = parseFloat(formData.cgst_amount);
      const sgst_amount = parseFloat(formData.sgst_amount);
      const total_amount = subtotalVal + cgst_amount + sgst_amount + shipping;

      // 供應商查找
      const foundSup = (suppliers || []).find(s => {
        const val = s.supplier_code ? `${s.supplier_code} - ${s.name}` : s.name;
        return val === formData.supplier_id;
      });

      const finalTotalAmount = parseFloat(formData.total_amount);
      const payload = {
        requester: formData.requester,
        department: formData.department,
        supplier_id: foundSup ? foundSup.id : null,
        supplier_name: foundSup ? foundSup.name : formData.supplier_id,
        remarks: formData.remarks,
        status,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        subtotal: subtotalVal,
        cgst_rate: cgstRate,
        sgst_rate: sgstRate,
        cgst_amount,
        sgst_amount,
        shipping_fee: shipping,
        shipping_remark_zh: formData.shipping_remark_zh,
        shipping_remark_en: formData.shipping_remark_en,
        excluding_tax_amount: parseFloat(formData.excluding_tax_amount) || 0,
        total_amount: Math.round((isNaN(finalTotalAmount) ? total_amount : finalTotalAmount) * 100) / 100,
        items: formData.items.map(i => ({
          ...i,
          quantity: parseFloat(i.quantity) || 0,
          unit_price: parseFloat(i.unit_price) || 0,
          total: (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0),
          remark_zh: i.remark_zh || '',
          remark_en: i.remark_en || ''
        }))
      };

      // [DEBUG] 第三階段：送出請求
      console.log('[DEBUG] Sending payload to backend...', payload);
      const response = await axios.put(`${API_BASE}/po/${editData.id}`, payload);
      console.log('[DEBUG] Response received:', response.data);

      alert('單據已送出！');
      onSuccess();
    } catch (err) {
      console.error('[CRITICAL] PO Submit failed:', err);
      alert('[系統報錯] 傳輸失敗：' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const calculateSubtotal = (items) => {
    const sum = items.reduce((sum, i) => sum + (parseFloat(i.quantity) * parseFloat(i.unit_price) || 0), 0);
    return Math.round(sum * 100) / 100;
  };

  // 新增：顯式觸發總額計算的函數
  const updateTotalAmount = (updatedFormData) => {
    const subtotal = calculateSubtotal(updatedFormData.items);
    const excluding = parseFloat(updatedFormData.excluding_tax_amount || 0);
    const taxableSubtotal = subtotal - excluding;
    
    const cgst = Math.round(taxableSubtotal * (parseFloat(updatedFormData.cgst_rate || 0) / 100));
    const sgst = Math.round(taxableSubtotal * (parseFloat(updatedFormData.sgst_rate || 0) / 100));
    const ship = parseFloat(updatedFormData.shipping_fee || 0);
    const newTotal = Math.round((subtotal + cgst + sgst + ship) * 100) / 100;
    setFormData(prev => ({ 
      ...prev, 
      cgst_amount: cgst, 
      sgst_amount: sgst, 
      total_amount: newTotal 
    }));
  };

  const subtotalVal = calculateSubtotal(formData.items);
  const cgstRate = parseFloat(formData.cgst_rate) || 0;
  const sgstRate = parseFloat(formData.sgst_rate) || 0;
  const shipping = parseFloat(formData.shipping_fee) || 0;
  const cgst_amount = formData.cgst_amount;
  const sgst_amount = formData.sgst_amount;

  // 移除會蓋掉資料的 useEffect

  return (
    <div className="po-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem 0' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .sidebar, .header, .main-content > div:not(.po-modal-overlay) {
            display: none !important;
          }
          .app-container, .main-content {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .po-modal-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
          }
        .print-only { display: none !important; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
      <div className="po-container card" style={{ width: '1200px', maxHeight: 'none', padding: '2rem', background: '#fff', color: '#000', borderRadius: '0', position: 'relative' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '1rem' }}>
          {(editData?.status === 'approved') && (
            <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={18} /> 列印採購單 Print PO
            </button>
          )}
          <X style={{ cursor: 'pointer', color: '#333' }} onClick={onClose} />
        </div>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Times New Roman, serif' }}>KST TERMINALS (INDIA) MANUFACTURING PRIVATE LIMITE</div>
            <div style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'Microsoft JhengHei, sans-serif' }}>採購訂單</div>
            <div style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Times New Roman, serif' }}>Purchase Order</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>訂單編號 PO No.</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.po_number}</div>
              <input className="no-print" value={formData.po_number} disabled style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>請購單號 PR No.</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.pr_number}</div>
              <input className="no-print" value={formData.pr_number} disabled style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>供應商 Supplier</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.supplier_id}</div>
              <input 
                className="no-print"
                list="supplier-datalist" 
                value={formData.supplier_id} 
                disabled={isPreview}
                onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>建立日期 Date</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{dateStr}</div>
              <input className="no-print" value={dateStr} disabled style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>採購人員 Buyer</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.requester}</div>
              <input className="no-print" value={formData.requester} disabled={isPreview} onChange={(e) => setFormData({...formData, requester: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>部門 Dept</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.department}</div>
              <input className="no-print" value={formData.department} disabled={isPreview} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>備註 Remarks</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', border: '1px solid #000', minHeight: '40px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{formData.remarks}</div>
              <textarea 
                className="no-print"
                value={formData.remarks} 
                disabled={isPreview} 
                onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }} 
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>幣別 Currency</label>
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.currency}</div>
              <select 
                className="no-print"
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
              <div className="print-only" style={{ display: 'none', padding: '0.5rem', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>{formData.exchange_rate}</div>
              <input 
                className="no-print"
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
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '12%' }}>進貨日 Delivery</th>
                <th style={{ border: '1px solid #000', padding: '0.5rem', width: '25%' }}>備註 Remark (ZH/EN)</th>
                {!isPreview && <th style={{ border: '1px solid #000', padding: '0.5rem', width: '4%' }}></th>}
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '0', position: 'relative' }}>
                    <div className="print-only" style={{ display: 'none', padding: '4px', textAlign: 'left', wordBreak: 'break-all', fontSize: '0.7rem' }}>{item.material_number}</div>
                    <input 
                      className="no-print"
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
                      style={{ width: '100%', border: 'none', padding: '0.5rem', background: isPreview ? '#f3f4f6' : 'transparent' }} 
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.65rem' }}>{item.quantity}</div>
                    <input 
                      className="no-print" 
                      type="number" 
                      step="0.01" 
                      value={item.quantity} 
                      disabled={isPreview} 
                      onChange={(e) => { 
                        const newItems = [...formData.items]; 
                        newItems[index].quantity = e.target.value; 
                        const nextData = {...formData, items: newItems};
                        setFormData(nextData);
                        updateTotalAmount(nextData); // 觸發計算
                      }} 
                      style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'transparent' }} 
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.65rem' }}>{item.unit}</div>
                    <input 
                      className="no-print"
                      list="unit-datalist"
                      value={item.unit} 
                      disabled={isPreview} 
                      onChange={(e) => { const newItems = [...formData.items]; newItems[index].unit = e.target.value; setFormData({...formData, items: newItems}); }} 
                      style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'transparent' }} 
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.65rem' }}>{item.unit_price}</div>
                    <input 
                      className="no-print" 
                      type="number" 
                      step="0.01" 
                      value={item.unit_price} 
                      disabled={isPreview} 
                      onChange={(e) => { 
                        const newItems = [...formData.items]; 
                        newItems[index].unit_price = e.target.value; 
                        const nextData = {...formData, items: newItems};
                        setFormData(nextData);
                        updateTotalAmount(nextData); // 觸發計算
                      }} 
                      style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'center', background: isPreview ? '#f3f4f6' : 'transparent' }} 
                    />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                    {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} {round2(parseFloat(item.quantity) * parseFloat(item.unit_price)).toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0' }}>
                    <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem', wordBreak: 'break-all' }}>{item.date_of_purchase}</div>
                    <input className="no-print" type="date" value={item.date_of_purchase} disabled={isPreview} onChange={(e) => { const newItems = [...formData.items]; newItems[index].date_of_purchase = e.target.value; setFormData({...formData, items: newItems}); }} style={{ width: '100%', border: 'none', padding: '0.5rem', background: isPreview ? '#f3f4f6' : 'transparent' }} />
                  </td>
                  <td style={{ border: '1px solid #000', padding: '0', textAlign: 'left' }}>
                    <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                      <div>{item.remark_zh}</div>
                      <div style={{ color: '#64748b', marginTop: '2px' }}>{item.remark_en}</div>
                    </div>
                    <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.5rem' }}>
                      <input 
                        placeholder="中文備註"
                        value={item.remark_zh || ''} 
                        disabled={isPreview} 
                        onChange={(e) => { const newItems = [...formData.items]; newItems[index].remark_zh = e.target.value; setFormData({...formData, items: newItems}); }} 
                        style={{ width: '100%', border: 'none', borderBottom: isPreview ? 'none' : '1px dashed #cbd5e1', padding: '2px', background: 'transparent', fontSize: '0.85rem' }} 
                      />
                      <input 
                        placeholder="English Remark"
                        value={item.remark_en || ''} 
                        disabled={isPreview} 
                        onChange={(e) => { const newItems = [...formData.items]; newItems[index].remark_en = e.target.value; setFormData({...formData, items: newItems}); }} 
                        style={{ width: '100%', border: 'none', padding: '2px', background: 'transparent', fontSize: '0.85rem', color: '#64748b' }} 
                      />
                    </div>
                  </td>
                  {!isPreview && (
                    <td style={{ border: '1px solid #000', textAlign: 'center' }}>
                      <button type="button" onClick={() => { if(formData.items.length > 1) { const newItems = formData.items.filter((_, i) => i !== index); setFormData({...formData, items: newItems}); } }} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td colSpan="4" style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>小計 Subtotal:</td>
                <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>
                  {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} {subtotalVal.toLocaleString()}
                </td>
                <td colSpan={isPreview ? 2 : 3} style={{ border: '1px solid #000' }}></td>
              </tr>
              <tr style={{ background: '#fff' }}>
                <td colSpan="4" style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right', color: '#64748b' }}>不計稅項目 Excluding tax item:</td>
                <td style={{ border: '1px solid #000', padding: '0' }}>
                  <input 
                    type="number" 
                    value={formData.excluding_tax_amount} 
                    disabled={isPreview} 
                    onChange={(e) => {
                      const nextData = {...formData, excluding_tax_amount: e.target.value};
                      setFormData(nextData);
                      updateTotalAmount(nextData);
                    }} 
                    style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'right', background: isPreview ? '#f8fafc' : '#fffeb3' }} 
                  />
                </td>
                <td colSpan={isPreview ? 2 : 3} style={{ border: '1px solid #000' }}></td>
              </tr>
              <tr style={{ background: '#fff' }}>
                <td colSpan="3" style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>CGST (%):</td>
                <td style={{ border: '1px solid #000', padding: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem' }}>
                    <input 
                      type="number" 
                      value={formData.cgst_rate} 
                      disabled={isPreview} 
                      onChange={(e) => {
                        const nextData = {...formData, cgst_rate: e.target.value};
                        setFormData(nextData);
                        updateTotalAmount(nextData);
                      }} 
                      style={{ width: '60%', border: 'none', padding: '0.5rem', textAlign: 'center' }} 
                    />
                    <span>%</span>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '0', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
                    <span style={{ paddingLeft: '0.5rem' }}>{formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')}</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.cgst_amount} 
                      disabled={isPreview}
                      onChange={(e) => {
                        const newAmt = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          cgst_amount: newAmt,
                          total_amount: subtotalVal + newAmt + prev.sgst_amount + parseFloat(prev.shipping_fee)
                        }));
                      }}
                      style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', background: isPreview ? '#f1f5f9' : '#fffeb3' }} 
                    />
                  </div>
                </td>
                <td colSpan={isPreview ? 2 : 3} style={{ border: '1px solid #000' }}></td>
              </tr>
              <tr style={{ background: '#fff' }}>
                <td colSpan="3" style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>SGST (%):</td>
                <td style={{ border: '1px solid #000', padding: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem' }}>
                    <input 
                      type="number" 
                      value={formData.sgst_rate} 
                      disabled={isPreview} 
                      onChange={(e) => {
                        const nextData = {...formData, sgst_rate: e.target.value};
                        setFormData(nextData);
                        updateTotalAmount(nextData);
                      }} 
                      style={{ width: '60%', border: 'none', padding: '0.5rem', textAlign: 'center' }} 
                    />
                    <span>%</span>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '0', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
                    <span style={{ paddingLeft: '0.5rem' }}>{formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')}</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.sgst_amount} 
                      disabled={isPreview}
                      onChange={(e) => {
                        const newAmt = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          sgst_amount: newAmt,
                          total_amount: subtotalVal + prev.cgst_amount + newAmt + parseFloat(prev.shipping_fee)
                        }));
                      }}
                      style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', background: isPreview ? '#f1f5f9' : '#fffeb3' }} 
                    />
                  </div>
                </td>
                <td colSpan={isPreview ? 2 : 3} style={{ border: '1px solid #000' }}></td>
              </tr>
              <tr style={{ background: '#fff' }}>
                <td colSpan="4" style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'right' }}>其他費用 Other Fees:</td>
                <td style={{ border: '1px solid #000', padding: '0' }}>
                  <input 
                    type="number" 
                    value={formData.shipping_fee} 
                    disabled={isPreview} 
                    onChange={(e) => {
                      const nextData = {...formData, shipping_fee: e.target.value};
                      setFormData(nextData);
                      updateTotalAmount(nextData);
                    }} 
                    style={{ width: '100%', border: 'none', padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }} 
                  />
                </td>
                <td colSpan={isPreview ? 2 : 3} style={{ border: '1px solid #000', padding: '0' }}>
                  <div className="print-only" style={{ display: 'none', padding: '4px', fontSize: '0.7rem' }}>
                    {formData.shipping_remark_zh} {formData.shipping_remark_en && `(${formData.shipping_remark_en})`}
                  </div>
                  <div className="no-print" style={{ display: 'flex', gap: '4px', padding: '4px' }}>
                    <input 
                      placeholder="中文備註"
                      style={{ flex: 1, border: '1px solid #e2e8f0', padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      value={formData.shipping_remark_zh}
                      disabled={isPreview}
                      onChange={(e) => setFormData({...formData, shipping_remark_zh: e.target.value})}
                      onBlur={async (e) => {
                        if (e.target.value && !formData.shipping_remark_en) {
                          const en = await handleTranslate(e.target.value, 'zh|en');
                          setFormData(prev => ({ ...prev, shipping_remark_en: en }));
                        }
                      }}
                    />
                    <input 
                      placeholder="EN Remark (Auto-Translate)"
                      style={{ flex: 1, border: '1px solid #e2e8f0', padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      value={formData.shipping_remark_en}
                      disabled={isPreview}
                      onChange={(e) => setFormData({...formData, shipping_remark_en: e.target.value})}
                      onBlur={async (e) => {
                        if (e.target.value && !formData.shipping_remark_zh) {
                          const zh = await handleTranslate(e.target.value, 'en|zh');
                          setFormData(prev => ({ ...prev, shipping_remark_zh: zh }));
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
              <tr style={{ background: '#e2e8f0', fontWeight: '900' }}>
                <td colSpan="4" style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'right', fontSize: '1.1rem' }}>總計 Grand Total:</td>
                <td style={{ border: '1px solid #000', padding: '0', textAlign: 'right', fontSize: '1.25rem', color: '#1e3a8a', background: '#fff' }}>
                  {isPreview ? (
                    <div style={{ padding: '0.75rem', background: '#f1f5f9' }}>
                      {formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')} {parseFloat(formData.total_amount || 0).toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
                      <span style={{ paddingLeft: '0.5rem', fontSize: '1.1rem' }}>{formData.currency === 'USD' ? '$' : (formData.currency === 'TWD' || formData.currency === 'CNY' ? '¥' : '₹')}</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.total_amount} 
                        onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                        style={{ 
                          width: '100%', 
                          border: 'none', 
                          padding: '0.75rem', 
                          textAlign: 'right', 
                          fontSize: '1.25rem', 
                          fontWeight: '900', 
                          color: '#1e3a8a',
                          background: '#fffeb3' // 黃色背景提示可修改
                        }} 
                      />
                    </div>
                  )}
                </td>
                <td colSpan={isPreview ? 2 : 3} style={{ border: '1px solid #000' }}></td>
              </tr>
            </tbody>
          </table>

          {/* 簽核歷程區塊 (編輯模式也顯示) */}
          {approvalHistory.length > 0 && (
            <div className="no-print" style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#10b981" /> 簽核歷程 (Approval History)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {approvalHistory.map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                      {i < approvalHistory.length - 1 && <div style={{ width: '2px', flex: 1, background: '#cbd5e1' }}></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>{log.approver}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: log.status === 'rejected' ? '#ef4444' : '#10b981', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {log.status === 'approved' ? '核准通過 (Approved)' : log.status === 'rejected' ? '已駁回 (Rejected)' : log.status}
                      </div>
                      {log.comment && (
                        <div style={{ fontSize: '0.85rem', color: '#475569', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <MessageSquare size={14} style={{ marginTop: '0.1rem' }} />
                          {log.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isPreview && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={(e) => handleSubmit(e, 'draft')} style={{ flex: 1, padding: '1rem', fontWeight: 900, background: '#64748b' }}>
                暫存草稿 (SAVE DRAFT)
              </button>
              <button 
                type="button" 
                disabled={isSubmitting} 
                onClick={(e) => handleSubmit(e, 'pending')}
                className="btn btn-primary" 
                style={{ flex: 2, padding: '1rem', fontWeight: 900, background: isSubmitting ? '#94a3b8' : '#1e3a8a' }}
              >
                {isSubmitting ? '處理中 (PROCESSING)...' : '送出簽核 (SUBMIT FOR SIGNING)'}
              </button>
            </div>
          )}
          {isPreview && (
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: '#64748b' }}>
              關閉預覽 (CLOSE PREVIEW)
            </button>
          )}
          {/* 列印專用簽章欄 */}
          <div className="print-only" style={{ marginTop: '4rem', paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '1.1rem' }}>開單人員： <span style={{ fontWeight: 'bold' }}>{formData.requester}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Requester</div>
              </div>
              <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '1.1rem' }}>主管審核： <span style={{ fontWeight: 'bold' }}>{supervisorName}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Supervisor Approval</div>
              </div>
            </div>
          </div>
        </div>

        <datalist id="material-datalist">
          {materials.map(m => <option key={m.id} value={`${m.material_number} - ${m.name || ''}`} />)}
        </datalist>
        <datalist id="supplier-datalist">
          {suppliers.map(s => <option key={s.id} value={`${s.supplier_code} - ${s.name}`} />)}
        </datalist>
        <datalist id="unit-datalist">
          {units.map(u => (
            <option key={u.id} value={u.name} />
          ))}
          {/* 備援：顯示物料中已存在的單位 */}
          {Array.from(new Set(materials.map(m => m.unit).filter(Boolean)))
            .filter(mu => !units.some(u => u.name === mu))
            .map(u => (
              <option key={`mat-${u}`} value={u} />
            ))
          }
        </datalist>
      </div>
    </div>
  );
}
