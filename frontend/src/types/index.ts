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

// Document types
export interface IDocument {
  _id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: DocumentStatus;
  taskId?: string;
  parseResult?: IParseResult;
  contentBlocks?: IContentBlock[];
  structureNodes?: IStructureNode[];
  tables?: ITableData[];
  figures?: IFigureData[];
  fileUrl?: string;
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

// Parse task types
export interface IParseTask {
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'PROGRESSING';
  document?: IDocument;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Upload types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  mode?: 'lite' | 'pro';
  startPage?: number;
  endPage?: number;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Filter and pagination types
export interface DocumentFilters {
  status?: DocumentStatus;
  search?: string;
  sortBy?: 'uploadedAt' | 'fileName' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  page: number;
  limit: number;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface DocumentCardProps extends BaseComponentProps {
  document: IDocument;
  onView?: (document: IDocument) => void;
  onDelete?: (document: IDocument) => void;
}

export interface ContentBlockProps extends BaseComponentProps {
  block: IContentBlock;
  isSelected?: boolean;
  onSelect?: (block: IContentBlock) => void;
}

export interface StructureNodeProps extends BaseComponentProps {
  node: IStructureNode;
  isExpanded?: boolean;
  onToggle?: (node: IStructureNode) => void;
  onSelect?: (node: IStructureNode) => void;
}

export interface TableViewerProps extends BaseComponentProps {
  table: ITableData;
  editable?: boolean;
  onEdit?: (table: ITableData) => void;
}

export interface FigureViewerProps extends BaseComponentProps {
  figure: IFigureData;
  onView?: (figure: IFigureData) => void;
}
