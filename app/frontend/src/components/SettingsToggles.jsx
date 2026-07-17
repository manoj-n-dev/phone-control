import React, { useState } from 'react';
import { Settings, Wifi, Bluetooth, Plane, Shield, Sun, Volume2, Radio, Zap, Bell, BellOff, Vibrate } from 'lucide-react';
import { Api } from '../api';

const TOGGLES = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
  { id: 'airplane', label: 'Airplane Mode', icon: Plane },
  { id: 'data', label: 'Mobile Data', icon: Radio },
  { id: 'dnd', label: 'Do Not Disturb', icon: Shield },
  { id: 'flashlight', label: 'Flashlight', icon: Zap },
];

export default function SettingsToggles({ connected, addLog, addToast }) {
  const [toggleStates, setToggleStates] = useState({});
  const [brightness, setBrightness] = useState(150);
  const [volumeMusic, setVolumeMusic] = useState(50);
  const [volumeRing, setVolumeRing] = useState(50);

  const handleToggle = async (setting) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    const currentState = toggleStates[setting] || false;
    const newAction = currentState ? 'off' : 'on';
    try {
      const res = await Api.toggle(setting, newAction);
      if (res.success) {
        setToggleStates(prev => ({ ...prev, [setting]: !currentState }));
        addLog(`${setting}: ${newAction}`, 'success');
        addToast(`${setting} turned ${newAction}`, 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Toggle error: ' + e.message, 'error');
    }
  };

  const handleBrightness = async (val) => {
    setBrightness(val);
    if (!connected) return;
    try {
      await Api.brightness(val);
    } catch (e) {}
  };

  const handleVolume = async (stream, val) => {
    if (stream === 'music') setVolumeMusic(val);
    else setVolumeRing(val);
    if (!connected) return;
    try {
      await Api.volume(stream, val);
    } catch (e) {}
  };

  const handleRingerMode = async (mode) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.ringerMode(mode);
      if (res.success) {
        addLog(`Ringer mode: ${mode}`, 'success');
        addToast(`Ringer mode set to ${mode}`, 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Ringer mode error: ' + e.message, 'error');
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <Settings /> Settings & Toggles
      </h2>

      <div className="card-grid-2">
        <div className="card">
          <div className="card-body">
            {TOGGLES.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.id} className="toggle-row">
                  <div className="toggle-label">
                    <Icon />
                    <span>{t.label}</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={toggleStates[t.id] || false}
                      onChange={() => handleToggle(t.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="slider-row">
              <label><Sun size={16} /> Brightness</label>
              <input
                type="range"
                min="0" max="255"
                value={brightness}
                onChange={(e) => handleBrightness(Number(e.target.value))}
              />
              <span className="slider-value">{Math.round((brightness/255)*100)}%</span>
            </div>

            <div className="slider-row">
              <label><Volume2 size={16} /> Media Vol</label>
              <input
                type="range"
                min="0" max="100"
                value={volumeMusic}
                onChange={(e) => handleVolume('music', Number(e.target.value))}
              />
              <span className="slider-value">{volumeMusic}%</span>
            </div>

            <div className="slider-row" style={{ marginBottom: 24 }}>
              <label><Volume2 size={16} /> Ring Vol</label>
              <input
                type="range"
                min="0" max="100"
                value={volumeRing}
                onChange={(e) => handleVolume('ring', Number(e.target.value))}
              />
              <span className="slider-value">{volumeRing}%</span>
            </div>
            
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Ringer Mode</div>
            <div className="btn-group">
              <button className="btn" onClick={() => handleRingerMode('silent')}>
                <BellOff size={16} /> Silent
              </button>
              <button className="btn" onClick={() => handleRingerMode('vibrate')}>
                <Vibrate size={16} /> Vibrate
              </button>
              <button className="btn" onClick={() => handleRingerMode('normal')}>
                <Bell size={16} /> Ring
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
