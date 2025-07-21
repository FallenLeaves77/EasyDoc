# 🔒 安全配置说明

## 📋 概述

本项目已经配置了完善的 `.gitignore` 文件，确保核心代码能够安全上传到GitHub，同时保护所有敏感信息不被意外提交。

## ✅ 已上传到GitHub的文件

### 核心代码
- ✅ 所有源代码文件 (`src/`, `components/`, `pages/` 等)
- ✅ 配置文件 (`package.json`, `tsconfig.json`, `next.config.js` 等)
- ✅ 构建配置 (`webpack`, `babel`, `eslint` 等)
- ✅ 文档文件 (`README.md`, `LICENSE`, `DEVELOPMENT.md` 等)

### 示例配置文件
- ✅ `backend/.env.example` - 后端环境变量示例
- ✅ `frontend/.env.example` - 前端环境变量示例
- ✅ 各种配置文件的示例版本

### 项目工具
- ✅ 启动脚本 (`start.bat`, `setup.bat`)
- ✅ 部署脚本 (`scripts/deploy.bat`)
- ✅ 开发工具配置

## 🚫 被保护的敏感信息

### 环境变量和密钥
- 🔒 `.env` - 实际的环境变量文件
- 🔒 `.env.local` - 本地环境变量
- 🔒 `.env.production` - 生产环境变量
- 🔒 所有包含 API 密钥的文件

### 认证和证书
- 🔒 SSH 私钥 (`id_rsa*`, `id_ed25519*`)
- 🔒 SSL 证书 (`*.crt`, `*.pem`, `*.p12`)
- 🔒 认证配置文件 (`credentials.json`, `auth-config.json`)

### 数据库和备份
- 🔒 数据库文件 (`*.db`, `*.sqlite`)
- 🔒 数据库备份 (`*.sql`, `*.dump`, `*.backup`)
- 🔒 用户数据目录

### 第三方服务
- 🔒 Firebase 配置 (`firebase-adminsdk-*.json`)
- 🔒 Google 服务配置 (`google-services.json`)
- 🔒 其他云服务认证文件

## 🛡️ 安全最佳实践

### 1. 环境变量管理
```bash
# ✅ 正确做法：使用示例文件
cp backend/.env.example backend/.env
# 然后编辑 .env 文件添加真实的密钥

# ❌ 错误做法：直接提交包含密钥的 .env 文件
```

### 2. API 密钥保护
```javascript
// ✅ 正确做法：从环境变量读取
const apiKey = process.env.EASYDOC_API_KEY;

// ❌ 错误做法：硬编码在代码中
const apiKey = "sk-1234567890abcdef"; // 永远不要这样做！
```

### 3. 配置文件管理
```bash
# ✅ 提供示例配置
config.example.json

# 🔒 保护实际配置
config.json (被 .gitignore 忽略)
```

## 📝 开发者指南

### 首次设置项目
1. 克隆仓库后，运行 `setup.bat` 自动创建环境文件
2. 编辑 `backend/.env` 添加您的 API 密钥
3. 编辑 `frontend/.env.local` 配置前端环境变量

### 添加新的敏感配置
如果需要添加新的敏感配置文件：

1. 将文件模式添加到 `.gitignore`
2. 创建对应的 `.example` 文件
3. 在文档中说明配置方法

### 检查敏感信息泄露
```bash
# 检查是否有敏感文件被意外添加
git status

# 检查提交历史中的敏感信息
git log --oneline
```

## 🚨 紧急情况处理

### 如果意外提交了敏感信息

1. **立即更改密钥**
   - 撤销或重新生成所有泄露的 API 密钥
   - 更改数据库密码
   - 更新其他认证信息

2. **清理 Git 历史**
   ```bash
   # 从历史中移除敏感文件
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/sensitive/file' \
   --prune-empty --tag-name-filter cat -- --all
   
   # 强制推送（谨慎操作）
   git push origin --force --all
   ```

3. **通知团队**
   - 告知所有团队成员安全事件
   - 确保所有人更新本地仓库
   - 检查是否有其他系统受影响

## 📞 联系方式

如果发现安全问题或有疑问，请：
1. 创建 GitHub Issue（不要在 Issue 中包含敏感信息）
2. 或通过私人渠道联系项目维护者

## 📚 相关资源

- [GitHub 安全最佳实践](https://docs.github.com/en/code-security)
- [环境变量管理指南](https://12factor.net/config)
- [API 密钥安全指南](https://owasp.org/www-project-api-security/)
