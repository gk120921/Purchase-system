import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, ShieldAlert, DollarSign } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3001/api`;

export default function ApprovalSettings() {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings/thresholds`);
      setThresholds(res.data);
      setLoading(false);
    } catch (err) {
      alert('無法讀取設定: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/settings/thresholds`, { thresholds });
      alert('設定已成功更新！ (Settings updated successfully)');
      fetchThresholds();
    } catch (err) {
      alert('更新失敗: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    try {
      await axios.post(`${API_BASE}/settings/thresholds`, {
        level_name: '新層級 New Level',
        role_key: 'supervisor',
        min_amount: 0,
        priority: thresholds.length + 1
      });
      fetchThresholds();
    } catch (err) {
      alert('新增失敗: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此審核層級嗎？ Confirm delete?')) return;
    try {
      await axios.delete(`${API_BASE}/settings/thresholds/${id}`);
      fetchThresholds();
    } catch (err) {
      alert('刪除失敗: ' + err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>載入中... Loading...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', color: '#fff', padding: '0.75rem', borderRadius: '12px' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>審核門檻與權責設定</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Approval Thresholds & Authority Matrix</p>
          </div>
        </div>
        <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           新增層級 (Add Level)
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚠️ 只有系統管理員（最高權限）可以調整此設定。變更後將立即影響新的請購單。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {thresholds.map((t, index) => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 0.8fr 1.2fr auto', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>層級名稱 (Level Name)</label>
                  <input 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={t.level_name}
                    onChange={(e) => {
                      const newT = [...thresholds];
                      newT[index].level_name = e.target.value;
                      setThresholds(newT);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>適用部門 (Dept)</label>
                  <select 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    value={t.dept_code || ''}
                    onChange={(e) => {
                      const newT = [...thresholds];
                      newT[index].dept_code = e.target.value || null;
                      setThresholds(newT);
                    }}
                  >
                    <option value="">所有部門 (Global)</option>
                    <option value="採購部">採購部 (D001)</option>
                    <option value="生產部">生產部 (P001)</option>
                    <option value="研發部">研發部 (R001)</option>
                    <option value="管理層">管理層 (M001)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>角色權限 (Role Authority)</label>
                  <select 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    value={t.role_key}
                    onChange={(e) => {
                      const newT = [...thresholds];
                      newT[index].role_key = e.target.value;
                      setThresholds(newT);
                    }}
                  >
                    <option value="purchaser">PURCHASER (採購)</option>
                    <option value="supervisor">SUPERVISOR (主管)</option>
                    <option value="admin">ADMIN (總經理/管理員)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>優先級</label>
                  <input 
                    type="number"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={t.priority}
                    onChange={(e) => {
                      const newT = [...thresholds];
                      newT[index].priority = parseInt(e.target.value) || 0;
                      setThresholds(newT);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>最低門檻 (Min Amount)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.9rem' }}>$</span>
                    <input 
                      type="number" 
                      value={t.min_amount}
                      onChange={(e) => {
                        const newT = [...thresholds];
                        newT[index].min_amount = parseFloat(e.target.value) || 0;
                        setThresholds(newT);
                      }}
                      style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 1.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
                <div style={{ paddingBottom: '2px' }}>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    style={{ 
                      padding: '0.6rem 0.8rem', 
                      borderRadius: '6px', 
                      border: '1px solid #fee2e2', 
                      background: '#fef2f2', 
                      color: '#ef4444', 
                      cursor: 'pointer', 
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    刪除
                  </button>
                </div>
              </div>
          ))}
        </div>

        <button 
          onClick={handleUpdate}
          disabled={saving}
          style={{ 
            marginTop: '2rem', 
            width: '100%', 
            padding: '1rem', 
            background: 'var(--primary)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '1rem'
          }}
        >
          {saving ? '儲存中...' : <><Save size={20} /> 儲存設定 (Save Settings)</>}
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.85rem', color: '#475569' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>💡 設定指南 (Guide)</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li><b>Dept Manager</b>: 通常設為 0，表示所有的請購單都必須經過部門主管。</li>
          <li><b>GM</b>: 設定觸發總經理審核的金額。例如設為 50,000，表示超過 $50k 的單據在主管核准後會轉送至總經理。</li>
          <li><b>審核順序</b>: 系統會優先檢查高金額門檻。</li>
        </ul>
      </div>
    </div>
  );
}
