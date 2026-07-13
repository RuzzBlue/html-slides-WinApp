export interface SlideNote {
  title: string;
  script: string;
  notes: string[];
}

export interface Presentation {
  id: string;
  name: string;
  path: string;
  slidesCount: number;
  dateAdded: string;
  htmlContent: string;
  speakerNotes: { [slideIndex: string]: SlideNote };
}

export interface MonitoredFolder {
  id: string;
  path: string;
}

export type ActiveTool = 'arrow' | 'laser' | 'pen' | 'highlighter' | 'eraser' | 'spotlight' | 'zoom' | null;

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  type: 'pen' | 'highlighter' | 'laser';
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  createdAt: number;
}
