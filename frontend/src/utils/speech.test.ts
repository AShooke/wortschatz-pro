import { afterEach, describe, expect, it, vi } from 'vitest';

import { speakGerman } from './speech';

class MockUtterance {
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(readonly text: string) {}
}

function mockVoice(lang: string): SpeechSynthesisVoice {
  return { lang, name: lang } as SpeechSynthesisVoice;
}

function setupSpeech(voices: SpeechSynthesisVoice[]) {
  let voicesChanged: EventListener | undefined;
  const synthesis = {
    getVoices: vi.fn(() => voices),
    cancel: vi.fn(),
    speak: vi.fn(),
    addEventListener: vi.fn((_type: string, listener: EventListener) => { voicesChanged = listener; }),
    removeEventListener: vi.fn(),
  } as unknown as SpeechSynthesis;

  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
  vi.stubGlobal('window', {
    speechSynthesis: synthesis,
    SpeechSynthesisUtterance: MockUtterance,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  });

  return {
    synthesis,
    emitVoicesChanged: () => voicesChanged?.(new Event('voiceschanged')),
  };
}

describe('German speech voice selection', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sets the German locale and prefers an exact German voice', () => {
    const germanVoice = mockVoice('de-DE');
    const { synthesis } = setupSpeech([mockVoice('en-US'), mockVoice('de-AT'), germanVoice]);

    expect(speakGerman('Guten Morgen')).toBe(true);
    const utterance = vi.mocked(synthesis.speak).mock.calls[0][0] as unknown as MockUtterance;

    expect(utterance.lang).toBe('de-DE');
    expect(utterance.voice).toBe(germanVoice);
  });

  it('waits for voiceschanged when voices are initially unavailable', () => {
    const germanVoice = mockVoice('de-AT');
    let voices: SpeechSynthesisVoice[] = [];
    const { synthesis, emitVoicesChanged } = setupSpeech(voices);
    vi.mocked(synthesis.getVoices).mockImplementation(() => voices);

    expect(speakGerman('Guten Abend')).toBe(true);
    expect(synthesis.speak).not.toHaveBeenCalled();
    expect(synthesis.addEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function));

    voices = [germanVoice];
    emitVoicesChanged();

    const utterance = vi.mocked(synthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('de-DE');
    expect(utterance.voice).toBe(germanVoice);
    expect(synthesis.removeEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function));
  });
});