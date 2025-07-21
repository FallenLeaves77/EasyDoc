import mongoose, { Schema, Document } from 'mongoose';
import { DocumentStatus } from '../types';

// Content Block Schema
const ContentBlockSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  position: {
    page: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  metadata: {
    confidence: { type: Number, required: true },
    language: { type: String },
    semanticTags: [{ type: String }],
    wordCount: { type: Number, required: true }
  },
  parentBlockId: { type: String },
  childBlockIds: [{ type: String }]
}, { _id: false });

// Structure Node Schema
const StructureNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  level: { type: Number, required: true },
  position: {
    page: { type: Number, required: true },
    order: { type: Number, required: true }
  },
  parentId: { type: String },
  childIds: [{ type: String }],
  contentBlockIds: [{ type: String }],
  metadata: {
    wordCount: { type: Number, required: true },
    importance: { type: Number, required: true },
    keywords: [{ type: String }]
  }
}, { _id: false });

// Table Cell Schema
const TableCellSchema = new Schema({
  value: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'date', 'boolean', 'empty'], required: true },
  colspan: { type: Number, default: 1 },
  rowspan: { type: Number, default: 1 },
  isHeader: { type: Boolean, default: false }
}, { _id: false });

// Table Data Schema
const TableDataSchema = new Schema({
  id: { type: String, required: true },
  position: {
    page: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  structure: {
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
    hasHeader: { type: Boolean, required: true },
    hasFooter: { type: Boolean, required: true }
  },
  data: [[TableCellSchema]],
  metadata: {
    title: { type: String },
    caption: { type: String },
    confidence: { type: Number, required: true },
    dataTypes: [{ type: String }]
  }
}, { _id: false });

// Figure Data Schema
const FigureDataSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    page: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  content: {
    imageUrl: { type: String },
    description: { type: String, required: true },
    caption: { type: String },
    altText: { type: String }
  },
  metadata: {
    confidence: { type: Number, required: true },
    extractedText: { type: String },
    colors: [{ type: String }],
    objects: [{ type: String }]
  }
}, { _id: false });

// Document interface
interface IDocumentDoc extends Document {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  status: DocumentStatus;
  taskId?: string;
  parseResult?: any;
  contentBlocks?: any[];
  structureNodes?: any[];
  tables?: any[];
  figures?: any[];
  fileUrl?: string;
}

// Main Document Schema
const DocumentSchema = new Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: Object.values(DocumentStatus),
    default: DocumentStatus.UPLOADED
  },
  taskId: { type: String },
  parseResult: { type: Schema.Types.Mixed },
  contentBlocks: [ContentBlockSchema],
  structureNodes: [StructureNodeSchema],
  tables: [TableDataSchema],
  figures: [FigureDataSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
DocumentSchema.index({ fileName: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ taskId: 1 });
DocumentSchema.index({ uploadedAt: -1 });

// Virtual for file URL
DocumentSchema.virtual('fileUrl').get(function () {
  return `/uploads/${this.fileName}`;
});

export const DocumentModel = mongoose.model<IDocumentDoc>('Document', DocumentSchema);
