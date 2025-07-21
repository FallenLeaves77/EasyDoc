# EasyDoc2 📄

> 智能文档解析系统 - 支持多格式文档解析与内容分析

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

EasyDoc2 是一个现代化的智能文档解析系统，支持多种文档格式的上传、解析和内容分析。系统采用前后端分离架构，提供直观的用户界面和强大的文档处理能力。

## ✨ 主要特性

- 📄 **多格式支持**: PDF、DOCX、DOC、TXT、RTF等格式
- 🧠 **智能解析**: 自动识别文档结构、标题、段落、列表等
- 🔍 **内容分析**: 提取关键信息，生成结构化数据
- 🎨 **现代界面**: 基于React和Tailwind CSS的响应式设计
- ⚡ **高性能**: TypeScript + Node.js后端，快速处理
- 🔧 **易部署**: 支持本地开发和生产环境部署

### 🚀 核心功能

#### 1. 内容块识别
将分散的文本转换为LLM就绪的知识块，具备智能内容分割和语义理解能力。

#### 2. 层次化文档结构分析
重构创意思维导图，通过高级文档层次分析为LLM提供更深层的结构化上下文。

#### 3. 表格和图形理解
将复杂的表格和图形转换为结构化知识，为AI应用提供强大支持。

## 🏗️ Architecture

```
EasyDoc2/
├── frontend/                    # Next.js + TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Next.js pages
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── styles/            # CSS styles
│   ├── package.json
│   └── .env                   # Frontend environment variables
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # Database and logger config
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── .env                   # Backend environment variables
├── scripts/                   # 启动脚本
│   ├── start-dev.bat         # 开发环境启动脚本
│   └── start-mongodb.bat     # MongoDB启动脚本
├── start.bat                 # Windows快速启动脚本
└── README.md                 # 项目说明文档
```

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **HTTP客户端**: Axios
- **文件上传**: React Dropzone
- **通知系统**: React Hot Toast

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **文档解析**:
  - PDF: pdf-parse
  - DOCX/DOC: mammoth
  - 编码检测: chardet + iconv-lite
- **文件上传**: multer
- **跨域**: CORS
- **安全**: Helmet

## 📦 安装与运行

### 环境要求

- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/your-username/EasyDoc2.git
cd EasyDoc2
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **启动开发服务器**
```bash
# 方式1: 使用启动脚本（推荐）
cd ..
./start.bat  # Windows

# 方式2: 手动启动
# 终端1 - 启动后端
cd backend
npm run dev

# 终端2 - 启动前端
cd frontend
npm run dev
```

4. **访问应用**
- 前端: http://localhost:3000 (如果3000被占用会自动使用3002)
- 后端API: http://localhost:3001
- API文档: http://localhost:3001/api/health

## 🔧 Configuration

### Backend Configuration (`backend/.env`)
```env
# EasyDoc API配置
EASYDOC_API_KEY=your-easydoc-api-key-here
EASYDOC_API_URL=https://api.easydoc.sh

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/easydoc2

# 服务器配置
PORT=3001
NODE_ENV=development

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# 安全配置
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:3000

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Frontend Configuration (`frontend/.env`)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Application Configuration
NEXT_PUBLIC_APP_NAME=EasyDoc2
NEXT_PUBLIC_APP_VERSION=1.0.0

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,rtf
NEXT_PUBLIC_SUPPORTED_FORMATS=.pdf,.doc,.docx,.txt,.rtf
```

## 📖 Usage

1. **Upload Document**: Navigate to the upload page and select a supported file
2. **Choose Processing Mode**: Select "Lite" for faster processing or "Pro" for detailed analysis
3. **Monitor Progress**: Watch real-time processing status with polling
4. **Explore Results**: View the three core analysis features:
   - **Content Blocks**: Semantic segmentation with confidence scores
   - **Document Structure**: Hierarchical tree with importance scoring
   - **Tables & Figures**: Structured data extraction with metadata

## 🎯 Key Features

### Content Block Identification
- ✅ Intelligent text segmentation into semantic blocks
- ✅ Block type classification (title, heading, paragraph, list, etc.)
- ✅ Confidence scoring and metadata extraction
- ✅ Interactive block selection and viewing
- ✅ Position and formatting information

### Document Structure Analysis
- ✅ Hierarchical structure extraction
- ✅ Tree-based navigation with expand/collapse
- ✅ Node importance scoring
- ✅ Keyword extraction for each section
- ✅ Page range mapping

### Table and Figure Processing
- ✅ Automatic table detection and extraction
- ✅ CSV export functionality
- ✅ Figure type classification
- ✅ Image preview and metadata analysis
- ✅ Position and dimension tracking

## 🌐 API Endpoints

### Document Management
- `POST /api/upload` - Upload document for processing
- `POST /api/parse` - Start document parsing
- `GET /api/parse/:taskId/status` - Check parsing status
- `GET /api/parse/:taskId/result` - Get parsing result

### Document Queries
- `GET /api/documents` - List all documents with pagination
- `GET /api/documents/:id` - Get specific document
- `GET /api/documents/:id/blocks` - Get content blocks
- `GET /api/documents/:id/structure` - Get document structure
- `GET /api/documents/:id/tables` - Get extracted tables
- `GET /api/documents/:id/figures` - Get extracted figures

### System
- `GET /api/health` - Health check endpoint

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running: `mongod`
   - Check connection string in `backend/.env`

2. **EasyDoc API Error**:
   - Verify API key in `backend/.env`
   - Check API credits at [EasyDoc Dashboard](https://easydoc.sh)

3. **File Upload Error**:
   - Check file size (max 50MB)
   - Verify supported formats: PDF, DOC, DOCX, TXT, RTF

4. **Port Already in Use**:
   - Change `PORT` in `backend/.env`
   - Update `NEXT_PUBLIC_API_URL` in `frontend/.env`

### Development Tips

- **Backend logs**: Check `logs/` directory for detailed logs
- **Frontend errors**: Open browser DevTools console
- **API testing**: Use the health endpoint: `http://localhost:3001/api/health`
- **Database inspection**: Use MongoDB Compass or CLI

## 📊 System Requirements

Based on the detailed system requirements document (`EasyDoc2_系统需求说明书.html`):

- **Node.js**: 18.0.0 or higher
- **MongoDB**: 4.4 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 10GB (50GB SSD recommended)
- **Network**: Stable internet connection for EasyDoc API

## 📄 License

MIT License - Built with EasyDoc API integration

---

**Note**: This project implements the EasyDoc API specifications as documented in the system requirements. For detailed technical specifications, refer to `EasyDoc2_系统需求说明书.html`.
