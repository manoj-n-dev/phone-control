import React, { useState } from 'react';
import { Grid3X3, Search, ExternalLink, X, Package, MessageCircle, Camera as CameraIcon, Mail, Map as MapIcon, Music, Twitter, Facebook, Video, Phone, MessageSquare, FileText, Calculator, Clock, Image as ImageIcon, PlayCircle, Lock } from 'lucide-react';
import { Api } from '../api';

const COMMON_APPS = [
  { name: 'WhatsApp', pkg: 'whatsapp', icon: MessageCircle },
  { name: 'Instagram', pkg: 'instagram', icon: CameraIcon },
  { name: 'YouTube', pkg: 'youtube', icon: Video },
  { name: 'Chrome', pkg: 'chrome', icon: Globe },
  { name: 'Camera', pkg: 'camera', icon: CameraIcon },
  { name: 'Settings', pkg: 'settings', icon: Settings },
  { name: 'Gmail', pkg: 'gmail', icon: Mail },
  { name: 'Maps', pkg: 'maps', icon: MapIcon },
  { name: 'Spotify', pkg: 'spotify', icon: Music },
  { name: 'Twitter', pkg: 'twitter', icon: Twitter },
  { name: 'Facebook', pkg: 'facebook', icon: Facebook },
  { name: 'Telegram', pkg: 'telegram', icon: MessageSquare },
  { name: 'Netflix', pkg: 'netflix', icon: Video },
  { name: 'Phone', pkg: 'phone', icon: Phone },
  { name: 'Messages', pkg: 'messages', icon: MessageSquare },
  { name: 'Files', pkg: 'files', icon: FileText },
  { name: 'Calculator', pkg: 'calculator', icon: Calculator },
  { name: 'Clock', pkg: 'clock', icon: Clock },
  { name: 'Gallery', pkg: 'gallery', icon: ImageIcon },
  { name: 'Play Store', pkg: 'play store', icon: PlayCircle },
];

function Globe(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>; }
function Settings(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>; }

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
};

export default function AppLauncher({ connected, addLog, addToast }) {
  const [search, setSearch] = useState('');
  const [installedApps, setInstalledApps] = useState([]);
  const [showInstalled, setShowInstalled] = useState(false);
  const [customApp, setCustomApp] = useState('');

  const [lockAppPkg, setLockAppPkg] = useState(null);
  const [appPassword, setAppPassword] = useState('');

  const fetchApps = async () => {
    if (!connected) return;
    try {
      const res = await Api.apps();
      if (res.success) {
        setInstalledApps(res.data);
        setShowInstalled(true);
        addLog(`Found ${res.count} installed apps`, 'success');
      }
    } catch (e) {
      addLog('Failed to fetch apps: ' + e.message, 'error');
    }
  };

  const handleLaunchRequest = (pkg) => {
    // Prompt for password
    setLockAppPkg(pkg);
    setAppPassword('');
  };

  const confirmLaunch = async () => {
    if (!connected || !lockAppPkg) return;
    const pkg = lockAppPkg;
    const pwd = appPassword;
    setLockAppPkg(null);

    // If password provided, we could type it, but for now we just launch the app
    // and if there's an app-lock, the user would type the password via keyboard endpoint
    // Or we type it automatically after launch if needed.
    
    try {
      const res = await Api.launchApp(pkg);
      addLog(`Launch ${pkg}: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) {
        addToast(`Launched ${pkg}`, 'success');
        if (pwd) {
          // Attempt to type password automatically if provided
          setTimeout(() => {
            Api.typeText(pwd);
          }, 2000); // wait 2s for app lock to appear
        }
      }
    } catch (e) {
      addLog('Launch error: ' + e.message, 'error');
    }
  };

  const closeApp = async (appName) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.closeApp(appName);
      addLog(`Close ${appName}: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Closed ${appName}`, 'success');
    } catch (e) {
      addLog('Close error: ' + e.message, 'error');
    }
  };

  const filteredCommon = COMMON_APPS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInstalled = installedApps.filter(a =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="section-title">
        <Grid3X3 /> App Launcher
      </h2>

      {lockAppPkg && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setLockAppPkg(null)}>
          <div className="passcode-box" style={{ maxWidth: 320 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <Lock size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="passcode-title">App Lock</div>
            <div className="passcode-subtitle" style={{ marginBottom: 16 }}>
              Enter password if this app is locked (Optional)
            </div>
            <input
              className="input"
              type="password"
              placeholder="App password..."
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmLaunch()}
              style={{ textAlign: 'center' }}
            />
            <button className="btn btn-accent" style={{ width: '100%', marginTop: 16 }} onClick={confirmLaunch}>
              {appPassword ? 'Unlock & Launch' : 'Launch App'}
            </button>
            <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setLockAppPkg(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {/* Search */}
          <div className="input-row" style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn" onClick={fetchApps} disabled={!connected}>
              <Package size={16} /> Load Installed Apps
            </button>
          </div>

          {/* Custom app launch */}
          <div className="input-row" style={{ marginBottom: 16 }}>
            <input
              className="input"
              placeholder="Custom app name or package..."
              value={customApp}
              onChange={(e) => setCustomApp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customApp && handleLaunchRequest(customApp)}
            />
            <button className="btn btn-accent" onClick={() => customApp && handleLaunchRequest(customApp)}>
              <ExternalLink size={16} /> Launch
            </button>
            <button className="btn btn-danger" onClick={() => customApp && closeApp(customApp)}>
              <X size={16} /> Close
            </button>
          </div>

          {/* Quick app grid */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Quick Launch</div>
          <div className="app-grid">
            {filteredCommon.map(app => {
              const Icon = app.icon || Package;
              return (
                <div key={app.pkg} className="app-tile" onClick={() => handleLaunchRequest(app.pkg)}>
                  <Icon size={24} style={{ color: stringToColor(app.pkg) }} />
                  <span>{app.name}</span>
                </div>
              );
            })}
          </div>

          {/* Installed apps list */}
          {showInstalled && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                Installed Apps ({filteredInstalled.length})
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }} className="custom-scroll">
                {filteredInstalled.map(pkg => (
                  <div
                    key={pkg}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 12px', borderBottom: '1px solid var(--border)', fontSize: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={16} style={{ color: stringToColor(pkg) }} />
                      </div>
                      <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all', fontSize: 13, fontWeight: 500 }}>{pkg}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-accent" onClick={() => handleLaunchRequest(pkg)}>Open</button>
                      <button className="btn btn-sm btn-danger" onClick={() => closeApp(pkg)}>Close</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
