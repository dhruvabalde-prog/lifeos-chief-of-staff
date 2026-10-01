'use client';

import React from 'react';
import { Zap, MessageSquare, ClipboardList } from 'lucide-react';
import { soundManager } from '@/lib/audio';

export type MainViewTab = 'approvals' | 'chat' | 'operations';

interface MobileNavBarProps {
  currentView: MainViewTab;
  onViewChange: (view: MainViewTab) => void;
  pendingCount: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentView,
  onViewChange,
  pendingCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-4 py-2 flex items-center justify-around shadow-2xl">
      {/* 1. Approvals (Left) */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('approvals'); }}
        className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition relative ${
          currentView === 'approvals' ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <div className="relative">
          <Zap className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-black shadow-sm">
              {pendingCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight">Approvals</span>
      </button>

      {/* 2. Staff / Home (Center Homepage - Chatbox) */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('chat'); }}
        className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition ${
          currentView === 'chat' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <div className="p-1 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-purple-500/30">
          <MessageSquare className="w-4 h-4 text-purple-400" />
        </div>
        <span className="text-[11px] tracking-tight">Staff</span>
      </button>

      {/* 3. Operations (Right) */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('operations'); }}
        className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition ${
          currentView === 'operations' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <ClipboardList className="w-5 h-5" />
        <span className="text-[11px] tracking-tight">Operations</span>
      </button>
    </nav>
  );
};
