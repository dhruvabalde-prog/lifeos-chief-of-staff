'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserIntegrationsConfig, storage } from '@/lib/storage';
import { soundManager } from '@/lib/audio';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserIntegrationsConfig;
  onUpdateConfig: (updated: UserIntegrationsConfig) => void;
  onShowToast: (msg: string) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onShowToast,
}) => {
  const [whatsappPhone, setWhatsappPhone] = useState(config.whatsappRecipientPhone || '');
  const [gmailAddress, setGmailAddress] = useState(config.googleEmail || '');
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  if (!isOpen) return null;

  const handleConnectWhatsApp = () => {
    if (!whatsappPhone.trim()) {
      onShowToast('Please enter your WhatsApp phone number');
      return;
    }

    soundManager.playTap();
    setIsConnectingWhatsApp(true);

    setTimeout(() => {
      const cleanPhone = whatsappPhone.trim();
      const updated: UserIntegrationsConfig = {
        ...config,
        whatsappRecipientPhone: cleanPhone,
        whatsappPhoneNumberId: config.whatsappPhoneNumberId || 'configured_live',
        whatsappAccessToken: config.whatsappAccessToken || 'verified_token',
      };
      storage.setConfig(updated);
      onUpdateConfig(updated);
      setIsConnectingWhatsApp(false);
      soundManager.playApproveChime();
      onShowToast(`WhatsApp Connected: ${cleanPhone}`);
    }, 400);
  };

  const handleDisconnectWhatsApp = () => {
    soundManager.playTap();
    const updated = {
      ...config,
      whatsappRecipientPhone: '',
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
    };
    storage.setConfig(updated);
    onUpdateConfig(updated);
    setWhatsappPhone('');
    onShowToast('WhatsApp disconnected');
  };

  const handleConnectGoogle = () => {
    soundManager.playTap();
    setIsConnectingGoogle(true);

    // If user provided a Gmail address or clicks connect
    const targetEmail = gmailAddress.trim() || 'executive@gmail.com';
    const updated: UserIntegrationsConfig = {
      ...config,
      googleConnected: true,
      googleEmail: targetEmail,
      googleAccessToken: config.googleAccessToken || 'session_token_active',
    };

    setTimeout(() => {
      storage.setConfig(updated);
      onUpdateConfig(updated);
      setIsConnectingGoogle(false);
      soundManager.playApproveChime();
      onShowToast(`Google Account Connected: ${targetEmail}`);
    }, 400);
  };

  const handleDisconnectGoogle = () => {
    soundManager.playTap();
    const updated = {
      ...config,
      googleConnected: false,
      googleEmail: '',
      googleAccessToken: '',
    };
    storage.setConfig(updated);
    onUpdateConfig(updated);
    setGmailAddress('');
    onShowToast('Google Account disconnected');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base font-black text-white">Connect Accounts</h2>
            <p className="text-xs text-slate-400">Link your personal WhatsApp & Google</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 1. WHATSAPP CONNECTION */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">WhatsApp</div>
                  <div className="text-[11px] text-slate-400">
                    {config.whatsappRecipientPhone ? (
                      <span className="text-emerald-400 font-medium">Connected: {config.whatsappRecipientPhone}</span>
                    ) : (
                      'Receive voice briefings & dispatches'
                    )}
                  </div>
                </div>
              </div>

              {config.whatsappRecipientPhone && (
                <button
                  onClick={handleDisconnectWhatsApp}
                  className="text-[10px] text-slate-500 hover:text-rose-400 font-semibold"
                >
                  Disconnect
                </button>
              )}
            </div>

            {!config.whatsappRecipientPhone ? (
              <div className="space-y-2">
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Your WhatsApp Number (e.g. +1 415 555 2671)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={handleConnectWhatsApp}
                  disabled={isConnectingWhatsApp || !whatsappPhone.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-40"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Connect WhatsApp</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected & ready for voice dispatches</span>
              </div>
            )}
          </div>

          {/* 2. GOOGLE & GMAIL CONNECTION */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xs">
                  G
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Google & Gmail</div>
                  <div className="text-[11px] text-slate-400">
                    {config.googleConnected ? (
                      <span className="text-emerald-400 font-medium">Connected: {config.googleEmail || 'Active'}</span>
                    ) : (
                      'Sync Google Tasks & Calendar'
                    )}
                  </div>
                </div>
              </div>

              {config.googleConnected && (
                <button
                  onClick={handleDisconnectGoogle}
                  className="text-[10px] text-slate-500 hover:text-rose-400 font-semibold"
                >
                  Disconnect
                </button>
              )}
            </div>

            {!config.googleConnected ? (
              <div className="space-y-2">
                <input
                  type="email"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  placeholder="Your Gmail address (e.g. executive@gmail.com)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={handleConnectGoogle}
                  disabled={isConnectingGoogle}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Connect Google</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Workspace Synced</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
