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
import PaymentVoucherModal from './components/PaymentVoucherModal';
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
import UnitModule from './components/UnitModule';

const API_BASE = `http://${window.location.hostname}:3001/api`;

// 語系 Context
const LanguageContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('BOTH'); // BOTH, CN, EN
  const [activeTab, setActiveTab] = useState('dashboard');
  const [suppliers, setSuppliers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [prs, setPrs] = useState([]);
  const [pos, setPos] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
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
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedPoForVoucher, setSelectedPoForVoucher] = useState(null);
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
      if (user.role === 'supervisor' || user.role === 'manager') setActiveTab('approvals');
      else if (user.allowed_modules?.includes('dashboard')) setActiveTab('dashboard');
    }
  }, [user]);

  const fetchData = async () => {
    const fetchBase = async () => {
      try {
        const results = await Promise.allSettled([
          axios.get(`${API_BASE}/suppliers`),
          axios.get(`${API_BASE}/subjects`),
          axios.get(`${API_BASE}/pr`),
          axios.get(`${API_BASE}/po`),
          axios.get(`${API_BASE}/materials`),
          axios.get(`${API_BASE}/units`)
        ]);

        if (results[0].status === 'fulfilled') setSuppliers(Array.isArray(results[0].value.data) ? results[0].value.data : []);
        if (results[1].status === 'fulfilled') setSubjects(Array.isArray(results[1].value.data) ? results[1].value.data : []);
        if (results[2].status === 'fulfilled') setPrs(Array.isArray(results[2].value.data) ? results[2].value.data : []);
        if (results[3].status === 'fulfilled') setPos(Array.isArray(results[3].value.data) ? results[3].value.data : []);
        if (results[4].status === 'fulfilled') setMaterials(Array.isArray(results[4].value.data) ? results[4].value.data : []);
        if (results[5].status === 'fulfilled') setUnits(Array.isArray(results[5].value.data) ? results[5].value.data : []);
        
        results.forEach((r, idx) => {
          if (r.status === 'rejected') console.error(`Fetch failed for index ${idx}:`, r.reason);
        });
      } catch (err) { console.error('Base data fetch critical failure:', err); }
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

  const handleEditPr = (pr) => { 
    setIsPreview(false); 
    setEditingPr(pr); 
    setPrModalMode(pr.input_mode === 'ACCOUNTING' ? 'subject' : 'bom'); 
  };
  const handlePreviewPr = (pr) => { 
    setIsPreview(true); 
    setEditingPr(pr); 
    setPrModalMode(pr.input_mode === 'ACCOUNTING' ? 'subject' : 'bom'); 
  };
  const handleDeletePr = async (id) => { if (window.confirm('確定刪除？')) { await axios.delete(`${API_BASE}/pr/${id}`); fetchData(); } };

  const handlePreviewPo = (po) => { setIsPreview(true); setEditingPo(po); setIsPoModalOpen(true); };
  const handleEditPo = (po) => { setIsPreview(false); setEditingPo(po); setIsPoModalOpen(true); };
  const handleOpenVoucher = (po) => { setSelectedPoForVoucher(po); setShowVoucherModal(true); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <ErrorBoundary>
        <div className={`app-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Sidebar 
            user={user} activeTab={activeTab} setActiveTab={setActiveTab} 
            sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}
            openCategories={openCategories} toggleCategory={(cat) => setOpenCategories(p => ({...p, [cat]: !p[cat]}))}
            handleLogout={handleLogout}
            lang={lang}
          />

          <main className="main-content">
            <header className="header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
                <h2>
                  {activeTab === 'dashboard' && (lang === 'EN' ? 'Dashboard' : lang === 'CN' ? '儀表板' : '儀表板 (Dashboard)')}
                  {activeTab === 'pr' && (lang === 'EN' ? 'Purchase Requests' : lang === 'CN' ? '請購管理' : '請購管理 (Purchase Requests)')}
                  {activeTab === 'po' && (lang === 'EN' ? 'Purchase Orders' : lang === 'CN' ? '採購管理' : '採購管理 (Purchase Orders)')}
                  {activeTab === 'approvals' && (lang === 'EN' ? 'Approval Queue' : lang === 'CN' ? '待簽核佇列' : '待簽核 (Approvals)')}
                  {activeTab === 'history' && (lang === 'EN' ? 'Review History' : lang === 'CN' ? '審查歷史' : '審查歷史 (History)')}
                  {activeTab === 'subjects' && (lang === 'EN' ? 'Account Subjects' : lang === 'CN' ? '會計科目' : '會計科目 (Subjects)')}
                  {activeTab === 'materials' && (lang === 'EN' ? 'Material Master' : lang === 'CN' ? '物料清單' : '物料清單 (BOM)')}
                  {activeTab === 'suppliers' && (lang === 'EN' ? 'Supplier Directory' : lang === 'CN' ? '供應商名冊' : '供應商名冊 (Suppliers)')}
                  {activeTab === 'departments' && (lang === 'EN' ? 'Organization Structure' : lang === 'CN' ? '組織架構' : '組織架構 (Hierarchy)')}
                  {activeTab === 'users' && (lang === 'EN' ? 'User Permissions' : lang === 'CN' ? '人員管理' : '人員管理 (Users)')}
                  {activeTab === 'settings' && (lang === 'EN' ? 'Approval Settings' : lang === 'CN' ? '審核設定' : '審核設定 (Settings)')}
                  {activeTab === 'export' && (lang === 'EN' ? 'Data Export' : lang === 'CN' ? '總表匯出' : '總表匯出 (Export)')}
                  {activeTab === 'units' && (lang === 'EN' ? 'Unit Management' : lang === 'CN' ? '單位管理' : '單位管理 (Units)')}
                </h2>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                  <button onClick={() => setLang('CN')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', background: lang === 'CN' ? '#fff' : 'transparent', color: lang === 'CN' ? 'var(--primary)' : '#64748b', boxShadow: lang === 'CN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>繁中</button>
                  <button onClick={() => setLang('EN')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', background: lang === 'EN' ? '#fff' : 'transparent', color: lang === 'EN' ? 'var(--primary)' : '#64748b', boxShadow: lang === 'EN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>EN</button>
                  <button onClick={() => setLang('BOTH')} style={{ padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', background: lang === 'BOTH' ? '#fff' : 'transparent', color: lang === 'BOTH' ? 'var(--primary)' : '#64748b', boxShadow: lang === 'BOTH' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>雙語</button>
                </div>
              </div>
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
                {activeTab === 'suppliers' && (
                  <button className="btn btn-primary" onClick={() => { setEditingSupplier(null); setShowSupplierModal(true); }}>+ 新增供應商 Supplier</button>
                )}
              </div>
            </header>

            {activeTab === 'dashboard' && <Dashboard pos={pos} prs={prs} lang={lang} />}
            {activeTab === 'departments' && <DeptModule departments={departments} onRefresh={fetchData} lang={lang} />}
            {activeTab === 'approvals' && (
              <ApprovalQueue 
                lang={lang}
                items={[
                  ...prs.filter(p => p.status === 'pending' || p.status === 'dept_pending' || p.status === 'gm_pending').map(p => ({ ...p, type: 'PR' })), 
                  ...pos.filter(p => p.status === 'pending').map(p => ({ ...p, type: 'PO' }))
                ]} 
                onApprove={handleApprove} 
                onPreview={(item, type) => type === 'PR' ? handlePreviewPr(item) : handlePreviewPo(item)}
              />
            )}
            {activeTab === 'po' && <POList pos={pos} onEdit={handleEditPo} onDelete={async (id) => { await axios.delete(`${API_BASE}/po/${id}`); fetchData(); }} onPreview={handlePreviewPo} onVoucher={handleOpenVoucher} lang={lang} />}
            {activeTab === 'subjects' && <SubjectModule subjects={subjects} onRefresh={fetchData} onEdit={(s) => { setEditingSubject(s); setShowSubjectModal(true); }} lang={lang} />}
            {activeTab === 'materials' && <MaterialModule materials={materials} onRefresh={fetchData} lang={lang} />}
            {activeTab === 'suppliers' && <SupplierModule suppliers={suppliers} onRefresh={fetchData} onEdit={s => { setEditingSupplier(s); setShowSupplierModal(true); }} lang={lang} />}
            {activeTab === 'users' && <UserModule users={allUsers} onRefresh={fetchData} onEdit={u => { setEditingUser(u); setShowUserModal(true); }} lang={lang} />}
            {activeTab === 'pr' && <PRList prs={prs} onEdit={handleEditPr} onDelete={handleDeletePr} onPreview={handlePreviewPr} lang={lang} />}
            {activeTab === 'history' && <ReviewHistoryModule onPreview={(item, type) => type === 'PR' ? handlePreviewPr(item) : handlePreviewPo(item)} onVoucher={handleOpenVoucher} lang={lang} />}
            {activeTab === 'settings' && <ApprovalSettings lang={lang} />}
            {activeTab === 'export' && <ExportModule pos={pos} lang={lang} />}
            {activeTab === 'units' && <UnitModule units={units} onRefresh={fetchData} lang={lang} />}

            {prModalMode && <PRModal mode={prModalMode} user={user} editData={editingPr} isPreview={isPreview} onClose={() => { setPrModalMode(null); setEditingPr(null); setIsPreview(false); }} suppliers={suppliers} subjects={subjects} materials={materials} units={units} onSuccess={() => { setPrModalMode(null); setEditingPr(null); setIsPreview(false); fetchData(); }} />}
            {isPoModalOpen && <POModal user={user} editData={editingPo} isPreview={isPreview} onClose={() => { setIsPoModalOpen(false); setEditingPo(null); setIsPreview(false); }} suppliers={suppliers} materials={materials} units={units} onSuccess={() => { setIsPoModalOpen(false); setEditingPo(null); setIsPreview(false); fetchData(); }} />}
            {showSupplierModal && <SupplierModal editData={editingSupplier} suppliers={suppliers} onClose={() => setShowSupplierModal(false)} onSuccess={() => { setShowSupplierModal(false); fetchData(); }} />}
            {showUserModal && <UserModal editData={editingUser} onClose={() => setShowUserModal(false)} onSuccess={() => { setShowUserModal(false); fetchData(); }} departments={departments} allUsers={allUsers} />}
            {showSubjectModal && <SubjectModal editData={editingSubject} onClose={() => setShowSubjectModal(false)} onSuccess={() => { setShowSubjectModal(false); fetchData(); }} />}
            {showVoucherModal && <PaymentVoucherModal po={selectedPoForVoucher} onClose={() => { setShowVoucherModal(false); setSelectedPoForVoucher(null); }} />}
          </main>

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
          <datalist id="unit-datalist">
            {units.map(u => (
              <option key={u.id} value={u.name} />
            ))}
            {Array.from(new Set(materials.map(m => m.unit).filter(Boolean)))
              .filter(mu => !units.some(u => u.name === mu))
              .map(u => (
                <option key={`mat-${u}`} value={u} />
              ))
            }
          </datalist>
        </div>
      </ErrorBoundary>
    </LanguageContext.Provider>
  );
}

export default App;
