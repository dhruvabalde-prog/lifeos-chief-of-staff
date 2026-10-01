'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  Zap,
  Timer,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { Routine, CalendarEvent, NorthStarItem, Mission, ActionCard } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';
import { PILLAR_GROUPS, spawnActionCardFromSkill, LIFE_SKILLS_CATALOG } from '@/lib/skillsCatalog';

type OperationFilter = 'all' | 'protocols' | 'tasks' | 'routines' | 'calendar' | 'northstars' | 'goals';

interface OperationsViewProps {
  routines: Routine[];
  calendarEvents: CalendarEvent[];
  northStars: NorthStarItem[];
  missions: Mission[];
  cards: ActionCard[];
  emergencyMode: boolean;
  onOpenRoutine: (routine: Routine) => void;
  onApproveCard: (card: ActionCard) => void;
  onSpawnCard?: (card: ActionCard) => void;
  onNavigateToApprovals?: () => void;
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
  onSpawnCard,
  onNavigateToApprovals,
}) => {
  const [activeFilter, setActiveFilter] = useState<OperationFilter>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    'pillar-1-health': true,
    'pillar-3-wealth': true,
    'pillar-6-cadence': true,
  });

  // Micro-Timer Friction Breaker State (Skill 17)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(600); // 10 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current as NodeJS.Timeout);
            setIsTimerRunning(false);
            soundManager.playApproveChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => {
    soundManager.playTap();
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    soundManager.playTap();
    setIsTimerRunning(false);
    setTimerSecondsLeft(600);
  };

  const toggleTask = (taskId: string) => {
    soundManager.playTap();
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const togglePillar = (pillarId: string) => {
    soundManager.playTap();
    setExpandedPillars((prev) => ({
      ...prev,
      [pillarId]: !prev[pillarId],
    }));
  };

  const handleRunProtocol = (skillId: string) => {
    soundManager.playTap();
    const newCard = spawnActionCardFromSkill(skillId);
    if (newCard && onSpawnCard) {
      soundManager.playApproveChime();
      onSpawnCard(newCard);
    }
  };

  // Filter pending or keystone cards
  const pendingTasks = cards.filter((c) => {
    if (c.status !== 'pending') return false;
    if (emergencyMode && !c.isKeystone) return false;
    return true;
  });

  const visibleRoutines = routines.filter((r) => {
    if (emergencyMode) {
      return r.steps.some((s) => s.isKeystone);
    }
    return true;
  });

  const taskCount = pendingTasks.length;
  const routineCount = visibleRoutines.length;
  const calendarCount = calendarEvents.length;
  const northStarCount = northStars.length;
  const missionCount = missions.length;
  const protocolCount = LIFE_SKILLS_CATALOG.length;

  const timerMinutes = Math.floor(timerSecondsLeft / 60);
  const timerSeconds = timerSecondsLeft % 60;

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
            onClick={() => { soundManager.playTap(); setActiveFilter('protocols'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'protocols' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Protocols ({protocolCount})</span>
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
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 no-scrollbar pb-8">
        {/* INTERACTIVE 10-MINUTE FRICTION BREAKER WIDGET (Skill 17) */}
        {(activeFilter === 'all' || activeFilter === 'protocols' || activeFilter === 'tasks') && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 font-bold">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">10m Friction Breaker</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    Skill #17
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Micro-commitment sprint. Free to stop when the bell rings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base font-black font-mono text-emerald-400 min-w-[50px] text-right">
                {timerMinutes}:{timerSeconds.toString().padStart(2, '0')}
              </span>
              <button
                onClick={toggleTimer}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                title={isTimerRunning ? 'Pause Sprint' : 'Start 10m Sprint'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
                title="Reset Sprint Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION: 21 BUILT-IN LIFE SKILLS & PROTOCOLS */}
        {(activeFilter === 'all' || activeFilter === 'protocols') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>7 Executive Pillars & 21 Life Protocols</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Google Workspace Ready</span>
            </div>

            <div className="space-y-2.5">
              {PILLAR_GROUPS.map((pillar) => {
                const isExpanded = expandedPillars[pillar.id];
                return (
                  <div
                    key={pillar.id}
                    className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md transition"
                  >
                    {/* Pillar Header */}
                    <button
                      onClick={() => togglePillar(pillar.id)}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">{pillar.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-indigo-400">
                              Pillar {pillar.number}
                            </span>
                            <span className="text-xs font-black text-white truncate">{pillar.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{pillar.tagline}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {pillar.skills.length} Skills
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Pillar Skills List */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 space-y-2 border-t border-slate-800/60 pt-2.5">
                        {pillar.skills.map((skill) => (
                          <div
                            key={skill.id}
                            className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm">{skill.icon}</span>
                                <h5 className="text-xs font-black text-white">{skill.name}</h5>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ➔ {skill.googleService}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug">
                                {skill.purpose}
                              </p>
                              <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                                Target: {skill.targetArtifact}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRunProtocol(skill.id)}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 transition shadow-sm"
                            >
                              <Zap className="w-3 h-3 fill-white" />
                              <span>Queue Card</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                          {task.googleService && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ➔ {task.googleService}
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
