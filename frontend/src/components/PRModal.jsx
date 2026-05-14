import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Clock, MessageSquare, CheckCircle, Printer } from 'lucide-react';
import axios from 'axios';
import PRHeader from './PRModal/PRHeader';
import PRTable from './PRModal/PRTable';
import PRFooter from './PRModal/PRFooter';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function PRModal({ mode, user, editData, isPreview, onClose, suppliers, subjects, materials, onSuccess }) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = editData ? new Date(editData.created_at).toLocaleDateString() : `${yyyy}/${mm}/${dd}`;
  const prNumberStr = editData ? editData.pr_number : `PR-${yyyy}${mm}${dd}...`;

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

  const [approvalHistory, setApprovalHistory] = useState([]);
  
  useEffect(() => {
    if (!editData) {
      axios.get(`${API_BASE}/pr/next-number`)
        .then(res => {
          if (res.data.next) {
            setFormData(prev => ({ ...prev, pr_number: res.data.next }));
          }
        })
        .catch(err => console.error('Failed to fetch next PR number', err));
    }
  }, [editData]);

  // 簽核進度條組件
  const ApprovalStepper = () => {
    if (!editData) return null;
    const flow = (editData.total_amount > 50000) ? ['課長 Head', '經理 Manager', '總經理 GM'] : 
                 (editData.total_amount > 10000) ? ['課長 Head', '經理 Manager'] : ['課長 Head'];
    const currentIndex = editData.current_step_index || 0;
    const isApproved = editData.status === 'approved' || editData.status === 'converted';
    const isRejected = editData.status === 'rejected';

    return (
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
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
    if (editData && editData.id) {
      // 抓取完整資料 (含品項)
      axios.get(`${API_BASE}/pr/${editData.id}`).then(fullRes => {
        const fullData = fullRes.data;
        const currentMode = fullData.input_mode === 'ACCOUNTING' ? 'subject' : 'bom';
        if (fullData.input_mode) setInputMode(fullData.input_mode);

        const populateData = (items) => {
          const currentItems = (items && items.length > 0) ? items.map(i => ({
            ...i,
            material_number: i.material_number || i.description || '',
            demand: i.quantity || 0,
            unit_price: i.unit_price || ''
          })) : [{ material_number: '', demand: '', unit: (currentMode === 'subject' ? 'PCS' : 'KG'), demand_day: '', purchase_quantity: '', manufacturer: '', date_of_purchase: '', remark_zh: '', remark_en: '', unit_price: '', subject_id: '' }];

          const next = {
            pr_number: fullData.pr_number || editData.number || '',
            requester: fullData.requester,
            department: fullData.department,
            category: '一般 General',
            remarks: fullData.remarks || '',
            currency: fullData.currency || 'INR',
            exchange_rate: fullData.exchange_rate || 1.0,
            items: currentItems
          };
          console.log('[PRModal] Form data updated:', next);
          setFormData(next);
        };

        if (fullData.items) {
          populateData(fullData.items);
        } else {
          // 備援：如果後端尚未更新整合型 API，則獨立抓取品項
          axios.get(`${API_BASE}/pr/${editData.id}/items`).then(res => {
            populateData(res.data);
          });
        }
      }).catch(err => console.error('Fetch PR details failed', err));

      // 抓取簽核歷程
      axios.get(`${API_BASE}/approvals/history/PR/${editData.id}`).then(res => {
        setApprovalHistory(res.data);
      }).catch(err => console.error('Failed to fetch approval history', err));
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

  const handlePrint = () => {
    window.print();
  };

  const lastApproval = approvalHistory.length > 0 ? approvalHistory[approvalHistory.length - 1] : null;
  const supervisorName = lastApproval && lastApproval.status === 'approved' ? lastApproval.approver : '待核准';

  return (
    <div className="pr-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem 0' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .sidebar, .header, .main-content > div:not(.pr-modal-overlay) {
            display: none !important;
          }
          .app-container, .main-content {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .pr-modal-overlay {
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
          .pr-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 1cm !important;
            overflow: visible !important;
            height: auto !important;
          }
        .print-only { display: none !important; }
        @media print {
          .no-print { display: none !important; }
          .print-only { 
            display: block !important; 
            visibility: visible !important;
            white-space: normal !important;
            word-break: break-all !important;
          }
          input, select, textarea, button.no-print {
            display: none !important;
          }
          table {
            font-size: 0.7rem !important;
            table-layout: fixed !important;
            width: 100% !important;
          }
          th, td {
            padding: 2px !important;
            overflow: visible !important;
          }
        }
      `}</style>
      <div className="pr-container card" style={{ width: '1200px', maxWidth: '98vw', maxHeight: 'none', padding: '2.5rem', background: '#fff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '1rem' }}>
          {(editData?.status === 'approved' || editData?.status === 'converted') && (
            <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={18} /> 列印請購單 Print PR
            </button>
          )}
          <X style={{ cursor: 'pointer', color: '#64748b' }} onClick={onClose} />
        </div>
        
        <form onSubmit={handleSubmit}>
          <PRHeader formData={formData} dateStr={dateStr} />
          <ApprovalStepper />

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.625rem 1.25rem', borderRadius: '12px', transition: 'all 0.3s', background: inputMode === 'BOM' ? '#fff' : 'transparent', boxShadow: inputMode === 'BOM' ? 'var(--shadow)' : 'none' }}>
              <input type="radio" checked={inputMode === 'BOM'} onChange={() => setInputMode('BOM')} disabled={isPreview} />
              <span style={{ fontWeight: 'bold', color: inputMode === 'BOM' ? 'var(--primary)' : 'var(--text-muted)' }}>BOM 物料模式</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.625rem 1.25rem', borderRadius: '12px', transition: 'all 0.3s', background: inputMode === 'ACCOUNTING' ? '#fff' : 'transparent', boxShadow: inputMode === 'ACCOUNTING' ? 'var(--shadow)' : 'none' }}>
              <input type="radio" checked={inputMode === 'ACCOUNTING'} onChange={() => setInputMode('ACCOUNTING')} disabled={isPreview} />
              <span style={{ fontWeight: 'bold', color: inputMode === 'ACCOUNTING' ? 'var(--primary)' : 'var(--text-muted)' }}>會計科目模式</span>
            </label>
          </div>

          <PRTable formData={formData} setFormData={setFormData} inputMode={inputMode} isPreview={isPreview} subjects={subjects} handleTranslate={handleTranslate} getSubjectName={getSubjectName} materials={materials} />
          <PRFooter formData={formData} setFormData={setFormData} inputMode={inputMode} isPreview={isPreview} onClose={onClose} handleSubmit={handleSubmit} />

          {/* 簽核歷程區塊 */}
          {isPreview && approvalHistory.length > 0 && (
            <div className="no-print" style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', textAlign: 'left' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000' }}>
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
                        <span style={{ fontWeight: 'bold', color: '#000' }}>{log.approver}</span>
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
          {/* 列印專用簽章欄 */}
          <div className="print-only" style={{ marginTop: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '1rem' }}>開單人員： <span style={{ fontWeight: 'bold' }}>{formData.requester}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Requester</div>
              </div>
              <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '1rem' }}>主管審核： <span style={{ fontWeight: 'bold' }}>{supervisorName}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Supervisor Approval</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
