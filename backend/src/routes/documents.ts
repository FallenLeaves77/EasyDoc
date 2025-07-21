import { Router, Request, Response } from 'express';

const router = Router();

// 真实上传的文档存储 - 只有用户真正上传的文档才会出现在这里
export const uploadedDocuments: any[] = [];

// 示例文档模板 - 用于为任何文档ID提供功能展示
const createSampleDocument = (id: string) => ({
  _id: id,
  fileName: `document_${id}.pdf`,
  originalName: `Document ${id}.pdf`,
  fileSize: 1024000,
  mimeType: 'application/pdf',
  uploadedAt: new Date().toISOString(),
  status: 'completed',
  contentBlocks: [
    {
      id: `block_${id}_1`,
      type: 'title',
      content: `Document ${id} Title`,
      position: { page: 1, x: 0, y: 0, width: 100, height: 20 },
      metadata: { confidence: 0.95, wordCount: 3 },
    },
    {
      id: `block_${id}_2`,
      type: 'paragraph',
      content: `This is a sample paragraph for document ${id}. You can upload your own documents to see real content analysis.`,
      position: { page: 1, x: 0, y: 30, width: 100, height: 40 },
      metadata: { confidence: 0.90, wordCount: 20 },
    },
  ],
  structureNodes: [
    {
      id: `node_${id}_1`,
      type: 'document',
      title: `Document ${id}`,
      level: 0,
      position: { page: 1, order: 0 },
      childIds: [] as string[],
      contentBlockIds: [`block_${id}_1`, `block_${id}_2`] as string[],
      metadata: { wordCount: 100, importance: 1.0, keywords: ['document', 'sample'] },
    },
  ],
  tables: [] as any[],
  figures: [] as any[],
});

// 辅助函数：获取文档（先从真实上传的文档中查找，如果没有找到则创建示例文档）
const getDocument = (id: string) => {
  // 首先尝试从真实上传的文档中查找
  let document = uploadedDocuments.find((doc: any) => doc._id === id);

  // 如果没有找到，创建示例文档
  if (!document) {
    document = createSampleDocument(id);
  }

  return document;
};

/**
 * Get all documents
 * GET /api/documents
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    console.log('📚 Getting documents:', { page, limit, status });

    // 只返回真正上传的文档
    let filteredDocuments = uploadedDocuments;
    if (status) {
      filteredDocuments = uploadedDocuments.filter(doc => doc.status === status);
    }

    const response = {
      success: true,
      data: {
        documents: filteredDocuments,
        total: filteredDocuments.length,
        page: Number(page),
        limit: Number(limit),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `list-${Date.now()}`,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Documents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DOCUMENTS_ERROR',
        message: error.message || 'Failed to get documents',
      },
    });
  }
});

/**
 * Get document by ID
 * GET /api/documents/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('📄 Getting document:', id);

    // 获取文档（真实上传的或示例文档）
    const document = getDocument(id);

    const response = {
      success: true,
      data: document,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: id,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Document error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DOCUMENT_ERROR',
        message: error.message || 'Failed to get document',
      },
    });
  }
});

/**
 * Get document content blocks
 * GET /api/documents/:id/blocks
 */
router.get('/:id/blocks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('🧩 Getting content blocks for document:', id);

    const document = getDocument(id);

    const response = {
      success: true,
      data: {
        documentId: id,
        contentBlocks: document.contentBlocks || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: id,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Blocks error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_BLOCKS_ERROR',
        message: error.message || 'Failed to get blocks',
      },
    });
  }
});

/**
 * Get document structure
 * GET /api/documents/:id/structure
 */
router.get('/:id/structure', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('🏗️ Getting structure for document:', id);

    const document = getDocument(id);

    const response = {
      success: true,
      data: {
        documentId: id,
        structureNodes: document.structureNodes || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: id,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Structure error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STRUCTURE_ERROR',
        message: error.message || 'Failed to get structure',
      },
    });
  }
});

/**
 * Get document tables
 * GET /api/documents/:id/tables
 */
router.get('/:id/tables', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('📊 Getting tables for document:', id);

    const document = getDocument(id);

    const response = {
      success: true,
      data: {
        documentId: id,
        tables: document.tables || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: id,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Tables error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TABLES_ERROR',
        message: error.message || 'Failed to get tables',
      },
    });
  }
});

/**
 * Get document figures
 * GET /api/documents/:id/figures
 */
router.get('/:id/figures', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('🖼️ Getting figures for document:', id);

    const document = getDocument(id);

    const response = {
      success: true,
      data: {
        documentId: id,
        figures: document.figures || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: id,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Figures error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FIGURES_ERROR',
        message: error.message || 'Failed to get figures',
      },
    });
  }
});

/**
 * Delete document
 * DELETE /api/documents/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting document:', id);

    // 查找并删除文档
    const documentIndex = uploadedDocuments.findIndex(doc => doc._id === id);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      });
    }

    const document = uploadedDocuments[documentIndex];

    // 删除文件
    const fs = require('fs').promises;
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, document.fileName);

    try {
      await fs.unlink(filePath);
      console.log('📁 File deleted:', filePath);
    } catch (fileError) {
      console.warn('⚠️ Could not delete file:', filePath, fileError);
    }

    // 从数组中删除文档
    uploadedDocuments.splice(documentIndex, 1);

    const response = {
      success: true,
      data: {
        message: `Document "${document.originalName}" deleted successfully`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: id,
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_DOCUMENT_ERROR',
        message: error.message || 'Failed to delete document',
      },
    });
  }
});

export default router;
