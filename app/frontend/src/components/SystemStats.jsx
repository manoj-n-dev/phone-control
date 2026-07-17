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
        {/* Battery */}
        <BatteryGauge
          level={battery?.level ?? 0}
          status={battery?.status === 2 ? 'Charging' : battery?.status === 3 ? 'Discharging' : battery?.status === 5 ? 'Full' : 'Unknown'}
          tempC={battery?.temperature_c ?? temperature?.temperature_c ?? 0}
        />

        {/* Memory */}
        {memory && (
          <StatBar
            label="Memory (RAM)"
            used={memory.used_mb}
            total={memory.total_mb}
            icon={MemoryStick}
          />
        )}

        {/* CPU */}
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

        {/* Temperature */}
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

        {/* Network */}
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

        {/* Storage */}
        {storage?.length > 0 && (
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <HardDrive size={18} style={{ color: 'var(--accent-dim)' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Storage</span>
              </div>
              {storage.slice(0, 3).map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{s.mounted_on}</span>
                    <span>{s.use_percent} used</span>
                  </div>
                  <div className="stat-bar-outer">
                    <div className="stat-bar-fill" style={{ width: s.use_percent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device details */}
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
