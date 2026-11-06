import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, SentenceProgress, ShadowStep, SelfCheckRating } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from '../components/YouTubePlayer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  Play,
  Pause,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Mic,
  Square,
  Volume2,
  CheckCircle,
  Sparkles,
  HelpCircle,
  RotateCcw,
  List,
  AlertTriangle,
  Smile,
  Meh,
  Check,
} from 'lucide-react';

interface Props {
  sentence: Sentence;
  index: number;
  totalSentences: number;
  progress: SentenceProgress;
  onUpdateProgress: (updater: (prev: SentenceProgress) => SentenceProgress) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToList: () => void;
  onFinish: () => void;
}

const STEP_INFO: Record<
  ShadowStep,
  { titleEn: string; titleKo: string; descEn: string; descKo: string; defaultHide: boolean }
> = {
  1: {
    titleEn: 'Step 1: Listen',
    titleKo: '1단계: 듣기',
    descEn: 'Text hidden. Just listen to the scene 2–3 times to catch the rhythm.',
    descKo: '문장을 숨긴 채 원어민의 자연스러운 호흡과 리듬을 2~3회 집중해서 듣습니다.',
    defaultHide: true,
  },
  2: {
    titleEn: 'Step 2: Mumble',
    titleKo: '2단계: 웅얼거리기',
    descEn: 'Text hidden. Quietly hum and follow the sounds and stress points.',
    descKo: '소리를 듣고 작은 소리로 입을 웅얼거리며 억양과 강세를 따라가 봅니다.',
    defaultHide: true,
  },
  3: {
    titleEn: 'Step 3: Read & Shadow',
    titleKo: '3단계: 읽으며 쉐도잉',
    descEn: 'Text shown. Speak aloud along with the actor, noticing bold stress words.',
    descKo: '문장을 보면서 배우의 음성에 맞춰 굵은 글씨(강세)를 힘주어 함께 말합니다.',
    defaultHide: false,
  },
  4: {
    titleEn: 'Step 4: Shadow',
    titleKo: '4단계: 실전 쉐도잉',
    descEn: 'Text hidden. Speak together with the video like a real shadow!',
    descKo: '자막 없이 배우의 목소리와 완벽한 타이밍으로 동시에 말해보세요!',
    defaultHide: true,
  },
};

