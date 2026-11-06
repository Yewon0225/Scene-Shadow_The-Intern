import React, { useState } from 'react';
import { Sentence, SentenceProgress } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from '../components/YouTubePlayer';
import { Play, Eye, EyeOff, CheckCircle2, ChevronRight, Settings, ArrowLeft } from 'lucide-react';

interface Props {
  sentences: Sentence[];
  progress: Record<number, SentenceProgress>;
  playerRef: React.RefObject<YouTubePlayerHandle | null>;
  onSelectSentence: (index: number) => void;
  onGoToEdit: () => void;
  onGoToHome: () => void;
}

export const SentenceListScreen: React.FC<Props> = ({
  sentences,
  progress,
  playerRef,
  onSelectSentence,
  onGoToEdit,
  onGoToHome,
}) => {
  const [hideAllText, setHideAllText] = useState(false);

  const getStatusIcon = (status?: string) => {
    if (status === 'done') {
      return (
        <span className="text-amber-500 font-bold text-base flex items-center gap-1" title="Done / 완료">
          ★ <span className="text-xs font-semibold text-neutral-800">Done</span>
        </span>
      );
    }
    if (status === 'practiced') {
      return (
        <span className="text-blue-600 font-bold text-base flex items-center gap-1" title="Practiced / 연습함">
          ◐ <span className="text-xs font-semibold text-neutral-800">Practiced</span>
        </span>
      );
    }
    return (
      <span className="text-neutral-400 font-bold text-base flex items-center gap-1" title="Not started / 미시작">
        ☆ <span className="text-xs font-normal text-neutral-400">New</span>
      </span>
    );
  };

  const completedCount = sentences.filter((s) => progress[s.id]?.status === 'done').length;
  const practicedCount = sentences.filter((s) => progress[s.id]?.status === 'practiced').length;

  return (
    <div className="w-full flex flex-col gap-4 py-2 pb-12 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onGoToHome}
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium py-1 px-2 rounded-lg hover:bg-neutral-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home / 시작화면</span>
        </button>

        <button
          onClick={onGoToEdit}
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium py-1 px-2 rounded-lg hover:bg-neutral-100 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Edit Sentences / 편집</span>
        </button>
      </div>

      {/* Video Player at top */}
      <YouTubePlayer ref={playerRef} />

      {/* Summary / Progress Tracker */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Scene Sentences / 대사 목록</h2>
          <p className="text-xs text-neutral-500">
            {completedCount} completed · {practicedCount} in progress · {sentences.length} total
          </p>
        </div>

        {sentences.length > 0 && (
          <button
            onClick={() => setHideAllText(!hideAllText)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            {hideAllText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{hideAllText ? 'Show Text / 보기' : 'Hide Text / 숨기기'}</span>
          </button>
        )}
      </div>

      {/* Sentence Cards */}
      {sentences.length === 0 ? (
        <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-8 text-center my-4">
          <p className="text-neutral-700 font-medium mb-3">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <button
            onClick={onGoToEdit}
            className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 cursor-pointer"
          >
            Edit Sentences / 문장 추가하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sentences.map((sentence, index) => {
            const p = progress[sentence.id];
            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(index)}
                className="group bg-white border border-neutral-200 hover:border-neutral-400 rounded-xl p-3.5 sm:p-4 transition-all shadow-xs hover:shadow-sm cursor-pointer flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-neutral-950 text-white font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {sentence.speaker}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {sentence.start.toFixed(1)}s – {sentence.end.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(p?.status)}
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Sentence text */}
                <div className="mt-0.5">
                  {hideAllText ? (
                    <div className="h-6 bg-neutral-100 rounded-md animate-pulse flex items-center px-3 text-xs text-neutral-400 italic">
                      [Text hidden for listening focus / 문장 숨김]
                    </div>
                  ) : (
                    <p className="text-base font-medium text-neutral-900 leading-snug">
                      {sentence.text}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                    {sentence.korean}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Button */}
      {sentences.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => onSelectSentence(0)}
            className="w-full min-h-[52px] py-3 px-6 rounded-xl bg-neutral-950 text-white font-bold text-base hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start from Sentence #1 / 첫 번째 문장부터 시작</span>
          </button>
        </div>
      )}
    </div>
  );
};
