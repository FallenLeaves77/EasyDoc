import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  ApiResponse,
  IDocument,
  IParseTask,
  DocumentStatus,
  PaginatedResponse,
  UploadOptions,
  PaginationParams,
  DocumentFilters
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`📥 API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ API Response Error:', error.response?.data || error.message);

        // Handle common errors
        if (error.response?.status === 401) {
          toast.error('未授权访问');
        } else if (error.response?.status === 403) {
          toast.error('访问被禁止');
        } else if (error.response?.status === 404) {
          toast.error('资源未找到');
        } else if (error.response?.status >= 500) {
          toast.error('服务器错误');
        }

        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Document upload
  async uploadDocument(file: File): Promise<ApiResponse<{ document: IDocument }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Start document parsing
  async startParsing(
    documentId: string,
    options: UploadOptions = {}
  ): Promise<ApiResponse<{ taskId: string }>> {
    const response = await this.client.post('/parse', {
      documentId,
      ...options,
    });

    return response.data;
  }

  // Get parse task status
  async getParseStatus(taskId: string): Promise<ApiResponse<IParseTask>> {
    const response = await this.client.get(`/parse/${taskId}/status`);
    return response.data;
  }

  // Get parse task result
  async getParseResult(taskId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/parse/${taskId}/result`);
    return response.data;
  }

  // Get all documents
  async getDocuments(
    params: PaginationParams & DocumentFilters = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<IDocument>>> {
    const response = await this.client.get('/documents', { params });
    return response.data;
  }

  // Get document by ID
  async getDocument(id: string): Promise<ApiResponse<IDocument>> {
    const response = await this.client.get(`/documents/${id}`);
    return response.data;
  }

  // Delete document
  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/documents/${id}`);
    return response.data;
  }

  // Get document content blocks
  async getDocumentBlocks(id: string): Promise<ApiResponse<{ documentId: string; contentBlocks: any[] }>> {
    const response = await this.client.get(`/documents/${id}/blocks`);
    return response.data;
  }

  // Get document structure
  async getDocumentStructure(id: string): Promise<ApiResponse<{ documentId: string; structureNodes: any[] }>> {
    const response = await this.client.get(`/documents/${id}/structure`);
    return response.data;
  }

  // Get document tables
  async getDocumentTables(id: string): Promise<ApiResponse<{ documentId: string; tables: any[] }>> {
    const response = await this.client.get(`/documents/${id}/tables`);
    return response.data;
  }

  // Get document figures
  async getDocumentFigures(id: string): Promise<ApiResponse<{ documentId: string; figures: any[] }>> {
    const response = await this.client.get(`/documents/${id}/figures`);
    return response.data;
  }

  // Upload and parse in one step
  async uploadAndParse(
    file: File,
    options: UploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<{ document: IDocument; taskId: string }> {
    console.log('📤 uploadAndParse called with file:', file.name, 'size:', file.size);

    // Upload file
    console.log('📁 Starting file upload...');
    const uploadResult = await this.uploadDocument(file);

    if (!uploadResult.success || !uploadResult.data?.document) {
      throw new Error(uploadResult.error?.message || 'Upload failed');
    }

    const document = uploadResult.data.document;

    // Start parsing
    const parseResult = await this.startParsing(document._id, options);

    if (!parseResult.success || !parseResult.data?.taskId) {
      throw new Error(parseResult.error?.message || 'Parse start failed');
    }

    return {
      document,
      taskId: parseResult.data.taskId,
    };
  }

  // Poll parse result until completion
  async pollParseResult(
    taskId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (status: string) => void;
    } = {}
  ): Promise<ApiResponse<any>> {
    const { maxAttempts = 60, intervalMs = 5000, onProgress } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Polling parse result (attempt ${attempt}/${maxAttempts}): ${taskId}`);

      const statusResult = await this.getParseStatus(taskId);

      if (!statusResult.success) {
        return statusResult;
      }

      const status = statusResult.data?.status;
      onProgress?.(status || 'UNKNOWN');

      if (status === 'SUCCESS') {
        console.log('✅ Parse task completed successfully');
        return await this.getParseResult(taskId);
      }

      if (status === 'ERROR') {
        console.log('❌ Parse task failed');
        return {
          success: false,
          error: {
            code: 'PARSE_TASK_ERROR',
            message: statusResult.data?.error || 'Parse task failed',
          },
        };
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Task status: ${status}. Waiting ${intervalMs}ms before next attempt...`);
        await this.sleep(intervalMs);
      }
    }

    return {
      success: false,
      error: {
        code: 'TIMEOUT',
        message: `Parse task timed out after ${maxAttempts} attempts`,
      },
    };
  }

  // Utility method to sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format date
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  // Get status badge color
  static getStatusColor(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.UPLOADED:
        return 'badge-secondary';
      case DocumentStatus.PARSING:
        return 'badge-warning';
      case DocumentStatus.COMPLETED:
        return 'badge-success';
      case DocumentStatus.FAILED:
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  }
}

export const apiService = new ApiService();
export default apiService;
