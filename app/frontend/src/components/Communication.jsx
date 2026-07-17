import React, { useState } from 'react';
import { Phone, MessageSquare, Send, Mail, Mic, MicOff, Volume2, Video, Square, Play } from 'lucide-react';
import { Api } from '../api';

export default function Communication({ connected, addLog, addToast }) {
  const [callNumber, setCallNumber] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const notConnected = () => { addToast('Device not connected', 'error'); };

  const makeCall = async () => {
    if (!connected) return notConnected();
    if (!callNumber) { addToast('Enter a number', 'error'); return; }
    const res = await Api.call('make', callNumber);
    addLog(`Call ${callNumber}: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast(`Calling ${callNumber}`, 'success');
  };

  const endCall = async () => {
    if (!connected) return notConnected();
    const res = await Api.call('end');
    addLog('End call: ' + res.message, res.success ? 'success' : 'error');
  };

  const answerCall = async () => {
    if (!connected) return notConnected();
    const res = await Api.call('answer');
    addLog('Answer call: ' + res.message, res.success ? 'success' : 'error');
  };

  const controlCall = async (action) => {
    if (!connected) return notConnected();
    const res = await Api.call(action);
    addLog(`Call control ${action}: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast(`Call ${action} toggled`, 'success');
  };

  const makeWhatsAppCall = async (type) => {
    if (!connected) return notConnected();
    if (!waNumber) { addToast('Enter a number', 'error'); return; }
    const res = await Api.call('make_whatsapp', waNumber, type);
    addLog(`WhatsApp ${type} call to ${waNumber}: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast(`Calling ${waNumber} on WhatsApp`, 'success');
  };

  const sendSms = async () => {
    if (!connected) return notConnected();
    if (!smsNumber || !smsMessage) { addToast('Fill number and message', 'error'); return; }
    const res = await Api.sms('send', smsNumber, smsMessage);
    addLog(`SMS to ${smsNumber}: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) { addToast('SMS sent', 'success'); setSmsMessage(''); }
  };

  const sendWhatsApp = async () => {
    if (!connected) return notConnected();
    if (!waNumber || !waMessage) { addToast('Fill number and message', 'error'); return; }
    const res = await Api.whatsapp(waNumber, waMessage);
    addLog(`WhatsApp to ${waNumber}: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) { addToast('WhatsApp message sent', 'success'); setWaMessage(''); }
  };

  const sendEmail = async () => {
    if (!connected) return notConnected();
    if (!emailTo) { addToast('Enter recipient', 'error'); return; }
    const res = await Api.email(emailTo, emailSubject, emailBody);
    addLog(`Email to ${emailTo}: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast('Email composed', 'success');
  };

  return (
    <div>
      <h2 className="section-title">
        <Phone /> Communication
      </h2>

      <div className="card-grid-2">
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Phone size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Phone Calls</span>
            </div>
            <div className="input-row">
              <input className="input" placeholder="Phone number..." value={callNumber} onChange={e => setCallNumber(e.target.value)} />
            </div>
            <div className="btn-group" style={{ marginBottom: 12 }}>
              <button className="btn btn-success" onClick={makeCall}><Phone size={16} /> Call</button>
              <button className="btn btn-accent" onClick={answerCall}>Answer</button>
              <button className="btn btn-danger" onClick={endCall}>End</button>
            </div>
            
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Active Call Controls</div>
            <div className="btn-group">
              <button className="btn" onClick={() => controlCall('speaker')}><Volume2 size={16} /> Speaker</button>
              <button className="btn" onClick={() => controlCall('mute')}><MicOff size={16} /> Mute</button>
              <button className="btn" onClick={() => controlCall('record')}><Mic size={16} /> Record</button>
              <button className="btn" onClick={() => controlCall('hold')}><Square size={16} /> Hold</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <MessageSquare size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>SMS</span>
            </div>
            <div className="input-row">
              <input className="input" placeholder="Phone number..." value={smsNumber} onChange={e => setSmsNumber(e.target.value)} />
            </div>
            <div className="input-row">
              <textarea className="input" placeholder="Message..." value={smsMessage} onChange={e => setSmsMessage(e.target.value)} />
            </div>
            <button className="btn btn-accent" onClick={sendSms}><Send size={16} /> Send SMS</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <MessageSquare size={18} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>WhatsApp</span>
            </div>
            <div className="input-row">
              <input className="input" placeholder="Phone number (with country code)..." value={waNumber} onChange={e => setWaNumber(e.target.value)} />
            </div>
            <div className="input-row">
              <textarea className="input" placeholder="Message..." value={waMessage} onChange={e => setWaMessage(e.target.value)} />
            </div>
            <div className="btn-group">
              <button className="btn btn-success" onClick={sendWhatsApp}><Send size={16} /> Send WhatsApp</button>
              <button className="btn" onClick={() => makeWhatsAppCall('voice')}><Phone size={16} /> Voice</button>
              <button className="btn" onClick={() => makeWhatsAppCall('video')}><Video size={16} /> Video</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Mail size={18} style={{ color: 'var(--accent-dim)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Email</span>
            </div>
            <div className="input-row">
              <input className="input" placeholder="Recipient email..." value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            </div>
            <div className="input-row">
              <input className="input" placeholder="Subject..." value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
            </div>
            <div className="input-row">
              <textarea className="input" placeholder="Body..." value={emailBody} onChange={e => setEmailBody(e.target.value)} />
            </div>
            <button className="btn btn-accent" onClick={sendEmail}><Send size={16} /> Compose</button>
          </div>
        </div>
      </div>
    </div>
  );
}
