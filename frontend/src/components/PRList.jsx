import React, { useState } from 'react';
import { Search, ArrowUpDown, Filter, Globe, Settings2 } from 'lucide-react';

export default function PRList({ prs, onEdit, onDelete, onPreview }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [language, setLanguage] = useState('zh'); // 'zh' or 'en'
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [inputModeFilter, setInputModeFilter] = useState('ALL');
  const [visibleColumns, setVisibleColumns] = useState({
    pr_number: true,
    requester: true,
    supplier: true,
    amount: false,
    status: true,
    date: true,
    item_remark_zh: false,
    item_remark_en: false,
    actions: true
  });

  const columns = [
    { id: 'pr_number', zh: '單號', en: 'Order No.' },
    { id: 'requester', zh: '申請人', en: 'Requester' },
    { id: 'supplier', zh: '供應商', en: 'Supplier' },
    { id: 'amount', zh: '金額', en: 'Amount' },
    { id: 'status', zh: '狀態', en: 'Status' },
    { id: 'date', zh: '日期', en: 'Date' },
    { id: 'item_remark_zh', zh: '中文備註', en: 'ZH Remark' },
    { id: 'item_remark_en', zh: '英文備註', en: 'EN Remark' },
    { id: 'actions', zh: '操作', en: 'Actions' }
  ];

  const filteredPrs = prs
    .filter(pr => {
      const matchStatus = filterStatus === 'ALL' || pr.status.toUpperCase() === filterStatus;
      const matchMode = inputModeFilter === 'ALL' || pr.input_mode === inputModeFilter;
      const matchSearch = 
        pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pr.display_supplier && pr.display_supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pr.item_remark_zh && pr.item_remark_zh.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pr.item_remark_en && pr.item_remark_en.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStatus && matchMode && matchSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });

  const statusLabels = {
    'ALL': { zh: '全部', en: 'ALL' },
    'DRAFT': { zh: '草稿', en: 'DRAFT' },
    'DEPT_PENDING': { zh: '待主管審核', en: 'DEPT PENDING' },
    'GM_PENDING': { zh: '待總經理審核', en: 'GM PENDING' },
    'APPROVED': { zh: '已核准', en: 'APPROVED' },
    'REJECTED': { zh: '已退回', en: 'REJECTED' },
    'CONVERTED': { zh: '已轉單', en: 'CONVERTED' }
  };

  const getCount = (status) => {
    if (status === 'ALL') return prs.length;
    return prs.filter(pr => pr.status.toUpperCase() === status).length;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          <input 
            type="text" 
            placeholder="快速搜尋單號、申請人或供應商... Search No, Requester or Supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', flexWrap: 'wrap' }}>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button 
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{ 
                padding: '0.5rem 0.75rem', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '70px',
                background: filterStatus === key ? '#fff' : 'transparent',
                color: filterStatus === key ? 'var(--primary)' : '#64748b',
                boxShadow: filterStatus === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{label.en}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {label.zh}
                <span style={{ 
                  background: filterStatus === key ? 'var(--primary)' : '#e2e8f0', 
                  color: filterStatus === key ? '#fff' : '#64748b',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '0.65rem'
                }}>
                  {getCount(key)}
                </span>
              </div>
            </button>
          ))}
        </div>
        <button 
          onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#64748b', whiteSpace: 'nowrap' }}
        >
          <ArrowUpDown size={16} /> {sortOrder === 'DESC' ? (language === 'zh' ? '由新到舊' : 'Newest') : (language === 'zh' ? '由舊到新' : 'Oldest')}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          {[
            { id: 'ALL', zh: '全部', en: 'ALL' },
            { id: 'ACCOUNTING', zh: '會計科目模式', en: 'ACCOUNTING' },
            { id: 'BOM', zh: '物料模式', en: 'BOM' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => {
                setInputModeFilter(m.id);
                if (m.id === 'ACCOUNTING') {
                  setVisibleColumns(prev => ({ ...prev, item_remark_zh: true, item_remark_en: true }));
                } else if (m.id === 'BOM') {
                  setVisibleColumns(prev => ({ ...prev, item_remark_zh: false, item_remark_en: false }));
                }
              }}
              style={{ 
                padding: '0.5rem 1rem', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '0.8rem', 
                fontWeight: '900',
                cursor: 'pointer',
                background: inputModeFilter === m.id ? 'var(--primary)' : 'transparent',
                color: inputModeFilter === m.id ? '#fff' : '#64748b',
                transition: 'all 0.2s'
              }}
            >
              {language === 'zh' ? m.zh : m.en}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
          <button 
            onClick={() => setLanguage(prev => prev === 'zh' ? 'en' : 'zh')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}
          >
            <Globe size={16} /> {language === 'zh' ? '切換英文 (Switch to English)' : '切換中文 (Switch to Chinese)'}
          </button>
          <button 
            onClick={() => setShowColumnConfig(!showColumnConfig)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}
          >
            <Settings2 size={16} /> {language === 'zh' ? '欄位設定' : 'Columns'}
          </button>

          {showColumnConfig && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1rem', zIndex: 10, minWidth: '200px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                {language === 'zh' ? '顯示欄位篩選' : 'Column Visibility'}
              </div>
              {columns.map(col => (
                <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns[col.id]} 
                    onChange={() => setVisibleColumns({...visibleColumns, [col.id]: !visibleColumns[col.id]})}
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  {language === 'zh' ? col.zh : col.en}
                </label>
              ))}
              <button 
                onClick={() => setShowColumnConfig(false)}
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.4rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}
              >
                {language === 'zh' ? '關閉' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <table style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
          <thead>
            <tr>
              {visibleColumns.pr_number && <th>{language === 'zh' ? '單號' : 'Order No.'}</th>}
              {visibleColumns.requester && <th>{language === 'zh' ? '申請人' : 'Requester'}</th>}
              {visibleColumns.supplier && <th>{language === 'zh' ? '供應商' : 'Supplier'}</th>}
              {visibleColumns.item_remark_zh && <th>{language === 'zh' ? '中文備註' : 'ZH Remark'}</th>}
              {visibleColumns.item_remark_en && <th>{language === 'zh' ? '英文備註' : 'EN Remark'}</th>}
              {visibleColumns.amount && <th>{language === 'zh' ? '金額' : 'Amount'}</th>}
              {visibleColumns.status && <th>{language === 'zh' ? '狀態' : 'Status'}</th>}
              {visibleColumns.date && <th>{language === 'zh' ? '日期' : 'Date'}</th>}
              {visibleColumns.actions && <th style={{ textAlign: 'right' }}>{language === 'zh' ? '操作' : 'Actions'}</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPrs.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>{language === 'zh' ? '找不到符合條件的請購單' : 'No matching PRs found'}</td></tr>
            ) : filteredPrs.map(pr => (
              <tr key={pr.id} style={{ background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {visibleColumns.pr_number && <td style={{ fontWeight: 900, color: 'var(--primary)', padding: '1rem' }}>{pr.pr_number}</td>}
                {visibleColumns.requester && <td>{pr.requester}</td>}
                {visibleColumns.supplier && <td>{pr.display_supplier}</td>}
                {visibleColumns.item_remark_zh && <td style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pr.item_remark_zh}>{pr.item_remark_zh}</td>}
                {visibleColumns.item_remark_en && <td style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pr.item_remark_en}>{pr.item_remark_en}</td>}
                {visibleColumns.amount && <td style={{ fontWeight: 'bold' }}>${pr.total_amount.toLocaleString()}</td>}
                {visibleColumns.status && (
                  <td>
                    <div className={`status-badge status-${pr.status}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                      <span style={{ fontSize: language === 'en' ? '0.8rem' : '0.65rem' }}>{(statusLabels[pr.status.toUpperCase()] || {en: pr.status}).en}</span>
                      {language === 'zh' && <span style={{ fontSize: '0.8rem' }}>{(statusLabels[pr.status.toUpperCase()] || {zh: pr.status}).zh}</span>}
                    </div>
                  </td>
                )}
                {visibleColumns.date && <td style={{ color: 'var(--text-muted)' }}>{new Date(pr.created_at).toLocaleDateString()}</td>}
                {visibleColumns.actions && (
                  <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => onPreview(pr)}
                        style={{ border: 'none', background: '#6366f1', color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span>{language === 'zh' ? '預覽' : 'PREVIEW'}</span>
                        {language === 'zh' && <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>PREVIEW</span>}
                      </button>
                      {(pr.status === 'dept_pending' || pr.status === 'gm_pending' || pr.status === 'draft' || pr.status === 'rejected') && (
                        <>
                          <button 
                            onClick={() => onEdit(pr)}
                            style={{ border: 'none', background: 'var(--primary)', color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span>{language === 'zh' ? '修正' : 'EDIT'}</span>
                            {language === 'zh' && <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>EDIT</span>}
                          </button>
                          <button 
                            onClick={() => { if(window.confirm(language === 'zh' ? '確定要刪除這筆請購單嗎？' : 'Confirm Delete?')) onDelete(pr.id); }}
                            style={{ border: 'none', background: 'var(--danger)', color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span>{language === 'zh' ? '刪除' : 'DELETE'}</span>
                            {language === 'zh' && <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>DELETE</span>}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
