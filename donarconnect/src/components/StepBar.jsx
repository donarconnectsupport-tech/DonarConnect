import React from 'react';

const LABELS = ['Details', 'Order', 'Payment'];

export default function StepBar({ current, total = 3 }) {
  return (
    <div className="steps" style={{ padding: '14px 24px' }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const isDone   = n < current;
        const isActive = n === current;
        return (
          <React.Fragment key={n}>
            {i > 0 && (
              <div className={`step-line ${isDone || isActive ? 'done' : ''}`} />
            )}
            <div className={`step-dot ${isActive ? 'active' : isDone ? 'done' : ''}`}
                 title={LABELS[i]}>
              {isDone ? '✓' : n}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
