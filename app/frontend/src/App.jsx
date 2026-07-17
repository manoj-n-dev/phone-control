import React, { useState, useCallback } from 'react';

import Sidebar from './components/Sidebar';
import PhoneMirror from './components/PhoneMirror';
import PasscodeModal from './components/PasscodeModal';
import SystemStats from './components/SystemStats';
import QuickControls from './components/QuickControls';
import AppLauncher from './components/AppLauncher';
import Communication from './components/Communication';
import MediaControls from './components/MediaControls';
import SettingsToggles from './components/SettingsToggles';
import FileExplorer from './components/FileExplorer';
import CameraModule from './components/CameraModule';
import Automation from './components/Automation';
import NaturalCommand from './components/NaturalCommand';
import ConsoleLog from './components/ConsoleLog';
import NotificationsPanel from './components/NotificationsPanel';
import ToastContainer from './components/ToastContainer';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [activeSection, setActiveSection] = useState('mirror');
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addLog = useCallback((message, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-200), { time, message, type, id: Date.now() + Math.random() }]);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar
        connected={connected}
        deviceInfo={deviceInfo}
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      <main className="main-content">
        {/* Connection */}
        <section id="section-mirror" className="section">
          <PhoneMirror
            connected={connected}
            setConnected={setConnected}
            deviceInfo={deviceInfo}
            setDeviceInfo={setDeviceInfo}
            addLog={addLog}
            addToast={addToast}
            onUnlockRequest={() => setShowPasscode(true)}
          />
        </section>

        {/* System Stats */}
        <section id="section-system" className="section">
          <SystemStats connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Quick Controls */}
        <section id="section-controls" className="section">
          <QuickControls connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* App Launcher */}
        <section id="section-apps" className="section">
          <AppLauncher connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Communication */}
        <section id="section-comms" className="section">
          <Communication connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Media */}
        <section id="section-media" className="section">
          <MediaControls connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Settings & Toggles */}
        <section id="section-settings" className="section">
          <SettingsToggles connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* File Explorer */}
        <section id="section-files" className="section">
          <FileExplorer connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Notifications */}
        <section id="section-notifications" className="section">
          <NotificationsPanel connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Camera */}
        <section id="section-camera" className="section">
          <CameraModule connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Automation */}
        <section id="section-automation" className="section">
          <Automation connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Natural Command */}
        <section id="section-command" className="section">
          <NaturalCommand connected={connected} addLog={addLog} addToast={addToast} />
        </section>

        {/* Console */}
        <section id="section-console" className="section">
          <ConsoleLog logs={logs} />
        </section>
      </main>

      {/* Passcode Modal */}
      {showPasscode && (
        <PasscodeModal
          onClose={() => setShowPasscode(false)}
          addLog={addLog}
          addToast={addToast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
