import React, { useState } from 'react';
import { Bell, Trash2, RefreshCw, Smartphone, X } from 'lucide-react';
import { Api } from '../api';

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPanel({ connected, addLog, addToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchNotifications = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    setLoading(true);
    try {
      const res = await Api.notifications('list');
      if (res.success) {
        setNotifications(Array.isArray(res.data) ? res.data : []);
        addLog(`Retrieved ${Array.isArray(res.data) ? res.data.length : 0} notifications`, 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      console.error('Notifications error: ' + e.message);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    let interval;
    if (connected && autoRefresh) {
      fetchNotifications();
      interval = setInterval(fetchNotifications, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, autoRefresh]);

  const clearNotifications = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    if (!confirm('Clear all notifications on device?')) return;
    try {
      const res = await Api.notifications('clear');
      if (res.success) {
        setNotifications([]);
        addLog('Notifications cleared', 'success');
        addToast('Notifications cleared', 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Clear notifications error: ' + e.message, 'error');
    }
  };

  const dismissNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h2 className="section-title">
        <Bell /> Notifications
      </h2>

      <div className="card">
        <div className="card-body">
          <div className="btn-group" style={{ marginBottom: 16 }}>
            <button className="btn btn-accent" onClick={fetchNotifications} disabled={loading || !connected}>
              {loading ? <span className="spinner" /> : <RefreshCw size={16} />}
              Refresh Now
            </button>
            <button className={`btn ${autoRefresh ? 'btn-success' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)} disabled={!connected}>
              {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
            </button>
            <button className="btn btn-danger" onClick={clearNotifications} disabled={!connected}>
              <Trash2 size={16} /> Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }} className="custom-scroll">
            {notifications.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, color: 'var(--text-muted)', gap: 12 }}>
                <Bell size={32} style={{ opacity: 0.3 }} />
                <span>No notifications. Click "Refresh Now" to fetch device alerts.</span>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const accentColor = stringToColor(n.package || '');
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                      transition: 'all 0.15s var(--ease)',
                    }}
                    className="notification-card"
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `linear-gradient(135deg, ${accentColor}, rgba(0,0,0,0.6))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 'bold', color: '#fff',
                    }}>
                      {(n.app || '?').charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {n.app}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {timeAgo(n.time)}
                        </span>
                      </div>
                      {n.title && (
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.title}
                        </div>
                      )}
                      {n.text && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {n.text}
                        </div>
                      )}
                      {n.subtext && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {n.subtext}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => dismissNotification(idx)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 2, borderRadius: 4,
                        opacity: 0.5, transition: 'opacity 0.15s',
                      }}
                      title="Dismiss"
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.5}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
