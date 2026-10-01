'use client';

import React from 'react';
import { Target, Flag, CheckCircle2, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Mission, NorthStarItem } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';

interface MissionsPanelProps {
  missions: Mission[];
  northStars: NorthStarItem[];
  onNavigateToCockpit: () => void;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
  missions,
  northStars,
  onNavigateToCockpit,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Strategic Trajectory
            </span>
            <span className="text-xs text-slate-400">Chief of Staff Mission Alignment</span>
          </div>
          <h1 className="text-2xl font-black text-white">Missions & North Stars</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Every raw voice memo, document approval, and routine executed in the Cockpit directly advances these core strategic imperatives.
          </p>
        </div>

        <button
          onClick={() => { soundManager.playTap(); onNavigateToCockpit(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition shrink-0"
        >
          <span>Return to Cockpit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ACTIVE NORTH STARS SUMMARY */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Active North Stars</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">High-Leverage Orbit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {northStars.map((ns) => (
            <div
              key={ns.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white line-clamp-2">{ns.title}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                    {ns.leverageScore}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Target: <span className="text-slate-300 font-medium">{ns.targetMetric}</span>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Current Velocity</span>
                  <span className="font-mono font-bold text-emerald-400">{ns.currentProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${ns.currentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRATEGIC MISSIONS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-extrabold text-white">Quarterly Missions</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Q4 2026 Directives</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {mission.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Target Horizon: {mission.deadline}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">{mission.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{mission.description}</p>

                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">Linked North Stars:</div>
                  <div className="flex flex-wrap gap-2">
                    {mission.northStars.map((ns, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-medium"
                      >
                        🎯 {ns}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress dial */}
              <div className="flex flex-col items-center md:items-end justify-center shrink-0 w-full md:w-44 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
                <div className="text-2xl font-black text-white font-mono mb-1">
                  {mission.progressPercent}%
                </div>
                <div className="text-[11px] text-slate-400 mb-2">Execution Velocity</div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${mission.progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-emerald-400 mt-2 font-semibold">
                  Status: On Track
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
