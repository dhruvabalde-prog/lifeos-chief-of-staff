'use client';

import React from 'react';
import { ShieldAlert, Activity, CheckCircle2, X } from 'lucide-react';

interface EmergencyBannerProps {
  active: boolean;
  onStandDown: () => void;
  quarantinedCount: number;
  keystoneCount: number;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  active,
  onStandDown,
  quarantinedCount,
  keystoneCount,
}) => {
  if (!active) return null;

  return (
    <aside aria-label="Emergency Shield Active Banner" className="w-full bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-b border-rose-500/50 px-4 py-3 shadow-lg shadow-rose-950/40 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-rose-200">
              <span>🚨 Emergency Shield Active</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/40">
                SICK_DAY_PAUSE Engaged
              </span>
            </div>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Non-essential tasks & routines are quarantined. Habit streaks are protected and frozen. Only <span className="font-bold text-white underline decoration-rose-400">*KEYSTONE*</span> directives remain visible.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span className="text-amber-400 font-bold">{quarantinedCount} Quarantined</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{keystoneCount} Keystone Active</span>
          </div>

          <button
            onClick={onStandDown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition shadow-md shadow-rose-900/40 shrink-0"
          >
            <span>Stand Down Shield</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
