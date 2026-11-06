import React from 'react';
import { Sentence, SentenceProgress, MOVIE_DATA } from '../types';
import { EducationalCreditLine } from '../components/EducationalCreditLine';
import { Award, RotateCcw, List, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  sentences: Sentence[];
  progress: Record<number, SentenceProgress>;
  onPracticeAgainSentence: (sentenceIndex: number) => void;
  onRestartAll: () => void;
  onGoToList: () => void;
}

export const FinishScreen: React.FC<Props> = ({
  sentences,
  progress,
  onPracticeAgainSentence,
  onRestartAll,
  onGoToList,
}) => {
  const completedSentences = sentences.filter((s) => progress[s.id]?.status === 'done');
  const totalRecordings = Object.values(progress).reduce((acc, p) => acc + (p.recordings || 0), 0);

  // Find sentences marked with 😐 ('needs_work') in any of the 3 self-checks
  const reviewSentences = sentences
    .map((s, index) => ({ sentence: s, index, p: progress[s.id] }))
    .filter(({ p }) => p && p.selfCheck.some((rate) => rate === 'needs_work'));

  return (
    <div className="w-full flex flex-col gap-6 py-6 pb-12 animate-in fade-in duration-300">
      {/* Great Job Celebration Banner */}
      <div className="bg-white border-2 border-neutral-200 rounded-3xl p-6 text-center shadow-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center mb-3 shadow-sm">
          <Award className="w-9 h-9 text-amber-400" />
        </div>
        <h1 className="text-3xl font-black text-neutral-950 tracking-tight font-serif mb-1">
          Great job!
        </h1>
        <p className="text-sm font-semibold text-neutral-800 mb-1">
          수고하셨습니다! 쉐도잉 세션을 완료했습니다.
        </p>
        <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
          You practiced natural English lines from <em>{MOVIE_DATA.titleEn}</em> like a native speaker!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6 pt-5 border-t border-neutral-100">
          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {completedSentences.length} / {sentences.length}
            </span>
            <p className="text-xs font-semibold text-neutral-700 mt-0.5">
              Completed / 완료 문장
            </p>
          </div>

          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {totalRecordings}
            </span>
            <p className="text-xs font-semibold text-neutral-700 mt-0.5">
              Recordings / 총 녹음 횟수
            </p>
          </div>
        </div>
      </div>

      {/* Sentences marked 😐 with "Practice again" button */}
      {reviewSentences.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-300 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">😐</span>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Review & Practice Again / 다시 연습해볼 문장
              </h2>
              <p className="text-[11px] text-neutral-500">
                자가진단에서 😐(More practice)를 표시한 문장들입니다.
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-1">
            {reviewSentences.map(({ sentence, index }) => (
              <div
                key={sentence.id}
                className="bg-white border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-mono font-bold text-neutral-400">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {sentence.speaker}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral-900 truncate">
                    {sentence.text}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">
                    {sentence.korean}
                  </p>
                </div>

                <button
                  onClick={() => onPracticeAgainSentence(index)}
                  className="min-h-[44px] px-3.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-2xs"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-2">
        <button
          onClick={onRestartAll}
          className="w-full min-h-[52px] py-3 px-5 rounded-xl bg-neutral-950 text-white font-bold text-base hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Again from Beginning / 처음부터 다시 연습</span>
        </button>

        <button
          onClick={onGoToList}
          className="w-full min-h-[48px] py-2.5 px-4 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-semibold text-sm hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <List className="w-4 h-4 text-neutral-600" />
          <span>Sentence List / 문장 목록으로 가기</span>
        </button>
      </div>

      {/* Mandatory One-Line Credit at Bottom */}
      <div className="pt-4 border-t border-neutral-200">
        <EducationalCreditLine />
      </div>
    </div>
  );
};
