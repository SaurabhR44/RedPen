import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import {
  FaSpellCheck,
  FaSyncAlt,
  FaCheck,
  FaPencilAlt,
  FaBook,
  FaBolt,
  FaCompressAlt,
  FaPalette,
  FaComments,
  FaFont,
  FaSitemap,
  FaExclamationCircle,
  FaCircle,
  FaExpandAlt,
  FaCompress,
  FaMagic,
  FaTheaterMasks,
  FaClock,
  FaDownload,
  FaCopy,
  FaChartLine,
  FaSave,
  FaTrash,
} from "react-icons/fa";

import { API_BASE } from "../config";

const CATEGORY_CONFIG = {
  spelling: {
    label: "Spelling",
    icon: <FaSpellCheck className="inline mr-1" />,
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    ring: "ring-red-200",
  },
  grammar: {
    label: "Grammar",
    icon: <FaFont className="inline mr-1" />,
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    ring: "ring-amber-200",
  },
  punctuation: {
    label: "Punctuation",
    icon: <FaCircle className="inline mr-1" style={{ fontSize: "0.5rem", verticalAlign: "middle" }} />,
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-800",
    ring: "ring-orange-200",
  },
  clarity: {
    label: "Clarity",
    icon: <FaExclamationCircle className="inline mr-1" />,
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    ring: "ring-blue-200",
  },
  conciseness: {
    label: "Conciseness",
    icon: <FaCompressAlt className="inline mr-1" />,
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    badge: "bg-cyan-100 text-cyan-800",
    ring: "ring-cyan-200",
  },
  engagement: {
    label: "Engagement",
    icon: <FaBolt className="inline mr-1" />,
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800",
    ring: "ring-purple-200",
  },
  tone: {
    label: "Tone",
    icon: <FaComments className="inline mr-1" />,
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-800",
    ring: "ring-indigo-200",
  },
  word_choice: {
    label: "Word choice",
    icon: <FaPalette className="inline mr-1" />,
    bg: "bg-teal-50",
    border: "border-teal-200",
    badge: "bg-teal-100 text-teal-800",
    ring: "ring-teal-200",
  },
  structure: {
    label: "Structure",
    icon: <FaSitemap className="inline mr-1" />,
    bg: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-800",
    ring: "ring-slate-200",
  },
};

const getCategoryConfig = (category) =>
  CATEGORY_CONFIG[category] || CATEGORY_CONFIG.grammar;

const MARK_CLASS = {
  spelling: "bg-red-200/80 border-b-2 border-red-500",
  grammar: "bg-amber-200/80 border-b-2 border-amber-500",
  punctuation: "bg-orange-200/80 border-b-2 border-orange-500",
  clarity: "bg-blue-200/80 border-b-2 border-blue-500",
  conciseness: "bg-cyan-200/80 border-b-2 border-cyan-500",
  engagement: "bg-purple-200/80 border-b-2 border-purple-500",
  tone: "bg-indigo-200/80 border-b-2 border-indigo-500",
  word_choice: "bg-teal-200/80 border-b-2 border-teal-500",
  structure: "bg-slate-300/80 border-b-2 border-slate-500",
};

