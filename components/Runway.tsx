'use client';

import React from 'react';
import { Play, Calendar, ExternalLink, Target, Clock, ShieldAlert, Flame } from 'lucide-react';
import { Routine, CalendarEvent, NorthStarItem } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';

interface RunwayProps {
  activeRoutine: Routine | null;
  allRoutines: Routine[];
  calendarEvents: CalendarEvent[];
  northStars: NorthStarItem[];
  emergencyMode: boolean;
  onOpenRoutine: (routine: Routine) => void;
}

export const Runway: React.FC<RunwayProps> = ({
  activeRoutine,
  allRoutines,
  calendarEvents,
  northStars,
  emergencyMode,
  onOpenRoutine,
}) => {
  return (
    <section aria-label="Today's Runway" className="w-full max-w-2xl mx-auto space-y-3">
      {/* NOW BLOCK */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              {emergencyMode ? 'NOW (KEYSTONE FOCUS)' : 'NOW'}
            </span>
            {emergencyMode && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                SICK SHIELD
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-white truncate">
            {emergencyMode
              ? 'Keystone: Morning Medication & Rest'
              : activeRoutine?.name || 'Deep Work Focus'}
          </h3>
          <p className="text-xs text-slate-400 truncate">
            {emergencyMode
              ? 'Streaks frozen under SICK_DAY_PAUSE'
              : `Step: ${activeRoutine?.steps.find((s) => !s.completed)?.title || 'All Complete'}`}
          </p>
        </div>

        {activeRoutine && (
          <button
            onClick={() => { soundManager.playTap(); onOpenRoutine(activeRoutine); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 shadow-md transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">Launch Routine</span>
            <span className="sm:hidden">Play</span>
          </button>
        )}
      </div>

      {/* CALENDAR & NORTH STARS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* UP NEXT */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> UP NEXT
            </span>
            <span className="text-[10px] text-emerald-400">Google Calendar</span>
          </div>

          <div className="space-y-1.5">
            {calendarEvents.slice(0, 2).map((evt) => (
              <div key={evt.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs">
                <div className="truncate pr-2">
                  <div className="font-bold text-slate-200 truncate">{evt.title}</div>
                  <div className="text-[10px] text-slate-400">{evt.timeRange}</div>
                </div>
                {evt.meetLink && (
                  <a href={evt.meetLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-white p-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* NORTH STARS */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> NORTH STARS
            </span>
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              <Flame className="w-3 h-3" /> 14d Streak
            </span>
          </div>

          <div className="space-y-2">
            {northStars.slice(0, 2).map((ns) => (
              <div key={ns.id} className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="truncate pr-2">{ns.title}</span>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">{ns.currentProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${ns.currentProgress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROUTINES LAUNCHER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 no-scrollbar">
        {allRoutines.map((r) => (
          <button
            key={r.id}
            onClick={() => { soundManager.playTap(); onOpenRoutine(r); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold whitespace-nowrap"
          >
            <span>🔄 {r.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">({r.totalMinutes}m)</span>
          </button>
        ))}
      </div>
    </section>
  );
};
