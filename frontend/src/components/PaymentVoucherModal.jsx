import React, { useState, useEffect } from 'react';
import { X, Printer, Save, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function PaymentVoucherModal({ po, onClose }) {
  const [voucher, setVoucher] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, iRes] = await Promise.all([
          axios.get(`${API_BASE}/payment-vouchers/po/${po.id}`),
          axios.get(`${API_BASE}/po/${po.id}/items`)
        ]);
        setVoucher(vRes.data);
        setPoItems(iRes.data);
        
        // Initialize due date if empty
        if (vRes.data && !vRes.data.due_date) {
            setVoucher(prev => ({ ...prev, due_date: new Date().toISOString().split('T')[0] }));
        }
      } catch (err) {
        console.error('Failed to fetch voucher data', err);
      } finally {
        setLoading(false);
      }
    };
    if (po && po.id) fetchData();
  }, [po]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE}/payment-vouchers/${voucher.id}`, voucher);
      alert('付款憑單已儲存！ Saved successfully!');
    } catch (err) {
      alert('儲存失敗：' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('確認核准此憑單？ Confirm approval?')) return;
    const updatedVoucher = { ...voucher, status: 'approved' };
    setVoucher(updatedVoucher);
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE}/payment-vouchers/${voucher.id}`, updatedVoucher);
      alert('付款憑單已核准！ Approved successfully!');
    } catch (err) {
      alert('核准失敗：' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const updateVoucherField = (field, value) => {
    setVoucher(prev => {
        const newVoucher = { ...prev, [field]: value };
        
        // Recalculate TDS and Net if rate changed
        if (field === 'tds_rate') {
            const rate = parseFloat(value) || 0;
            const sub = po.subtotal || 0;
            const tdsAmt = sub * (rate / 100);
            newVoucher.tds_amount = tdsAmt;
            newVoucher.net_amount = (po.total_amount || 0) - tdsAmt;
        }
        
        return newVoucher;
    });
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              載入中... Loading...
          </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '2rem' }}>⚠️</div>
              無法讀取憑單資料 (Voucher data not found)
              <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '1rem' }}>關閉 Close</button>
          </div>
      </div>
    );
  }

  const calculatedSubtotal = poItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const subtotal = po.subtotal || calculatedSubtotal || 0;
  
  let gstAmount = (po.cgst_amount || 0) + (po.sgst_amount || 0);
  // Fallback calculation if tax amounts are not explicitly stored
  if (gstAmount === 0 && subtotal > 0) {
      gstAmount = subtotal * 0.18;
  }
  const grandTotal = po.total_amount || (subtotal + gstAmount);

  return (
    <div className="voucher-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, overflowY: 'auto', padding: '2rem 0' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: inline-block !important; }
          
          /* 隱藏側邊欄、頁首、按鈕以及背景所有內容 */
          .sidebar, .header, .main-content > div:not(.voucher-modal-overlay) {
            display: none !important;
          }
          
          /* 修正外層容器佈局，防止多餘空白頁 */
          .app-container, .main-content {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* 憑單容器設定 */
          .voucher-modal-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          
          .voucher-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 1cm !important;
            background: white !important;
          }
        }
        .print-only { display: none; }
        .voucher-table th, .voucher-table td { border: 1px solid #000; padding: 4px 8px; font-size: 0.85rem; }
        .voucher-table th { background: #f8fafc; font-weight: bold; text-align: center; }
        .notes-list { list-style: none; padding: 0; margin: 0; font-size: 0.75rem; color: #333; }
        .notes-list li { margin-bottom: 4px; line-height: 1.2; }
      `}</style>
      
      <div className="voucher-container card" style={{ width: '1000px', background: '#fff', color: '#000', borderRadius: '0', padding: '2rem', position: 'relative' }}>
        
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981' }}>
              <Save size={18} /> {isSaving ? '儲存中...' : '儲存變更 Save Changes'}
            </button>
            {voucher.status !== 'approved' && (
                <button 
                    onClick={handleApprove} 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6' }}
                >
                    <CheckCircle2 size={18} /> 核准 Approve
                </button>
            )}
            <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={18} /> 列印憑單 Print Voucher
            </button>
          </div>
          <X style={{ cursor: 'pointer', color: '#64748b' }} onClick={onClose} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>印度製造廠申請付款憑單</h2>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'normal', fontFamily: 'serif' }}>India Manufacturing Plant Payment Request Form</h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <div>
            <div>付款幣別: <span style={{ fontWeight: 'bold' }}>{po.currency || 'INR'}</span></div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Payment Currency: {po.currency}</div>
          </div>
          {po.currency !== 'INR' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>付款匯率 (Exch. Rate):</span>
                <input 
                  type="number" 
                  className="no-print"
                  step="0.01"
                  value={voucher.exchange_rate || po.exchange_rate || 1.0} 
                  onChange={(e) => updateVoucherField('exchange_rate', e.target.value)} 
                  style={{ width: '80px', border: '1px solid #ccc', padding: '2px 4px', fontWeight: 'bold', textAlign: 'center' }}
                />
                <span className="print-only" style={{ fontWeight: 'bold' }}>{voucher.exchange_rate}</span>
              </div>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div>{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <table className="voucher-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>摘要<br/><span style={{ fontSize: '0.7rem' }}>Description/code</span></th>
              <th style={{ width: '8%' }}>數量<br/><span style={{ fontSize: '0.7rem' }}>Quantity</span></th>
              <th style={{ width: '10%' }}>單價<br/><span style={{ fontSize: '0.7rem' }}>Unit Price</span></th>
              <th style={{ width: '12%' }}>發票總額<br/><span style={{ fontSize: '0.7rem' }}>Total Amount</span></th>
              <th style={{ width: '10%' }}>未稅金額<br/><span style={{ fontSize: '0.7rem' }}>Untaxed Amount</span></th>
              <th style={{ width: '10%' }}>減: TDS<br/><span style={{ fontSize: '0.7rem' }}>Less: TDS</span></th>
              <th style={{ width: '12%' }}>實付金額<br/><span style={{ fontSize: '0.7rem' }}>Net Amount</span></th>
              <th style={{ width: '33%' }}>備註<br/><span style={{ fontSize: '0.7rem' }}>Remarks</span></th>
            </tr>
          </thead>
          <tbody>
            {poItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.material_number}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{item.unit_price?.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{item.total?.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{item.total?.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}></td>
                <td style={{ textAlign: 'right' }}>{item.total?.toLocaleString()}</td>
                <td style={{ fontSize: '0.75rem' }}>
                    <div style={{ color: '#000' }}>
                        {[item.remark_zh, item.remark_en].filter(Boolean).join(' / ')}
                    </div>
                </td>
              </tr>
            ))}
            {[...Array(Math.max(0, 5 - poItems.length))].map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: '24px' }}>
                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))}
            
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', fontWeight: 'bold' }}>GST 18%</td>
              <td style={{ textAlign: 'right' }}>{gstAmount.toLocaleString()}</td>
              <td></td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{gstAmount.toLocaleString()}</td>
              <td></td>
            </tr>

            <tr>
              <td colSpan="3" style={{ padding: '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px solid #000', padding: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={voucher.payment_category === 'Bank Transfer'} onChange={() => updateVoucherField('payment_category', 'Bank Transfer')} />
                        ■ 網路轉帳 Bank Transfer
                    </label>
                  </div>
                  <div style={{ padding: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={voucher.payment_category === 'Petty Cash'} onChange={() => updateVoucherField('payment_category', 'Petty Cash')} />
                        □ 零用金帳戶 Petty Cash Account
                    </label>
                  </div>
                </div>
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>到期日：</div>
                <input 
                    type="date" 
                    className="no-print"
                    value={voucher.due_date || ''} 
                    onChange={(e) => updateVoucherField('due_date', e.target.value)} 
                    style={{ border: 'none', fontSize: '0.8rem', width: '100%' }}
                />
                <div style={{ fontSize: '0.7rem' }}>Due Date</div>
              </td>
              <td colSpan="2" style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                付款金額：<br/>
                <span style={{ fontSize: '0.7rem' }}>Payment Amount:</span>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ color: po.currency !== 'INR' ? '#666' : '#000', fontSize: po.currency !== 'INR' ? '0.85rem' : '1rem' }}>
                    {po.currency === 'INR' ? '₹' : (po.currency === 'USD' ? '$' : '')} {grandTotal.toLocaleString()}
                  </div>
                  {po.currency !== 'INR' && (
                    <div style={{ color: '#1e3a8a', borderTop: '1px solid #ccc', marginTop: '4px', paddingTop: '4px' }}>
                      ₹ {(grandTotal * (parseFloat(voucher.exchange_rate) || 1.0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (INR)
                    </div>
                  )}
                </div>
              </td>
              <td>
                <div style={{ fontSize: '0.7rem' }}>TDS Rate:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input 
                        type="number" 
                        className="no-print"
                        value={voucher.tds_rate} 
                        onChange={(e) => updateVoucherField('tds_rate', e.target.value)} 
                        style={{ width: '40px', border: '1px solid #ccc' }} 
                    />
                    <span className="no-print">%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '2rem' }}>
          <div style={{ width: '30%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                授權： 
                <input 
                    className="no-print"
                    placeholder="Authorized by"
                    value={voucher.authorized_by || ''} 
                    onChange={(e) => updateVoucherField('authorized_by', e.target.value)} 
                    style={{ border: 'none', borderBottom: '1px dashed #ccc', fontSize: '1rem', flex: 1, fontFamily: 'cursive' }}
                />
                <span className="print-only" style={{ fontFamily: 'cursive', fontSize: '1.1rem' }}>{voucher.authorized_by}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>Department</div>
          </div>
          <div style={{ width: '30%', borderTop: '1px solid #000', paddingTop: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                核准： 
                <input 
                    className="no-print"
                    placeholder="Reviewed by"
                    value={voucher.reviewed_by || ''} 
                    onChange={(e) => updateVoucherField('reviewed_by', e.target.value)} 
                    style={{ border: 'none', borderBottom: '1px dashed #ccc', fontSize: '1rem', width: '120px', textAlign: 'center', fontWeight: 'bold' }}
                />
                <span className="print-only" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{voucher.reviewed_by}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>Reviewed by</div>
          </div>
          <div style={{ width: '30%', borderTop: '1px solid #000', paddingTop: '0.5rem', textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                請款人： 
                <input 
                    className="no-print"
                    placeholder="Requested by"
                    value={voucher.requested_by || ''} 
                    onChange={(e) => updateVoucherField('requested_by', e.target.value)} 
                    style={{ border: 'none', borderBottom: '1px dashed #ccc', fontSize: '1rem', width: '120px', textAlign: 'right', fontFamily: 'cursive' }}
                />
                <span className="print-only" style={{ fontFamily: 'cursive', fontSize: '1.1rem' }}>{voucher.requested_by}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>Requested by</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>注意：<br/><span style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>Notes:</span></h4>
          <ul className="notes-list">
            <li>1. TDS 稅率依照支付類型 (租金 10%、會計師 10%)，稅率不一致，請與會計師做確認<br/>
                1. The TDS rate depends on the type of payment (e.g., Rent 10%, Accountant Fee 10%). Since tax rates may vary, please confirm with the accountant.</li>
            <li>2. 請每月 5、15、30 日前彙總提出，依核決權限由張副理或陳處長簽核。<br/>
                2. Please submit before the 5th, 15th, and 30th of each month. Approval will be granted by the Deputy Manager or Manager based on authorization levels.</li>
            <li>3. 有付款期限者，請於備註欄註明。<br/>
                3. If there is a payment deadline, please indicate it in the remarks column.</li>
            <li>4. 該份簽核後付款憑單連同各筆憑證一併 mail 回台灣，財務付款作業。<br/>
                4. After approval, the signed payment request form should be sent together with supporting documents via email back to Taiwan for finance processing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
