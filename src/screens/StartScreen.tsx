import React from 'react';
import { MOVIE_DATA } from '../types';
import { Play, ExternalLink, Sparkles, Film, ShieldCheck } from 'lucide-react';

interface Props {
  onStart: () => void;
  onEdit?: () => void;
  sentenceCount: number;
}

export const StartScreen: React.FC<Props> = ({ onStart, onEdit, sentenceCount }) => {
  return (
    <div className="w-full flex flex-col gap-6 py-4 pb-12 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-neutral-100 text-xs font-medium mb-3 shadow-xs">
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>Movie English Shadowing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-2 font-serif">
          Scene Shadow
        </h1>
        <div className="text-xl font-bold text-neutral-800 tracking-wide">
          {MOVIE_DATA.titleEn} <span className="text-sm font-normal text-neutral-500">({MOVIE_DATA.titleKo})</span>
        </div>
      </div>

      {/* Movie Scene Brief Card */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
          <span>Scene Clip · {MOVIE_DATA.year}</span>
        </div>
        <p className="text-sm text-neutral-700 leading-snug">
          {MOVIE_DATA.sceneDescription}
        </p>
        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
          <span>Characters:</span>
          <span className="font-semibold text-neutral-800">Jules (Anne Hathaway)</span>
          <span>&</span>
          <span className="font-semibold text-neutral-800">Ben (Robert De Niro)</span>
        </div>
      </div>

      {/* What is Shadowing? Card */}
      <div className="bg-white border-2 border-neutral-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-neutral-900" />
          <h2 className="text-lg font-bold text-neutral-950">
            What is Shadowing? / 쉐도잉이란?
          </h2>
        </div>
        <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
          원어민의 소리를 그림자(Shadow)처럼 아주 약간의 시차를 두고 그대로 흉내 내어 말하는 가장 효과적인 스피킹 훈련법입니다.
        </p>
        <ul className="space-y-2.5 text-sm text-neutral-700">
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center mt-0.5 border border-neutral-300">
              1
            </span>
            <div>
              <p className="font-semibold text-neutral-900">1. Listen closely / 주의 깊게 듣기</p>
              <p className="text-xs text-neutral-600">Hear the natural speed, rhythm, and pauses.</p>
              <p className="text-xs text-neutral-500">배우의 말하는 속도와 끊어 읽는 호흡을 귀담아듣습니다.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center mt-0.5 border border-neutral-300">
              2
            </span>
            <div>
              <p className="font-semibold text-neutral-900">2. Copy stress & tone / 강세와 억양 복사하기</p>
              <p className="text-xs text-neutral-600">Mumble along and copy the high & low pitch.</p>
              <p className="text-xs text-neutral-500">단어의 강세와 오르내리는 억양 멜로디를 흉내 냅니다.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center mt-0.5 border border-neutral-300">
              3
            </span>
            <div>
              <p className="font-semibold text-neutral-900">3. Speak at the same time / 동시에 말하기</p>
              <p className="text-xs text-neutral-600">Overlap your voice naturally like a shadow.</p>
              <p className="text-xs text-neutral-500">자막 없이 원어민의 음성과 거의 동시에 입을 열어 따라 말합니다.</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={onStart}
          className="w-full min-h-[56px] py-3.5 px-6 rounded-xl bg-neutral-950 text-white font-bold text-lg hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-md flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 fill-white" />
            <span>Start Practice</span>
          </div>
          <span className="text-xs font-normal text-neutral-300">
            연습 시작 ({sentenceCount} Sentences)
          </span>
        </button>
      </div>

      {/* Educational Use & Source Card (Section 0-3) */}
      <div className="bg-neutral-50 border border-neutral-300 rounded-2xl p-5 text-neutral-700 text-xs shadow-xs mt-2">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200">
          <ShieldCheck className="w-4 h-4 text-neutral-700" />
          <h3 className="font-bold text-neutral-900 text-sm">
            Educational Use & Source / 교육용 고지 및 출처
          </h3>
        </div>

        {/* Notice text */}
        <div className="space-y-2 mb-4 bg-white p-3.5 rounded-xl border border-neutral-200">
          <p className="font-semibold text-neutral-900 leading-relaxed">
            Educational use only / 교육 목적 전용
          </p>
          <p className="text-neutral-600 leading-relaxed">
            This app was made <strong>only for non-commercial English learning</strong> in the university course <em>AI and English Language Education</em> (ENG3088, Sungkyunkwan University). The film clip is used <strong>only to practice listening and speaking (shadowing)</strong>. It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.
          </p>
          <p className="text-neutral-600 leading-relaxed pt-1 border-t border-neutral-100">
            이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 <strong>비영리 영어 학습 목적으로만</strong> 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.
          </p>
        </div>

        {/* Source metadata lines */}
        <div className="grid grid-cols-1 gap-1.5 text-neutral-600 font-mono text-[11px] sm:text-xs">
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Movie Title:</span>
            <span className="font-sans font-medium text-neutral-900 text-right">
              {MOVIE_DATA.titleEn} ({MOVIE_DATA.titleKo})
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Release Year:</span>
            <span className="text-neutral-800">{MOVIE_DATA.year}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Director / Screenplay:</span>
            <span className="text-neutral-800">{MOVIE_DATA.director}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Production:</span>
            <span className="text-neutral-800">{MOVIE_DATA.production}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Distribution:</span>
            <span className="text-neutral-800">{MOVIE_DATA.distribution}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Scene:</span>
            <span className="font-sans text-neutral-800 text-right max-w-[240px] truncate" title={MOVIE_DATA.sceneDescription}>
              {MOVIE_DATA.sceneDescription}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">YouTube Title:</span>
            <span className="font-sans text-neutral-800 text-right max-w-[240px] truncate" title={MOVIE_DATA.youtubeTitle}>
              {MOVIE_DATA.youtubeTitle}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Channel:</span>
            <span className="text-neutral-800">{MOVIE_DATA.youtubeChannel}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Practice Range:</span>
            <span className="text-neutral-900 font-semibold">0:01 – 0:42</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 py-1">
            <span className="text-neutral-500 font-sans">Made by:</span>
            <span className="text-neutral-900 font-semibold">{MOVIE_DATA.author}</span>
          </div>
          <div className="pt-2 text-right">
            <a
              href={MOVIE_DATA.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-sans font-medium text-xs hover:underline"
            >
              <span>Watch full clip on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
