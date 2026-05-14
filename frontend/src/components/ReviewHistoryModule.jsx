import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, RotateCcw, Trash2, Eye, Calendar, User, Building2, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function ReviewHistoryModule({ onPreview, onVoucher }) {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('ALL'); // ALL, PR, PO
    const [sortOrder, setSortOrder] = useState('DESC'); // DESC, ASC (created_at/approval_date)
    const [headerSort, setHeaderSort] = useState({ field: null, direction: 'DESC' }); // For column specific sorting

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/history`, {
                params: { search: searchTerm }
            });
            setHistory(res.data);
        } catch (err) {
            console.error('Fetch history failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleHeaderSort = (field) => {
        if (headerSort.field === field) {
            setHeaderSort({ field, direction: headerSort.direction === 'ASC' ? 'DESC' : 'ASC' });
        } else {
            setHeaderSort({ field, direction: 'DESC' });
        }
    };

    const filteredAndSortedHistory = history
        .filter(item => {
            const matchType = filterType === 'ALL' || item.type === filterType;
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = 
                item.number.toLowerCase().includes(searchLower) ||
                item.requester.toLowerCase().includes(searchLower) ||
                item.department.toLowerCase().includes(searchLower);
            return matchType && matchSearch;
        })
        .sort((a, b) => {
            // Priority 1: Header Sort
            if (headerSort.field) {
                let valA = a[headerSort.field];
                let valB = b[headerSort.field];

                if (headerSort.field === 'approval_date' || headerSort.field === 'created_at') {
                    valA = new Date(valA || 0).getTime();
                    valB = new Date(valB || 0).getTime();
                } else if (headerSort.field === 'total_amount') {
                    valA = Number(valA) || 0;
                    valB = Number(valB) || 0;
                }

                if (valA < valB) return headerSort.direction === 'ASC' ? -1 : 1;
                if (valA > valB) return headerSort.direction === 'ASC' ? 1 : -1;
                return 0;
            }

            // Priority 2: Global Date Sort
            const dateA = new Date(a.approval_date || a.created_at).getTime();
            const dateB = new Date(b.approval_date || b.created_at).getTime();
            return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
        });

    const handleReturn = async (item) => {
        if (!window.confirm(`確定將單據 ${item.number} 退回至待簽核清單？`)) return;
        try {
            await axios.post(`${API_BASE}/history/return/${item.type}/${item.id}`);
            fetchHistory();
            alert('單據已退回至待簽核狀態');
        } catch (err) {
            alert('退回失敗: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`警告：確定要永久刪除紀錄 ${item.number} 嗎？此操作無法還原。`)) return;
        try {
            await axios.delete(`${API_BASE}/history/${item.type}/${item.id}`);
            fetchHistory();
        } catch (err) {
            alert('刪除失敗');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: '已核准 (Approved)' };
            case 'converted': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: '已轉採購 (Converted)' };
            case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: '已駁回 (Rejected)' };
            case 'closed': return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', text: '已結案 (Closed)' };
            default: return { bg: '#f1f5f9', color: '#64748b', text: status };
        }
    };

    const SortIndicator = ({ field }) => {
        if (headerSort.field !== field) return <ArrowUpDown size={12} style={{ marginLeft: '4px', opacity: 0.3 }} />;
        return headerSort.direction === 'ASC' ? <ChevronUp size={12} style={{ marginLeft: '4px' }} /> : <ChevronDown size={12} style={{ marginLeft: '4px' }} />;
    };

    return (
        <div className="module-container animate-fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>審查歷史紀錄</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>檢視、搜尋與管理所有已結案的請購單與採購單</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                            <input 
                                type="text" 
                                placeholder="搜尋單號、人員、部門..." 
                                className="form-input" 
                                style={{ paddingLeft: '2.5rem', minWidth: '250px', height: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'ENTER' && fetchHistory()}
                            />
                        </div>
                        <button className="btn btn-primary" style={{ height: '40px' }} onClick={fetchHistory}>查詢 Query</button>
                    </div>
                </div>

                {/* Filter and Global Sort Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['ALL', 'PR', 'PO'].map(type => (
                            <button 
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{ 
                                    padding: '0.5rem 1.25rem', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    background: filterType === type ? 'var(--primary)' : 'transparent',
                                    color: filterType === type ? '#fff' : '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {type === 'ALL' ? '全部 ALL' : type}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}
                    >
                        <ArrowUpDown size={14} /> {sortOrder === 'DESC' ? '由新到舊 Newest' : '由舊到新 Oldest'}
                    </button>
                </div>

                <div className="table-wrapper" style={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table className="table">
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ cursor: 'default' }}>類型 Type</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleHeaderSort('number')}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>單號 Number <SortIndicator field="number" /></div>
                                </th>
                                <th>申請人/單位 Requester/Dept</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleHeaderSort('total_amount')}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>總金額 Amount <SortIndicator field="total_amount" /></div>
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleHeaderSort('approval_date')}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>簽核日期 Date <SortIndicator field="approval_date" /></div>
                                </th>
                                <th>狀態 Status</th>
                                <th style={{ textAlign: 'center' }}>操作 Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>讀取中...</td></tr>
                            ) : filteredAndSortedHistory.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>尚無結案紀錄</td></tr>
                            ) : filteredAndSortedHistory.map((item) => {
                                const style = getStatusStyle(item.status);
                                return (
                                    <tr key={`${item.type}-${item.id}`} className="hover-row">
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold',
                                                background: item.type === 'PR' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: item.type === 'PR' ? '#6366f1' : '#f59e0b',
                                                border: `1px solid ${item.type === 'PR' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                            }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{item.number}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                    <User size={14} style={{ color: '#94a3b8' }} /> {item.requester}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    <Building2 size={12} /> {item.department}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                                {item.currency} {item.total_amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.9rem' }}>
                                                <Calendar size={14} /> {new Date(item.approval_date || item.created_at).toLocaleDateString()}
                                            </div>
                                            {item.last_approver && (
                                                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', marginTop: '4px' }}>
                                                    由 {item.last_approver} 核准
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                                                background: style.bg, color: style.color
                                            }}>
                                                {style.text}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button className="btn-icon" onClick={() => onPreview(item, item.type)} title="查看詳情">
                                                    <Eye size={18} />
                                                </button>
                                                {item.type === 'PO' && item.status === 'approved' && (
                                                    <button className="btn-icon" style={{ color: '#10b981' }} onClick={() => onVoucher(item)} title="查看付款憑單">
                                                        <FileText size={18} />
                                                    </button>
                                                )}
                                                <button className="btn-icon" style={{ color: '#3b82f6' }} onClick={() => handleReturn(item)} title="退回至待簽核">
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDelete(item)} title="永久刪除">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
