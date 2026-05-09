import React, { useState } from 'react';
import { User as UserIcon, Lock, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="login-page">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="login-video-bg"
      >
        <source src="/homepge-pc.mp4" type="video/mp4" />
      </video>

      <div className="login-hero-container">
        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(0,32,91,0.05)', borderRadius: '20px', marginBottom: '1.5rem' }}>
              <ShieldCheck size={40} color="var(--primary)" />
            </div>
            <h2 style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.75rem', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
              採購管理系統
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Procurement Management
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserIcon size={14} /> 帳號 Username
              </label>
              <input 
                className="form-control" 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="帳號"
                required 
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} /> 密碼 Password
              </label>
              <input 
                className="form-control" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="密碼"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1.125rem', fontSize: '1rem' }}>
              進入系統 LOGIN
            </button>
          </form>
          
          <div style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
            © 2026 KST Terminals (India) <br/> All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