export const ShadowPracticeScreen: React.FC<Props> = ({
  sentence,
  index,
  totalSentences,
  progress,
  onUpdateProgress,
  onPrev,
  onNext,
  onGoToList,
  onFinish,
}) => {
  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Practice state
  const [currentStep, setCurrentStep] = useState<ShadowStep>(1);
  const [isTextHidden, setIsTextHidden] = useState(STEP_INFO[1].defaultHide);
  const [isKoreanHidden, setIsKoreanHidden] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Audio Recorder hook
  const {
    isRecording,
    isMicDenied,
    hasRecording,
    isPlayingRecorded,
    startRecording,
    stopRecording,
    playRecordedAudio,
    stopRecordedAudio,
  } = useAudioRecorder({
    sentenceId: sentence.id,
    onRecordingComplete: () => {
      // Mark as practiced
      onUpdateProgress((prev) => ({
        ...prev,
        recordings: prev.recordings + 1,
        status: currentStep === 4 ? 'done' : prev.status === 'new' ? 'practiced' : prev.status,
      }));
    },
  });

  // Speech Recognition hook for Word Check
  const {
    isSupported: isSpeechSupported,
    isListening: isCheckingWords,
    result: wordCheckResult,
    error: speechError,
    startCheck: startWordCheck,
    stopCheck: stopWordCheck,
    clearResult: clearWordCheck,
  } = useSpeechRecognition();

  // Reset or adjust states when sentence changes
  useEffect(() => {
    setIsTextHidden(STEP_INFO[currentStep].defaultHide);
    clearWordCheck();
  }, [sentence.id, currentStep, clearWordCheck]);

  // Handle Step change
  const handleStepSelect = (step: ShadowStep) => {
    setCurrentStep(step);
    setIsTextHidden(STEP_INFO[step].defaultHide);
  };

  // Play sentence clip
  const handlePlaySegment = (loopOverride?: boolean) => {
    if (!playerRef.current) return;
    const loop = loopOverride !== undefined ? loopOverride : isLooping;
    setIsPlayingVideo(true);

    // Track play count
    onUpdateProgress((prev) => ({ ...prev, plays: prev.plays + 1 }));

    playerRef.current.playSegment(sentence.start, sentence.end, loop, () => {
      if (!loop) {
        setIsPlayingVideo(false);
      }
    });
  };

  const handlePause = () => {
    if (!playerRef.current) return;
    playerRef.current.pause();
    setIsPlayingVideo(false);
  };

  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (isPlayingVideo) {
      handlePlaySegment(nextLoop);
    }
  };

  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current) {
      playerRef.current.setSpeed(speed);
    }
  };

  // Synchronized Recording:
  // Plays the sentence once and records the learner's voice at the same time.
  // Recording automatically stops 1 second after sentence ends.
  const recordTimeoutRef = useRef<any>(null);

  const handleStartRecord = async () => {
    if (isRecording) {
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
      stopRecording();
      handlePause();
      return;
    }

    const micGranted = await startRecording();
    if (!micGranted) {
      return;
    }

    // Play the segment once (loop ignored during recording)
    handlePlaySegment(false);

    // Duration of segment + 1 second buffer
    const segmentDurationMs = Math.max(500, (sentence.end - sentence.start) / playbackSpeed * 1000);
    const totalRecordTimeMs = segmentDurationMs + 1000;

    recordTimeoutRef.current = setTimeout(() => {
      stopRecording();
      handlePause();
    }, totalRecordTimeMs);
  };

  // Play Original Clip for side-by-side comparison
  const handlePlayOriginal = () => {
    handlePlaySegment(false);
  };

  // Handle Self-Check ratings
  const handleRate = (questionIndex: 0 | 1 | 2, rating: SelfCheckRating) => {
    onUpdateProgress((prev) => {
      const nextSelfCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating] = [
        ...prev.selfCheck,
      ];
      nextSelfCheck[questionIndex] = rating;

      // If user has recorded and completed ratings, evaluate if done
      let nextStatus = prev.status;
      if (prev.recordings > 0 && currentStep === 4) {
        nextStatus = 'done';
      } else if (prev.recordings > 0 && prev.status === 'new') {
        nextStatus = 'practiced';
      }

      return {
        ...prev,
        selfCheck: nextSelfCheck,
        status: nextStatus,
      };
    });
  };

  // Highlight bold stress words in English text
  const renderFormattedSentence = () => {
    if (isTextHidden) {
      return (
        <div className="py-6 px-4 bg-neutral-100/90 rounded-2xl border border-dashed border-neutral-300 text-center select-none">
          <p className="text-base text-neutral-500 font-medium flex items-center justify-center gap-2">
            <EyeOff className="w-5 h-5 text-neutral-400" />
            <span>Text is hidden for shadowing focus</span>
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            자막 없이 귀로만 듣고 따라 해보세요 (필요하면 아래 '보기' 버튼 클릭)
          </p>
        </div>
      );
    }

    // Parse words and highlight stress words
    const stressTokens = (sentence.stress || []).map((s) => s.toLowerCase().trim());
    const words = sentence.text.split(/(\s+)/);

    return (
      <div className="text-2xl sm:text-[26px] font-medium text-neutral-900 leading-relaxed tracking-normal p-2">
        {words.map((word, i) => {
          if (!word.trim()) return <span key={i}>{word}</span>;
          const clean = word.toLowerCase().replace(/[^a-z0-9']/g, '').trim();
          const isStressed = stressTokens.some(
            (s) => s === clean || s.includes(clean) || clean.includes(s)
          );

          if (isStressed) {
            return (
              <span
                key={i}
                className="font-black text-black underline decoration-neutral-900 decoration-3 underline-offset-6 bg-amber-100/60 px-1 py-0.5 rounded-sm"
                title="Stressed word / 강세 단어"
              >
                {word}
              </span>
            );
          }
          return <span key={i}>{word}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 py-2 pb-14 animate-in fade-in duration-300">
      {/* Top Bar with Sentence Counter & Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onGoToList}
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium py-1.5 px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer shadow-2xs"
        >
          <List className="w-3.5 h-3.5" />
          <span>All Sentences / 목록</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="w-8 h-8 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Previous Sentence"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-neutral-900 px-2 font-mono">
            Sentence {index + 1} / {totalSentences}
          </span>

          <button
            onClick={onNext}
            disabled={index === totalSentences - 1}
            className="w-8 h-8 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Next Sentence"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Video Player (16:9) with One-Line Credit Underneath */}
      <YouTubePlayer
        ref={playerRef}
        playbackRate={playbackSpeed}
        showCredit={true}
      />

      {/* 6. Step Guide (4 tabs in order) */}
      <div className="bg-neutral-100 p-1 rounded-xl grid grid-cols-4 gap-1 text-center">
        {([1, 2, 3, 4] as ShadowStep[]).map((step) => {
          const isActive = currentStep === step;
          return (
            <button
              key={step}
              onClick={() => handleStepSelect(step)}
              className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center cursor-pointer ${
                isActive
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
              }`}
            >
              <span>{step === 1 ? '1. Listen' : step === 2 ? '2. Mumble' : step === 3 ? '3. Read' : '4. Shadow'}</span>
              <span className={`text-[10px] font-normal ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                {step === 1 ? '듣기' : step === 2 ? '웅얼' : step === 3 ? '읽기' : '실전'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Instruction Line (English + Korean) */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col gap-0.5 shadow-2xs">
        <p className="text-xs font-bold text-neutral-900">
          {STEP_INFO[currentStep].titleEn} · {STEP_INFO[currentStep].titleKo}
        </p>
        <p className="text-xs text-neutral-700 font-medium">
          {STEP_INFO[currentStep].descEn}
        </p>
        <p className="text-[11px] text-neutral-500">
          {STEP_INFO[currentStep].descKo}
        </p>
      </div>

      {/* 3 & 4. Sentence Box (Large font >= 22px, Stress in bold, Hide toggle, Korean meaning) */}
      <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-neutral-900 text-white font-bold text-xs font-mono">
              #{index + 1}
            </span>
            <span className="text-sm font-bold text-neutral-800">
              {sentence.speaker}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              ({sentence.start.toFixed(1)}s – {sentence.end.toFixed(1)}s)
            </span>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTextHidden(!isTextHidden)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              {isTextHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isTextHidden ? 'Show / 보기' : 'Hide / 숨김'}</span>
            </button>
          </div>
        </div>

        {/* English Sentence with Stress formatting */}
        <div className="min-h-[70px] flex items-center justify-center text-center">
          {renderFormattedSentence()}
        </div>

        {/* Korean Meaning (small, gray, can be hidden) */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex-1">
            {isKoreanHidden ? (
              <span className="text-neutral-400 italic">[Korean meaning hidden / 해석 숨김]</span>
            ) : (
              <p className="text-neutral-600 font-medium leading-relaxed">{sentence.korean}</p>
            )}
          </div>
          <button
            onClick={() => setIsKoreanHidden(!isKoreanHidden)}
            className="text-[11px] text-neutral-400 hover:text-neutral-700 underline underline-offset-2 ml-2 cursor-pointer flex-shrink-0"
          >
            {isKoreanHidden ? 'Show / 해석보기' : 'Hide / 해석숨김'}
          </button>
        </div>
      </div>

      {/* 5. Control Row: Play, Loop, Speed (0.5x, 0.75x, 1.0x) */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        {/* Play / Pause button */}
        <button
          onClick={isPlayingVideo ? handlePause : () => handlePlaySegment()}
          className="min-h-[48px] px-5 rounded-xl bg-neutral-950 text-white font-bold text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer flex-1 justify-center sm:flex-initial"
        >
          {isPlayingVideo ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause / 일시정지</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Play / 재생</span>
            </>
          )}
        </button>

        {/* Loop toggle */}
        <button
          onClick={handleToggleLoop}
          className={`min-h-[48px] px-4 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
            isLooping
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
          }`}
          title="Repeat with 1.5s pause for learner to speak"
        >
          <Repeat className={`w-4 h-4 ${isLooping ? 'animate-spin' : ''}`} />
          <div className="flex flex-col text-left">
            <span>Loop {isLooping ? 'ON' : 'OFF'}</span>
            <span className="text-[10px] opacity-80">반복재생</span>
          </div>
        </button>

        {/* Speed buttons (0.5x / 0.75x / 1.0x) */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
          {[0.5, 0.75, 1.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedSelect(rate)}
              className={`min-h-[40px] px-2.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                playbackSpeed === rate
                  ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {rate}×
            </button>
          ))}
        </div>
      </div>

      {/* 7. Record Area (At least 48px buttons, English with small Korean below) */}
      <div className="bg-neutral-50 border-2 border-neutral-300 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Mic className={`w-4 h-4 ${isRecording ? 'text-red-600 animate-pulse' : 'text-neutral-800'}`} />
            <h3 className="font-bold text-sm text-neutral-900">
              Voice Shadowing / 녹음 및 확인
            </h3>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Recording & Shadowing...
            </span>
          )}
        </div>

        {/* Mic Denied Notification */}
        {isMicDenied && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mic is off. You can still listen and shadow out loud.</p>
              <p className="text-[11px] text-amber-800">
                마이크 권한이 꺼져 있습니다. 브라우저 주소창 자물쇠 아이콘에서 허용하거나 소리 내어 연습해보세요.
              </p>
            </div>
          </div>
        )}

        {/* Record Button */}
        <button
          onClick={handleStartRecord}
          className={`w-full min-h-[52px] py-3 px-4 rounded-xl font-bold text-base transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm active:scale-[0.99] ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-200'
              : 'bg-neutral-950 hover:bg-neutral-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />}
            <span>{isRecording ? 'Stop Recording' : 'Record & Shadow'}</span>
          </div>
          <span className="text-[11px] font-normal text-neutral-300">
            {isRecording ? '녹음 중지' : '문장 재생과 동시에 내 목소리 녹음하기'}
          </span>
        </button>

        {/* Playback Buttons: My Voice & Original */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={isPlayingRecorded ? stopRecordedAudio : playRecordedAudio}
            disabled={!hasRecording}
            className={`min-h-[48px] py-2 px-3 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
              hasRecording
                ? 'bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-100 shadow-2xs'
                : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingRecorded ? 'Stop Voice' : '▶ My Voice'}</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-normal">
              {isPlayingRecorded ? '음성 정지' : '내 녹음 듣기'}
            </span>
          </button>

          <button
            onClick={handlePlayOriginal}
            className="min-h-[48px] py-2 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 flex flex-col items-center justify-center cursor-pointer shadow-2xs transition-all"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Play className="w-3.5 h-3.5" />
              <span>▶ Original</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-normal">
              배우 원본 음성 듣기
            </span>
          </button>
        </div>
      </div>

      {/* 8. Self-Check (after recording or practicing) */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <h3 className="font-bold text-sm text-neutral-900">
            Self-Check / 스스로 점검하기
          </h3>
          <span className="text-xs text-neutral-500">
            {progress.recordings > 0 ? `${progress.recordings} takes recorded` : 'Try recording first'}
          </span>
        </div>

        <div className="space-y-3">
          {/* Question 1: Speed */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800">
                1. Did I keep up with the speed?
              </span>
              <span className="text-neutral-500 text-[11px]">속도를 잘 따라갔나요?</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'good', emoji: '😀', label: 'Great' },
                { value: 'ok', emoji: '🙂', label: 'Good' },
                { value: 'needs_work', emoji: '😐', label: 'More practice' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRate(0, opt.value as SelfCheckRating)}
                  className={`min-h-[44px] rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    progress.selfCheck[0] === opt.value
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Stress */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800">
                2. Did I stress the bold words?
              </span>
              <span className="text-neutral-500 text-[11px]">강조 단어에 힘을 주었나요?</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'good', emoji: '😀', label: 'Great' },
                { value: 'ok', emoji: '🙂', label: 'Good' },
                { value: 'needs_work', emoji: '😐', label: 'More practice' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRate(1, opt.value as SelfCheckRating)}
                  className={`min-h-[44px] rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    progress.selfCheck[1] === opt.value
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Intonation */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800">
                3. Did my voice go up and down like the actor?
              </span>
              <span className="text-neutral-500 text-[11px]">배우처럼 억양을 살렸나요?</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'good', emoji: '😀', label: 'Great' },
                { value: 'ok', emoji: '🙂', label: 'Good' },
                { value: 'needs_work', emoji: '😐', label: 'More practice' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRate(2, opt.value as SelfCheckRating)}
                  className={`min-h-[44px] rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    progress.selfCheck[2] === opt.value
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 9. Word Check (Optional / Web Speech API) */}
      {isSpeechSupported && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-neutral-900">
                Pronunciation Word Check / 발음 단어 확인
              </h4>
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">
              Web Speech AI
            </span>
          </div>

          <p className="text-xs text-neutral-600">
            마이크로 말하면 문장의 단어들이 잘 인식되었는지 친절하게 확인해 줍니다.
          </p>

          <button
            onClick={() => (isCheckingWords ? stopWordCheck() : startWordCheck(sentence.text))}
            className={`min-h-[48px] py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isCheckingWords
                ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200 animate-pulse'
                : 'bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-100 shadow-2xs'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isCheckingWords ? 'Listening... Speak now!' : 'Check My Words / 단어 인식 테스트'}</span>
          </button>

          {speechError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {speechError}
            </p>
          )}

          {wordCheckResult && (
            <div className="bg-white border border-neutral-200 rounded-xl p-3 mt-1 flex flex-col gap-2">
              <div className="text-xs font-bold text-neutral-900 flex items-center justify-between">
                <span>
                  You said {wordCheckResult.matchedCount} of {wordCheckResult.totalCount} words!
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {wordCheckResult.matchedCount === wordCheckResult.totalCount
                    ? '🎉 Perfect shadowing!'
                    : '👏 Great try! Keep shadowing!'}
                </span>
              </div>

              {/* Color coded words: matched green, missed gray with underline */}
              <div className="flex flex-wrap gap-1.5 py-1 text-sm font-medium">
                {wordCheckResult.words.map((w, idx) => (
                  <span
                    key={idx}
                    className={
                      w.isMatched
                        ? 'text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200'
                        : 'text-neutral-400 underline decoration-neutral-400 decoration-wavy px-1 py-0.5'
                    }
                  >
                    {w.originalWord}
                  </span>
                ))}
              </div>

              {wordCheckResult.spokenTranscript && (
                <p className="text-[11px] text-neutral-500 italic border-t border-neutral-100 pt-1.5">
                  Heard: "{wordCheckResult.spokenTranscript}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 10. Next Button */}
      <div className="pt-2">
        {index < totalSentences - 1 ? (
          <button
            onClick={onNext}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-neutral-950 text-white font-bold text-base hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Sentence / 다음 문장</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-neutral-950 text-white font-bold text-base hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Finish Practice / 연습 완료 결과보기</span>
          </button>
        )}
      </div>
    </div>
  );
};
