import { useState, useRef, useEffect, useCallback } from 'react';
import { storeAudioRecording, getAudioRecording } from '../services/storage';
import { processAndNormalizeAudioBlob, getAudioContext } from '../utils/audioProcessing';

export type MicProfile = 'clear_voice' | 'standard';

interface UseAudioRecorderProps {
  sentenceId: number;
  onRecordingComplete?: (blob: Blob) => void;
}

export function useAudioRecorder({ sentenceId, onRecordingComplete }: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMicDenied, setIsMicDenied] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [micProfile, setMicProfile] = useState<MicProfile>('clear_voice');
  const [playbackBoost, setPlaybackBoost] = useState<number>(1.5); // Default 1.5x boost for loud, clear playback

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const cachedAudioBufferRef = useRef<AudioBuffer | null>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);

  // Load existing recording for the active sentence
  useEffect(() => {
    let isCancelled = false;
    const existingBlob = getAudioRecording(sentenceId);

    if (existingBlob) {
      setHasRecording(true);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = URL.createObjectURL(existingBlob);

      // Pre-decode into AudioBuffer for instant, boosted playback
      const audioCtx = getAudioContext();
      existingBlob
        .arrayBuffer()
        .then((buf) => audioCtx.decodeAudioData(buf))
        .then((decoded) => {
          if (!isCancelled) {
            cachedAudioBufferRef.current = decoded;
          }
        })
        .catch(() => {
          // If decoding fails, normal HTMLAudio fallback will be used
        });
    } else {
      setHasRecording(false);
      cachedAudioBufferRef.current = null;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    }

    return () => {
      isCancelled = true;
      if (activeAudioSourceRef.current) {
        try {
          activeAudioSourceRef.current.stop();
        } catch (e) {
          // ignore
        }
        setIsPlayingRecorded(false);
      }
    };
  }, [sentenceId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (activeAudioSourceRef.current) {
        try {
          activeAudioSourceRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setIsMicDenied(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsMicDenied(true);
        return false;
      }

      // Stop any prior playing audio
      if (activeAudioSourceRef.current) {
        try {
          activeAudioSourceRef.current.stop();
        } catch (e) {}
        setIsPlayingRecorded(false);
      }

      // Audio Constraints specifically tuned for simultaneous video playback + speech
      // When clear_voice is selected: echoCancellation & noiseSuppression are disabled
      // so browser does NOT duck or distort user's voice while movie sound is playing!
      let stream: MediaStream;
      const optimizedConstraints: MediaStreamConstraints = {
        audio:
          micProfile === 'clear_voice'
            ? {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true,
                channelCount: 1,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(optimizedConstraints);
      } catch (err) {
        // Fallback to basic audio constraint if device doesn't support specific flags
        console.warn('Advanced mic constraints failed, using fallback { audio: true }', err);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      rawStreamRef.current = stream;
      audioChunksRef.current = [];

      // Determine highest fidelity supported mimeType
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorderOptions: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 192000, // Crisp 192kbps vocal quality
      };

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (e) {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        const rawAudioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        // Turn off microphone tracks immediately
        stream.getTracks().forEach((track) => track.stop());
        rawStreamRef.current = null;

        let finalBlob = rawAudioBlob;
        try {
          // Normalize and enhance the voice waveform to make it clear and punchy
          const processed = await processAndNormalizeAudioBlob(rawAudioBlob);
          finalBlob = processed.enhancedBlob;
          cachedAudioBufferRef.current = processed.audioBuffer;
        } catch (normErr) {
          console.warn('Audio normalization note:', normErr);
        }

        // Store latest recording per sentence in memory
        storeAudioRecording(sentenceId, finalBlob);
        setHasRecording(true);

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(finalBlob);

        setIsRecording(false);
        setIsProcessing(false);
        onRecordingComplete?.(finalBlob);
      };

      recorder.start(100); // 100ms slice
      setIsRecording(true);
      return true;
    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setIsMicDenied(true);
      setIsRecording(false);
      return false;
    }
  }, [sentenceId, micProfile, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping recorder:', err);
      }
    }
    setIsRecording(false);
  }, []);

  // High-clarity playback with volume boost and zero latency using Web Audio API
  const playRecordedAudio = useCallback(() => {
    const audioCtx = getAudioContext();

    // Stop existing playback
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch (e) {}
      activeAudioSourceRef.current = null;
    }

    if (cachedAudioBufferRef.current) {
      const source = audioCtx.createBufferSource();
      source.buffer = cachedAudioBufferRef.current;

      // Gain Node with user-configured boost
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(playbackBoost, audioCtx.currentTime);

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      activeAudioSourceRef.current = source;
      setIsPlayingRecorded(true);

      source.onended = () => {
        setIsPlayingRecorded(false);
        activeAudioSourceRef.current = null;
      };

      source.start(0);
    } else if (audioUrlRef.current) {
      // Fallback HTML Audio
      const audio = new Audio(audioUrlRef.current);
      audio.volume = 1.0;
      setIsPlayingRecorded(true);

      audio.onended = () => {
        setIsPlayingRecorded(false);
      };
      audio.onerror = () => {
        setIsPlayingRecorded(false);
      };
      audio.play().catch(() => {
        setIsPlayingRecorded(false);
      });
    }
  }, [playbackBoost]);

  const stopRecordedAudio = useCallback(() => {
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch (e) {}
      activeAudioSourceRef.current = null;
    }
    setIsPlayingRecorded(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    isMicDenied,
    hasRecording,
    isPlayingRecorded,
    micProfile,
    setMicProfile,
    playbackBoost,
    setPlaybackBoost,
    startRecording,
    stopRecording,
    playRecordedAudio,
    stopRecordedAudio,
  };
}
