import React from 'react';
import { X, BookOpen, HelpCircle, Eye, MessageSquare, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface UDLGuideProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
}

export const UDLScaffoldGuide: React.FC<UDLGuideProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 dark:border-slate-800 p-6 md:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {lang === 'zh' ? 'SQ3R 閱讀策略指南' : 'SQ3R Reading Guide'}
            </h2>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {lang === 'zh' ? 'UDL 全方位無障礙學習鷹架' : 'UDL Cognitive Scaffolding'}
            </p>
          </div>
        </div>

        {/* UDL Principles */}
        <div className="mb-8 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            {lang === 'zh' ? '什麼是 UDL 學習設計？' : 'What is UDL?'}
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
            {lang === 'zh'
              ? 'UDL（Universal Design for Learning）主張學習設計應打破單一標準，透過提供多元管道，讓不同認知特質與學習需求的學習者皆能成功參與：'
              : 'UDL provides multiple means of representation, expression, and engagement so all learners can succeed:'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-slate-700">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                {lang === 'zh' ? '1. 多元表徵呈現' : '1. Multiple Representation'}
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                {lang === 'zh' ? '支援文字貼上、相片上傳、PDF/Word、網頁抓取與 Google Doc 雲端無縫讀取。' : 'Supports text paste, photo upload, PDF/Word, Web URLs, and Google Docs.'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-slate-700">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                {lang === 'zh' ? '2. 多元表達與行動' : '2. Multiple Expression'}
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                {lang === 'zh' ? '學生可拍攝手寫紙本筆記由 AI 視覺辨識，或使用步驟引導表單填寫。' : 'Learners can upload handwritten notes or use structured digital form fields.'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-slate-700">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                {lang === 'zh' ? '3. 友善激勵與反思' : '3. Multiple Engagement'}
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                {lang === 'zh' ? '提供五向度雷達分析、教師示範筆記對照、亮點肯定與具體鷹架提問。' : '5-dimension radar analytics, teacher demo notes, and positive constructive hints.'}
              </p>
            </div>
          </div>
        </div>

        {/* The 5 Steps of SQ3R */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'zh' ? 'SQ3R 五大經典閱讀步驟' : 'The 5 Core Steps of SQ3R'}
          </h3>

          {/* S */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold">
              <Eye className="w-5 h-5" />
              <span>S - Survey (瀏覽掃描)</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              {lang === 'zh'
                ? '在深入細讀前，先用 1~2 分鐘快速宏觀掃描全書或全篇。觀察標題、引言、粗體小標、章節結構、圖表照片與結論段落，在大腦中建立認知地圖。'
                : 'Skim headings, intro, summaries, and visuals before diving deep. Build a high-level mental map.'}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'zh' ? '學生自我檢查點：我能說出這篇文章想談的大方向與骨架嗎？' : 'Self-check: Can I articulate the big picture and outline?'}</span>
            </div>
          </div>

          {/* Q */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400 font-bold">
              <HelpCircle className="w-5 h-5" />
              <span>Q - Question (提問好奇)</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              {lang === 'zh'
                ? '將小標題或核心概念轉換成「為什麼、如何、有何影響」的深層問題。帶著問題閱讀，大腦會由「被動吸收」轉為「主動偵探尋找線索」。'
                : 'Turn headings into active questions (Why, How, What implications). Read like a detective seeking clues.'}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'zh' ? '學生自我檢查點：我的提問是否能引導思考，而非單純字面事實？' : 'Self-check: Do my questions spark deep conceptual inquiry?'}</span>
            </div>
          </div>

          {/* R1 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <BookOpen className="w-5 h-5" />
              <span>R1 - Read (精讀研讀)</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              {lang === 'zh'
                ? '有目標性地閱讀內文，主動追蹤在 Q 階段設定的疑問。注意段落主題句、關鍵論證、因果推理與舉例證明，圈選真正重要的概念。'
                : 'Read deliberately to answer your questions. Identify topic sentences, evidence, and logical links.'}
            </p>
          </div>

          {/* R2 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-bold">
              <MessageSquare className="w-5 h-5" />
              <span>R2 - Recite (摘要複述)</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              {lang === 'zh'
                ? '讀完一個段落或小節後，把書蓋上！用自己的話口頭講述或動筆寫下一到兩句摘要。唯有能用自己的話說清楚，才代表真正內化消化。'
                : 'Close the page! Summarize the essence in your own words. If you can explain it simply, you own it.'}
            </p>
          </div>

          {/* R3 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400 font-bold">
              <RefreshCw className="w-5 h-5" />
              <span>R3 - Review (複習統整)</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              {lang === 'zh'
                ? '重新檢視所有提問與筆記，核對解答是否完整，並將各小節觀點串接為整篇知識架構。隔日或間隔一段時間再次回顧，將短期記憶固化至長期記憶。'
                : 'Review questions and answers as a coherent whole. Spaced reviews turn fleeting memory into permanent schema.'}
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {lang === 'zh' ? '我瞭解了，開始診斷！' : 'Got it, let’s diagnose!'}
          </button>
        </div>
      </div>
    </div>
  );
};
