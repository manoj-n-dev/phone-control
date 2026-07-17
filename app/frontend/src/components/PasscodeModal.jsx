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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
            <div className="passcode-subtitle" style={{ marginBottom: 12 }}>Draw Pattern (Click dots in sequence)</div>
            
            <div style={{ position: 'relative', width: 240, height: 240, background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20 }}>
              <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                {(() => {
                  const points = [];
                  const path = value ? (Array.isArray(value) ? value : value.split(',').filter(Boolean).map(Number)) : [];
                  path.forEach(dotId => {
                    const idx = dotId - 1;
                    const row = Math.floor(idx / 3);
                    const col = idx % 3;
                    const x = 30 + col * 70;
                    const y = 30 + row * 70;
                    points.push(`${x},${y}`);
                  });
                  if (points.length > 0) {
                    return (
                      <polyline
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points.join(' ')}
                        style={{ filter: 'drop-shadow(0 0 4px var(--accent))' }}
                      />
                    );
                  }
                  return null;
                })()}

                {Array.from({ length: 9 }).map((_, i) => {
                  const dotId = i + 1;
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const cx = 30 + col * 70;
                  const cy = 30 + row * 70;
                  const path = value ? (Array.isArray(value) ? value : value.split(',').filter(Boolean).map(Number)) : [];
                  const isSelected = path.includes(dotId);

                  return (
                    <g key={dotId} style={{ cursor: 'pointer' }} onClick={() => {
                      if (path[path.length - 1] === dotId) return;
                      const newPath = [...path, dotId];
                      setValue(newPath.join(','));
                    }}>
                      <circle cx={cx} cy={cy} r="25" fill="transparent" />
                      <circle
                        cx={cx}
                        cy={cy}
                        r="12"
                        fill={isSelected ? 'var(--accent-glow)' : 'transparent'}
                        stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth="2"
                        style={{ transition: 'all 0.2s var(--ease)' }}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r="5"
                        fill={isSelected ? 'var(--accent)' : 'var(--text-muted)'}
                        style={{ transition: 'all 0.2s var(--ease)' }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
              Sequence: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{value ? value.replace(/,/g, ' ➔ ') : 'None'}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 16 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setValue('')}>Reset</button>
              <button className="btn btn-accent" style={{ flex: 1 }} onClick={handleSubmit} disabled={!value}>Unlock</button>
            </div>
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
