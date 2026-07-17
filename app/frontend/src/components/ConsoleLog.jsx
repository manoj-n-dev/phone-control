import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export default function ConsoleLog({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
      <h2 className="section-title">
        <Terminal /> Console/Activity Log
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
