import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // 检查数据库连接状态
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    const response = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbStatus,
          connected: mongoose.connection.readyState === 1,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'health-check',
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Health check failed',
      },
    });
  }
});

export default router;
