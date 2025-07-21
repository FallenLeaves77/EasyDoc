// Core document types
export interface IDocument {
  _id?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  status: DocumentStatus;
  taskId?: string;
  parseResult?: IParseResult;
  contentBlocks?: IContentBlock[];
  structureNodes?: IStructureNode[];
  tables?: ITableData[];
  figures?: IFigureData[];
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PARSING = 'parsing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Parse result from EasyDoc API
export interface IParseResult {
  success: boolean;
  errCode?: string;
  errMessage?: string;
  data?: {
    taskId: string;
    task_status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'PROGRESSING';
    task_result?: any;
  };
}

// Content Block Identification
export interface IContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  position: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: {
    confidence: number;
    language?: string;
    semanticTags?: string[];
    wordCount: number;
  };
  parentBlockId?: string;
  childBlockIds?: string[];
}

export enum ContentBlockType {
  TITLE = 'title',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  QUOTE = 'quote',
  CODE = 'code',
  TABLE = 'table',
  FIGURE = 'figure',
  CAPTION = 'caption',
  FOOTER = 'footer',
  HEADER = 'header'
}

// Hierarchical Document Structure
export interface IStructureNode {
  id: string;
  type: StructureNodeType;
  title: string;
  level: number;
  position: {
    page: number;
    order: number;
  };
  parentId?: string;
  childIds: string[];
  contentBlockIds: string[];
  metadata: {
    wordCount: number;
    importance: number;
    keywords: string[];
  };
}

export enum StructureNodeType {
  DOCUMENT = 'document',
  CHAPTER = 'chapter',
  SECTION = 'section',
  SUBSECTION = 'subsection',
  PARAGRAPH = 'paragraph'
}

// Table Understanding
export interface ITableData {
  id: string;
  position: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  structure: {
    rows: number;
    columns: number;
    hasHeader: boolean;
    hasFooter: boolean;
  };
  data: ITableCell[][];
  metadata: {
    title?: string;
    caption?: string;
    confidence: number;
    dataTypes: string[];
  };
}

export interface ITableCell {
  value: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'empty';
  colspan?: number;
  rowspan?: number;
  isHeader?: boolean;
}

// Figure Understanding
export interface IFigureData {
  id: string;
  type: FigureType;
  position: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: {
    imageUrl?: string;
    description: string;
    caption?: string;
    altText?: string;
  };
  metadata: {
    confidence: number;
    extractedText?: string;
    colors?: string[];
    objects?: string[];
  };
}

export enum FigureType {
  IMAGE = 'image',
  CHART = 'chart',
  DIAGRAM = 'diagram',
  GRAPH = 'graph',
  ILLUSTRATION = 'illustration',
  PHOTO = 'photo'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// File upload types
export interface IFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Parse task types
export interface IParseTask {
  _id?: string;
  documentId: string;
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'PROGRESSING';
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}
