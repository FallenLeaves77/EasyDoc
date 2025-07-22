import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { IParseResult } from '../types';

export class EasyDocService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EASYDOC_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('EASYDOC_API_KEY is required');
    }

    this.client = axios.create({
      baseURL: process.env.EASYDOC_API_URL || 'https://api.easydoc.sh',
      timeout: 120000, // Increase timeout to 2 minutes
      headers: {
        'api-key': this.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📤 EasyDoc API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ EasyDoc API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`📥 EasyDoc API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ EasyDoc API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload and parse a document
   */
  async parseDocument(
    filePath: string,
    options: {
      mode?: 'lite' | 'pro';
      startPage?: number;
      endPage?: number;
    } = {}
  ): Promise<IParseResult> {
    try {
      const { mode = 'lite', startPage, endPage } = options;

      // 检查文件大小，给出警告
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      if (fileSizeInMB > 10) {
        console.warn(`⚠️ Large file detected: ${fileSizeInMB.toFixed(2)}MB. This may cause timeout.`);
      }

      console.log(`📤 Uploading file: ${path.basename(filePath)} (${fileSizeInMB.toFixed(2)}MB) in ${mode} mode`);

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('mode', mode);

      if (startPage) {
        formData.append('start_page', startPage.toString());
      }
      if (endPage) {
        formData.append('end_page', endPage.toString());
      }

      const response: AxiosResponse<IParseResult> = await this.client.post(
        '/api/v1/parse',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 300000, // 5分钟超时
        }
      );

      console.log(`✅ Document parsed successfully. Response size: ${JSON.stringify(response.data).length} chars`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error parsing document:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        errCode: 'PARSE_ERROR',
        errMessage: error.message || 'Failed to parse document',
      };
    }
  }

  /**
   * Get parse task result
   */
  async getParseResult(taskId: string): Promise<IParseResult> {
    try {
      const response: AxiosResponse<IParseResult> = await this.client.get(
        `/api/v1/parse/${taskId}/result`
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting parse result:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        errCode: 'GET_RESULT_ERROR',
        errMessage: error.message || 'Failed to get parse result',
      };
    }
  }

  /**
   * Poll for parse result until completion
   */
  async pollParseResult(
    taskId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
    } = {}
  ): Promise<IParseResult> {
    const { maxAttempts = 60, intervalMs = 5000 } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Polling parse result (attempt ${attempt}/${maxAttempts}): ${taskId}`);

      const result = await this.getParseResult(taskId);

      if (!result.success) {
        return result;
      }

      const status = result.data?.task_status;

      if (status === 'SUCCESS') {
        console.log('✅ Parse task completed successfully');
        console.log('📊 Parse result data structure:', JSON.stringify(result.data?.task_result, null, 2));
        return result;
      }

      if (status === 'ERROR') {
        console.log('❌ Parse task failed');
        return {
          success: false,
          errCode: 'PARSE_TASK_ERROR',
          errMessage: 'Parse task failed',
          data: result.data,
        };
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Task status: ${status}. Waiting ${intervalMs}ms before next attempt...`);
        await this.sleep(intervalMs);
      }
    }

    return {
      success: false,
      errCode: 'TIMEOUT',
      errMessage: `Parse task timed out after ${maxAttempts} attempts`,
    };
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to make a simple request to validate the API key
      const response = await this.client.get('/');
      return response.status === 200;
    } catch (error) {
      console.error('❌ API key validation failed:', error);
      return false;
    }
  }
}
