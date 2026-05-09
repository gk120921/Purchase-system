import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import PRList from './components/PRList';
import ApprovalQueue from './components/ApprovalQueue';
import POList from './components/POList';
import PRModal from './components/PRModal';
import POModal from './components/POModal';
import SubjectModule from './components/SubjectModule';
import MaterialModule from './components/MaterialModule';
import SupplierModule from './components/SupplierModule';
import UserModule from './components/UserModule';
import SupplierModal from './components/SupplierModal';
import UserModal from './components/UserModal';
import SubjectModal from './components/SubjectModal';
import ApprovalSettings from './components/ApprovalSettings';
import ExportModule from './components/ExportModule';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import DeptModule from './components/DeptModule';
import ReviewHistoryModule from './components/ReviewHistoryModule';

const API_BASE = `http://${window.location.hostname}:3001/api`;

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [suppliers, setSuppliers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [prs, setPrs] = useState([]);
  const [pos, setPos] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [prModalMode, setPrModalMode] = useState(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPr, setEditingPr] = useState(null);
  const [editingPo, setEditingPo] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState({ requisition: true, database: false, system: false });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.allowed_modules) return handleLogout();
      fetchData();
      if (user.role === 'supervisor') setActiveTab('approvals');
      else if (user.allowed_modules?.includes('dashboard')) setActiveTab('dashboard');
    }
  }, [user]);

  const fetchData = async () => {
    const fetchBase = async () => {
      try {
        const [sRes, subRes, prRes, poRes, matRes] = await Promise.all([
          axios.get(`${API_BASE}/suppliers`), axios.get(`${API_BASE}/subjects`),
          axios.get(`${API_BASE}/pr`), axios.get(`${API_BASE}/po`),
          axios.get(`${API_BASE}/materials`)
        ]);
        setSuppliers(Array.isArray(sRes.data) ? sRes.data : []);
        setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
        setPrs(Array.isArray(prRes.data) ? prRes.data : []);
        setPos(Array.isArray(poRes.data) ? poRes.data : []);
        setMaterials(Array.isArray(matRes.data) ? matRes.data : []);
      } catch (err) { console.error('Base data fetch failed:', err); }
    };

    const fetchDepts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/departments`);
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error('Dept fetch failed:', err); setDepartments([]); }
    };

    const fetchUsers = async () => {
      if (user?.role === 'admin' || user?.allowed_modules?.includes('users')) {
        try {
          const res = await axios.get(`${API_BASE}/users`);
          setAllUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error('User fetch failed:', err); setAllUsers([]); }
      }
    };

    // 並行執行所有任務，互不干擾
    await Promise.all([fetchBase(), fetchDepts(), fetchUsers()]);
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      alert(err.response?.data?.error || '登入失敗');
    }
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('user'); };

  const handleApprove = async (id, status, targetType = 'PR', comment = '') => {
    try {
      await axios.post(`${API_BASE}/approvals`, { target_type: targetType, target_id: id, approver: user.name, status, comment });
      fetchData();
    } catch (err) { alert('簽核失敗'); }
  };

  const handleEditPr = (pr) => { setIsPreview(false); setEditingPr(pr); setPrModalMode(pr.subject_id && pr.subject_id > 1 ? 'subject' : 'bom'); };
  const handlePreviewPr = (pr) => { setIsPreview(true); setEditingPr(pr); setPrModalMode(pr.subject_id && pr.subject_id > 1 ? 'subject' : 'bom'); };
  const handleDeletePr = async (id) => { if (window.confirm('確定刪除？')) { await axios.delete(`${API_BASE}/pr/${id}`); fetchData(); } };

  // 補齊缺失的 PO 處理函數
  const handlePreviewPo = (po) => { setIsPreview(true); setEditingPo(po); setIsPoModalOpen(true); };
  const handleEditPo = (po) => { setIsPreview(false); setEditingPo(po); setIsPoModalOpen(true); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  // 確保打開人員設定時會刷新資料
  if (showUserModal) { /* effect already handled or logic can be simpler */ }

  return (
    <ErrorBoundary>
      <div className={`app-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar 
          user={user} activeTab={activeTab} setActiveTab={setActiveTab} 
          sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}
          openCategories={openCategories} toggleCategory={(cat) => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
          handleLogout={handleLogout}
        />

        <main className="main-content">
          <header className="header">
            <h2>{activeTab.toUpperCase()}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeTab === 'pr' && (
                <>
                  <button className="btn btn-primary" onClick={() => { setEditingPr(null); setPrModalMode('subject'); }}>+ 新增會計 PR</button>
                  <button className="btn btn-primary" style={{ background: '#3b82f6' }} onClick={() => { setEditingPr(null); setPrModalMode('bom'); }}>+ 新增物料 PR</button>
                </>
              )}
              {activeTab === 'materials' && (
                <button className="btn btn-primary" onClick={() => {
                  const num = prompt('Enter Material Number / 輸入物料編號:');
                  const unit = prompt('Enter Unit (e.g. PCS, KG) / 輸入單位:');
                  if (num && unit) {
                    axios.post(`${API_BASE}/materials`, { material_number: num, name: num, unit }).then(() => fetchData());
                  }
                }}>+ 新增物料 Material</button>
              )}
              {activeTab === 'departments' && (
                <button className="btn btn-primary" onClick={() => {
                  const event = new CustomEvent('toggle-add-dept');
                  window.dispatchEvent(event);
                }}>+ 新增部門 Unit</button>
              )}
              {activeTab === 'users' && (
                <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>+ 新增人員 User</button>
              )}
            </div>
          </header>

          {activeTab === 'dashboard' && <Dashboard pos={pos} prs={prs} />}
          {activeTab === 'departments' && <DeptModule departments={departments} onRefresh={fetchData} />}
          {activeTab === 'approvals' && (
            <ApprovalQueue 
              items={[
                ...prs.filter(p => p.status === 'pending' || p.status === 'dept_pending' || p.status === 'gm_pending').map(p => ({ ...p, type: 'PR' })), 
                ...pos.filter(p => p.status === 'pending').map(p => ({ ...p, type: 'PO' }))
              ]} 
              onApprove={handleApprove} 
              onPreview={(item, type) => type === 'PR' ? handlePreviewPr(item) : handlePreviewPo(item)}
            />
          )}
          {activeTab === 'po' && <POList pos={pos} onEdit={handleEditPo} onDelete={async (id) => { await axios.delete(`${API_BASE}/po/${id}`); fetchData(); }} onPreview={handlePreviewPo} />}
          {activeTab === 'subjects' && <SubjectModule subjects={subjects} onRefresh={fetchData} onEdit={(s) => { setEditingSubject(s); setShowSubjectModal(true); }} />}
          {activeTab === 'materials' && <MaterialModule materials={materials} onRefresh={fetchData} />}
          {activeTab === 'suppliers' && <SupplierModule suppliers={suppliers} onRefresh={fetchData} onEdit={s => { setEditingSupplier(s); setShowSubjectModal(true); }} />}
          {activeTab === 'users' && <UserModule users={allUsers} onRefresh={fetchData} onEdit={u => { setEditingUser(u); setShowUserModal(true); }} />}
          {activeTab === 'pr' && <PRList prs={prs} onEdit={handleEditPr} onDelete={handleDeletePr} onPreview={handlePreviewPr} />}
          {activeTab === 'history' && <ReviewHistoryModule onPreview={(item, type) => type === 'PR' ? handlePreviewPr(item) : handlePreviewPo(item)} />}
          {activeTab === 'settings' && <ApprovalSettings />}
          {activeTab === 'export' && <ExportModule pos={pos} />}

          {prModalMode && <PRModal mode={prModalMode} user={user} editData={editingPr} isPreview={isPreview} onClose={() => { setPrModalMode(null); setEditingPr(null); setIsPreview(false); }} suppliers={suppliers} subjects={subjects} materials={materials} onSuccess={() => { setPrModalMode(null); setEditingPr(null); setIsPreview(false); fetchData(); }} />}
          {isPoModalOpen && <POModal user={user} editData={editingPo} isPreview={isPreview} onClose={() => { setIsPoModalOpen(false); setEditingPo(null); setIsPreview(false); }} suppliers={suppliers} materials={materials} onSuccess={() => { setIsPoModalOpen(false); setEditingPo(null); setIsPreview(false); fetchData(); }} />}
          {showSupplierModal && <SupplierModal editData={editingSupplier} suppliers={suppliers} onClose={() => setShowSupplierModal(false)} onSuccess={() => { setShowSupplierModal(false); fetchData(); }} />}
          {showUserModal && <UserModal editData={editingUser} onClose={() => setShowUserModal(false)} onSuccess={() => { setShowUserModal(false); fetchData(); }} departments={departments} allUsers={allUsers} />}
          {showSubjectModal && <SubjectModal editData={editingSubject} onClose={() => setShowSubjectModal(false)} onSuccess={() => { setShowSubjectModal(false); fetchData(); }} />}
        </main>

        {/* 建議清單 Datalists */}
        <datalist id="material-datalist">
          {materials.map(m => (
            <option key={m.id} value={m.material_number}>
              {m.name || ''}
            </option>
          ))}
        </datalist>
        <datalist id="supplier-datalist">
          {suppliers.map(s => (
            <option key={s.id} value={s.supplier_code ? `${s.supplier_code} - ${s.name}` : s.name} />
          ))}
        </datalist>
      </div>
    </ErrorBoundary>
  );
}

export default App;
