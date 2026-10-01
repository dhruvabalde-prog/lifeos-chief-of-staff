'use client';

import React from 'react';
import {
  Play,
  Calendar,
  ExternalLink,
  Target,
  Sparkles,
  Clock,
  ShieldAlert,
  Flame,
} from 'lucide-react';
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
    <section aria-label="Today's Runway" className="w-full max-w-4xl mx-auto space-y-4">
      {/* 1. 🟢 NOW BLOCK & ROUTINES LAUNCHER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NOW BLOCK (Takes 2 cols on md) */}
        <div className="md:col-span-2 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                {emergencyMode ? '🟢 NOW (KEYSTONE FOCUS)' : '🟢 NOW ACTIVE BLOCK'}
              </span>
            </div>
            {emergencyMode && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Shielded
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-white mb-1">
              {emergencyMode
                ? 'Keystone Directive: Critical Morning Medication & Rest'
                : activeRoutine?.name || 'Deep Work Focus Block'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {emergencyMode
                ? 'All non-essential commitments are paused under SICK_DAY_PAUSE. Take prescribed medication and hydrate.'
                : activeRoutine
                ? `Window: ${activeRoutine.window} (${activeRoutine.totalMinutes} min budget). Step in progress: ${
                    activeRoutine.steps.find((s) => !s.completed)?.title || 'All steps checked'
                  }.`
                : 'Current window reserved for high-leverage strategic output.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono">
              {activeRoutine ? `${activeRoutine.totalMinutes}m Window` : 'Continuous Focus'}
            </div>

            {activeRoutine && (
              <button
                onClick={() => { soundManager.playTap(); onOpenRoutine(activeRoutine); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume Routine Player</span>
              </button>
            )}
          </div>
        </div>

        {/* ROUTINES LAUNCHER (1 col) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>🔄 ROUTINES LAUNCHER</span>
            </div>

            <div className="space-y-2">
              {allRoutines.map((routine) => {
                const isQuarantined = emergencyMode;
                return (
                  <button
                    key={routine.id}
                    onClick={() => { soundManager.playTap(); onOpenRoutine(routine); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      routine.isActiveNow
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                        : isQuarantined
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-2">{routine.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {routine.totalMinutes}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-amber-400">
              <Flame className="w-3.5 h-3.5" /> 14-Day Streak
            </span>
            <span className="text-[10px]">{emergencyMode ? 'Status: SICK_DAY_PAUSE' : 'Status: Active'}</span>
          </div>
        </div>
      </div>

      {/* 2. ⏳ UP NEXT (Calendar) & 🎯 TODAY'S NORTH STARS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* UP NEXT (Next 2 Calendar Events) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                ⏳ UP NEXT (CALENDAR)
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Google Calendar Synced</span>
          </div>

          <div className="space-y-3">
            {calendarEvents.slice(0, 2).map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{evt.title}</span>
                    {evt.isHighImpact && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        High Impact
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{evt.timeRange}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-semibold">in {evt.countdownMinutes} mins</span>
                  </div>
                </div>

                {evt.meetLink && (
                  <a
                    href={evt.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 transition shrink-0"
                    title="Open Meeting Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TODAY'S NORTH STARS (1 to 3 High-Leverage Focus Items) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                🎯 TODAY'S NORTH STARS
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Max 3 Focus Items</span>
          </div>

          <div className="space-y-3">
            {northStars.slice(0, 3).map((ns) => (
              <div
                key={ns.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 line-clamp-1">{ns.title}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                    {ns.leverageScore}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Target: <span className="text-slate-300 font-medium">{ns.targetMetric}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${ns.currentProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{ns.currentProgress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
