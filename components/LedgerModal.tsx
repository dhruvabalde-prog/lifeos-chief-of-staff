'use client';

import React from 'react';
import { X, CheckCircle2, Clock, Trash2, FolderArchive, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { ActivityLedgerEntry } from '@/types/lifeos';

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ActivityLedgerEntry[];
  emergencyMode: boolean;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  entries,
  emergencyMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
          <div>
            <h2 className="text-base font-black text-white">Execution Ledger</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Audit trail</span>
              {emergencyMode && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                  SICK_DAY_PAUSE Active
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No activity entries logged yet.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                  {entry.actionType === 'EXECUTE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {entry.actionType === 'ROUTINE_COMPLETED' && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  {entry.actionType === 'SNOOZE' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  {entry.actionType === 'CRITIQUE_REDRAFT' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  {entry.actionType === 'DRAFT_SAVED' && <FolderArchive className="w-3.5 h-3.5 text-blue-400" />}
                  {entry.actionType === 'KILLED' && <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                  {(entry.actionType === 'SICK_SHIELD_ACTIVATED' || entry.actionType === 'SICK_SHIELD_DEACTIVATED') && (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-white truncate">{entry.cardTitle}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{entry.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {entry.details}
                  </div>
                  {entry.streakStatus && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{entry.streakStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
