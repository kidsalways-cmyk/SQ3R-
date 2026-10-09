import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';

interface SpeechSpeakerProps {
  text: string;
  lang: 'zh' | 'en';
  label?: string;
  isDark?: boolean;
}

export const SpeechSpeaker: React.FC<SpeechSpeakerProps> = ({
  text,
  lang,
  label = '聽 AI 語音回饋',
  isDark = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const handleToggle = () => {
    if (!supported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/\n+/g, '，')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'zh' ? 'zh-TW' : 'en-US';
    utterance.rate = 0.95; // Gentle teacher pacing
    utterance.pitch = 1.05;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) =>
      lang === 'zh' ? v.lang.includes('zh') || v.name.includes('Yating') || v.name.includes('Mei') : v.lang.includes('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
        isPlaying
          ? 'bg-rose-500 text-white animate-pulse shadow-md'
          : isDark
          ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700'
          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
      }`}
      title={isPlaying ? '停止朗讀' : '語音朗讀'}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>{lang === 'zh' ? '停止朗讀' : 'Stop Audio'}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
