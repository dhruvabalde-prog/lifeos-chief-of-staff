'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, X, Check, RefreshCw } from 'lucide-react';
import { ActionCard } from '@/types/lifeos';
import { geminiStaff } from '@/lib/integrations/gemini';
import { soundManager } from '@/lib/audio';

interface QuickCritiqueModalProps {
  card: ActionCard | null;
  isOpen: boolean;
  onClose: () => void;
  onCritiqueApplied: (updatedCard: ActionCard) => void;
}

export const QuickCritiqueModal: React.FC<QuickCritiqueModalProps> = ({
  card,
  isOpen,
  onClose,
  onCritiqueApplied,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(5);
  const [critiqueText, setCritiqueText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackApplied, setFeedbackApplied] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCritiqueText('');
      setFeedbackApplied(null);
      setIsProcessing(false);
      setIsRecording(false);
      setRecordingSeconds(5);
    }
  }, [isOpen]);

  // Handle countdown during recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev <= 1) {
            handleStopRecording();
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
  }, [isRecording]);

  if (!isOpen || !card) return null;

  const handleStartRecording = () => {
    soundManager.playTap();
    setIsRecording(true);
    setRecordingSeconds(5);
    setFeedbackApplied(null);

    // If browser supports SpeechRecognition, can transcribe; fallback with simulated speech or default
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                              (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setCritiqueText(speechResult);
        };
        recognition.start();
      } catch {
        // Fallback default
        setCritiqueText('Make tone firmer and stand firm on valuation');
      }
    } else {
      setCritiqueText('Make tone firmer, drop price 10% and request 48h extension');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (!critiqueText) {
      setCritiqueText('Make tone firmer, drop price 10% and demand 48h extension');
    }
  };

  const handleApplyCritique = async (textToApply: string) => {
    if (!textToApply.trim()) return;
    setIsProcessing(true);
    soundManager.playTap();

    try {
      const redraft = await geminiStaff.redraftWithCritique(card, textToApply);

      const updatedCard: ActionCard = {
        ...card,
        headline: redraft.headline,
        synthesis: redraft.synthesis,
        previewData: redraft.previewData,
        critiqueHistory: [
          ...(card.critiqueHistory || []),
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            critique: textToApply,
            priorSynthesis: card.synthesis,
          },
        ],
      };

      setFeedbackApplied(redraft.explanation);
      soundManager.playApproveChime();

      setTimeout(() => {
        onCritiqueApplied(updatedCard);
        onClose();
      }, 700);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const presets = [
    'Make tone firmer, drop price 10%',
    'Make tone firmer & remove apologetic phrasing',
    'Condense to under 75 words executive brevity',
    'Request 48-hour extension on signature',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">5-Second Quick Voice Critique</h3>
            <p className="text-xs text-slate-400">
              Speak feedback to re-draft this card in place with zero typing.
            </p>
          </div>
        </div>

        {/* Current Card Summary Target */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            Re-Drafting Target: {card.categoryLabel}
          </div>
          <div className="text-xs text-slate-300 line-clamp-2 font-medium">
            {card.headline}
          </div>
        </div>

        {/* Central Voice Capture Button */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60 mb-5">
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleStopRecording}
                className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-xl shadow-rose-600/30 ring-4 ring-rose-500/30 animate-pulse transition"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-sm font-bold text-rose-300">
                  Recording Critique ({recordingSeconds}s remaining)...
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleStartRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-600/25 ring-4 ring-purple-500/20 transition-transform active:scale-95 group"
              >
                <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-xs font-semibold text-slate-300">
                Tap to record 5-sec directive
              </span>
            </div>
          )}
        </div>

        {/* Input & Editable Transcript */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Or Edit Voice Directive</span>
            <span className="text-[10px] text-slate-500">Gemini 1.5 Redraft</span>
          </label>
          <input
            type="text"
            value={critiqueText}
            onChange={(e) => setCritiqueText(e.target.value)}
            placeholder="e.g. Make tone firmer, drop price 10%, request 48h extension..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Quick Executive Presets */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">Executive One-Tap Presets:</div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCritiqueText(preset);
                  handleApplyCritique(preset);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 hover:border-slate-500 transition text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => handleApplyCritique(critiqueText)}
            disabled={!critiqueText.trim() || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Re-drafting Card...</span>
              </>
            ) : feedbackApplied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Critique Applied!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Re-Draft Card in Place</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
