'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Calendar,
  ExternalLink,
  Target,
  Flame,
  Flag,
  Sparkles,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Routine, CalendarEvent, NorthStarItem, Mission, ActionCard } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';

type OperationFilter = 'all' | 'tasks' | 'routines' | 'calendar' | 'northstars' | 'goals';

interface OperationsViewProps {
  routines: Routine[];
  calendarEvents: CalendarEvent[];
  northStars: NorthStarItem[];
  missions: Mission[];
  cards: ActionCard[];
  emergencyMode: boolean;
  onOpenRoutine: (routine: Routine) => void;
  onApproveCard: (card: ActionCard) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  routines,
  calendarEvents,
  northStars,
  missions,
  cards,
  emergencyMode,
  onOpenRoutine,
  onApproveCard,
}) => {
  const [activeFilter, setActiveFilter] = useState<OperationFilter>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  const toggleTask = (taskId: string) => {
    soundManager.playTap();
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Filter pending or keystone cards
  const pendingTasks = cards.filter((c) => {
    if (c.status !== 'pending') return false;
    if (emergencyMode && !c.isKeystone) return false;
    return true;
  });

  const visibleRoutines = routines.filter((r) => {
    if (emergencyMode) {
      // In emergency mode, only show routines with keystone steps
      return r.steps.some((s) => s.isKeystone);
    }
    return true;
  });

  // Pill counts
  const taskCount = pendingTasks.length;
  const routineCount = visibleRoutines.length;
  const calendarCount = calendarEvents.length;
  const northStarCount = northStars.length;
  const missionCount = missions.length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden max-w-2xl mx-auto select-none">
      {/* 1. HORIZONTAL SCROLLABLE PILL FILTERS ON TOP */}
      <div className="shrink-0 mb-3 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 min-w-max px-0.5">
          <button
            onClick={() => { soundManager.playTap(); setActiveFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'all' ? 'bg-white text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>

          <button
            onClick={() => { soundManager.playTap(); setActiveFilter('tasks'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'tasks' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasks ({taskCount})</span>
          </button>

          <button
            onClick={() => { soundManager.playTap(); setActiveFilter('routines'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'routines' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Routines ({routineCount})</span>
          </button>

          <button
            onClick={() => { soundManager.playTap(); setActiveFilter('calendar'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar ({calendarCount})</span>
          </button>

          <button
            onClick={() => { soundManager.playTap(); setActiveFilter('northstars'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'northstars' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>North Stars ({northStarCount})</span>
          </button>

          <button
            onClick={() => { soundManager.playTap(); setActiveFilter('goals'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'goals' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Goals ({missionCount})</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 no-scrollbar pb-6">
        {/* SECTION: TASKS */}
        {(activeFilter === 'all' || activeFilter === 'tasks') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Action Tasks & Keystones</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{pendingTasks.length} pending</span>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                No active tasks pending.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => {
                  const isDone = completedTaskIds[task.id];
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3 transition ${
                        isDone ? 'opacity-50 bg-slate-950/60' : 'hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-0.5 text-slate-500 hover:text-indigo-400 transition shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            {task.categoryLabel}
                          </span>
                          {task.isKeystone && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Keystone
                            </span>
                          )}
                          {task.urgency === 'critical' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                              Critical
                            </span>
                          )}
                        </div>
                        <div className={`text-xs font-bold text-white leading-snug ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {task.headline}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {task.synthesis}
                        </div>
                      </div>

                      {!isDone && (
                        <button
                          onClick={() => {
                            soundManager.playApproveChime();
                            onApproveCard(task);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0 transition"
                        >
                          Execute
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION: ROUTINES */}
        {(activeFilter === 'all' || activeFilter === 'routines') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Executive Routines</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{visibleRoutines.length} active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {visibleRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {routine.window}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                        {routine.totalMinutes}m
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-white">{routine.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {routine.steps.length} sequential steps • {routine.mode}
                    </p>
                  </div>

                  <button
                    onClick={() => { soundManager.playTap(); onOpenRoutine(routine); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs transition border border-slate-700"
                  >
                    <Play className="w-3 h-3 fill-indigo-300" />
                    <span>Launch Routine</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: CALENDAR */}
        {(activeFilter === 'all' || activeFilter === 'calendar') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Calendar & Schedule</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Live Sync</span>
            </div>

            <div className="space-y-2">
              {calendarEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-slate-200 truncate">{evt.title}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{evt.timeRange}</span>
                    </div>
                  </div>
                  {evt.meetLink && (
                    <a
                      href={evt.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-[10px] font-bold shrink-0"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: NORTH STARS */}
        {(activeFilter === 'all' || activeFilter === 'northstars') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Today&#39;s North Stars</span>
              </span>
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Active Streaks
              </span>
            </div>

            <div className="space-y-2">
              {northStars.map((ns) => (
                <div
                  key={ns.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{ns.title}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {ns.currentProgress}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Target: <span className="text-slate-300">{ns.targetMetric}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${ns.currentProgress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: GOALS & MISSIONS */}
        {(activeFilter === 'all' || activeFilter === 'goals') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quarterly Missions & Goals</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{missions.length} missions</span>
            </div>

            <div className="space-y-2">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {m.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{m.deadline}</span>
                  </div>

                  <h5 className="text-xs font-bold text-white">{m.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{m.description}</p>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Velocity</span>
                      <span className="font-bold text-indigo-400">{m.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${m.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
