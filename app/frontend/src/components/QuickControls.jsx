import React, { useState } from 'react';
import {
  Zap, Power, Home, ArrowLeft, Menu, Volume2,
  VolumeX, Volume1, ChevronUp, ChevronDown,
  Camera, Monitor, Trash2, XCircle
} from 'lucide-react';
import { Api } from '../api';

export default function QuickControls({ connected, addLog, addToast }) {
  const [screenshotImg, setScreenshotImg] = useState(null);

  const sendKey = async (key) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.key(key);
      addLog(`Key: ${key} - ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`${key} pressed`, 'success');
    } catch (e) {
      addLog('Key error: ' + e.message, 'error');
    }
  };

  const screenAction = async (action) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.screen(action);
      addLog(`Screen ${action}: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Screen ${action}`, 'success');
    } catch (e) {
      addLog('Screen error: ' + e.message, 'error');
    }
  };

  const clearRecentApps = async () => {
    if (!connected) return;
    try {
      addToast('Clearing recent apps...', 'info');
      const res = await Api.recentApps();
      if (res.success) {
        addLog('Recent apps cleared', 'success');
        addToast('Recent apps cleared', 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Error clearing apps: ' + e.message, 'error');
    }
  };

  const takeScreenshot = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.screenshot();
      if (res.success && res.image) {
        setScreenshotImg(`data:image/png;base64,${res.image}`);
        addLog('Screenshot captured', 'success');
        addToast('Screenshot saved', 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Screenshot error: ' + e.message, 'error');
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <Zap /> Quick Controls
      </h2>

      <div className="card-grid">
        {/* Power Controls */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Power / Screen</div>
            <div className="btn-group">
              <button className="btn btn-success" onClick={() => screenAction('on')}>
                <Power size={16} /> Wake
              </button>
              <button className="btn btn-danger" onClick={() => screenAction('off')}>
                <Power size={16} /> Sleep
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Keys */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Navigation</div>
            <div className="btn-group" style={{ marginBottom: 8 }}>
              <button className="btn" onClick={() => sendKey('home')}>
                <Home size={16} /> Home
              </button>
              <button className="btn" onClick={() => sendKey('back')}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn" onClick={() => sendKey('menu')}>
                <Menu size={16} /> Menu
              </button>
            </div>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={clearRecentApps}>
              <Trash2 size={16} /> Clear Recent Apps
            </button>
          </div>
        </div>

        {/* Volume Controls */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Volume</div>
            <div className="btn-group">
              <button className="btn" onClick={() => sendKey('volume_up')}>
                <Volume2 size={16} /> Up
              </button>
              <button className="btn" onClick={() => sendKey('volume_down')}>
                <Volume1 size={16} /> Down
              </button>
              <button className="btn btn-danger" onClick={() => sendKey('mute')}>
                <VolumeX size={16} /> Mute
              </button>
            </div>
          </div>
        </div>

        {/* Screenshot */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Screenshot</div>
            <button className="btn btn-accent" onClick={takeScreenshot}>
              <Camera size={16} /> Take Screenshot
            </button>
            {screenshotImg && (
              <div style={{ marginTop: 12, position: 'relative', display: 'inline-block', width: '100%' }}>
                <button 
                  onClick={() => setScreenshotImg(null)}
                  style={{
                    position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none',
                    borderRadius: '50%', padding: 4, cursor: 'pointer', color: '#ff1744'
                  }}
                >
                  <XCircle size={20} />
                </button>
                <img
                  src={screenshotImg}
                  alt="Screenshot"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
