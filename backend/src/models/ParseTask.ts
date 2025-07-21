import mongoose, { Schema, Document } from 'mongoose';

interface IParseTaskDoc extends Document {
  documentId: string;
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'PROGRESSING';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParseTaskSchema = new Schema({
  documentId: {
    type: String,
    ref: 'Document',
    required: true
  },
  taskId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'ERROR', 'PROGRESSING'],
    default: 'PENDING'
  },
  result: {
    type: Schema.Types.Mixed
  },
  error: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ParseTaskSchema.index({ taskId: 1 });
ParseTaskSchema.index({ documentId: 1 });
ParseTaskSchema.index({ status: 1 });
ParseTaskSchema.index({ createdAt: -1 });

// Virtual for document reference
ParseTaskSchema.virtual('document', {
  ref: 'Document',
  localField: 'documentId',
  foreignField: '_id',
  justOne: true
});

export const ParseTaskModel = mongoose.model<IParseTaskDoc>('ParseTask', ParseTaskSchema);
