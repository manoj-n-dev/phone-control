import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, RefreshCw, Power, Lock, Plug, Unplug } from 'lucide-react';
import { Api } from '../api';

export default function PhoneMirror({ connected, setConnected, deviceInfo, setDeviceInfo, addLog, addToast, onUnlockRequest }) {
  const [mirrorImage, setMirrorImage] = useState(null);
  const [mirrorActive, setMirrorActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef(null);
  const mirrorActiveRef = useRef(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await Api.connect();
      if (res.success) {
        setConnected(true);
        setDeviceInfo(res.data);
        addLog(`Connected to ${res.data.model} (${res.data.manufacturer})`, 'success');
        addToast(`Connected to ${res.data.model}`, 'success');
      } else {
        addLog(res.message, 'error');
        addToast(res.message, 'error');
      }
    } catch (e) {
      addLog('Connection failed: ' + e.message, 'error');
      addToast('Connection failed', 'error');
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setDeviceInfo(null);
    setMirrorImage(null);
    setMirrorActive(false);
    mirrorActiveRef.current = false;
    addLog('Disconnected from device', 'info');
    addToast('Device disconnected', 'info');
  };

  const fetchMirrorLoop = useCallback(async () => {
    if (!connected || !mirrorActiveRef.current) return;
    try {
      const res = await Api.mirror();
      if (res.success && res.image) {
        setMirrorImage(`data:image/png;base64,${res.image}`);
      }
    } catch (e) {
      // Silently fail on mirror refresh
    }
    // Schedule next frame as fast as possible
    if (mirrorActiveRef.current) {
      setTimeout(fetchMirrorLoop, 100);
    }
  }, [connected]);

  const toggleMirror = () => {
    if (mirrorActive) {
      setMirrorActive(false);
      mirrorActiveRef.current = false;
      addLog('Screen mirror paused', 'info');
    } else {
      setMirrorActive(true);
      mirrorActiveRef.current = true;
      fetchMirrorLoop();
      addLog('Fast screen mirror started', 'info');
    }
  };

  useEffect(() => {
    return () => {
      mirrorActiveRef.current = false;
    };
  }, []);

  const handleKeyDown = async (e) => {
    if (!connected) return;
    const key = e.key;
    // Don't prevent default for tab, etc unless we want to trap focus
    try {
      await fetch('/api/keyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, text: key.length === 1 ? key : '' })
      });
    } catch(err) {
      // ignore
    }
  };

  const handleImageClick = async (e) => {
    if (!connected || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const imgWidth = imgRef.current.naturalWidth;
    const imgHeight = imgRef.current.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Translate to device coordinates
    const deviceX = Math.round((clickX / displayWidth) * imgWidth);
    const deviceY = Math.round((clickY / displayHeight) * imgHeight);

    try {
      await Api.tap(deviceX, deviceY);
      addLog(`Tapped at (${deviceX}, ${deviceY})`, 'info');
      // If mirror is paused, fetch one frame to see result
      if (!mirrorActiveRef.current) {
        const res = await Api.mirror();
        if (res.success && res.image) setMirrorImage(`data:image/png;base64,${res.image}`);
      }
    } catch (e) {
      addLog('Tap failed: ' + e.message, 'error');
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <Monitor /> Phone Display
      </h2>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Phone Frame */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            className="phone-frame" 
            onClick={handleImageClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            style={{ outline: 'none' }}
          >
            {mirrorImage ? (
              <img ref={imgRef} src={mirrorImage} alt="Phone Screen" draggable={false} />
            ) : (
              <div className="no-display">
                {connected ? 'Click "Start Mirror" to view phone screen' : 'Connect a device to begin'}
              </div>
            )}
          </div>
          <div className="mirror-controls">
            {!connected ? (
              <button className="btn btn-accent btn-lg" onClick={handleConnect} disabled={loading}>
                {loading ? <span className="spinner" /> : <Plug size={18} />}
                {loading ? 'Connecting...' : 'Connect Device'}
              </button>
            ) : (
              <>
                <button className="btn btn-accent" onClick={toggleMirror}>
                  <RefreshCw size={16} />
                  {mirrorActive ? 'Stop Mirror' : 'Start Mirror'}
                </button>
                <button className="btn" onClick={onUnlockRequest}>
                  <Lock size={16} /> Unlock
                </button>
                <button className="btn btn-danger" onClick={handleDisconnect}>
                  <Unplug size={16} /> Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Device Info Card */}
        {connected && deviceInfo && (
          <div className="card" style={{ flex: 1, minWidth: 280 }}>
            <div className="card-body">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--accent)' }}>
                Device Information
              </h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Model', deviceInfo.model],
                  ['Manufacturer', deviceInfo.manufacturer],
                  ['Android', deviceInfo.android_version],
                  ['Serial', deviceInfo.serial],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
