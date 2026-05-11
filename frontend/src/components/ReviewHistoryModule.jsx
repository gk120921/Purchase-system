import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, RotateCcw, Trash2, Eye, Calendar, User, Building2, ChevronRight } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function ReviewHistoryModule({ onPreview, onVoucher }) {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="module-container animate-fade-in">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>審查歷史紀錄</h3>
                        <p style={{ color: 'var(--text-muted)' }}>檢視、搜尋與管理所有已結案的請購單與採購單</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input 
                                type="text" 
                                placeholder="搜尋單號、人員、部門..." 
                                className="form-input" 
                                style={{ paddingLeft: '3rem', minWidth: '300px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'ENTER' && fetchHistory()}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={fetchHistory}>查詢 Query</button>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>類型 Type</th>
                                <th>單號 Number</th>
                                <th>申請人/單位 Requester/Dept</th>
                                <th>總金額 Amount</th>
                                <th>簽核日期 Date</th>
                                <th>狀態 Status</th>
                                <th style={{ textAlign: 'center' }}>操作 Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>讀取中...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>尚無結案紀錄</td></tr>
                            ) : history.map((item) => {
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
