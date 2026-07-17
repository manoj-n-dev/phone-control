import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function ConsoleLog({ logs, onClearLogs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
      <h2 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal /> Console/Activity Log
        </span>
        {logs.length > 0 && onClearLogs && (
          <button
            className="btn btn-sm btn-danger"
            onClick={onClearLogs}
            title="Clear all logs"
            style={{ fontSize: 12 }}
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </h2>

      <div className="card">
        <div className="card-body">
          <div ref={containerRef} className="console">
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No activities logged yet. Trigger phone actions to see live output.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">[{log.time}]</span>
                  <span className={`log-${log.type}`}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
