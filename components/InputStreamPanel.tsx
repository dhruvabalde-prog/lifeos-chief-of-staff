'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  FileText,
  Send,
  Sparkles,
  RefreshCw,
  ArrowRight,
  List,
} from 'lucide-react';
import { RawInputItem, ActionCard } from '@/types/lifeos';
import { soundManager, generateWaveformData } from '@/lib/audio';
import { geminiStaff } from '@/lib/integrations/gemini';

interface InputStreamPanelProps {
  inputs: RawInputItem[];
  onAddNewInput: (input: RawInputItem, resultingCard?: ActionCard) => void;
  onNavigateToCard?: (cardId: string) => void;
}

export const InputStreamPanel: React.FC<InputStreamPanelProps> = ({
  inputs,
  onAddNewInput,
  onNavigateToCard,
}) => {
  const [subTab, setSubTab] = useState<'capture' | 'feed'>('capture');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const [scratchpadText, setScratchpadText] = useState('');
  const [isProcessingScratchpad, setIsProcessingScratchpad] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // START RECORDING
  const handleStartRecording = async () => {
    soundManager.playTap();
    setIsRecording(true);
    setRecordingDuration(0);
    setVoiceTranscript('');
    audioChunksRef.current = [];

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                              (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (e: any) => {
          const current = Array.from(e.results)
            .map((res: any) => res[0].transcript)
            .join(' ');
          setVoiceTranscript(current);
        };
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition failed', e);
      }
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
      }
    } catch (e) {
      console.warn('Microphone error', e);
    }

    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  // STOP & DELEGATE
  const handleStopAndDelegate = async () => {
    soundManager.playTap();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    let audioBlobUrl: string | undefined = undefined;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream?.getTracks();
      tracks?.forEach((t) => t.stop());
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size > 0) {
        audioBlobUrl = URL.createObjectURL(audioBlob);
      }
    }

    setIsProcessingVoice(true);
    const spokenText = voiceTranscript.trim() || 'Tell Mark from Apex Capital we accept 18M cap valuation and request 48h signature extension.';

    try {
      const aiResponse = await geminiStaff.parseDirective(spokenText, 'voice');

      const rawItem: RawInputItem = {
        id: `raw-${Date.now()}`,
        type: 'voice',
        title: `Directive: "${spokenText.slice(0, 28)}..."`,
        content: spokenText,
        timestamp: 'Just now',
        status: 'approval_pending',
        durationSeconds: Math.max(3, recordingDuration),
        audioBlobUrl,
        audioWaveformData: generateWaveformData(24),
        resultingCardId: aiResponse.card.id,
      };

      soundManager.playApproveChime();
      onAddNewInput(rawItem, aiResponse.card);
      setVoiceTranscript('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Delegate Scratchpad Memo
  const handleDelegateScratchpad = async () => {
    if (!scratchpadText.trim()) return;
    setIsProcessingScratchpad(true);
    soundManager.playTap();

    try {
      const aiResponse = await geminiStaff.parseDirective(scratchpadText.trim(), 'scratchpad');

      const rawItem: RawInputItem = {
        id: `raw-${Date.now()}`,
        type: 'scratchpad',
        title: `Memo: "${scratchpadText.trim().slice(0, 28)}..."`,
        content: scratchpadText.trim(),
        timestamp: 'Just now',
        status: 'approval_pending',
        resultingCardId: aiResponse.card.id,
      };

      soundManager.playApproveChime();
      onAddNewInput(rawItem, aiResponse.card);
      setScratchpadText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingScratchpad(false);
    }
  };

  // Upload Document
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedDocument(e.dataTransfer.files[0]);
    }
  };

  const processUploadedDocument = async (file: File) => {
    soundManager.playTap();
    const docTitle = file.name;
    const isPdf = file.type.includes('pdf');

    const aiResponse = await geminiStaff.parseDirective(
      `Process attached document: ${docTitle} (${(file.size / 1024).toFixed(1)} KB)`,
      'document'
    );

    const rawItem: RawInputItem = {
      id: `raw-${Date.now()}`,
      type: isPdf ? 'document' : 'image',
      title: docTitle,
      content: `Extracted ${docTitle} (${(file.size / 1024).toFixed(1)} KB). Formulated into Cockpit Action Card.`,
      timestamp: 'Just now',
      status: 'approval_pending',
      fileMeta: {
        name: docTitle,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || 'application/pdf',
      },
      resultingCardId: aiResponse.card.id,
    };

    soundManager.playApproveChime();
    onAddNewInput(rawItem, aiResponse.card);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Sub-Tab Navigation */}
      <div className="flex items-center justify-center">
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold w-full max-w-xs justify-center">
          <button
            onClick={() => { soundManager.playTap(); setSubTab('capture'); }}
            className={`flex-1 py-1.5 px-3 rounded-xl transition text-center ${
              subTab === 'capture' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎙️ Capture
          </button>
          <button
            onClick={() => { soundManager.playTap(); setSubTab('feed'); }}
            className={`flex-1 py-1.5 px-3 rounded-xl transition text-center ${
              subTab === 'feed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Feed ({inputs.length})
          </button>
        </div>
      </div>

      {/* SUB-PAGE 1: CAPTURE (VOICE, DROPZONE, MEMO) */}
      {subTab === 'capture' && (
        <div className="space-y-4 animate-fade-in">
          {/* Central Voice Capture */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center shadow-xl">
            <div className="my-2">
              {isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleStopAndDelegate}
                    className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-2xl ring-8 ring-rose-500/20 animate-pulse transition"
                  >
                    <Square className="w-8 h-8 text-white fill-white" />
                  </button>
                  <div className="text-xs font-mono font-bold text-rose-300">
                    00:{recordingDuration.toString().padStart(2, '0')} / 00:30
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleStartRecording}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-600/30 ring-6 ring-indigo-500/20 active:scale-95 transition"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </button>
                  <span className="text-xs font-semibold text-slate-300">
                    Tap to record voice directive
                  </span>
                </div>
              )}
            </div>

            <textarea
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              placeholder="Speak or type directive..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none h-16 mb-2"
            />

            <button
              onClick={handleStopAndDelegate}
              disabled={isProcessingVoice || (!isRecording && !voiceTranscript.trim())}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
            >
              {isProcessingVoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Delegate to Staff</span>
            </button>
          </div>

          {/* Quick Drop & Memo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                isDragging ? 'border-indigo-400 bg-indigo-950/20' : 'border-slate-800'
              }`}
            >
              <div className="text-xs font-bold text-teal-400 mb-2">📄 Drop Document / Bill</div>
              <label className="border-2 border-dashed border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-600 transition bg-slate-950/40">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processUploadedDocument(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-teal-400 mb-1" />
                <span className="text-xs font-semibold text-slate-300">Tap to Upload</span>
                <span className="text-[10px] text-slate-500">PDF, JPG, PNG</span>
              </label>
            </div>

            {/* Quick Scratchpad */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div className="text-xs font-bold text-amber-400 mb-2">📝 Scratchpad Memo</div>
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Quick notes or links..."
                className="w-full h-16 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none mb-2"
              />
              <button
                onClick={handleDelegateScratchpad}
                disabled={!scratchpadText.trim() || isProcessingScratchpad}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Memo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 2: INGESTION FEED */}
      {subTab === 'feed' && (
        <div className="space-y-2.5 animate-fade-in">
          {inputs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No directives logged yet. Record a voice memo or drop a document.
            </div>
          ) : (
            inputs.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs shadow-md"
              >
                <div className="truncate pr-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{item.timestamp}</span>
                  </div>
                  <div className="text-slate-400 text-xs truncate">{item.content}</div>

                  {item.audioBlobUrl && (
                    <div className="mt-2">
                      <audio src={item.audioBlobUrl} controls className="h-7 w-full max-w-[240px]" />
                    </div>
                  )}
                </div>

                {item.resultingCardId && onNavigateToCard && (
                  <button
                    onClick={() => onNavigateToCard(item.resultingCardId!)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 transition shrink-0"
                    title="View Action Card in Cockpit"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
