import React from 'react';

interface UpgradeNudgeProps {
  message: string;
  onClick: () => void;
  variant?: 'text' | 'badge' | 'hint';
  className?: string;
}

export function UpgradeNudge({
  message,
  onClick,
  variant = 'text',
  className = '',
}: UpgradeNudgeProps) {
  if (variant === 'badge') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 bg-rv-accent/10 text-rv-accent text-[10px] font-medium rounded-full hover:bg-rv-accent/20 transition-colors ${className}`}
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {message}
      </button>
    );
  }

  if (variant === 'hint') {
    return (
      <div className={`flex items-center gap-1.5 text-[11px] text-rv-textMuted ${className}`}>
        <svg className="w-3 h-3 text-rv-accent/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{message}</span>
        <button
          onClick={onClick}
          className="text-rv-accent hover:text-rv-primary font-medium transition-colors"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`text-[11px] text-rv-accent hover:text-rv-primary transition-colors ${className}`}
    >
      {message} <span className="font-medium">→ Upgrade</span>
    </button>
  );
}
