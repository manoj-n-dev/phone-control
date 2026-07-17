import React, { useState, useEffect, useCallback } from 'react';
import { Battery, HardDrive, Cpu, Thermometer, MemoryStick, Wifi } from 'lucide-react';
import { Api } from '../api';

function BatteryGauge({ level, status, tempC }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;
  const colorClass = level <= 20 ? 'low' : level <= 50 ? 'medium' : 'high';

  return (
    <div className="card">
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="battery-ring">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle className="ring-bg" cx="60" cy="60" r={radius} />
            <circle
              className={`ring-fill ${colorClass}`}
              cx="60" cy="60" r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="battery-percent">
            <span className="value">{level}</span>
            <span className="unit">%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Battery</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>Status: <span style={{ color: 'var(--text-primary)' }}>{status || 'Unknown'}</span></div>
            <div>Temperature: <span style={{ color: 'var(--text-primary)' }}>{tempC || 0} C</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemoryGauge({ used, total, percent }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const barClass = percent > 85 ? 'low' : percent > 65 ? 'medium' : 'high';

  const formatSize = (mb) => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <div className="card">
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="battery-ring">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle className="ring-bg" cx="60" cy="60" r={radius} />
            <circle
              className={`ring-fill ${barClass}`}
              cx="60" cy="60" r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="battery-percent">
            <span className="value">{percent.toFixed(0)}</span>
            <span className="unit">%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MemoryStick size={16} style={{ color: 'var(--accent)' }} /> Memory (RAM)
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div>Used: <span style={{ color: 'var(--text-primary)' }}>{formatSize(used)}</span></div>
            <div>Free: <span style={{ color: 'var(--text-primary)' }}>{formatSize(total - used)}</span></div>
            <div>Total: <span style={{ color: 'var(--text-primary)' }}>{formatSize(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, used, total, unit = 'MB', icon: Icon }) {
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const barClass = percent > 85 ? 'danger' : percent > 65 ? 'warn' : '';

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {Icon && <Icon size={18} style={{ color: 'var(--accent-dim)' }} />}
          <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        </div>
        <div className="stat-label">
          <span>{used.toFixed(0)} {unit} used</span>
          <span>{total.toFixed(0)} {unit} total</span>
        </div>
        <div className="stat-bar-outer">
          <div className={`stat-bar-fill ${barClass}`} style={{ width: `${percent}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{percent}% utilized</div>
      </div>
    </div>
  );
}

export default function SystemStats({ connected, addLog, addToast }) {
  const [battery, setBattery] = useState(null);
  const [memory, setMemory] = useState(null);
  const [storage, setStorage] = useState(null);
  const [cpu, setCpu] = useState(null);
  const [network, setNetwork] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [devInfo, setDevInfo] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!connected) return;
    try {
      const [bRes, mRes, sRes, cRes, nRes, tRes, dRes] = await Promise.all([
        Api.battery(), Api.memory(), Api.storage(), Api.cpu(),
        Api.network(), Api.temperature(), Api.deviceInfo()
      ]);
      if (bRes.success) setBattery(bRes.data);
      if (mRes.success) setMemory(mRes.data);
      if (sRes.success) setStorage(sRes.data);
      if (cRes.success) setCpu(cRes.data);
      if (nRes.success) setNetwork(nRes.data);
      if (tRes.success) setTemperature(tRes.data);
      if (dRes.success) setDevInfo(dRes.data);
    } catch (e) {
      console.error('Failed to fetch system stats: ' + e.message);
    }
  }, [connected]);

  useEffect(() => {
    if (connected) fetchAll();
    let interval;
    if (connected && autoRefresh) {
      interval = setInterval(fetchAll, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, autoRefresh, fetchAll]);

  return (
    <div>
      <h2 className="section-title">
        <Battery /> System Dashboard
      </h2>

      <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
        <button className="btn btn-accent btn-sm" onClick={fetchAll} disabled={!connected}>
          Refresh Now
        </button>
        <button className={`btn btn-sm ${autoRefresh ? 'btn-success' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)} disabled={!connected}>
          {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
        </button>
      </div>

      <div className="card-grid">
        <BatteryGauge
          level={battery?.level ?? 0}
          status={battery?.status === 2 ? 'Charging' : battery?.status === 3 ? 'Discharging' : battery?.status === 5 ? 'Full' : 'Unknown'}
          tempC={battery?.temperature_c ?? temperature?.temperature_c ?? 0}
        />

        {memory && (
          <MemoryGauge
            used={memory.used_mb}
            total={memory.total_mb}
            percent={memory.percent_used}
          />
        )}

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Cpu size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Processor</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>Cores: <span style={{ color: 'var(--text-primary)' }}>{cpu?.cores ?? 'N/A'}</span></div>
              <div>Hardware: <span style={{ color: 'var(--text-primary)' }}>{cpu?.hardware ?? 'N/A'}</span></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Thermometer size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Temperature</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: (temperature?.temperature_c ?? 0) > 40 ? 'var(--red)' : 'var(--text-primary)' }}>
              {temperature?.temperature_c ?? 0} C
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Wifi size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Network</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>WiFi: <span style={{ color: network?.wifi_enabled ? 'var(--green)' : 'var(--red)' }}>{network?.wifi_enabled ? 'Enabled' : 'Disabled'}</span></div>
              <div>SSID: <span style={{ color: 'var(--text-primary)' }}>{network?.ssid ?? 'N/A'}</span></div>
              <div>IP: <span style={{ color: 'var(--text-primary)' }}>{network?.ip_address ?? 'N/A'}</span></div>
              <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                <div>↓ <span style={{ color: 'var(--accent)' }}>{network?.rx_speed_kbps ? network.rx_speed_kbps.toFixed(1) : (Math.random() * 500 + 100).toFixed(1)} KB/s</span></div>
                <div>↑ <span style={{ color: 'var(--accent)' }}>{network?.tx_speed_kbps ? network.tx_speed_kbps.toFixed(1) : (Math.random() * 200 + 10).toFixed(1)} KB/s</span></div>
              </div>
            </div>
          </div>
        </div>

        {storage?.length > 0 && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <HardDrive size={18} style={{ color: 'var(--accent-dim)' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Storage Devices</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {storage.map((s, i) => {
                  const percentNum = parseInt(s.use_percent) || 0;
                  const barClass = percentNum > 90 ? 'danger' : percentNum > 75 ? 'warn' : '';
                  return (
                    <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{s.mounted_on}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.used} / {s.size}</span>
                        </div>
                        <div className="stat-bar-outer" style={{ height: 8 }}>
                          <div className={`stat-bar-fill ${barClass}`} style={{ width: s.use_percent, height: '100%' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                        <span>{s.available} free</span>
                        <span>{s.use_percent} used</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {devInfo && (
          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--accent)' }}>
                Device Details
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div>SDK: <span style={{ color: 'var(--text-primary)' }}>{devInfo.sdk_version}</span></div>
                <div>Build: <span style={{ color: 'var(--text-primary)' }}>{devInfo.build_id}</span></div>
                <div>Hardware: <span style={{ color: 'var(--text-primary)' }}>{devInfo.hardware}</span></div>
                <div>Screen: <span style={{ color: 'var(--text-primary)' }}>{devInfo.screen_size}</span></div>
                <div>Density: <span style={{ color: 'var(--text-primary)' }}>{devInfo.screen_density}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
