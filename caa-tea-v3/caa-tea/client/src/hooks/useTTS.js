import { useCallback, useRef } from 'react';

export function useTTS(lang = 'es-ES') {
  const utterRef = useRef(null);

  const speak = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang  = lang;
    u.rate  = 0.85;
    u.pitch = 1.1;

    // Prefer a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es') && v.localService);
    if (esVoice) u.voice = esVoice;

    u.onend = onEnd || null;
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }, [lang]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, stop };
}
