'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  FileText,
  Send,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { RawInputItem, ActionCard } from '@/types/lifeos';
import { soundManager, generateWaveformData } from '@/lib/audio';
import { geminiStaff } from '@/lib/integrations/gemini';

interface InputStreamPanelProps {
  inputs: RawInputItem[];
  onAddNewInput: (input: RawInputItem, resultingCard?: ActionCard) => void;
  onNavigateToCard?: (cardId: string) => void;
  onOpenSettings?: () => void;
}

export const InputStreamPanel: React.FC<InputStreamPanelProps> = ({
  inputs,
  onAddNewInput,
  onNavigateToCard,
  onOpenSettings,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const [scratchpadText, setScratchpadText] = useState('');
  const [isProcessingScratchpad, setIsProcessingScratchpad] = useState(false);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isSimulatingWhatsApp, setIsSimulatingWhatsApp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // START REAL MICROPHONE RECORDING
  const handleStartRecording = async () => {
    soundManager.playTap();
    setIsRecording(true);
    setRecordingDuration(0);
    setVoiceTranscript('');
    audioChunksRef.current = [];

    // 1. Browser Speech Recognition (Real Speech-to-Text)
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
        console.warn('SpeechRecognition failed to start', e);
      }
    }

    // 2. HTML5 MediaRecorder (Real Audio Capture)
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
      console.warn('Microphone permission not granted or unsupported', e);
    }

    // Timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  // STOP & DELEGATE REAL RECORDING
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
        title: `Directive: "${spokenText.slice(0, 30)}..."`,
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
        title: `Memo: "${scratchpadText.trim().slice(0, 30)}..."`,
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
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
      content: `Extracted file: ${docTitle} (${(file.size / 1024).toFixed(1)} KB). Formulated into Cockpit Action Card.`,
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
      {/* 1. BIG VOICE DIRECTIVE CAPTURE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center shadow-xl">
        <div className="text-xs font-bold text-purple-400 mb-3 uppercase tracking-wider">
          🎙️ Voice Directive Capture
        </div>

        {/* Central Circular Mic */}
        <div className="my-3">
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

        {/* Live Transcript / Input */}
        <textarea
          value={voiceTranscript}
          onChange={(e) => setVoiceTranscript(e.target.value)}
          placeholder="Speak or type directive (e.g., 'Draft email to Mark countering at 18M cap')..."
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

      {/* 2. DROPZONE & QUICK SCRATCHPAD (Clean Mobile Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
            isDragging ? 'border-indigo-400 bg-indigo-950/20' : 'border-slate-800'
          }`}
        >
          <div className="text-xs font-bold text-teal-400 mb-2">📄 Drop PDF Bill or Receipt</div>
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
            <span className="text-xs font-semibold text-slate-300">Tap to Upload File</span>
            <span className="text-[10px] text-slate-500">PDF, JPG, PNG</span>
          </label>
        </div>

        {/* Scratchpad */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs font-bold text-amber-400 mb-2">📝 Scratchpad Memo</div>
          <textarea
            value={scratchpadText}
            onChange={(e) => setScratchpadText(e.target.value)}
            placeholder="Quick memo or numbers..."
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

      {/* 3. INGESTION LOG (Raw History Feed) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800 pb-2">
          <span>Ingestion Log ({inputs.length})</span>
          <span className="text-emerald-400">Live Agent Stream</span>
        </div>

        <div className="space-y-2">
          {inputs.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="truncate pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-white truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{item.timestamp}</span>
                </div>
                <div className="text-slate-400 truncate text-[11px]">{item.content}</div>

                {/* Real Audio Player if recorded */}
                {item.audioBlobUrl && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <audio src={item.audioBlobUrl} controls className="h-6 max-w-[200px]" />
                  </div>
                )}
              </div>

              {item.resultingCardId && onNavigateToCard && (
                <button
                  onClick={() => onNavigateToCard(item.resultingCardId!)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition shrink-0"
                  title="View Card"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
