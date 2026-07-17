import React, { useState } from 'react';
import { Bell, Trash2, RefreshCw } from 'lucide-react';
import { Api } from '../api';

export default function NotificationsPanel({ connected, addLog, addToast }) {
  const [notifications, setNotifications] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchNotifications = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    setLoading(true);
    try {
      const res = await Api.notifications('list');
      if (res.success) {
        setNotifications(res.data || 'No active notifications.');
        addLog('Notifications retrieved', 'success');
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
      interval = setInterval(fetchNotifications, 5000); // Poll every 5s
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
        setNotifications('');
        addLog('Notifications cleared', 'success');
        addToast('Notifications cleared', 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Clear notifications error: ' + e.message, 'error');
    }
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

          <div className="console" style={{ maxHeight: 250, color: 'var(--text-primary)' }}>
            {notifications ? notifications : <span style={{ color: 'var(--text-muted)' }}>Click "Refresh Notifications" to retrieve device alerts.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
