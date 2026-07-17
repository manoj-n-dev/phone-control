import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { Api } from '../api';

export default function PasscodeModal({ onClose, addLog, addToast }) {
  const [activeTab, setActiveTab] = useState('pin');
  const [value, setValue] = useState('');
  
  const handleKey = (key) => {
    if (key === 'del') {
      setValue(prev => prev.slice(0, -1));
    } else if (key === 'submit') {
      handleSubmit();
    } else if (value.length < (activeTab === 'pin' ? 6 : 20)) {
      setValue(prev => prev + key);
    }
  };

  const handleSubmit = async () => {
    if (!value) return;
    try {
      const res = await Api.unlock(activeTab, value);
      if (res.success) {
        addLog('Unlock command sent', 'success');
        addToast('Unlock sequence sent', 'success');
        onClose();
      } else {
        addLog(res.message, 'error');
        addToast('Unlock failed', 'error');
      }
    } catch (e) {
      addLog('Unlock error: ' + e.message, 'error');
      addToast('Unlock error', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="passcode-box" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Lock size={24} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="passcode-title">Unlock Device</div>
        
        <div style={{ display: 'flex', gap: 10, margin: '16px 0', borderBottom: '1px solid var(--border)' }}>
          {['pin', 'pattern', 'password'].map(tab => (
            <button 
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', padding: '8px', border: 'none', background: activeTab === tab ? 'var(--accent-glow)' : 'transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)' }}
              onClick={() => { setActiveTab(tab); setValue(''); }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'pin' && (
          <>
            <div className="passcode-subtitle">Enter 4 or 6 digit PIN</div>
            <div className="passcode-dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`passcode-dot ${i < value.length ? 'filled' : ''}`} />
              ))}
            </div>
            <div className="keypad">
              {['1','2','3','4','5','6','7','8','9'].map(k => (
                <button key={k} className="keypad-btn" onClick={() => handleKey(k)}>{k}</button>
              ))}
              <button className="keypad-btn action" onClick={() => handleKey('del')}><Delete size={18} /></button>
              <button className="keypad-btn" onClick={() => handleKey('0')}>0</button>
              <button className="keypad-btn submit" onClick={() => handleKey('submit')}>OK</button>
            </div>
          </>
        )}

        {activeTab === 'pattern' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="passcode-subtitle">Pattern bypass via ADB is experimental.</div>
            <input
              className="input"
              type="password"
              placeholder="Enter numerical dot sequence (1-9)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{ textAlign: 'center', marginTop: 16 }}
            />
            <button className="btn btn-accent" style={{ width: '100%', marginTop: 16 }} onClick={handleSubmit}>Send Pattern</button>
          </div>
        )}

        {activeTab === 'password' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="passcode-subtitle">Enter alphanumeric password</div>
            <input
              className="input"
              type="password"
              placeholder="Password..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{ textAlign: 'center', marginTop: 16 }}
            />
            <button className="btn btn-accent" style={{ width: '100%', marginTop: 16 }} onClick={handleSubmit}>Unlock</button>
          </div>
        )}

        <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
