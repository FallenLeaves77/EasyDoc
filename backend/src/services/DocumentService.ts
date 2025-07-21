import { DocumentModel } from '../models/Document';
import { ParseTaskModel } from '../models/ParseTask';
import { EasyDocService } from './EasyDocService';
import { ContentAnalysisService } from './ContentAnalysisService';
import { IDocument, DocumentStatus, IFileUpload, ApiResponse } from '../types';
import fs from 'fs/promises';
import path from 'path';

export class DocumentService {
  private easyDocService: EasyDocService;
  private contentAnalysisService: ContentAnalysisService;

  constructor() {
    this.easyDocService = new EasyDocService();
    this.contentAnalysisService = new ContentAnalysisService();
  }

  /**
   * Create a new document record
   */
  async createDocument(fileInfo: IFileUpload): Promise<ApiResponse<IDocument>> {
    try {
      const document = new DocumentModel({
        fileName: fileInfo.filename,
        originalName: fileInfo.originalname,
        fileSize: fileInfo.size,
        mimeType: fileInfo.mimetype,
        status: DocumentStatus.UPLOADED,
      });

      const savedDocument = await document.save();
      
      return {
        success: true,
        data: savedDocument.toObject(),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: savedDocument._id?.toString() || '',
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error creating document:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_DOCUMENT_ERROR',
          message: error.message || 'Failed to create document',
          details: error,
        },
      };
    }
  }

  /**
   * Start document parsing
   */
  async startParsing(
    documentId: string,
    options: {
      mode?: 'lite' | 'pro';
      startPage?: number;
      endPage?: number;
    } = {}
  ): Promise<ApiResponse<{ taskId: string }>> {
    try {
      const document = await DocumentModel.findById(documentId);
      if (!document) {
        return {
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        };
      }

      // Update document status
      document.status = DocumentStatus.PARSING;
      await document.save();

      // Get file path
      const filePath = path.join(process.cwd(), 'uploads', document.fileName);

      // Start parsing with EasyDoc
      const parseResult = await this.easyDocService.parseDocument(filePath, options);

      if (!parseResult.success || !parseResult.data?.taskId) {
        document.status = DocumentStatus.FAILED;
        await document.save();
        
        return {
          success: false,
          error: {
            code: parseResult.errCode || 'PARSE_START_ERROR',
            message: parseResult.errMessage || 'Failed to start parsing',
          },
        };
      }

      // Save task information
      const taskId = parseResult.data.taskId;
      document.taskId = taskId;
      document.parseResult = parseResult;
      await document.save();

      // Create parse task record
      const parseTask = new ParseTaskModel({
        documentId: document._id,
        taskId: taskId,
        status: 'PENDING',
      });
      await parseTask.save();

      // Start background polling
      this.pollParseResultInBackground(documentId, taskId);

      return {
        success: true,
        data: { taskId },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: documentId,
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error starting parsing:', error);
      return {
        success: false,
        error: {
          code: 'START_PARSING_ERROR',
          message: error.message || 'Failed to start parsing',
          details: error,
        },
      };
    }
  }

  /**
   * Get parse status
   */
  async getParseStatus(taskId: string): Promise<ApiResponse<any>> {
    try {
      const parseTask = await ParseTaskModel.findOne({ taskId }).populate('document');
      if (!parseTask) {
        return {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Parse task not found',
          },
        };
      }

      return {
        success: true,
        data: {
          taskId: parseTask.taskId,
          status: parseTask.status,
          document: parseTask.document,
          result: parseTask.result,
          error: parseTask.error,
          createdAt: parseTask.createdAt,
          updatedAt: parseTask.updatedAt,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: taskId,
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error getting parse status:', error);
      return {
        success: false,
        error: {
          code: 'GET_STATUS_ERROR',
          message: error.message || 'Failed to get parse status',
          details: error,
        },
      };
    }
  }

  /**
   * Get all documents
   */
  async getDocuments(
    options: {
      page?: number;
      limit?: number;
      status?: DocumentStatus;
    } = {}
  ): Promise<ApiResponse<{ documents: IDocument[]; total: number; page: number; limit: number }>> {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const [documents, total] = await Promise.all([
        DocumentModel.find(filter)
          .sort({ uploadedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DocumentModel.countDocuments(filter),
      ]);

      return {
        success: true,
        data: {
          documents,
          total,
          page,
          limit,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `list-${Date.now()}`,
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error getting documents:', error);
      return {
        success: false,
        error: {
          code: 'GET_DOCUMENTS_ERROR',
          message: error.message || 'Failed to get documents',
          details: error,
        },
      };
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<ApiResponse<IDocument>> {
    try {
      const document = await DocumentModel.findById(documentId).lean();
      if (!document) {
        return {
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        };
      }

      return {
        success: true,
        data: document,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: documentId,
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error getting document:', error);
      return {
        success: false,
        error: {
          code: 'GET_DOCUMENT_ERROR',
          message: error.message || 'Failed to get document',
          details: error,
        },
      };
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const document = await DocumentModel.findById(documentId);
      if (!document) {
        return {
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        };
      }

      // Delete file
      const filePath = path.join(process.cwd(), 'uploads', document.fileName);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('⚠️ Could not delete file:', filePath);
      }

      // Delete parse tasks
      await ParseTaskModel.deleteMany({ documentId });

      // Delete document
      await DocumentModel.findByIdAndDelete(documentId);

      return {
        success: true,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: documentId,
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error deleting document:', error);
      return {
        success: false,
        error: {
          code: 'DELETE_DOCUMENT_ERROR',
          message: error.message || 'Failed to delete document',
          details: error,
        },
      };
    }
  }

  /**
   * Poll parse result in background
   */
  private async pollParseResultInBackground(documentId: string, taskId: string): Promise<void> {
    try {
      console.log(`🔄 Starting background polling for task: ${taskId}`);
      
      const result = await this.easyDocService.pollParseResult(taskId, {
        maxAttempts: 60,
        intervalMs: 5000,
      });

      const document = await DocumentModel.findById(documentId);
      const parseTask = await ParseTaskModel.findOne({ taskId });

      if (!document || !parseTask) {
        console.error('❌ Document or parse task not found during polling');
        return;
      }

      if (result.success && result.data?.task_status === 'SUCCESS') {
        // Parse completed successfully
        document.status = DocumentStatus.COMPLETED;
        document.parseResult = result;
        
        parseTask.status = 'SUCCESS';
        parseTask.result = result.data.task_result;

        // Analyze content and extract structured data
        if (result.data.task_result) {
          const analysisResult = await this.contentAnalysisService.analyzeContent(result.data.task_result);
          
          if (analysisResult.success) {
            document.contentBlocks = analysisResult.data?.contentBlocks;
            document.structureNodes = analysisResult.data?.structureNodes;
            document.tables = analysisResult.data?.tables;
            document.figures = analysisResult.data?.figures;
          }
        }
      } else {
        // Parse failed
        document.status = DocumentStatus.FAILED;
        parseTask.status = 'ERROR';
        parseTask.error = result.errMessage || 'Parse task failed';
      }

      await document.save();
      await parseTask.save();

      console.log(`✅ Background polling completed for task: ${taskId}`);
    } catch (error) {
      console.error('❌ Error in background polling:', error);
      
      // Update status to failed
      try {
        await DocumentModel.findByIdAndUpdate(documentId, { status: DocumentStatus.FAILED });
        await ParseTaskModel.findOneAndUpdate({ taskId }, { status: 'ERROR', error: 'Polling failed' });
      } catch (updateError) {
        console.error('❌ Error updating failed status:', updateError);
      }
    }
  }
}
