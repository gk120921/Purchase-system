import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

const API_BASE = 'http://127.0.0.1:3001/api';
const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard({ pos, prs }) {
  const [stats, setStats] = useState({
    monthlyTrend: [],
    categoryStats: [],
    top3: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/dashboard/stats`)
      .then(res => {
        const data = res.data || {};
        setStats({
          monthlyTrend: Array.isArray(data.monthlyTrend) ? data.monthlyTrend : [],
          categoryStats: Array.isArray(data.categoryStats) ? data.categoryStats : [],
          top3: Array.isArray(data.top3) ? data.top3 : []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch stats error', err);
        setLoading(false);
      });
  }, [pos]); // Re-fetch when POs change

  const totalSpend = (pos || []).reduce((sum, po) => sum + ((po.total_amount || 0) * (po.exchange_rate || 1)), 0);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard Data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '5px solid #1e3a8a', padding: '1.5rem' }}>
          <h3 style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>採購總支出 (換算 INR)</h3>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>TOTAL EXPENDITURE (CONVERTED)</span>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem', color: '#1e3a8a' }}>
            ₹{totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card" style={{ borderLeft: '5px solid #f59e0b', padding: '1.5rem' }}>
          <h3 style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>待簽核請購單</h3>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>PENDING APPROVALS (PR)</span>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem', color: '#f59e0b' }}>
            {(prs || []).filter(p => (p.status || '').includes('pending')).length}
          </p>
        </div>
        <div className="card" style={{ borderLeft: '5px solid #10b981', padding: '1.5rem' }}>
          <h3 style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>本月採購訂單量</h3>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>MONTHLY ORDERS (PO)</span>
          <p style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem', color: '#10b981' }}>
            {pos.length}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>每月採購支出趨勢</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Monthly Expenditure Trend (INR)</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrend}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Expenditure']}
                />
                <Area type="monotone" dataKey="amount" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>支出類別分佈</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Expenditure by Category</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryStats}
                  dataKey="total_value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 3 Row */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>支出類別前三大排行榜</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Top 3 Spending Categories</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {stats.top3.map((cat, idx) => (
            <div key={idx} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ 
                  background: idx === 0 ? '#1e3a8a' : (idx === 1 ? '#3b82f6' : '#93c5fd'), 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold' 
                }}>
                  RANK {idx + 1}
                </span>
                <span style={{ fontWeight: '900', color: '#1e3a8a' }}>
                  {totalSpend > 0 ? ((cat.total_value / totalSpend) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{cat.category || '未分類'}</h4>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                ₹{cat.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${(stats.top3[0]?.total_value > 0) ? (cat.total_value / stats.top3[0].total_value) * 100 : 0}%`, 
                  height: '100%', 
                  background: idx === 0 ? '#1e3a8a' : (idx === 1 ? '#3b82f6' : '#93c5fd') 
                }} />
              </div>
            </div>
          ))}
          {stats.top3.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              尚無足夠資料產生排行榜 / No data available for ranking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
