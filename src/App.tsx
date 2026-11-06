import React, { useState, useEffect, useRef } from 'react';
import { Sentence, SentenceProgress, MOVIE_DATA } from './types';
import {
  loadSentences,
  saveSentences,
  resetSentencesToDefault,
  loadProgress,
  saveProgress,
  updateSentenceProgress,
  getOrCreateSentenceProgress,
} from './services/storage';
import { StartScreen } from './screens/StartScreen';
import { SentenceListScreen } from './screens/SentenceListScreen';
import { ShadowPracticeScreen } from './screens/ShadowPracticeScreen';
import { EditSentencesScreen } from './screens/EditSentencesScreen';
import { FinishScreen } from './screens/FinishScreen';
import { YouTubePlayerHandle } from './components/YouTubePlayer';
import { Film, Volume2, Sparkles } from 'lucide-react';

type ScreenType = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('start');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [progress, setProgress] = useState<Record<number, SentenceProgress>>({});
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);

  // Shared ref for sentence list player if needed
  const listPlayerRef = useRef<YouTubePlayerHandle>(null);

  // Initial load
  useEffect(() => {
    const loadedSentences = loadSentences();
    const loadedProgress = loadProgress();
    setSentences(loadedSentences);
    setProgress(loadedProgress);
  }, []);

  // Handler to update sentence progress
  const handleUpdateProgress = (sentenceId: number, updater: (prev: SentenceProgress) => SentenceProgress) => {
    const updated = updateSentenceProgress(sentenceId, updater);
    setProgress(updated);
  };

  // Handler to save modified sentences
  const handleSaveSentences = (updated: Sentence[]) => {
    setSentences(updated);
    saveSentences(updated);
  };

  // Handler to reset sentences to default
  const handleResetDefaults = () => {
    const defaults = resetSentencesToDefault();
    setSentences(defaults);
  };

  // Navigation handlers
  const handleStartPractice = () => {
    setScreen('list');
  };

  const handleSelectSentence = (index: number) => {
    setCurrentSentenceIndex(index);
    setScreen('practice');
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      setScreen('finish');
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const handlePracticeAgain = (sentenceIndex: number) => {
    setCurrentSentenceIndex(sentenceIndex);
    setScreen('practice');
  };

  const handleRestartAll = () => {
    setCurrentSentenceIndex(0);
    setScreen('practice');
  };

  const activeSentence = sentences[currentSentenceIndex];

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-start text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white sm:py-6">
      {/* Centered Mobile Container: Max 480px Portrait */}
      <main className="w-full max-w-[480px] min-h-screen sm:min-h-[860px] bg-white sm:rounded-3xl sm:shadow-xl sm:border sm:border-neutral-200/80 flex flex-col px-4 sm:px-5 relative overflow-hidden">
        {/* Compact App Header */}
        <header className="py-3 border-b border-neutral-100 flex items-center justify-between select-none">
          <div
            onClick={() => setScreen('start')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-neutral-800 transition-colors">
              <Film className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-neutral-950 font-serif">
                Scene Shadow
              </span>
              <span className="text-[11px] font-normal text-neutral-500 ml-1.5">
                {MOVIE_DATA.titleEn}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {screen !== 'start' && (
              <button
                onClick={() => setScreen('start')}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 px-2 py-1 rounded-md hover:bg-neutral-100 cursor-pointer"
              >
                Home
              </button>
            )}
            {screen !== 'list' && (
              <button
                onClick={() => setScreen('list')}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 px-2 py-1 rounded-md hover:bg-neutral-100 cursor-pointer"
              >
                Sentences
              </button>
            )}
          </div>
        </header>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col">
          {screen === 'start' && (
            <StartScreen
              onStart={handleStartPractice}
              onEdit={() => setScreen('edit')}
              sentenceCount={sentences.length}
            />
          )}

          {screen === 'list' && (
            <SentenceListScreen
              sentences={sentences}
              progress={progress}
              playerRef={listPlayerRef}
              onSelectSentence={handleSelectSentence}
              onGoToEdit={() => setScreen('edit')}
              onGoToHome={() => setScreen('start')}
            />
          )}

          {screen === 'practice' && activeSentence && (
            <ShadowPracticeScreen
              key={activeSentence.id}
              sentence={activeSentence}
              index={currentSentenceIndex}
              totalSentences={sentences.length}
              progress={getOrCreateSentenceProgress(activeSentence.id, progress)}
              onUpdateProgress={(updater) => handleUpdateProgress(activeSentence.id, updater)}
              onPrev={handlePrevSentence}
              onNext={handleNextSentence}
              onGoToList={() => setScreen('list')}
              onFinish={() => setScreen('finish')}
            />
          )}

          {screen === 'edit' && (
            <EditSentencesScreen
              sentences={sentences}
              onSaveSentences={handleSaveSentences}
              onResetDefaults={handleResetDefaults}
              onBack={() => setScreen('list')}
            />
          )}

          {screen === 'finish' && (
            <FinishScreen
              sentences={sentences}
              progress={progress}
              onPracticeAgainSentence={handlePracticeAgain}
              onRestartAll={handleRestartAll}
              onGoToList={() => setScreen('list')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
