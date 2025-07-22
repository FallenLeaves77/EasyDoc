const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
require('dotenv').config();

const API_KEY = process.env.EASYDOC_API_KEY;
const API_URL = process.env.EASYDOC_API_URL || 'https://api.easydoc.sh';

console.log('🔧 Testing EasyDoc API...');
console.log('📍 API URL:', API_URL);
console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET');

async function testAPI() {
  try {
    // 1. 测试基本连接
    console.log('\n1️⃣ Testing basic connection...');
    const client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'api-key': API_KEY,
      },
    });

    try {
      const response = await client.get('/');
      console.log('✅ Basic connection successful:', response.status);
    } catch (error) {
      console.log('❌ Basic connection failed:', error.response?.status, error.response?.data || error.message);
    }

    // 2. 测试API端点
    console.log('\n2️⃣ Testing API endpoints...');
    try {
      const response = await client.get('/api/v1');
      console.log('✅ API endpoint accessible:', response.status);
    } catch (error) {
      console.log('❌ API endpoint failed:', error.response?.status, error.response?.data || error.message);
    }

    // 3. 测试文档解析（如果有测试文件）
    const testFilePath = path.join(__dirname, 'uploads');
    if (fs.existsSync(testFilePath)) {
      const files = fs.readdirSync(testFilePath);
      if (files.length > 0) {
        const testFile = path.join(testFilePath, files[0]);
        console.log(`\n3️⃣ Testing document parsing with: ${files[0]}`);
        
        try {
          const formData = new FormData();
          formData.append('file', fs.createReadStream(testFile));
          formData.append('mode', 'lite');

          const response = await client.post('/api/v1/parse', formData, {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 60000,
          });

          console.log('✅ Document parsing request successful:', response.status);
          console.log('📄 Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('❌ Document parsing failed:', error.response?.status, error.response?.data || error.message);
        }
      } else {
        console.log('⚠️ No test files found in uploads directory');
      }
    } else {
      console.log('⚠️ Uploads directory not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
