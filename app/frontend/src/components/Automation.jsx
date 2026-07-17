import React, { useState } from 'react';
import { Clock, AlarmClock, Compass, Calendar, Timer } from 'lucide-react';
import { Api } from '../api';

export default function Automation({ connected, addLog, addToast }) {
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [navDest, setNavDest] = useState('');
  const [calTitle, setCalTitle] = useState('');

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

  const navigateTo = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    if (!navDest) return;
    try {
      const res = await Api.navigate(navDest);
      addLog(`Navigation: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Navigating to ${navDest}`, 'success');
    } catch (e) {
      addLog('Navigation error: ' + e.message, 'error');
    }
  };

  const createEvent = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    if (!calTitle) return;
    try {
      const res = await Api.calendar(calTitle);
      addLog(`Calendar: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) addToast(`Calendar event composed`, 'success');
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
        {/* Alarm & Timer */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlarmClock size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Alarms & Timers</span>
            </div>
            
            <div className="input-row">
              <label>Alarm Time</label>
              <input type="time" className="input" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} />
              <button className="btn btn-accent" onClick={setAlarm}>Set Alarm</button>
            </div>

            <div className="input-row" style={{ marginTop: 12 }}>
              <label>Timer (sec)</label>
              <input type="number" className="input" value={timerSeconds} onChange={e => setTimerSeconds(Number(e.target.value))} />
              <button className="btn btn-accent" onClick={startTimer}>Start Timer</button>
            </div>
          </div>
        </div>

        {/* Navigation & Calendar */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Compass size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Nav & Productivity</span>
            </div>

            <div className="input-row">
              <input className="input" placeholder="Destination address..." value={navDest} onChange={e => setNavDest(e.target.value)} />
              <button className="btn btn-accent" onClick={navigateTo}>Navigate</button>
            </div>

            <div className="input-row" style={{ marginTop: 12 }}>
              <input className="input" placeholder="Calendar event title..." value={calTitle} onChange={e => setCalTitle(e.target.value)} />
              <button className="btn btn-accent" onClick={createEvent}>Add Event</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