function TextWithMarks({ text, suggestions }) {
  if (!suggestions?.length) return <span className="whitespace-pre-wrap">{text}</span>;
  const segments = [];
  const used = [];
  suggestions.forEach((s) => {
    const orig = s.original;
    const pos = text.indexOf(orig);
    if (pos === -1) return;
    const end = pos + orig.length;
    const overlap = used.some(([a, b]) => !(end <= a || pos >= b));
    if (!overlap) {
      segments.push({ start: pos, end, category: s.category || "grammar", original: orig });
      used.push([pos, end]);
    }
  });
  segments.sort((a, b) => a.start - b.start);
  const merged = [];
  let lastEnd = 0;
  segments.forEach((s) => {
    if (s.start > lastEnd) merged.push({ start: lastEnd, end: s.start, text: text.slice(lastEnd, s.start), mark: null });
    merged.push({ start: s.start, end: s.end, text: s.original, mark: s.category });
    lastEnd = s.end;
  });
  if (lastEnd < text.length) merged.push({ start: lastEnd, end: text.length, text: text.slice(lastEnd), mark: null });
  return (
    <span className="whitespace-pre-wrap">
      {merged.map((seg, i) =>
        seg.mark ? (
          <mark key={i} className={`${MARK_CLASS[seg.mark] || MARK_CLASS.grammar} rounded px-0.5`} title={seg.mark}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

// Calculate readability score (Flesch Reading Ease approximation)
const calculateReadability = (text) => {
  if (!text.trim()) return { score: 0, level: "N/A" };

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/);
  const syllables = words.reduce((count, word) => {
    // Simple syllable counter (approximation)
    const vowels = word.toLowerCase().match(/[aeiouy]+/g);
    return count + (vowels ? vowels.length : 1);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return { score: 0, level: "N/A" };

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord);
  const clampedScore = Math.max(0, Math.min(100, score));

  let level = "Very Difficult";
  if (clampedScore >= 90) level = "Very Easy";
  else if (clampedScore >= 80) level = "Easy";
  else if (clampedScore >= 70) level = "Fairly Easy";
  else if (clampedScore >= 60) level = "Standard";
  else if (clampedScore >= 50) level = "Fairly Difficult";
  else if (clampedScore >= 30) level = "Difficult";

  return { score: clampedScore, level };
};

const Editor = () => {
  const [text, setText] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");
  const [rephrasedSentences, setRephrasedSentences] = useState([]);
  const [correctedSentences, setCorrectedSentences] = useState([]);
  const [checkedText, setCheckedText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showMarkedView, setShowMarkedView] = useState(false);
  const [paraphraseOptions, setParaphraseOptions] = useState([]);
  const [paraphraseLoading, setParaphraseLoading] = useState(false);
  const [paraphraseError, setParaphraseError] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolResult, setToolResult] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const textareaRef = useRef(null);
  const resultsPanelRef = useRef(null);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('redpen_draft');
    const draftTime = localStorage.getItem('redpen_draft_time');
    if (draft) {
      setText(draft);
      if (draftTime) {
        setLastSaved(new Date(parseInt(draftTime)));
      }
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!text.trim()) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem('redpen_draft', text);
      const now = Date.now();
      localStorage.setItem('redpen_draft_time', now.toString());
      setLastSaved(new Date(now));
      setTimeout(() => setIsSaving(false), 500);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [text]);

  const handleTextChange = (e) => setText(e.target.value);

  const wordCount = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const charCount = useMemo(() => text.length, [text]);
  const sentenceCount = useMemo(() => {
    if (!text.trim()) return 0;
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }, [text]);
  const paragraphCount = useMemo(() => {
    if (!text.trim()) return 0;
    return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  }, [text]);
  const readingTime = useMemo(() => {
    const wpm = 200; // Average reading speed
    return Math.ceil(wordCount / wpm);
  }, [wordCount]);
  const readability = useMemo(() => calculateReadability(text), [text]);

  const updateSelectionFromTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd, value } = ta;
    if (selectionStart === selectionEnd) {
      setSelectedSentence("");
      return;
    }
    const sel = value.slice(selectionStart, selectionEnd).trim();
    if (sel) {
      setSelectedSentence(sel);
      setToolResult(null);
    }
  }, []);

  const handleSentenceSelection = () => {
    const ta = textareaRef.current;
    if (ta && document.activeElement === ta) {
      updateSelectionFromTextarea();
      return;
    }
    const selection = window.getSelection().toString().trim();
    if (selection) {
      setSelectedSentence(selection);
      setToolResult(null);
    }
  };

  const rephraseSentence = async () => {
    try {
      const response = await axios.post(`${API_BASE}/api/analyze`, {
        sentence: selectedSentence,
      });
      setRephrasedSentences(response.data.rephrasedSentences);
      // Scroll to results panel
      setTimeout(() => resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (error) {
      console.error("Error rephrasing sentence:", error);
    }
  };

  const addCorrectedSentence = (sentence) => {
    setCorrectedSentences([...correctedSentences, sentence]);
  };

  const paraphraseFullText = async () => {
    if (!text.trim()) return;
    setParaphraseLoading(true);
    setParaphraseOptions([]);
    setParaphraseError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/tools/paraphrase`, { text });
      setParaphraseOptions(res.data.options || []);
      if (res.data.error) setParaphraseError(res.data.error);
      // Scroll to results panel
      setTimeout(() => resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Paraphrasing failed. Try again.";
      setParaphraseError(msg);
      setParaphraseOptions([text]);
    } finally {
      setParaphraseLoading(false);
    }
  };

  const improveSelection = async () => {
    if (!selectedSentence.trim()) return;
    setToolLoading(true);
    setToolResult(null);
    try {
      const res = await axios.post(`${API_BASE}/api/tools/improve`, { text: selectedSentence });
      setToolResult({ type: "improve", ...res.data });
      setTimeout(() => resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err) {
      console.error(err);
      setToolResult({ type: "improve", improved: selectedSentence, alternatives: [] });
    } finally {
      setToolLoading(false);
    }
  };

  const synonymsSelection = async () => {
    if (!selectedSentence.trim()) return;
    setToolLoading(true);
    setToolResult(null);
    try {
      const res = await axios.post(`${API_BASE}/api/tools/synonyms`, { word: selectedSentence.trim() });
      setToolResult({ type: "synonyms", ...res.data });
      setTimeout(() => resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err) {
      console.error(err);
      setToolResult({ type: "synonyms", word: selectedSentence, synonyms: [] });
    } finally {
      setToolLoading(false);
    }
  };

  const rewriteSelection = async (mode) => {
    if (!selectedSentence.trim()) return;
    setToolLoading(true);
    setToolResult(null);
    try {
      const res = await axios.post(`${API_BASE}/api/tools/rewrite`, { text: selectedSentence, mode });
      setToolResult({ type: mode, result: res.data.result });
      setTimeout(() => resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (err) {
      console.error(err);
      setToolResult({ type: mode, result: selectedSentence });
    } finally {
      setToolLoading(false);
    }
  };

  const replaceSelectionWith = (newText) => {
    if (!selectedSentence) return;
    const i = text.indexOf(selectedSentence);
    if (i === -1) return;
    setText(text.slice(0, i) + newText + text.slice(i + selectedSentence.length));
    setSelectedSentence("");
    setToolResult(null);
    setRephrasedSentences([]);
  };

  const checkText = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setSuggestions([]);
    setInsights(null);
    setCheckedText("");
    try {
      const response = await axios.post(`${API_BASE}/api/check`, { text });
      setCheckedText(response.data.correctedText);
      setSuggestions(response.data.suggestions || []);
      setInsights(response.data.insights || null);
      setActiveCategory(null);
    } catch (error) {
      console.error("Error checking text:", error);
      alert("Error checking text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    const firstIndex = text.indexOf(suggestion.original);
    if (firstIndex === -1) return;
    const before = text.slice(0, firstIndex);
    const after = text.slice(firstIndex + suggestion.original.length);
    setText(before + suggestion.suggestion + after);
  };

  const suggestionsByCategory = useMemo(() => {
    const map = {};
    suggestions.forEach((s) => {
      const cat = s.category || "grammar";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    const order = [
      "spelling",
      "grammar",
      "punctuation",
      "clarity",
      "conciseness",
      "engagement",
      "tone",
      "word_choice",
      "structure",
    ];
    return order.filter((c) => map[c]?.length).map((c) => ({ category: c, items: map[c] }));
  }, [suggestions]);

  const clearDraft = () => {
    if (window.confirm("Are you sure you want to clear the saved draft?")) {
      localStorage.removeItem('redpen_draft');
      localStorage.removeItem('redpen_draft_time');
      setLastSaved(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    alert("Text copied to clipboard!");
  };

  const downloadAsText = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redpen-document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redpen-document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved";
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000); // seconds
    if (diff < 60) return "Saved just now";
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} min ago`;
    return `Saved ${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Editor and Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editor Card */}
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">RedPen</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Grammar, clarity, tone & more</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {isSaving ? (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <FaSave className="animate-pulse" /> Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <FaCheck className="text-green-500" /> {formatLastSaved()}
                  </span>
                )}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onMouseUp={handleSentenceSelection}
              onKeyUp={handleSentenceSelection}
              placeholder="Type or paste your text here..."
              rows={12}
              className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-800 dark:text-white dark:bg-slate-700"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span><strong>{wordCount}</strong> words</span>
                <span>·</span>
                <span><strong>{charCount}</strong> characters</span>
                <span>·</span>
                <span><strong>{sentenceCount}</strong> sentences</span>
                <span>·</span>
                <span><strong>{paragraphCount}</strong> paragraphs</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={checkText} icon={<FaSpellCheck />} disabled={isLoading}>
                  {isLoading ? "Checking..." : "Check writing"}
                </Button>
                <button
                  type="button"
                  onClick={paraphraseFullText}
                  disabled={paraphraseLoading || !text.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
                >
                  <FaTheaterMasks />
                  {paraphraseLoading ? "Paraphrasing..." : "Paraphrase"}
                </button>
              </div>
            </div>

            {/* Export and Clear Options */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={copyToClipboard}
                disabled={!text.trim()}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:text-slate-400 flex items-center gap-1"
              >
                <FaCopy /> Copy
              </button>
              <button
                onClick={downloadAsText}
                disabled={!text.trim()}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:text-slate-400 flex items-center gap-1"
              >
                <FaDownload /> TXT
              </button>
              <button
                onClick={downloadAsMarkdown}
                disabled={!text.trim()}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:text-slate-400 flex items-center gap-1"
              >
                <FaDownload /> Markdown
              </button>
              <button
                onClick={clearDraft}
                disabled={!lastSaved}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:text-slate-400 flex items-center gap-1 ml-auto"
              >
                <FaTrash /> Clear draft
              </button>
            </div>
          </div>

          {/* Suggestions by category */}
          {suggestions.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center">
                Suggestions by category ({suggestions.length})
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestionsByCategory.map(({ category, items }) => {
                  const config = getCategoryConfig(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setActiveCategory(activeCategory === category ? null : category)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium ${config.badge} ${activeCategory === category ? "ring-2 " + config.ring : ""
                        }`}
                    >
                      {config.icon}
                      {config.label} ({items.length})
                    </button>
                  );
                })}
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {suggestionsByCategory.map(({ category, items }) => {
                  const config = getCategoryConfig(category);
                  const show = activeCategory === null || activeCategory === category;
                  if (!show) return null;
                  return (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2 flex items-center">
                        {config.icon}
                        {config.label} — {items.length} {items.length === 1 ? "issue" : "issues"}
                      </h4>
                      <ul className="space-y-2">
                        {items.map((s, idx) => (
                          <li
                            key={`${category}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-white rounded border border-slate-100"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-800">
                                <span className="text-red-600 line-through">{s.original}</span>
                                <span className="mx-1">→</span>
                                <span className="text-green-700 font-medium">
                                  {s.suggestion}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{s.message}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => applySuggestion(s)}
                              className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Apply
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMarkedView(!showMarkedView)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {showMarkedView ? "Hide" : "View"} text with issues marked
                </button>
                {showMarkedView && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                    <TextWithMarks text={text} suggestions={suggestions} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Corrected text result */}
          {checkedText && (
            <div className="bg-white shadow-lg rounded-xl p-6 border border-green-200 bg-green-50/30">
              <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                <FaCheck className="mr-2 text-green-600" />
                Corrected text
              </h3>
              <p className="mb-4 text-slate-700 whitespace-pre-wrap">{checkedText}</p>
              <Button
                onClick={() => addCorrectedSentence(checkedText)}
                icon={<FaCheck />}
              >
                Accept full version
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Sticky Results Panel */}
        <div className="lg:col-span-1">
          <div ref={resultsPanelRef} className="sticky top-8 space-y-6">
            {/* Statistics Card */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <FaChartLine className="mr-2 text-blue-500" />
                Statistics
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Words</span>
                  <span className="font-semibold text-slate-800">{wordCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Reading time</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <FaClock className="text-slate-400" /> {readingTime} min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Readability</span>
                  <span className={`font-semibold ${readability.score >= 70 ? 'text-green-600' :
                    readability.score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    {readability.score} ({readability.level})
                  </span>
                </div>
                {insights?.detectedTone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tone</span>
                    <span className="font-semibold text-slate-800 capitalize">{insights.detectedTone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Avg sentence length</span>
                  <span className="font-semibold text-slate-800">
                    {sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0} words
                  </span>
                </div>
              </div>
            </div>

            {/* Tool Results - Paraphrase */}
            {(paraphraseOptions.length > 0 || paraphraseError) && (
              <div className="bg-white shadow-lg rounded-xl p-6 border border-violet-200">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Paraphrased versions</h3>
                {paraphraseError && (
                  <p className="mb-3 text-amber-700 bg-amber-50 px-3 py-2 rounded text-sm">
                    {paraphraseError}
                  </p>
                )}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {paraphraseOptions.map((opt, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="mb-2 text-slate-700 text-sm whitespace-pre-wrap">{opt}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setText(opt)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium"
                        >
                          Use in editor
                        </button>
                        <button
                          type="button"
                          onClick={() => addCorrectedSentence(opt)}
                          className="text-xs text-slate-600 hover:text-slate-800"
                        >
                          Add to approved
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selection tools */}
            {selectedSentence && (
              <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold mb-2 flex items-center text-slate-800">
                  <FaPencilAlt className="mr-2 text-purple-500" />
                  Selected text
                </h3>
                <p className="mb-3 text-slate-600 text-sm bg-slate-50 p-3 rounded border border-slate-100">
                  &ldquo;{selectedSentence}&rdquo;
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={rephraseSentence}
                    disabled={toolLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1"
                  >
                    <FaSyncAlt /> Rephrase
                  </button>
                  <button
                    onClick={improveSelection}
                    disabled={toolLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1"
                  >
                    <FaMagic /> Improve
                  </button>
                  <button
                    onClick={synonymsSelection}
                    disabled={toolLoading}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1"
                  >
                    <FaPalette /> Synonyms
                  </button>
                  <button
                    onClick={() => rewriteSelection("simplify")}
                    disabled={toolLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1"
                  >
                    <FaCompress /> Simplify
                  </button>
                  <button
                    onClick={() => rewriteSelection("expand")}
                    disabled={toolLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1"
                  >
                    <FaExpandAlt /> Expand
                  </button>
                </div>

                {toolLoading && <p className="text-slate-500 text-sm">Loading...</p>}

                {toolResult && !toolLoading && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-80 overflow-y-auto">
                    {toolResult.type === "improve" && (
                      <>
                        <p className="font-medium text-slate-700 mb-2 text-sm">Improved:</p>
                        <p className="mb-3 text-slate-800 text-sm">{toolResult.improved}</p>
                        <button
                          onClick={() => replaceSelectionWith(toolResult.improved)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium"
                        >
                          Use this
                        </button>
                        {toolResult.alternatives?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-600 mb-1">Alternatives:</p>
                            {toolResult.alternatives.map((alt, i) => (
                              <p key={i} className="text-xs text-slate-700 mb-2">
                                {alt}
                                <button
                                  type="button"
                                  onClick={() => replaceSelectionWith(alt)}
                                  className="ml-2 text-blue-600 hover:underline"
                                >
                                  Use
                                </button>
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {toolResult.type === "synonyms" && (
                      <>
                        <p className="font-medium text-slate-700 mb-2 text-sm">Synonyms for &ldquo;{toolResult.word}&rdquo;:</p>
                        <div className="flex flex-wrap gap-2">
                          {(toolResult.synonyms || []).map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => replaceSelectionWith(s)}
                              className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs hover:bg-teal-200"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {(toolResult.type === "simplify" || toolResult.type === "expand") && (
                      <>
                        <p className="font-medium text-slate-700 mb-2 text-sm">
                          {toolResult.type === "simplify" ? "Simplified:" : "Expanded:"}
                        </p>
                        <p className="mb-3 text-slate-800 text-sm">{toolResult.result}</p>
                        <button
                          onClick={() => replaceSelectionWith(toolResult.result)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium"
                        >
                          Use this
                        </button>
                      </>
                    )}
                  </div>
                )}

                {rephrasedSentences.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Rephrased options</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {rephrasedSentences.map((sentence, index) => (
                        <div key={index} className="p-2 bg-slate-50 rounded border border-slate-100">
                          <p className="mb-2 text-slate-700 text-sm">{sentence}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => replaceSelectionWith(sentence)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-medium"
                            >
                              Use this
                            </button>
                            <button
                              type="button"
                              onClick={() => addCorrectedSentence(sentence)}
                              className="text-xs text-slate-600 hover:text-slate-800"
                            >
                              Add to approved
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approved Text */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <FaCheck className="mr-2 text-green-500" />
                Approved text
              </h3>
              <p className="mb-4 text-slate-600 text-sm">
                Accepted corrections appear here.
              </p>
              {correctedSentences.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {correctedSentences.map((sentence, index) => (
                    <div
                      key={index}
                      className="pb-3 border-b border-slate-200 last:border-b-0"
                    >
                      <p className="text-sm text-slate-700">{sentence}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-sm">No approved sentences yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Button = ({ onClick, children, icon, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${disabled ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
      } text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm`}
  >
    {icon}
    {children}
  </button>
);

export default Editor;
