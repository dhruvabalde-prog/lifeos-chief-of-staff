'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Clock,
  Sparkles,
  FileCode,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Routine, RoutineStep } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';
import { googleWorkspace } from '@/lib/integrations/googleWorkspace';

interface RoutinePlayerModalProps {
  routine: Routine | null;
  isOpen: boolean;
  emergencyMode: boolean;
  onClose: () => void;
  onUpdateRoutineSteps: (routineId: string, steps: RoutineStep[]) => void;
}

export const RoutinePlayerModal: React.FC<RoutinePlayerModalProps> = ({
  routine,
  isOpen,
  emergencyMode,
  onClose,
  onUpdateRoutineSteps,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepSecondsRemaining, setStepSecondsRemaining] = useState(300); // 5 min default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showMarkdownSpec, setShowMarkdownSpec] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset when routine opens
  useEffect(() => {
    if (routine && isOpen) {
      // Find first uncompleted step (or first keystone step if in emergency mode)
      const targetIndex = routine.steps.findIndex((s) => {
        if (emergencyMode && !s.isKeystone) return false;
        return !s.completed;
      });

      const initialIdx = targetIndex !== -1 ? targetIndex : 0;
      setActiveStepIndex(initialIdx);
      const step = routine.steps[initialIdx];
      if (step) {
        setStepSecondsRemaining(step.durationMinutes * 60);
      }
      setIsTimerRunning(false);
      setSyncMessage(null);
    }
  }, [routine, isOpen, emergencyMode]);

  // Handle countdown
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setStepSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteActiveStep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, activeStepIndex, routine]);

  if (!isOpen || !routine) return null;

  const steps = routine.steps;
  const currentStep: RoutineStep | undefined = steps[activeStepIndex];

  // Calculate overall routine remaining time
  const totalCompletedMinutes = steps
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.durationMinutes, 0);
  const overallMinutesRemaining = Math.max(0, routine.totalMinutes - totalCompletedMinutes);
  const overallProgressPercent = Math.round((totalCompletedMinutes / routine.totalMinutes) * 100);

  // Step countdown format
  const stepMinutes = Math.floor(stepSecondsRemaining / 60);
  const stepSeconds = stepSecondsRemaining % 60;
  const formattedStepTime = `${stepMinutes.toString().padStart(2, '0')}:${stepSeconds.toString().padStart(2, '0')}`;

  const currentStepTotalSeconds = currentStep ? currentStep.durationMinutes * 60 : 300;
  const currentStepProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(((currentStepTotalSeconds - stepSecondsRemaining) / currentStepTotalSeconds) * 100))
  );

  const handleToggleTimer = () => {
    soundManager.playTap();
    setIsTimerRunning(!isTimerRunning);
  };

  const handleCompleteActiveStep = async () => {
    soundManager.playStepCompleteChime();
    const updatedSteps = steps.map((s, idx) => (idx === activeStepIndex ? { ...s, completed: true } : s));
    onUpdateRoutineSteps(routine.id, updatedSteps);

    // Sync to Google Tasks adapter
    if (currentStep) {
      const sync = await googleWorkspace.syncTask(currentStep.title, currentStep.isKeystone);
      setSyncMessage(sync.message);
    }

    // Advance to next step
    const nextIdx = steps.findIndex((s, idx) => {
      if (idx <= activeStepIndex) return false;
      if (emergencyMode && !s.isKeystone) return false;
      return !s.completed;
    });

    if (nextIdx !== -1) {
      setActiveStepIndex(nextIdx);
      setStepSecondsRemaining(steps[nextIdx].durationMinutes * 60);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  };

  const handleSkipStep = () => {
    soundManager.playTap();
    const nextIdx = steps.findIndex((s, idx) => {
      if (idx <= activeStepIndex) return false;
      if (emergencyMode && !s.isKeystone) return false;
      return !s.completed;
    });
    if (nextIdx !== -1) {
      setActiveStepIndex(nextIdx);
      setStepSecondsRemaining(steps[nextIdx].durationMinutes * 60);
    }
  };

  const handleResetStep = () => {
    soundManager.playTap();
    if (currentStep) {
      setStepSecondsRemaining(currentStep.durationMinutes * 60);
    }
  };

  const handleManualCheckStep = async (idx: number) => {
    soundManager.playStepCompleteChime();
    const step = steps[idx];
    if (emergencyMode && !step.isKeystone) return; // Prevent clicking quarantined

    const updatedSteps = steps.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s));
    onUpdateRoutineSteps(routine.id, updatedSteps);

    if (!step.completed) {
      const sync = await googleWorkspace.syncTask(step.title, step.isKeystone);
      setSyncMessage(sync.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {routine.mode} Routine
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Window: {routine.window}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{routine.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundManager.playTap(); setShowMarkdownSpec(!showMarkdownSpec); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Toggle Native Markdown Spec"
            >
              <FileCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Emergency Mode Notification */}
        {emergencyMode && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Emergency Mode Active:</strong> Standard routine steps are quarantined. Focus is narrowed strictly to <span className="font-bold underline">*KEYSTONE*</span> steps.
            </span>
          </div>
        )}

        {/* Native Task Markdown Spec Viewer */}
        {showMarkdownSpec && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2 border-b border-slate-800 pb-1">
              <span className="font-sans font-bold">Google Tasks Notes Spec</span>
              <span className="text-[10px]">Markdown Native</span>
            </div>
            <pre className="whitespace-pre-wrap">{routine.markdownSpec}</pre>
          </div>
        )}

        {/* DUAL TIMERS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* TIMER A: CURRENT STEP COUNTDOWN */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center justify-between">
              <span>Step Timer</span>
              {currentStep?.isKeystone && (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3" /> *KEYSTONE*
                </span>
              )}
            </div>

            <div className="text-3xl font-black text-white font-mono tracking-tight mb-2">
              {formattedStepTime}
            </div>

            <div className="text-xs text-slate-300 font-medium truncate mb-3">
              {currentStep ? currentStep.title : 'All Active Steps Finished'}
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${currentStepProgressPercent}%` }}
              />
            </div>

            {/* Step Timer Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTimer}
                disabled={!currentStep}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Pause' : 'Start Step'}</span>
              </button>

              <button
                onClick={handleResetStep}
                disabled={!currentStep}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                title="Reset Step Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSkipStep}
                disabled={!currentStep}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>

              <button
                onClick={handleCompleteActiveStep}
                disabled={!currentStep}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* TIMER B: TOTAL ROUTINE TIMER */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Routine Runway</span>
                <span className="text-slate-400">{overallProgressPercent}% done</span>
              </div>

              <div className="text-3xl font-black text-white font-mono tracking-tight mb-2">
                {overallMinutesRemaining}m left
              </div>

              <div className="text-xs text-slate-400 font-medium mb-3">
                Total Budget: {routine.totalMinutes} minutes
              </div>
            </div>

            {/* Routine Progress Bar */}
            <div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Completed: {totalCompletedMinutes}m</span>
                <span>Target: {routine.totalMinutes}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Google Workspace Sync Status */}
        {syncMessage && (
          <div className="mb-4 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            {syncMessage}
          </div>
        )}

        {/* STEP-BY-STEP CHECKLIST */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Execution Steps
          </div>

          {steps.map((step, idx) => {
            const isQuarantined = emergencyMode && !step.isKeystone;
            const isCurrent = idx === activeStepIndex;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                    : isQuarantined
                    ? 'bg-slate-950/30 border-slate-800/40 opacity-40'
                    : step.completed
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleManualCheckStep(idx)}
                    disabled={isQuarantined}
                    className={`p-1 rounded-lg transition ${
                      step.completed
                        ? 'text-emerald-400 hover:text-emerald-300'
                        : isQuarantined
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-500 hover:text-indigo-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${step.completed ? 'fill-emerald-400/20' : ''}`} />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${step.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {step.index.toString().padStart(2, '0')}. {step.title}
                      </span>
                      {step.isKeystone && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          *KEYSTONE*
                        </span>
                      )}
                      {isQuarantined && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                          Quarantined
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{step.durationMinutes}m</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
