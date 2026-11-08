/**
 * Audio processing utilities to normalize, boost, and clarify recorded voice.
 */

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

/**
 * Normalizes and enhances an audio buffer so quiet voices become loud and clear
 * without clipping or distortion.
 */
export async function processAndNormalizeAudioBlob(blob: Blob): Promise<{
  audioBuffer: AudioBuffer;
  peakGain: number;
  enhancedBlob: Blob;
}> {
  const audioCtx = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const numChannels = decodedBuffer.numberOfChannels;
  const length = decodedBuffer.length;
  const sampleRate = decodedBuffer.sampleRate;

  // Create a new buffer for the normalized audio
  const normalizedBuffer = audioCtx.createBuffer(numChannels, length, sampleRate);

  // Find peak amplitude across all channels
  let peak = 0;
  for (let c = 0; c < numChannels; c++) {
    const channelData = decodedBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peak) {
        peak = abs;
      }
    }
  }

  // Calculate target gain to normalize peak to ~0.92 (-0.7 dB)
  // Limit max boost to 4.0x to avoid amplifying pure silence/noise floors excessively
  let targetGain = 1.0;
  if (peak > 0.01) {
    targetGain = Math.min(4.0, 0.92 / peak);
  }

  // Apply gain and gentle soft limiter
  for (let c = 0; c < numChannels; c++) {
    const inputData = decodedBuffer.getChannelData(c);
    const outputData = normalizedBuffer.getChannelData(c);

    for (let i = 0; i < length; i++) {
      let sample = inputData[i] * targetGain;
      // Soft saturation limiter to prevent any harsh clipping
      if (sample > 0.95) {
        sample = 0.95 + 0.05 * Math.tanh((sample - 0.95) / 0.05);
      } else if (sample < -0.95) {
        sample = -0.95 + 0.05 * Math.tanh((sample + 0.95) / 0.05);
      }
      outputData[i] = sample;
    }
  }

  // Convert normalized AudioBuffer to high-quality WAV Blob for storage/download
  const wavBlob = audioBufferToWavBlob(normalizedBuffer);

  return {
    audioBuffer: normalizedBuffer,
    peakGain: targetGain,
    enhancedBlob: wavBlob,
  };
}

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
