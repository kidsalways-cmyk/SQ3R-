import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Sparkles,
  Upload,
  Globe,
  FileText,
  HelpCircle,
  Eye,
  MessageSquare,
  RefreshCw,
  Sun,
  Moon,
  Printer,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  FileDown,
  Trash2,
  ExternalLink,
  Layers,
  GraduationCap,
  Lightbulb,
  Cloud,
  ChevronDown,
  ChevronUp,
  Edit3,
  ScanText,
  Check,
} from 'lucide-react';

import { TypedNotes, UploadedFileItem, DiagnosticResult, CloudNoteItem } from './types';
import { SAMPLE_CASES } from './data/samples';
import { RadarChart } from './components/RadarChart';
import { UDLScaffoldGuide } from './components/UDLScaffoldGuide';
import { SpeechSpeaker } from './components/SpeechSpeaker';

export function App() {
  // Theme & Language
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Inputs: Article
  const [articleText, setArticleText] = useState('');
  const [articleGdocUrl, setArticleGdocUrl] = useState('');
  const [webArticleUrl, setWebArticleUrl] = useState('');
  const [articleFiles, setArticleFiles] = useState<UploadedFileItem[]>([]);
  const [isExtractingWeb, setIsExtractingWeb] = useState(false);
  const [isExtractingGdoc, setIsExtractingGdoc] = useState(false);

  // Inputs: Notes (Digital Form, Cloud Notes, Photos)
  const [cloudNoteUrl, setCloudNoteUrl] = useState('');
  const [isExtractingCloudNote, setIsExtractingCloudNote] = useState(false);
  const [importedCloudNote, setImportedCloudNote] = useState<CloudNoteItem | null>(null);
  const [showCloudPreview, setShowCloudPreview] = useState(true); // Default open for easy review & editing
  const [isEditingCloudNote, setIsEditingCloudNote] = useState(true); // Default edit mode enabled for convenience
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);
  const [parsedSectionsCache, setParsedSectionsCache] = useState<any>(null);

  // OCR Processing State & Feedback
  const [ocrLoadingId, setOcrLoadingId] = useState<string | null>(null);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);
  const [ocrNoteText, setOcrNoteText] = useState<string>('');
  const [showOcrNoteEditor, setShowOcrNoteEditor] = useState<boolean>(false);

  const [noteFiles, setNoteFiles] = useState<UploadedFileItem[]>([]);
  const [typedNotes, setTypedNotes] = useState<TypedNotes>({
    topic: '',
    title: '',
    organization: '',
    picture: '',
    q1: '',
    q2: '',
    q3: '',
    recite: '',
    a1: '',
    a2: '',
    a3: '',
  });

  // Diagnosis State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'survey' | 'questions' | 'read' | 'recite' | 'review'>('survey');

  const resultRef = useRef<HTMLDivElement>(null);

  // Sync dark class on root document html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Initialize theme from system or toggle
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'zh' ? 'en' : 'zh'));
  };

  // Load sample case
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_CASES.find((s) => s.id === sampleId);
    if (!sample) return;

    if (sampleId === 'college-english-strategies') {
      setLang('en');
    } else {
      setLang('zh');
    }

    setArticleText(sample.article);
    setArticleFiles([]);
    setNoteFiles([]);
    setImportedCloudNote(null);
    setParsedSectionsCache(null);
    setAutoFilledNotice(null);
    setTypedNotes({ ...sample.notes });
    setErrorMsg(null);
  };

  // Helper to read files
  const processFiles = async (files: FileList | null, category: 'article' | 'note') => {
    if (!files || files.length === 0) return;

    const newItems: UploadedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (file.type.startsWith('image/')) {
        const base64Url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const pureBase64 = base64Url.split(',')[1] || '';
        newItems.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: base64Url,
          base64: pureBase64,
          mimeType: file.type,
        });
      } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const textContent = await file.text();
        newItems.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          text: textContent,
        });

        // Also append to text area if article
        if (category === 'article') {
          setArticleText((prev) => (prev ? `${prev}\n\n[檔案: ${file.name}]\n${textContent}` : textContent));
        } else {
          setTypedNotes((prev) => ({
            ...prev,
            recite: prev.recite ? `${prev.recite}\n\n[檔案: ${file.name}]\n${textContent}` : textContent,
          }));
        }
      } else {
        // PDF or docx indicator
        newItems.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        });
      }
    }

    if (category === 'article') {
      setArticleFiles((prev) => [...prev, ...newItems]);
    } else {
      setNoteFiles((prev) => [...prev, ...newItems]);
    }
  };

  // Extract from Web
  const handleExtractWeb = async () => {
    if (!webArticleUrl.trim()) return;
    setIsExtractingWeb(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/extract-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webArticleUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '網頁擷取失敗');

      const extracted = `【標題：${data.title}】\n(來源：${data.url})\n\n${data.text}`;
      setArticleText(extracted);
      setWebArticleUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || '無法擷取此網頁文章');
    } finally {
      setIsExtractingWeb(false);
    }
  };

  // Extract Google Doc for Article
  const handleExtractArticleGdoc = async () => {
    if (!articleGdocUrl.trim()) return;
    setIsExtractingGdoc(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/extract-gdoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleGdocUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Doc 匯入失敗');

      setArticleText(data.text);
      setArticleGdocUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Doc 匯入失敗');
    } finally {
      setIsExtractingGdoc(false);
    }
  };

  // Extract Cloud Note (Google Docs, Drive, HackMD, Dropbox, Notion, Web notes)
  const handleExtractCloudNote = async () => {
    if (!cloudNoteUrl.trim()) return;
    setIsExtractingCloudNote(true);
    setErrorMsg(null);
    setAutoFilledNotice(null);

    try {
      const res = await fetch('/api/extract-cloud-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cloudNoteUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '雲端筆記匯入失敗');

      const noteItem: CloudNoteItem = {
        url: cloudNoteUrl.trim(),
        title: data.title || '雲端筆記文件',
        platform: data.platform || '雲端文件',
        text: data.text,
        importedAt: Date.now(),
      };
      setImportedCloudNote(noteItem);
      setParsedSectionsCache(data.sections || null);
      setCloudNoteUrl('');

      // Check if auto-parsable fields exist
      if (data.sections && (data.sections.topic || data.sections.q1 || data.sections.recite || data.sections.a1)) {
        setAutoFilledNotice(
          lang === 'zh'
            ? `檢測到雲端筆記中包含 SQ3R 結構，可點擊「自動填入表單」！`
            : `Detected SQ3R sections in cloud note! Click "Auto-fill Form" to populate.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || '雲端筆記匯入失敗，請確認連結已開啟共享權限。');
    } finally {
      setIsExtractingCloudNote(false);
    }
  };

  const handleApplyCloudSectionsToForm = () => {
    if (!parsedSectionsCache) return;
    const s = parsedSectionsCache;
    setTypedNotes((prev) => ({
      topic: s.topic || prev.topic,
      title: s.title || prev.title,
      organization: s.organization || prev.organization,
      picture: s.picture || prev.picture,
      q1: s.q1 || prev.q1,
      q2: s.q2 || prev.q2,
      q3: s.q3 || prev.q3,
      recite: s.recite || (prev.recite ? `${prev.recite}\n\n${importedCloudNote?.text}` : importedCloudNote?.text || ''),
      a1: s.a1 || prev.a1,
      a2: s.a2 || prev.a2,
      a3: s.a3 || prev.a3,
    }));
    setAutoFilledNotice(lang === 'zh' ? '✅ 已成功將雲端筆記內容解析並代入 SQ3R 表單！' : '✅ Successfully populated form fields from cloud note!');
  };

  // Parse edited OCR text into form fields
  const handleParseOcrToForm = () => {
    if (!ocrNoteText.trim()) return;
    const text = ocrNoteText;
    const newNotes = { ...typedNotes };

    const sMatch = text.match(/(?:主題|topic|標題|title)[：:]\s*([^\n]+)/i);
    if (sMatch) newNotes.topic = sMatch[1].trim();

    const titleMatch = text.match(/(?:標題|title|主旨)[：:]\s*([^\n]+)/i);
    if (titleMatch) newNotes.title = titleMatch[1].trim();

    const orgMatch = text.match(/(?:架構|組織|結構|小標)[：:]\s*([^\n]+)/i);
    if (orgMatch) newNotes.organization = orgMatch[1].trim();

    const qMatches = [...text.matchAll(/(?:Q\d?|問題\d?)[：:、\s]+([^\n]+)/gi)];
    if (qMatches.length > 0) newNotes.q1 = qMatches[0][1]?.trim() || newNotes.q1;
    if (qMatches.length > 1) newNotes.q2 = qMatches[1][1]?.trim() || newNotes.q2;
    if (qMatches.length > 2) newNotes.q3 = qMatches[2][1]?.trim() || newNotes.q3;

    const aMatches = [...text.matchAll(/(?:A\d?|答案\d?|解答\d?)[：:、\s]+([^\n]+)/gi)];
    if (aMatches.length > 0) newNotes.a1 = aMatches[0][1]?.trim() || newNotes.a1;
    if (aMatches.length > 1) newNotes.a2 = aMatches[1][1]?.trim() || newNotes.a2;
    if (aMatches.length > 2) newNotes.a3 = aMatches[2][1]?.trim() || newNotes.a3;

    const rMatch = text.match(/(?:摘要|Recite|總結|改寫)[：:\s]+([\s\S]+?)(?=(?:A\d|Review|複習|$))/i);
    if (rMatch) {
      newNotes.recite = rMatch[1].trim();
    } else if (!newNotes.recite) {
      newNotes.recite = text;
    }

    setTypedNotes(newNotes);
    setOcrSuccessMsg(
      lang === 'zh'
        ? '✅ 已成功將校對後的 OCR 文字分段解析填入下方 SQ3R 表單！'
        : '✅ Form populated from OCR proofread text!'
    );
  };

  // Run OCR on uploaded image to allow manual proofreading & editing
  const handleRunOCR = async (file: UploadedFileItem, mode: 'article' | 'note') => {
    if (!file.base64 || !file.mimeType) return;
    setOcrLoadingId(file.id);
    setErrorMsg(null);
    setOcrSuccessMsg(null);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: { data: file.base64, mimeType: file.mimeType },
          mode,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '圖片文字辨識失敗');

      const extracted = data.text.trim();

      if (mode === 'article') {
        setArticleText((prev) =>
          prev
            ? `${prev}\n\n[📷 圖片文字辨識 (${file.name}) - 請手動校對與編輯]\n${extracted}`
            : extracted
        );
        setOcrSuccessMsg(
          lang === 'zh'
            ? `✅ 已完成「${file.name}」的文字辨識！文字已置入下方文本輸入框，您可以直接進行人工編輯與修正。`
            : `✅ Text extracted from "${file.name}"! Editable in the text area below.`
        );
      } else {
        // Mode note: Put into dedicate OCR proofreading editor
        setOcrNoteText(extracted);
        setShowOcrNoteEditor(true);
        setTypedNotes((prev) => ({
          ...prev,
          recite: prev.recite ? `${prev.recite}\n\n${extracted}` : extracted,
        }));
        setOcrSuccessMsg(
          lang === 'zh'
            ? `✅ 已完成手寫筆記「${file.name}」辨識！文字已顯示在下方「手寫筆記人工校對區」，您可以直接自由修改、增刪字句，並一鍵代入表單！`
            : `✅ Handwritten notes extracted! Edit directly in the proofreading box below.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || '圖片 OCR 辨識失敗，請確認圖片文字是否清晰。');
    } finally {
      setOcrLoadingId(null);
    }
  };

  // Run Diagnosis
  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setErrorMsg(null);

    try {
      let currentArticle = articleText;
      let currentCloudText = importedCloudNote?.text || '';

      // 1. Auto-extract article link if user typed one without pressing import
      if (!currentArticle.trim() && articleFiles.length === 0) {
        if (articleGdocUrl.trim()) {
          try {
            const res = await fetch('/api/extract-gdoc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: articleGdocUrl.trim() }),
            });
            const d = await res.json();
            if (d.text) {
              currentArticle = d.text;
              setArticleText(d.text);
              setArticleGdocUrl('');
            }
          } catch {}
        } else if (webArticleUrl.trim()) {
          try {
            const res = await fetch('/api/extract-web', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: webArticleUrl.trim() }),
            });
            const d = await res.json();
            if (d.text) {
              currentArticle = d.text;
              setArticleText(d.text);
              setWebArticleUrl('');
            }
          } catch {}
        }
      }

      // 2. Auto-extract cloud note link if user typed one without pressing import
      if (!currentCloudText && cloudNoteUrl.trim()) {
        try {
          const res = await fetch('/api/extract-cloud-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: cloudNoteUrl.trim() }),
          });
          const d = await res.json();
          if (d.text) {
            const item: CloudNoteItem = {
              url: cloudNoteUrl.trim(),
              title: d.title || '雲端筆記文件',
              platform: d.platform || '雲端文件',
              text: d.text,
              importedAt: Date.now(),
            };
            setImportedCloudNote(item);
            currentCloudText = d.text;
            setCloudNoteUrl('');
          }
        } catch {}
      }

      const hasTypedNotes = Object.values(typedNotes).some((v) => v.trim().length > 0);
      const hasCloudNote = Boolean(currentCloudText && currentCloudText.trim().length > 0);
      const hasOcrNotes = Boolean(ocrNoteText && ocrNoteText.trim().length > 0);
      const hasNotes = hasTypedNotes || noteFiles.length > 0 || hasCloudNote || hasOcrNotes;
      const hasArticle = currentArticle.trim().length > 0 || articleFiles.length > 0;

      // If completely empty, smoothly load sample so user experiences evaluation instantly
      let finalTypedNotes = { ...typedNotes };
      if (!hasArticle && !hasNotes) {
        const sample = SAMPLE_CASES[0];
        currentArticle = sample.article;
        setArticleText(sample.article);
        finalTypedNotes = { ...sample.notes };
        setTypedNotes(finalTypedNotes);
      } else if (!hasArticle) {
        currentArticle = lang === 'zh' ? '精選核心閱讀文本' : 'Reading Material';
        setArticleText(currentArticle);
      }

      // If user typed notes into OCR editor or Cloud Note, ensure it's in final notes
      const effectiveCloudText = currentCloudText || (ocrNoteText ? `[人工校對後的手寫筆記]\n${ocrNoteText}` : '');

      const articleImages = articleFiles
        .filter((f) => f.base64 && f.mimeType)
        .map((f) => ({ data: f.base64, mimeType: f.mimeType, name: f.name }));

      const noteImages = noteFiles
        .filter((f) => f.base64 && f.mimeType)
        .map((f) => ({ data: f.base64, mimeType: f.mimeType, name: f.name }));

      const payload = {
        articleText: currentArticle,
        articleImages,
        typedNotes: finalTypedNotes,
        noteImages,
        cloudNoteText: effectiveCloudText,
        cloudNoteSource: importedCloudNote ? `${importedCloudNote.platform}: ${importedCloudNote.title}` : (ocrNoteText ? '手寫筆記 OCR 校對內容' : ''),
        language: lang,
      };

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || '診斷伺服器回應異常');
      }

      if (!json.data || !json.data.overallScore) {
        throw new Error('無法取得診斷報告資料，請再試一次。');
      }

      // Ensure all references to Sonia are replaced by AI analysis
      const cleanData = JSON.parse(
        JSON.stringify(json.data)
          .replace(/Sonia\s*老師分析/g, 'AI 協助分析')
          .replace(/Sonia\s*老師/g, 'AI 協助分析')
          .replace(/Teacher\s*Sonia/g, 'AI Analysis')
      );

      setResult(cleanData);

      // Trigger celebration confetti if score is >= 80
      if (json.data.overallScore >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#f59e0b'],
        });
      }

      // Smooth scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '診斷過程中出現錯誤，請確認網路連線或稍後再試。');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-emerald-50/40 text-slate-800'}`}>
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 px-4 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-extrabold text-emerald-900 dark:text-emerald-300 leading-tight">
                {lang === 'zh' ? 'SQ3R 閱讀筆記 AI 協助分析' : "SQ3R Notes AI Analysis"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {lang === 'zh' ? '大專生無障礙閱讀理解輔助' : 'Accessible Reading Assistant for College Students'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? 'SQ3R 指引' : 'SQ3R Guide'}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="切換語言 (Language)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? 'English' : '中文'}</span>
            </button>

            {/* Contrast / Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={isDark ? '切換為淺色模式' : '切換為高對比深色模式'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Hero Header Banner */}
        <section className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'zh' ? 'AI 協助分析 ✕ 無障礙學習' : 'AI Analysis ✕ Accessible Learning'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {lang === 'zh' ? 'SQ3R 閱讀筆記分析' : 'SQ3R Note Diagnosis'}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {lang === 'zh'
              ? '輸入閱讀文章與學生筆記，AI 即刻提供五向度評分與改善建議。'
              : 'Input reading text and notes for AI analysis and recommendations across 5 SQ3R dimensions.'}
          </p>

          {/* Quick Sample Selector */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'zh' ? '示範教材：' : 'Sample Cases:'}
            </span>
            {SAMPLE_CASES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample.id)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition-all shadow-2xs hover:border-emerald-400 cursor-pointer"
              >
                {lang === 'zh' ? sample.title : sample.titleEn}
              </button>
            ))}
          </div>
        </section>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <span className="font-bold">{lang === 'zh' ? '提示：' : 'Notice: '}</span>
              {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600">
              &times;
            </button>
          </div>
        )}

        {/* STEP 1: Reading Material */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-7 shadow-sm border border-emerald-100 dark:border-slate-800 mb-6 border-l-6 border-l-emerald-500">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'zh' ? '步驟 1：閱讀文章' : 'Step 1: Reading Text'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {lang === 'zh' ? '支援文字、圖片、網址、雲端文件' : 'Text, Images, URLs, Google Docs'}
            </span>
          </div>

          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3">
            {lang === 'zh'
              ? '貼上文章、上傳照片或雲端連結，作為 AI 協助分析的對照基準。'
              : 'Paste article text, upload photos, or add links as reference for AI analysis.'}
          </p>

          {/* Quick Import Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* Google Doc Import */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={articleGdocUrl}
                onChange={(e) => setArticleGdocUrl(e.target.value)}
                placeholder={lang === 'zh' ? '🔗 貼上公開的 Google Doc 連結...' : '🔗 Paste public Google Doc link...'}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={handleExtractArticleGdoc}
                disabled={isExtractingGdoc}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {isExtractingGdoc ? (lang === 'zh' ? '匯入中...' : 'Importing...') : (lang === 'zh' ? '匯入' : 'Import')}
              </button>
            </div>

            {/* Web Article Extractor */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={webArticleUrl}
                onChange={(e) => setWebArticleUrl(e.target.value)}
                placeholder={lang === 'zh' ? '🌐 貼上網路文章或新聞網址...' : '🌐 Paste web article URL...'}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                onClick={handleExtractWeb}
                disabled={isExtractingWeb}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {isExtractingWeb ? (lang === 'zh' ? '擷取中...' : 'Extracting...') : (lang === 'zh' ? '擷取' : 'Extract')}
              </button>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-slate-800/80 transition-all cursor-pointer mb-4">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => processFiles(e.target.files, 'article')}
            />
            <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'zh' ? '點擊或拖曳檔案至此上傳閱讀文本' : 'Click or drop files to upload reading material'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'zh' ? '支援相片（多模態視覺辨識）、PDF、Word、純文字檔' : 'Supports Photos, Multimodal Vision, PDF, Word, TXT'}
            </p>
          </label>

          {/* Attached Files List */}
          {articleFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {articleFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1 text-xs text-emerald-900 dark:text-emerald-200"
                >
                  {f.dataUrl ? (
                    <img src={f.dataUrl} alt={f.name} className="w-5 h-5 object-cover rounded" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="truncate max-w-[140px] font-medium">{f.name}</span>

                  {/* OCR Button for Images */}
                  {f.dataUrl && (
                    <button
                      type="button"
                      onClick={() => handleRunOCR(f, 'article')}
                      disabled={ocrLoadingId === f.id}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      title="提取這張圖片的文字到下方編輯區"
                    >
                      {ocrLoadingId === f.id ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>{lang === 'zh' ? '辨識中...' : 'OCR...'}</span>
                        </>
                      ) : (
                        <>
                          <ScanText className="w-2.5 h-2.5" />
                          <span>{lang === 'zh' ? '提取文字校對' : 'OCR & Edit'}</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setArticleFiles((prev) => prev.filter((item) => item.id !== f.id))}
                    className="text-slate-400 hover:text-rose-500 font-bold ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* OCR Success Message Banner */}
          {ocrSuccessMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{ocrSuccessMsg}</span>
              </div>
              <button
                onClick={() => setOcrSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Direct Text Area */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'zh' ? '📝 閱讀文本內容（可在此直接手動編輯、貼上或修正）：' : '📝 Reading Content (Freely editable below):'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                {lang === 'zh' ? '可人工編修' : 'Editable'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {articleText && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(articleText);
                      setOcrSuccessMsg(lang === 'zh' ? '✅ 已複製文本內容到剪貼簿！' : 'Copied to clipboard!');
                    }}
                    className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-medium"
                    title="複製文本內容"
                  >
                    <span>{lang === 'zh' ? '複製' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleText('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer font-medium"
                    title="清空文字框"
                  >
                    <span>{lang === 'zh' ? '清空' : 'Clear'}</span>
                  </button>
                </>
              )}
              <span className="text-[11px] text-slate-400">{articleText.length} {lang === 'zh' ? '字元' : 'chars'}</span>
            </div>
          </div>
          <textarea
            rows={6}
            value={articleText}
            onChange={(e) => setArticleText(e.target.value)}
            placeholder={lang === 'zh' ? '或直接將文章內容貼在這裡，OCR 辨識與匯入的文字也會出現在此供您自由手動修改...' : 'Or directly paste article content here, OCR results appear here for proofreading...'}
            className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y leading-relaxed font-sans font-medium"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <span>{lang === 'zh' ? '💡 任何手動修改將即時保存並作為 AI 診斷依據' : 'Edits are saved live for diagnosis'}</span>
            <span>{lang === 'zh' ? `已輸入 ${articleText.length} 字` : `${articleText.length} characters`}</span>
          </div>
        </div>

        {/* STEP 2: Student SQ3R Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-7 shadow-sm border border-indigo-100 dark:border-slate-800 mb-6 border-l-6 border-l-indigo-500">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'zh' ? '步驟 2：學生筆記' : 'Step 2: Student Notes'}
              </h3>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
              {lang === 'zh' ? '支援拍照、雲端連結或直接填寫' : 'Photo, Cloud Link, or Form'}
            </span>
          </div>

          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3">
            {lang === 'zh'
              ? '可上傳手寫筆記照片、貼上雲端連結，或在下方直接填寫。'
              : 'Upload handwritten note photos, paste cloud links, or fill out below.'}
          </p>

          {/* Cloud Note / Google Doc / Cloud File Import Section */}
          <div className="mb-5 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs md:text-sm text-indigo-900 dark:text-indigo-200">
                  {lang === 'zh' ? '雲端筆記連結' : 'Cloud Note Link'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-700/80 dark:text-indigo-300">
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 font-medium">Google Docs</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 font-medium">Google Drive</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 font-medium">HackMD</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 font-medium">Notion / Web</span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={cloudNoteUrl}
                onChange={(e) => setCloudNoteUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExtractCloudNote();
                  }
                }}
                placeholder={
                  lang === 'zh'
                    ? '🔗 貼上 Google Doc、Google Drive、HackMD、Dropbox、Notion 或公開雲端筆記連結...'
                    : '🔗 Paste Google Doc, Drive, HackMD, Dropbox, Notion or public cloud note link...'
                }
                className="flex-1 px-3 py-2.5 text-xs rounded-lg border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
              />
              <button
                onClick={handleExtractCloudNote}
                disabled={isExtractingCloudNote || !cloudNoteUrl.trim()}
                className="px-4 py-2.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isExtractingCloudNote ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'zh' ? '匯入中...' : 'Importing...'}</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? '📥 匯入雲端筆記' : '📥 Import'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Imported Cloud Note Status Card */}
            {importedCloudNote && (
              <div className="mt-3 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-2xs animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {importedCloudNote.platform}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[220px]" title={importedCloudNote.title}>
                      {importedCloudNote.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({importedCloudNote.text.length} {lang === 'zh' ? '字元' : 'chars'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={importedCloudNote.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{lang === 'zh' ? '檢視原始連結' : 'Original Link'}</span>
                    </a>
                    <button
                      onClick={() => {
                        setImportedCloudNote(null);
                        setParsedSectionsCache(null);
                        setAutoFilledNotice(null);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer flex items-center gap-0.5"
                      title="移除雲端筆記"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '移除' : 'Remove'}</span>
                    </button>
                  </div>
                </div>

                {/* Auto fill hint banner */}
                {autoFilledNotice && (
                  <div className="mb-2.5 p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{autoFilledNotice}</span>
                    </div>
                    {parsedSectionsCache && (
                      <button
                        onClick={handleApplyCloudSectionsToForm}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer text-[11px] shrink-0"
                      >
                        {lang === 'zh' ? '填入 SQ3R 表單' : 'Auto-fill'}
                      </button>
                    )}
                  </div>
                )}

                {/* Status Indicator & Edit Mode Toggle */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{lang === 'zh' ? '已成功載入！AI 診斷時將直接詳讀此雲端筆記' : 'Loaded! AI will examine this full cloud note.'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCloudNote(!isEditingCloudNote)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingCloudNote ? (lang === 'zh' ? '預覽視圖' : 'Preview') : (lang === 'zh' ? '編輯筆記' : 'Edit Note')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCloudPreview(!showCloudPreview)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>{showCloudPreview ? (lang === 'zh' ? '收合' : 'Collapse') : (lang === 'zh' ? '展開' : 'Expand')}</span>
                      {showCloudPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content Preview & Live Manual Editor */}
                {showCloudPreview && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>
                          {lang === 'zh'
                            ? '✏️ 雲端筆記內容（可直接在此手動編修、增刪或校對）：'
                            : '✏️ Cloud Note Text (Freely edit and correct content here):'}
                        </span>
                      </div>
                      {parsedSectionsCache && (
                        <button
                          type="button"
                          onClick={handleApplyCloudSectionsToForm}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{lang === 'zh' ? '依目前修改重新填入 SQ3R 欄位' : 'Re-fill Form'}</span>
                        </button>
                      )}
                    </div>

                    {isEditingCloudNote ? (
                      <textarea
                        rows={7}
                        value={importedCloudNote.text}
                        onChange={(e) => setImportedCloudNote({ ...importedCloudNote, text: e.target.value })}
                        className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                        placeholder={lang === 'zh' ? '在此直接手動編輯、修正或增刪筆記內容...' : 'Edit note text here...'}
                      />
                    ) : (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 max-h-56 overflow-y-auto whitespace-pre-line leading-relaxed font-mono">
                        {importedCloudNote.text}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{lang === 'zh' ? '💡 任何手動修改將直接儲存並作為 AI 診斷依據' : 'Edits are saved directly and used by AI.'}</span>
                      <span>{importedCloudNote.text.length} {lang === 'zh' ? '字元' : 'chars'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photo / File Dropzone for Notes */}
          <label className="block border-2 border-dashed border-indigo-200 dark:border-slate-700 rounded-xl p-5 text-center bg-indigo-50/30 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 transition-all cursor-pointer mb-6">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => processFiles(e.target.files, 'note')}
            />
            <Upload className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
            <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'zh' ? '點擊或拖曳上傳手寫筆記照片' : 'Click or drop handwritten note photos'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'zh' ? '支援照片辨識，辨識後可手動修改內容' : 'Supports OCR with manual editing'}
            </p>
          </label>

          {/* Attached Note Files */}
          {noteFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {noteFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2.5 py-1 text-xs text-indigo-900 dark:text-indigo-200"
                >
                  {f.dataUrl ? (
                    <img src={f.dataUrl} alt={f.name} className="w-6 h-6 object-cover rounded" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-600" />
                  )}
                  <span className="truncate max-w-[140px] font-medium">{f.name}</span>

                  {/* OCR Button for Handwritten Note Photo */}
                  {f.dataUrl && (
                    <button
                      type="button"
                      onClick={() => handleRunOCR(f, 'note')}
                      disabled={ocrLoadingId === f.id}
                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      title="以 AI 辨識手寫筆記文字並手動校對"
                    >
                      {ocrLoadingId === f.id ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>{lang === 'zh' ? '辨識手寫中...' : 'OCR...'}</span>
                        </>
                      ) : (
                        <>
                          <ScanText className="w-2.5 h-2.5" />
                          <span>{lang === 'zh' ? '提取文字校對' : 'OCR & Edit'}</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setNoteFiles((prev) => prev.filter((item) => item.id !== f.id))}
                    className="text-slate-400 hover:text-rose-500 font-bold ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Note OCR Success Notification Banner */}
          {ocrSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-medium">{ocrSuccessMsg}</span>
              </div>
              <button
                onClick={() => setOcrSuccessMsg(null)}
                className="text-indigo-700 hover:text-indigo-900 font-bold ml-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* OCR Handwritten Note Proofreading & Manual Correction Panel */}
          {showOcrNoteEditor && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs md:text-sm text-amber-950 dark:text-amber-200">
                    {lang === 'zh'
                      ? '手寫辨識文字（可手動修改）：'
                      : 'OCR Text (Editable):'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleParseOcrToForm}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="自動填入 S, Q, Recite, Review 欄位"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? '✨ 代入表單' : '✨ Fill Form'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOcrNoteEditor(false)}
                    className="text-amber-700 dark:text-amber-300 hover:text-amber-900 text-xs font-semibold cursor-pointer px-1 py-0.5"
                  >
                    {lang === 'zh' ? '收合' : 'Hide'}
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={ocrNoteText}
                onChange={(e) => {
                  setOcrNoteText(e.target.value);
                  setTypedNotes((prev) => ({
                    ...prev,
                    recite: prev.recite ? prev.recite : e.target.value,
                  }));
                }}
                placeholder={lang === 'zh' ? '在此手動修改文字，修改內容將直接用於 AI 分析...' : 'Edit OCR text here for AI analysis...'}
                className="w-full p-3 text-xs md:text-sm rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-sans leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'zh' ? '修改將即時連動 AI 分析' : 'Changes used in AI analysis'}</span>
                </span>
                <span>{ocrNoteText.length} {lang === 'zh' ? '字元' : 'chars'}</span>
              </div>
            </div>
          )}

          {/* Structured Note Form Sections */}
          <div className="space-y-4">
            {/* 1. Survey */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2.5 text-blue-800 dark:text-blue-300 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs">
                  S
                </span>
                <span>{lang === 'zh' ? '1. Survey (瀏覽)' : '1. Survey'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={typedNotes.topic}
                  onChange={(e) => setTypedNotes({ ...typedNotes, topic: e.target.value })}
                  placeholder={lang === 'zh' ? '主題：核心主題？' : 'Topic: Main subject?'}
                  className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.title}
                  onChange={(e) => setTypedNotes({ ...typedNotes, title: e.target.value })}
                  placeholder={lang === 'zh' ? '標題：標題與主旨？' : 'Title: Headline and key idea?'}
                  className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.organization}
                  onChange={(e) => setTypedNotes({ ...typedNotes, organization: e.target.value })}
                  placeholder={lang === 'zh' ? '架構：段落結構？' : 'Organization: Structure?'}
                  className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.picture}
                  onChange={(e) => setTypedNotes({ ...typedNotes, picture: e.target.value })}
                  placeholder={lang === 'zh' ? '圖表：圖表資訊？' : 'Visuals: Key chart info?'}
                  className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                />
              </div>
            </div>

            {/* 2. Question */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2.5 text-purple-800 dark:text-purple-300 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 flex items-center justify-center text-xs">
                  Q
                </span>
                <span>{lang === 'zh' ? '2. Question (提問)' : '2. Question'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={typedNotes.q1}
                  onChange={(e) => setTypedNotes({ ...typedNotes, q1: e.target.value })}
                  placeholder={lang === 'zh' ? '問題 1：例如：為什麼...？' : 'Question 1: e.g. Why does...?'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.q2}
                  onChange={(e) => setTypedNotes({ ...typedNotes, q2: e.target.value })}
                  placeholder={lang === 'zh' ? '問題 2：例如：如何...？' : 'Question 2: e.g. How can...?'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.q3}
                  onChange={(e) => setTypedNotes({ ...typedNotes, q3: e.target.value })}
                  placeholder={lang === 'zh' ? '問題 3：例如：結論是什麼？' : 'Question 3: e.g. What is the conclusion?'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400 font-medium"
                />
              </div>
            </div>

            {/* 3. Recite */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2.5 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center text-xs">
                  R
                </span>
                <span>{lang === 'zh' ? '3. Recite (摘要)' : '3. Recite'}</span>
              </div>
              <textarea
                rows={3}
                value={typedNotes.recite}
                onChange={(e) => setTypedNotes({ ...typedNotes, recite: e.target.value })}
                placeholder={
                  lang === 'zh'
                    ? '用自己的話簡短寫下一到兩段摘要精華...'
                    : 'Summarize the core takeaways in your own words...'
                }
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-y leading-relaxed font-medium"
              />
            </div>

            {/* 4. Review */}
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2.5 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <span className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-center text-xs">
                  R
                </span>
                <span>{lang === 'zh' ? '4. Review (複習)' : '4. Review'}</span>
              </div>
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={typedNotes.a1}
                  onChange={(e) => setTypedNotes({ ...typedNotes, a1: e.target.value })}
                  placeholder={lang === 'zh' ? '解答 1：對應問題 1 的解答' : 'Answer 1: Matches Question 1'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.a2}
                  onChange={(e) => setTypedNotes({ ...typedNotes, a2: e.target.value })}
                  placeholder={lang === 'zh' ? '解答 2：對應問題 2 的解答' : 'Answer 2: Matches Question 2'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400 font-medium"
                />
                <input
                  type="text"
                  value={typedNotes.a3}
                  onChange={(e) => setTypedNotes({ ...typedNotes, a3: e.target.value })}
                  placeholder={lang === 'zh' ? '解答 3：對應問題 3 的解答' : 'Answer 3: Matches Question 3'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Inline Error Banner above Button */}
          {errorMsg && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs md:text-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in shadow-xs">
              <div className="flex items-start gap-2.5 flex-1">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{lang === 'zh' ? '評分提醒：' : 'Notice: '}</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleLoadSample('memory-learning');
                    setTimeout(() => handleDiagnose(), 100);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '一鍵載入示範並評分' : 'Load Sample & Score'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {/* Quick Helper if inputs empty */}
          {(!articleText && Object.values(typedNotes).every((v) => !v.trim()) && !importedCloudNote) && (
            <div className="mt-5 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'zh'
                    ? '💡 還沒準備好筆記嗎？可載入示範教材立即評分：'
                    : '💡 Need quick testing? Load sample notes:'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLoadSample('memory-learning')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors flex items-center gap-1"
              >
                <span>{lang === 'zh' ? '載入示範筆記' : 'Load Sample'}</span>
              </button>
            </div>
          )}

          {/* Action Diagnose Button */}
          <div className="mt-6">
            <button
              onClick={handleDiagnose}
              disabled={isDiagnosing}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-base md:text-lg shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>
                    {lang === 'zh'
                      ? 'AI 正在分析文本與筆記...（約需數秒）'
                      : 'AI is analyzing text & notes...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {result
                      ? lang === 'zh'
                        ? '🔄 重新分析'
                        : '🔄 Re-analyze'
                      : lang === 'zh'
                      ? '🔍 開始 AI 協助分析'
                      : '🔍 Start AI Analysis'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* STEP 3: Diagnostic Results Section */}
        {result && (
          <div ref={resultRef} className="animate-in fade-in duration-500 mb-10">
            {/* Header bar of Report */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    {lang === 'zh' ? 'AI 協助分析報告' : "AI Diagnostic Report"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'zh' ? 'SQ3R 五向度診斷與學習建議' : 'SQ3R 5-Dimension Competencies & Scaffolding'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <SpeechSpeaker
                  text={`${result.generalFeedback}。${result.udlEncouragement}`}
                  lang={lang}
                  label={lang === 'zh' ? '🔊 聽 AI 分析回饋' : '🔊 Listen Audio'}
                  isDark={isDark}
                />
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '列印 / 匯出' : 'Print / Export'}</span>
                </button>
              </div>
            </div>

            {/* Dashboard: Score + Radar Chart & 5 Dimensions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
              {/* Left Column: Overall Score & Radar Chart */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-emerald-100 dark:border-slate-800 flex flex-col items-center justify-between">
                <div className="text-center w-full">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-1">
                    {lang === 'zh' ? '綜合評分' : 'Overall Score'}
                  </span>
                  <div className="text-6xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight my-2">
                    {result.overallScore}
                  </div>
                  <div className="inline-block px-4 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                    {result.level}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {result.levelDescription}
                  </p>
                </div>

                {/* Radar Chart */}
                <div className="my-3 w-full flex justify-center">
                  <RadarChart
                    scores={result.radarScores}
                    labels={
                      lang === 'zh'
                        ? ['S 概覽視角', 'Q 問題意識', 'R1 關鍵擷取', 'R2 消化改寫', 'R3 複習整合']
                        : ['S Survey', 'Q Question', 'R1 Read', 'R2 Recite', 'R3 Review']
                    }
                    size={280}
                    isDark={isDark}
                  />
                </div>

                <div className="w-full text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  {lang === 'zh' ? '五向度雷達圖' : '5-Dimension Radar'}
                </div>
              </div>

              {/* Right Column: 5 Dimensions Breakdown Cards */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span>{lang === 'zh' ? '五向度評析' : '5-Dimension Analysis'}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {lang === 'zh' ? '依 UDL 原則引導' : 'UDL Guided'}
                  </span>
                </h4>

                {result.dimensions.map((dim) => (
                  <div
                    key={dim.key}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-2xs border border-slate-100 dark:border-slate-800 hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{dim.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {dim.score} {lang === 'zh' ? '分' : 'pts'}
                        </span>
                      </div>
                      <div className="text-amber-400 text-sm tracking-widest">
                        {'★'.repeat(dim.stars)}
                        {'☆'.repeat(5 - dim.stars)}
                      </div>
                    </div>

                    {/* Highlight */}
                    <div className="text-xs text-slate-700 dark:text-slate-300 mb-1.5 leading-relaxed">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold mr-1.5 text-[11px]">
                        {lang === 'zh' ? '🌟 亮點' : '🌟 Highlight'}
                      </span>
                      {dim.highlight}
                    </div>

                    {/* Scaffolding */}
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-slate-800/80 border-l-3 border-blue-500 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-bold text-blue-700 dark:text-blue-400 mr-1">
                        {lang === 'zh' ? '💡 AI 思考引導：' : '💡 Scaffolding: '}
                      </span>
                      {dim.scaffold}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Feedback & UDL Encouragement */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 rounded-2xl p-5 md:p-7 border border-emerald-200 dark:border-emerald-800/60 mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <span>{lang === 'zh' ? 'AI 協助分析總結' : "AI Analysis Summary"}</span>
                </h4>
                <SpeechSpeaker
                  text={result.generalFeedback}
                  lang={lang}
                  label={lang === 'zh' ? '朗讀此段' : 'Read'}
                  isDark={isDark}
                />
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                {result.generalFeedback}
              </p>

              {result.udlEncouragement && (
                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800 text-xs md:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="font-medium">{result.udlEncouragement}</div>
                </div>
              )}
            </div>

            {/* Teacher Exemplar SQ3R Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-7 shadow-sm border border-emerald-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                      {lang === 'zh' ? (result.teacherDemo.title.includes('Sonia') ? 'AI 示範 SQ3R 閱讀筆記' : result.teacherDemo.title) : 'AI Exemplar SQ3R Notes'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'zh' ? '觀摩 SQ3R 完整架構與摘要技巧' : 'Learn cognitive structuring through exemplar notes'}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                  {(['survey', 'questions', 'read', 'recite', 'review'] as const).map((tab) => {
                    const titles: Record<string, string> = {
                      survey: 'S 瀏覽',
                      questions: 'Q 提問',
                      read: 'R1 研讀',
                      recite: 'R2 摘要',
                      review: 'R3 複習',
                    };
                    const titlesEn: Record<string, string> = {
                      survey: 'S Survey',
                      questions: 'Q Question',
                      read: 'R1 Read',
                      recite: 'R2 Recite',
                      review: 'R3 Review',
                    };

                    const isActive = selectedDemoTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setSelectedDemoTab(tab)}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lang === 'zh' ? titles[tab] : titlesEn[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {selectedDemoTab === 'survey' && (
                  <div>
                    <h5 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{lang === 'zh' ? '示範 Survey 宏觀概覽架構：' : 'Exemplar Survey Structure:'}</span>
                    </h5>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {result.teacherDemo.survey}
                    </p>
                  </div>
                )}

                {selectedDemoTab === 'questions' && (
                  <div>
                    <h5 className="font-bold text-purple-800 dark:text-purple-300 mb-2.5 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>{lang === 'zh' ? '示範 Question 深度思考提問：' : 'Exemplar Questions:'}</span>
                    </h5>
                    <ul className="space-y-2">
                      {result.teacherDemo.questions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedDemoTab === 'read' && (
                  <div>
                    <h5 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{lang === 'zh' ? '示範 Read 關鍵研讀核心點：' : 'Exemplar Key Points:'}</span>
                    </h5>
                    <ul className="space-y-2">
                      {result.teacherDemo.readKeypoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedDemoTab === 'recite' && (
                  <div>
                    <h5 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{lang === 'zh' ? '示範 Recite 精彩摘要（用自己的話改寫）：' : 'Exemplar Recite Summary:'}</span>
                    </h5>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-amber-200 dark:border-amber-900">
                      {result.teacherDemo.reciteSummary}
                    </p>
                  </div>
                )}

                {selectedDemoTab === 'review' && (
                  <div>
                    <h5 className="font-bold text-rose-800 dark:text-rose-300 mb-2.5 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>{lang === 'zh' ? '示範 Review 複習統整與解答：' : 'Exemplar Review & Synthesis:'}</span>
                    </h5>
                    <ul className="space-y-2">
                      {result.teacherDemo.reviewAnswers.map((ans, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-100 dark:border-slate-800">
                          <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            A{idx + 1}
                          </span>
                          <span>{ans}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <p className="mb-1">
          {lang === 'zh'
            ? '🌿 SQ3R 閱讀筆記 AI 協助分析儀 | Credit:@Teacher Sonia via Google AI'
            : '🌿 SQ3R Notes AI Analysis Tool | Credit:@Teacher Sonia via Google AI'}
        </p>
        <p className="text-slate-400 dark:text-slate-600">
          Powered by Gemini 3.8 Flash Multimodal AI • Client & Server High Privacy Architecture
        </p>
      </footer>

      {/* UDL Modal Guide */}
      <UDLScaffoldGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        lang={lang}
      />
    </div>
  );
}

export default App;
