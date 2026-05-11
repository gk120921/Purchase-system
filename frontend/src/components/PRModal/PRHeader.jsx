import React from 'react';

export default function PRHeader({ formData, dateStr }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Times New Roman, serif', color: '#1e3a8a', letterSpacing: '1px' }}>KST TERMINALS (INDIA) MANUFACTURING PRIVATE LIMITE</div>
        <div style={{ margin: '0.25rem 0 0', fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'Microsoft JhengHei, sans-serif' }}>請購單</div>
        <div style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Times New Roman, serif', color: '#64748b' }}>Purchase Requisition</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1rem', fontFamily: 'Microsoft JhengHei, sans-serif' }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <div style={{ fontWeight: '900', color: '#64748b', fontSize: '0.8rem' }}>日期 DATE</div>
          <div style={{ fontSize: '1rem', marginTop: '0.25rem' }}>{dateStr}</div>
        </div>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <div style={{ fontWeight: '900', color: '#64748b', fontSize: '0.8rem' }}>單位 UNIT</div>
          <div style={{ fontSize: '1rem', marginTop: '0.25rem' }}>{formData.department}</div>
        </div>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <div style={{ fontWeight: '900', color: '#64748b', fontSize: '0.8rem' }}>單號 ORDER NO.</div>
          <div style={{ fontSize: '1rem', marginTop: '0.25rem', fontWeight: 'bold', color: '#1e3a8a' }}>{formData.pr_number}</div>
        </div>
      </div>
    </>
  );
}
