import React, { useState } from 'react';
import { Terminal, Send } from 'lucide-react';
import { Api } from '../api';

export default function NaturalCommand({ connected, addLog, addToast }) {
  const [cmd, setCmd] = useState('');
  const [loading, setLoading] = useState(false);

  const executeCommand = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    if (!cmd.trim()) return;
    setLoading(true);
    addLog(`Running natural command: "${cmd}"`, 'info');
    try {
      const res = await Api.command(cmd);
      if (res.success) {
        addLog(`Response: ${res.output || 'Success'}`, 'success');
        addToast('Command executed', 'success');
        setCmd('');
      } else {
        addLog(res.message, 'error');
        addToast('Command execution failed', 'error');
      }
    } catch (e) {
      addLog('Command error: ' + e.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="section-title">
        <Terminal /> Natural Command Input
      </h2>

      <div className="card">
        <div className="card-body">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Type standard natural language commands such as "open settings and set brightness to 200", "send sms to 123 hello", "play song shape of you", etc.
          </div>
          <div className="input-row">
            <input
              className="input"
              placeholder="Say what to do on phone (e.g. 'turn on wifi', 'volume up')..."
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && executeCommand()}
              disabled={loading}
            />
            <button className="btn btn-accent" onClick={executeCommand} disabled={loading}>
              {loading ? <span className="spinner" /> : <Send size={16} />}
              Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
