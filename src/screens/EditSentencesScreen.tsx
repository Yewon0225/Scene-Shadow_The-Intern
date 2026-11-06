import React, { useState, useRef } from 'react';
import { Sentence, MOVIE_DATA } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from '../components/YouTubePlayer';
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';

interface Props {
  sentences: Sentence[];
  onSaveSentences: (updated: Sentence[]) => void;
  onResetDefaults: () => void;
  onBack: () => void;
}

export const EditSentencesScreen: React.FC<Props> = ({
  sentences,
  onSaveSentences,
  onResetDefaults,
  onBack,
}) => {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(MOVIE_DATA.practiceStart);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [speaker, setSpeaker] = useState('Jules');
  const [text, setText] = useState('');
  const [korean, setKorean] = useState('');
  const [stressText, setStressText] = useState('');
  const [startSec, setStartSec] = useState<number>(MOVIE_DATA.practiceStart);
  const [endSec, setEndSec] = useState<number>(MOVIE_DATA.practiceStart + 2.5);
  const [formError, setFormError] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);

  // Import / Export state
  const [showJsonModal, setShowJsonModal] = useState<'export' | 'import' | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Set start / end to current video time
  const handleSetStartNow = () => {
    if (playerRef.current) {
      const time = Number(playerRef.current.getCurrentTime().toFixed(1));
      setStartSec(time);
      validateTimesAndLength(time, endSec, text);
    }
  };

  const handleSetEndNow = () => {
    if (playerRef.current) {
      const time = Number(playerRef.current.getCurrentTime().toFixed(1));
      setEndSec(time);
      validateTimesAndLength(startSec, time, text);
    }
  };

  const handleTestSegment = () => {
    if (playerRef.current && endSec > startSec) {
      playerRef.current.playSegment(startSec, endSec, false);
    }
  };

  // Validation function
  const validateTimesAndLength = (start: number, end: number, sentenceText: string) => {
    setFormError(null);
    setFormWarning(null);

    if (start < MOVIE_DATA.practiceStart) {
      setFormError(`Start time must be at or after ${MOVIE_DATA.practiceStart.toFixed(1)}s.`);
      return false;
    }
    if (end > MOVIE_DATA.practiceEnd) {
      setFormError(`End time cannot exceed practice range ${MOVIE_DATA.practiceEnd.toFixed(1)}s.`);
      return false;
    }
    if (end <= start) {
      setFormError('End time must be strictly greater than start time.');
      return false;
    }

    // Warnings
    const duration = end - start;
    const wordCount = sentenceText.trim().split(/\s+/).filter(Boolean).length;
    if (duration > 4.0 || wordCount > 12) {
      setFormWarning(
        `Tip: For best shadowing, keep sentences under 4s & 12 words (current: ${duration.toFixed(1)}s, ${wordCount} words).`
      );
    }

    return true;
  };

  const handleStartEdit = (s: Sentence) => {
    setEditingId(s.id);
    setSpeaker(s.speaker);
    setText(s.text);
    setKorean(s.korean);
    setStressText((s.stress || []).join(', '));
    setStartSec(s.start);
    setEndSec(s.end);
    setFormError(null);
    setFormWarning(null);
    // seek player
    playerRef.current?.seekTo(s.start);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSpeaker('Jules');
    setText('');
    setKorean('');
    setStressText('');
    setStartSec(MOVIE_DATA.practiceStart);
    setEndSec(MOVIE_DATA.practiceStart + 2.5);
    setFormError(null);
    setFormWarning(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setFormError('Please enter the English sentence text.');
      return;
    }

    if (!validateTimesAndLength(startSec, endSec, text)) {
      return;
    }

    const parsedStress = stressText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId !== null) {
      // Update existing
      const updated = sentences.map((s) =>
        s.id === editingId
          ? {
              ...s,
              speaker: speaker.trim() || 'Speaker',
              text: text.trim(),
              korean: korean.trim(),
              stress: parsedStress,
              start: startSec,
              end: endSec,
            }
          : s
      );
      onSaveSentences(updated);
      handleCancelEdit();
    } else {
      // Add new
      const nextId = sentences.length > 0 ? Math.max(...sentences.map((s) => s.id)) + 1 : 1;
      const newSentence: Sentence = {
        id: nextId,
        speaker: speaker.trim() || 'Speaker',
        text: text.trim(),
        korean: korean.trim(),
        stress: parsedStress,
        start: startSec,
        end: endSec,
      };
      onSaveSentences([...sentences, newSentence]);
      handleCancelEdit();
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this sentence from practice? / 문장을 삭제하시겠습니까?')) {
      const updated = sentences.filter((s) => s.id !== id);
      onSaveSentences(updated);
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sentences.length) return;

    const copy = [...sentences];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onSaveSentences(copy);
  };

  // Export / Import
  const handleOpenExport = () => {
    setJsonText(JSON.stringify(sentences, null, 2));
    setShowJsonModal('export');
  };

  const handleOpenImport = () => {
    setJsonText('');
    setShowJsonModal('import');
  };

  const handleCopyExportJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleApplyImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        alert('Invalid JSON: Must be an array of sentences.');
        return;
      }
      // Check required fields
      for (const item of parsed) {
        if (typeof item.text !== 'string' || typeof item.start !== 'number' || typeof item.end !== 'number') {
          alert('Invalid format. Each item must have text (string), start (number), end (number).');
          return;
        }
      }
      onSaveSentences(parsed);
      setShowJsonModal(null);
      alert('Sentences successfully imported!');
    } catch (e: any) {
      alert(`JSON Parse Error: ${e.message}`);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 py-2 pb-14 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 font-semibold py-1 px-2 rounded-lg hover:bg-neutral-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back / 돌아가기</span>
        </button>

        <h1 className="text-sm font-bold text-neutral-900">
          Edit Sentences / 문장 편집
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenExport}
            className="p-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-medium cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenImport}
            className="p-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-medium cursor-pointer"
            title="Import JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <YouTubePlayer
        ref={playerRef}
        onTimeUpdate={(t) => setCurrentVideoTime(t)}
        showCredit={true}
      />

      {/* Live Player Current Time Indicator */}
      <div className="flex items-center justify-between text-xs bg-neutral-100 px-3 py-1.5 rounded-lg font-mono text-neutral-700">
        <span className="flex items-center gap-1 font-sans font-medium">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          Current Video Time:
        </span>
        <span className="font-bold text-neutral-900">
          {currentVideoTime.toFixed(1)}s (Allowed range: {MOVIE_DATA.practiceStart.toFixed(1)}s – {MOVIE_DATA.practiceEnd.toFixed(1)}s)
        </span>
      </div>

      {/* Form: Add or Edit Sentence */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-neutral-300 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs"
      >
        <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            {editingId !== null ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId !== null ? `Edit Sentence #${sentences.findIndex((s) => s.id === editingId) + 1}` : 'Add New Sentence / 문장 추가'}</span>
          </h2>
          {editingId !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
            >
              Cancel Edit / 취소
            </button>
          )}
        </div>

        {/* Speaker & English Sentence */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Speaker / 화자
            </label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="e.g. Jules"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-neutral-900"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              English Sentence / 영어 문장
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                validateTimesAndLength(startSec, endSec, e.target.value);
              }}
              placeholder="e.g. Well, better late than never."
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-neutral-900"
              required
            />
          </div>
        </div>

        {/* Korean Meaning & Stress words */}
        <div className="flex flex-col gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Korean Meaning / 한국어 뜻
            </label>
            <input
              type="text"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              placeholder="e.g. 안 하는 것보단 늦게라도 시작하는 게 낫죠."
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Stress Words (comma-separated) / 강조 단어
            </label>
            <input
              type="text"
              value={stressText}
              onChange={(e) => setStressText(e.target.value)}
              placeholder="e.g. better, late, never"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-neutral-900"
            />
          </div>
        </div>

        {/* Time Settings with Set Start/End = now & Test */}
        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Start time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-neutral-700">Start (s)</label>
                <button
                  type="button"
                  onClick={handleSetStartNow}
                  className="text-[10px] bg-neutral-900 text-white font-semibold px-2 py-0.5 rounded hover:bg-neutral-800 cursor-pointer"
                >
                  Set Start = now
                </button>
              </div>
              <input
                type="number"
                step="0.1"
                min={MOVIE_DATA.practiceStart}
                max={MOVIE_DATA.practiceEnd}
                value={startSec}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setStartSec(val);
                  validateTimesAndLength(val, endSec, text);
                }}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-neutral-300 focus:outline-neutral-900"
              />
            </div>

            {/* End time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-neutral-700">End (s)</label>
                <button
                  type="button"
                  onClick={handleSetEndNow}
                  className="text-[10px] bg-neutral-900 text-white font-semibold px-2 py-0.5 rounded hover:bg-neutral-800 cursor-pointer"
                >
                  Set End = now
                </button>
              </div>
              <input
                type="number"
                step="0.1"
                min={MOVIE_DATA.practiceStart}
                max={MOVIE_DATA.practiceEnd}
                value={endSec}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setEndSec(val);
                  validateTimesAndLength(startSec, val, text);
                }}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-neutral-300 focus:outline-neutral-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-500 font-mono">
              Duration: {(endSec - startSec > 0 ? endSec - startSec : 0).toFixed(1)}s
            </span>
            <button
              type="button"
              onClick={handleTestSegment}
              className="px-3 py-1 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Play className="w-3 h-3 fill-neutral-900" />
              <span>Test Segment / 구간 미리듣기</span>
            </button>
          </div>
        </div>

        {/* Validation Errors & Warnings */}
        {formError && (
          <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formWarning && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formWarning}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-neutral-950 text-white font-bold text-sm hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>{editingId !== null ? 'Save Changes / 변경사항 저장' : 'Add Sentence / 문장 추가하기'}</span>
        </button>
      </form>

      {/* Sentences List for reordering, editing, deleting */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Current Sentences ({sentences.length})
          </h3>
          <button
            onClick={() => {
              if (confirm('Reset all sentences to default 8 scene lines? / 기본 문장으로 초기화하시겠습니까?')) {
                onResetDefaults();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default / 초기화</span>
          </button>
        </div>

        {sentences.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500 bg-neutral-50 rounded-xl border border-neutral-200">
            No sentences yet. Add one above!
          </div>
        ) : (
          sentences.map((s, idx) => (
            <div
              key={s.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                editingId === s.id ? 'bg-amber-50 border-amber-400' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-5 h-5 rounded-md bg-neutral-900 text-white text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-800">{s.speaker}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {s.start.toFixed(1)}s – {s.end.toFixed(1)}s
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral-900 truncate">{s.text}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Reorder */}
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === sentences.length - 1}
                  className="p-1 rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleStartEdit(s)}
                  className="p-1 rounded text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* JSON Import/Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full flex flex-col gap-3 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900">
              {showJsonModal === 'export' ? 'Export Sentences JSON' : 'Import Sentences JSON'}
            </h3>
            <p className="text-xs text-neutral-600">
              {showJsonModal === 'export'
                ? 'Copy this JSON to backup or share your practice lines.'
                : 'Paste a JSON array of sentences to replace the current list.'}
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              readOnly={showJsonModal === 'export'}
              rows={8}
              className="w-full font-mono text-xs p-3 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-neutral-900"
              placeholder={showJsonModal === 'import' ? '[ { "id": 1, "speaker": "Jules", ... } ]' : ''}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowJsonModal(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Close / 닫기
              </button>

              {showJsonModal === 'export' ? (
                <button
                  type="button"
                  onClick={handleCopyExportJson}
                  className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
                >
                  {copyFeedback ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copyFeedback ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyImportJson}
                  className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Import / 적용하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
