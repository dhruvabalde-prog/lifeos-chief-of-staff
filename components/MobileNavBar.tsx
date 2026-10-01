'use client';

import React from 'react';
import { Zap, Mic, Compass } from 'lucide-react';
import { soundManager } from '@/lib/audio';

interface MobileNavBarProps {
  currentView: 'cockpit' | 'input' | 'missions';
  onViewChange: (view: 'cockpit' | 'input' | 'missions') => void;
  pendingCount: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentView,
  onViewChange,
  pendingCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl px-6 py-2.5 flex items-center justify-around shadow-2xl">
      {/* 1. Cockpit */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('cockpit'); }}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition relative ${
          currentView === 'cockpit' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Zap className="w-5 h-5" />
        <span className="text-[11px] tracking-tight">Cockpit</span>
        {pendingCount > 0 && (
          <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
            {pendingCount}
          </span>
        )}
      </button>

      {/* 2. Direct Voice Directives */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('input'); }}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition ${
          currentView === 'input' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Mic className="w-5 h-5" />
        <span className="text-[11px] tracking-tight">Direct</span>
      </button>

      {/* 3. Missions */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('missions'); }}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition ${
          currentView === 'missions' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[11px] tracking-tight">Missions</span>
      </button>
    </nav>
  );
};
