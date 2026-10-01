'use client';

import React, { useState } from 'react';
import { Target, Flag, Sparkles } from 'lucide-react';
import { Mission, NorthStarItem } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';

interface MissionsPanelProps {
  missions: Mission[];
  northStars: NorthStarItem[];
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
  missions,
  northStars,
}) => {
  const [subTab, setSubTab] = useState<'northstars' | 'missions'>('northstars');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Sub-Page Segment Switcher */}
      <div className="flex items-center justify-center">
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold w-full max-w-xs justify-center">
          <button
            onClick={() => { soundManager.playTap(); setSubTab('northstars'); }}
            className={`flex-1 py-1.5 px-3 rounded-xl transition text-center ${
              subTab === 'northstars' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 North Stars
          </button>
          <button
            onClick={() => { soundManager.playTap(); setSubTab('missions'); }}
            className={`flex-1 py-1.5 px-3 rounded-xl transition text-center ${
              subTab === 'missions' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏁 Missions
          </button>
        </div>
      </div>

      {/* SUB-PAGE 1: NORTH STARS */}
      {subTab === 'northstars' && (
        <div className="space-y-3 animate-fade-in">
          {northStars.map((ns) => (
            <div
              key={ns.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white line-clamp-1">{ns.title}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  {ns.leverageScore}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Target: <span className="text-slate-200 font-medium">{ns.targetMetric}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Progress</span>
                  <span className="text-emerald-400 font-bold">{ns.currentProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${ns.currentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-PAGE 2: QUARTERLY MISSIONS */}
      {subTab === 'missions' && (
        <div className="space-y-3 animate-fade-in">
          {missions.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {m.category}
                </span>
                <span className="text-xs font-mono text-slate-400">{m.deadline}</span>
              </div>

              <h3 className="text-sm font-bold text-white">{m.title}</h3>
              <p className="text-xs text-slate-400 leading-snug line-clamp-2">{m.description}</p>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                <span>Execution Velocity:</span>
                <span className="font-mono font-bold text-indigo-400">{m.progressPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
