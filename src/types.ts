export interface TypedNotes {
  topic: string;
  title: string;
  organization: string;
  picture: string;
  q1: string;
  q2: string;
  q3: string;
  recite: string;
  a1: string;
  a2: string;
  a3: string;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // For images
  base64?: string;
  mimeType?: string;
  text?: string; // If text file
}

export interface DimensionAnalysis {
  key: 'S' | 'Q' | 'R1' | 'R2' | 'R3';
  name: string;
  score: number;
  stars: number;
  highlight: string;
  scaffold: string;
  growthTip: string;
}

export interface TeacherDemoNotes {
  title: string;
  survey: string;
  questions: string[];
  readKeypoints: string[];
  reciteSummary: string;
  reviewAnswers: string[];
}

export interface DiagnosticResult {
  overallScore: number;
  level: string;
  levelBadge: string;
  levelDescription: string;
  radarScores: [number, number, number, number, number];
  dimensions: DimensionAnalysis[];
  teacherDemo: TeacherDemoNotes;
  generalFeedback: string;
  udlEncouragement: string;
}

export interface SampleTextCase {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  article: string;
  notes: TypedNotes;
}

export interface CloudNoteItem {
  url: string;
  title: string;
  platform: string;
  text: string;
  importedAt: number;
}
