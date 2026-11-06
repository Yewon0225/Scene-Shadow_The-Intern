import { useState, useRef, useEffect, useCallback } from 'react';
import { storeAudioRecording, getAudioRecording } from '../services/storage';

interface UseAudioRecorderProps {
  sentenceId: number;
  onRecordingComplete?: (blob: Blob) => void;
}

export function useAudioRecorder({ sentenceId, onRecordingComplete }: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMicDenied, setIsMicDenied] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Check if sentence already has a recording in memory
  useEffect(() => {
    const existingBlob = getAudioRecording(sentenceId);
    if (existingBlob) {
      setHasRecording(true);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = URL.createObjectURL(existingBlob);
    } else {
      setHasRecording(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    }

    return () => {
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
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
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine supported mimeType
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        // Store latest recording per sentence in memory
        storeAudioRecording(sentenceId, audioBlob);
        setHasRecording(true);

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(audioBlob);

        // Stop all audio tracks to turn off mic indicator
        stream.getTracks().forEach((track) => track.stop());

        setIsRecording(false);
        onRecordingComplete?.(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      return true;
    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setIsMicDenied(true);
      setIsRecording(false);
      return false;
    }
  }, [sentenceId, onRecordingComplete]);

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

  const playRecordedAudio = useCallback(() => {
    if (!audioUrlRef.current) return;

    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }

    const audio = new Audio(audioUrlRef.current);
    audioPlaybackRef.current = audio;
    setIsPlayingRecorded(true);

    audio.onended = () => {
      setIsPlayingRecorded(false);
    };

    audio.onerror = () => {
      setIsPlayingRecorded(false);
    };

    audio.play().catch((err) => {
      console.warn('Audio playback error:', err);
      setIsPlayingRecorded(false);
    });
  }, []);

  const stopRecordedAudio = useCallback(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      setIsPlayingRecorded(false);
    }
  }, []);

  return {
    isRecording,
    isMicDenied,
    hasRecording,
    isPlayingRecorded,
    startRecording,
    stopRecording,
    playRecordedAudio,
    stopRecordedAudio,
  };
}
