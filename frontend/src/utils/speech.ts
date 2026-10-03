let requestId = 0;
let cancelPendingVoiceWait: (() => void) | null = null;

export function speakGerman(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return false;
  }

  const synthesis = window.speechSynthesis;
  cancelPendingVoiceWait?.();
  const currentRequestId = ++requestId;
  synthesis.cancel();

  let timeoutId: number | undefined;
  let speakWithVoices: (voices: SpeechSynthesisVoice[]) => void = () => {};
  const cleanup = () => {
    synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (cancelPendingVoiceWait === cleanup) cancelPendingVoiceWait = null;
  };
  const handleVoicesChanged = () => {
    const voices = synthesis.getVoices();
    if (voices.length) speakWithVoices(voices);
  };

  speakWithVoices = (voices) => {
    if (currentRequestId !== requestId) {
      cleanup();
      return;
    }
    cleanup();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.88;
    const germanVoice = voices.find((voice) => voice.lang.toLowerCase() === 'de-de')
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('de'));
    if (germanVoice) utterance.voice = germanVoice;
    synthesis.speak(utterance);
  };

  cancelPendingVoiceWait = cleanup;
  const voices = synthesis.getVoices();
  if (voices.length) {
    speakWithVoices(voices);
  } else {
    synthesis.addEventListener('voiceschanged', handleVoicesChanged);
    timeoutId = window.setTimeout(() => speakWithVoices(synthesis.getVoices()), 1500);
  }

  return true;
}