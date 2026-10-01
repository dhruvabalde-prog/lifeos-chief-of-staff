'use client';

import React from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Trash2,
  FolderArchive,
  ShieldAlert,
  Flame,
  User,
  Bot,
  Sparkles,
} from 'lucide-react';
import { ActivityLedgerEntry } from '@/types/lifeos';

interface ActivityLedgerPanelProps {
  entries: ActivityLedgerEntry[];
  emergencyMode: boolean;
}

export const ActivityLedgerPanel: React.FC<ActivityLedgerPanelProps> = ({
  entries,
  emergencyMode,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Audit Trail & Execution Ledger
            </span>
            <span className="text-xs text-slate-400">Complete Human Sovereignty</span>
          </div>
          <h1 className="text-2xl font-black text-white">Activity Ledger</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Every delegated approval, voice critique, snooze, and habit streak event is immutably logged for total transparency.
          </p>
        </div>

        {/* Streak Status Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>14-Day Keystone Streak</span>
              {emergencyMode && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  FROZEN (SICK_DAY_PAUSE)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              {emergencyMode
                ? 'Habit streaks protected from failure during Emergency Shield'
                : 'Zero broken keystone routines'}
            </div>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-extrabold text-white">Chronological Execution Log</h2>
          <span className="text-xs font-mono text-slate-400">{entries.length} Events Logged</span>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {entry.actionType === 'EXECUTE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {entry.actionType === 'ROUTINE_COMPLETED' && <Sparkles className="w-4 h-4 text-indigo-400" />}
                  {entry.actionType === 'SNOOZE' && <Clock className="w-4 h-4 text-amber-400" />}
                  {entry.actionType === 'CRITIQUE_REDRAFT' && <Sparkles className="w-4 h-4 text-purple-400" />}
                  {entry.actionType === 'DRAFT_SAVED' && <FolderArchive className="w-4 h-4 text-blue-400" />}
                  {entry.actionType === 'KILLED' && <Trash2 className="w-4 h-4 text-rose-400" />}
                  {(entry.actionType === 'SICK_SHIELD_ACTIVATED' || entry.actionType === 'SICK_SHIELD_DEACTIVATED') && (
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{entry.cardTitle}</span>
                    <span className="text-[10px] text-slate-400">{entry.timestamp}</span>

                    {entry.categoryLabel && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        {entry.categoryLabel}
                      </span>
                    )}

                    {entry.streakStatus === 'SICK_DAY_PAUSE' && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        SICK_DAY_PAUSE 🛡️
                      </span>
                    )}
                    {entry.streakStatus === 'COMPLETED' && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        STREAK PRESERVED 🔥
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{entry.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 self-end md:self-center bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {entry.actor === 'User (Principal)' ? (
                  <User className="w-3 h-3 text-indigo-400" />
                ) : (
                  <Bot className="w-3 h-3 text-emerald-400" />
                )}
                <span>{entry.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
