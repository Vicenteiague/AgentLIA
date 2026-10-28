/**
 * Audio helper utilities for recording and generating audible test samples
 */

export function createSampleVoiceAudioUrl(): string {
  // Generate a minimal valid WAV audio file with pleasant tones simulating speech
  const sampleRate = 8000;
  const durationSec = 3;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  // RIFF identifier
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate, true); // ByteRate (SampleRate * 1)
  view.setUint16(32, 1, true); // BlockAlign (1)
  view.setUint16(34, 8, true); // BitsPerSample (8)
  writeString(36, 'data');
  view.setUint32(40, numSamples, true);

  // Generate pleasant soft modulated audio mimicking speech cadences
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Modulated frequency around human speech pitch (180Hz - 260Hz)
    const pitch = 220 + 40 * Math.sin(2 * Math.PI * 3 * t);
    const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t);
    const sample = Math.sin(2 * Math.PI * pitch * t) * envelope;
    // 8-bit unsigned PCM: 0-255, center 128
    view.setUint8(44 + i, Math.floor(128 + sample * 60));
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
