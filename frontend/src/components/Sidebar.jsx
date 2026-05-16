import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  ShoppingBag, 
  FileSpreadsheet, 
  LogOut,
  User as UserIcon,
  Users,
  Settings,
  Menu,
  ChevronDown,
  ChevronRight,
  Database,
  ShieldCheck,
  Package,
  GitMerge,
  FileClock,
  Scale
} from 'lucide-react';

export default function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  openCategories, 
  toggleCategory, 
  handleLogout,
  lang
}) {
  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {!sidebarCollapsed && <h1 style={{ margin: 0, fontSize: '1.2rem' }}>KST <span style={{ color: 'var(--secondary)', fontWeight: '900' }}>PR/PO</span></h1>}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }}
        >
          <Menu size={20} />
        </button>
      </div>

      {!sidebarCollapsed && (
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary), #6366f1)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
              <UserIcon size={20} color="#fff" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.dept_name || user.role}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', flex: 1 }}>
        {user.allowed_modules?.includes('dashboard') && (
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && (
              <span>
                {lang === 'CN' ? '儀表板' : lang === 'EN' ? 'Dashboard' : '儀表板 (Dashboard)'}
              </span>
            )}
          </div>
        )}

        {/* Requisition Group */}
        <div style={{ marginTop: '0.75rem' }}>
          {!sidebarCollapsed && (
            <div className="sidebar-group-label" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleCategory('requisition')}>
              {lang === 'CN' ? '單據管理' : lang === 'EN' ? 'REQUISITION' : '單據管理 (REQUISITION)'} 
              {openCategories.requisition ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          )}
          {(openCategories.requisition || sidebarCollapsed) && (
            <>
              {user.allowed_modules?.includes('pr') && (
                <div className={`nav-item ${activeTab === 'pr' ? 'active' : ''}`} onClick={() => setActiveTab('pr')}>
                  <FileText size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '請購管理' : lang === 'EN' ? 'PR' : '請購管理 (PR)'}</span>}
                </div>
              )}
              {user.allowed_modules?.includes('approvals') && (
                <div className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
                  <CheckSquare size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '待簽核' : lang === 'EN' ? 'Approvals' : '待簽核 (Approvals)'}</span>}
                </div>
              )}
              {user.allowed_modules?.includes('po') && (
                <div className={`nav-item ${activeTab === 'po' ? 'active' : ''}`} onClick={() => setActiveTab('po')}>
                  <ShoppingBag size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '採購訂單' : lang === 'EN' ? 'PO' : '採購訂單 (PO)'}</span>}
                </div>
              )}
              {user.allowed_modules?.includes('history') && (
                <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                  <FileClock size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '審查歷史' : lang === 'EN' ? 'History' : '審查歷史 (History)'}</span>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Database Group */}
        <div style={{ marginTop: '0.75rem' }}>
          {!sidebarCollapsed && (
            <div className="sidebar-group-label" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleCategory('database')}>
              {lang === 'CN' ? '資料庫' : lang === 'EN' ? 'DATABASE' : '資料庫 (DATABASE)'}
              {openCategories.database ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          )}
          {(openCategories.database || sidebarCollapsed) && (
            <>
              {(user.role === 'admin' || user.allowed_modules?.includes('subjects')) && (
                <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
                  <Database size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '會計科目' : lang === 'EN' ? 'Subjects' : '會計科目 (Subjects)'}</span>}
                </div>
              )}
              {(user.role === 'admin' || user.allowed_modules?.includes('materials')) && (
                <div className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
                  <Package size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '物料清單' : lang === 'EN' ? 'BOM' : '物料清單 (BOM)'}</span>}
                </div>
              )}
              {(user.role === 'admin' || user.allowed_modules?.includes('departments')) && (
                <div className={`nav-item ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>
                  <GitMerge size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '組織架構' : lang === 'EN' ? 'Hierarchy' : '組織架構 (Hierarchy)'}</span>}
                </div>
              )}
              {(user.role === 'admin' || user.allowed_modules?.includes('suppliers')) && (
                <div className={`nav-item ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
                  <Users size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '供應商名冊' : lang === 'EN' ? 'Suppliers' : '供應商名冊 (Suppliers)'}</span>}
                </div>
              )}
              {(user.role === 'admin' || user.allowed_modules?.includes('units')) && (
                <div className={`nav-item ${activeTab === 'units' ? 'active' : ''}`} onClick={() => setActiveTab('units')}>
                  <Scale size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '單位管理' : lang === 'EN' ? 'Units' : '單位管理 (Units)'}</span>}
                </div>
              )}
            </>
          )}
        </div>

        {/* System Group */}
        <div style={{ marginTop: '0.75rem' }}>
          {!sidebarCollapsed && (
            <div className="sidebar-group-label" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleCategory('system')}>
              {lang === 'CN' ? '系統設定' : lang === 'EN' ? 'SYSTEM' : '系統設定 (SYSTEM)'}
              {openCategories.system ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          )}
          {(openCategories.system || sidebarCollapsed) && (
            <>
              {user.allowed_modules?.includes('users') && (
                <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                  <ShieldCheck size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '人員管理' : lang === 'EN' ? 'Users' : '人員管理 (Users)'}</span>}
                </div>
              )}
              {user.allowed_modules?.includes('settings') && (
                <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                  <Settings size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '審核設定' : lang === 'EN' ? 'Settings' : '審核設定 (Settings)'}</span>}
                </div>
              )}
              {user.allowed_modules?.includes('export') && (
                <div className={`nav-item ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>
                  <FileSpreadsheet size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '總表匯出' : lang === 'EN' ? 'Export' : '總表匯出 (Export)'}</span>}
                </div>
              )}
            </>
          )}
        </div>

        <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#ff8080' }}>
          <LogOut size={20} /> {!sidebarCollapsed && <span>{lang === 'CN' ? '登出系統' : lang === 'EN' ? 'Logout' : '登出系統 (Logout)'}</span>}
        </div>
      </div>
    </div>
  );
}
