import React from 'react';
import {
  Monitor, Battery, Zap, Grid3X3, Phone, Music,
  Settings, FolderOpen, Bell, Camera, Clock, Terminal,
  Smartphone, MessageSquare
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'mirror', label: 'Phone Display', icon: Monitor },
  { id: 'system', label: 'System Stats', icon: Battery },
  { id: 'controls', label: 'Quick Controls', icon: Zap },
  { id: 'apps', label: 'App Launcher', icon: Grid3X3 },
  { id: 'comms', label: 'Communication', icon: Phone },
  { id: 'media', label: 'Media Controls', icon: Music },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'files', label: 'File Explorer', icon: FolderOpen },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'automation', label: 'Automation', icon: Clock },
  { id: 'command', label: 'Command', icon: Terminal },
  { id: 'console', label: 'Console Log', icon: MessageSquare },
];

export default function Sidebar({ connected, deviceInfo, activeSection, onNavigate }) {
  const scrollTo = (id) => {
    onNavigate(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Smartphone size={24} />
          <h1>CONTROL CENTER</h1>
        </div>
        <div className="sidebar-status">
          <div className={`status-dot ${connected ? 'connected' : ''}`} />
          <span>{connected ? (deviceInfo?.model || 'Connected') : 'Disconnected'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
