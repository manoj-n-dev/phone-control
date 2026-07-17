import React, { useState } from 'react';
import { Clock, AlarmClock, Compass, Calendar, Timer, MapPin, Plus } from 'lucide-react';
import { Api } from '../api';

const PRESET_DESTINATIONS = [
  { name: 'Home', address: 'Home' },
  { name: 'Work', address: 'Work' },
  { name: 'Airport', address: 'Airport' },
  { name: 'Downtown', address: 'Downtown' },
  { name: 'Gym', address: 'Gym' },
  { name: 'Mall', address: 'Shopping Mall' }
];

export default function Automation({ connected, addLog, addToast }) {
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [navDest, setNavDest] = useState('');
  
  const [calTitle, setCalTitle] = useState('');
  const [calDesc, setCalDesc] = useState('');
  const [calLoc, setCalLoc] = useState('');
  const [calStart, setCalStart] = useState('');
  const [calEnd, setCalEnd] = useState('');

  const setAlarm = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.alarm(alarmTime);
      addLog(`Alarm: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Alarm set for ${alarmTime}`, 'success');
    } catch (e) {
      addLog('Alarm error: ' + e.message, 'error');
    }
  };

  const startTimer = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.timer(timerSeconds);
      addLog(`Timer: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Timer set for ${timerSeconds} seconds`, 'success');
    } catch (e) {
      addLog('Timer error: ' + e.message, 'error');
    }
  };

  const navigateTo = async (destination) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    const target = destination || navDest;
    if (!target) return;
    try {
      const res = await Api.navigate(target);
      addLog(`Navigation: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Navigating to ${target}`, 'success');
    } catch (e) {
      addLog('Navigation error: ' + e.message, 'error');
    }
  };

  const createEvent = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    if (!calTitle) { addToast('Event title is required', 'error'); return; }
    try {
      const res = await Api.calendar({
        title: calTitle,
        description: calDesc,
        location: calLoc,
        beginTime: calStart,
        endTime: calEnd
      });
      addLog(`Calendar: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) {
        addToast(`Calendar event composed`, 'success');
        setCalTitle('');
        setCalDesc('');
        setCalLoc('');
        setCalStart('');
        setCalEnd('');
      }
    } catch (e) {
      addLog('Calendar error: ' + e.message, 'error');
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <Clock /> Automation & Utilities
      </h2>

      <div className="card-grid-2">
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlarmClock size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Alarms & Timers</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Alarm Time</label>
                  <input type="time" className="input" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} />
                </div>
                <button className="btn btn-accent" onClick={setAlarm} style={{ marginTop: 18 }}>Set Alarm</button>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Timer Duration (seconds)</label>
                    <input type="number" className="input" value={timerSeconds} onChange={e => setTimerSeconds(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-accent" onClick={startTimer} style={{ marginTop: 18 }}>Start Timer</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Compass size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Navigation</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Enter Destination</label>
                <div className="input-row">
                  <input className="input" placeholder="Address or place name..." value={navDest} onChange={e => setNavDest(e.target.value)} onKeyDown={e => e.key === 'Enter' && navigateTo()} />
                  <button className="btn btn-accent" onClick={() => navigateTo()}>Go</button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Quick Presets</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PRESET_DESTINATIONS.map(p => (
                    <button
                      key={p.name}
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigateTo(p.address)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        fontSize: 11, padding: '8px 4px'
                      }}
                    >
                      <MapPin size={10} style={{ color: 'var(--accent)' }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Calendar size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Schedule Calendar Event</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Event Title *</label>
                  <input className="input" placeholder="Meeting, flight, appointment..." value={calTitle} onChange={e => setCalTitle(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Location</label>
                  <input className="input" placeholder="Room, address, link..." value={calLoc} onChange={e => setCalLoc(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    className="input"
                    placeholder="Details, dial-in info, notes..."
                    value={calDesc}
                    onChange={e => setCalDesc(e.target.value)}
                    style={{ minHeight: 76, resize: 'vertical', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Start Date & Time</label>
                  <input type="datetime-local" className="input" value={calStart} onChange={e => setCalStart(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>End Date & Time</label>
                  <input type="datetime-local" className="input" value={calEnd} onChange={e => setCalEnd(e.target.value)} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  <button className="btn btn-accent" onClick={createEvent} style={{ width: '100%', height: 42 }}>
                    <Plus size={16} /> Compose Calendar Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
