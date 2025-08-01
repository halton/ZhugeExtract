# ZhugeExtract Backend

ZhugeExtract 后端API服务，为前端应用提供用户认证、文件管理、分享功能等云端增强服务。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- MinIO (S3兼容存储)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd ZhugeExtract/backend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的配置
```

4. **启动服务（Docker方式）**
```bash
# 启动所有服务
docker-compose up -d

# 或仅启动开发环境
docker-compose --profile development up -d

# 查看日志
docker-compose logs -f api
```

5. **启动服务（本地方式）**
```bash
# 确保PostgreSQL、Redis、MinIO正在运行
npm run dev
```

6. **数据库迁移**
```bash
npm run db:migrate
```

### 生产部署

```bash
# 构建并启动生产环境
docker-compose --profile production up -d

# 或使用Kubernetes
kubectl apply -f k8s/
```

## 📚 API文档

启动服务后访问：
- Swagger UI: http://localhost:3000/docs
- API健康检查: http://localhost:3000/health

## 🏗️ 项目结构

```
backend/
├── src/
│   ├── config/          # 配置管理
│   ├── database/        # 数据库模式和连接
│   ├── middleware/      # 中间件
│   ├── routes/          # API路由
│   ├── services/        # 业务逻辑服务
│   └── server.ts        # 服务器入口
├── tests/               # 测试文件
├── docker-compose.yml   # Docker编排
├── Dockerfile          # Docker构建文件
└── package.json        # 项目配置
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | 数据库连接URL | - |
| `REDIS_URL` | Redis连接URL | - |
| `JWT_SECRET` | JWT密钥 | - |
| `MAX_FILE_SIZE` | 最大文件大小(字节) | `2147483648` |

详细配置请参考 `.env.example` 文件。

### 数据库配置

支持PostgreSQL数据库，使用Drizzle ORM进行数据访问。

```typescript
// 连接配置
const db = drizzle(postgres(DATABASE_URL), {
  schema,
  logger: NODE_ENV === 'development'
})
```

### 存储配置

使用MinIO作为对象存储，兼容AWS S3 API。

```typescript
// MinIO客户端配置
const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
  useSSL: MINIO_USE_SSL
})
```

## 🔐 认证系统

基于JWT的认证系统，支持：

- 用户注册/登录
- 令牌刷新
- 会话管理
- 角色权限控制

### API认证

```bash
# 登录获取令牌
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 使用令牌访问API
curl -X GET http://localhost:3000/api/v1/files \
  -H "Authorization: Bearer <your-token>"
```

## 📊 监控和日志

### 健康检查

```bash
curl http://localhost:3000/health
```

返回：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": [
    {"name": "database", "status": "ok"},
    {"name": "redis", "status": "ok"},
    {"name": "storage", "status": "ok"}
  ]
}
```

### 指标监控

启用监控服务：
```bash
docker-compose --profile monitoring up -d
```

访问：
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### 日志管理

使用Pino进行结构化日志记录：

```typescript
fastify.log.info('User logged in', { userId, email })
fastify.log.error('Database error', { error: error.message })
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 运行特定测试
npm test -- --grep "auth"
```

## 🚀 部署选项

### Docker部署

```bash
# 构建镜像
docker build -t zhuge-extract-backend .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  zhuge-extract-backend
```

### Kubernetes部署

```bash
# 应用配置
kubectl apply -f k8s/

# 检查状态
kubectl get pods -l app=zhuge-extract-backend
```

### 云平台部署

支持一键部署到：
- Railway: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/...)
- Fly.io: `fly deploy`
- Render: 连接GitHub仓库自动部署

## 🔒 安全最佳实践

1. **环境变量**：所有敏感信息使用环境变量
2. **HTTPS**：生产环境强制使用HTTPS
3. **CORS**：配置正确的CORS策略
4. **限流**：API访问频率限制
5. **输入验证**：使用Zod进行输入验证
6. **SQL注入防护**：使用参数化查询
7. **密码安全**：bcrypt哈希，高强度要求

## 📈 性能优化

1. **数据库索引**：关键字段建立索引
2. **连接池**：PostgreSQL和Redis连接池
3. **缓存策略**：Redis缓存热点数据
4. **文件流处理**：大文件流式处理
5. **压缩**：Gzip压缩响应
6. **CDN**：静态资源CDN加速

## 🤝 开发指南

### 代码规范

- TypeScript严格模式
- ESLint + Prettier代码格式化
- Husky Git钩子检查
- 提交信息规范（Conventional Commits）

### API设计原则

1. RESTful设计
2. 一致的响应格式
3. 合理的HTTP状态码
4. 完整的错误处理
5. API版本控制
6. 完善的文档

### 提交流程

```bash
# 检查代码质量
npm run lint
npm run type-check

# 运行测试
npm test

# 提交代码
git add .
git commit -m "feat: add user authentication"
git push
```

## 📞 支持和反馈

- 问题反馈：[GitHub Issues](https://github.com/zhuge-extract/issues)
- 功能建议：[GitHub Discussions](https://github.com/zhuge-extract/discussions)
- 邮件联系：support@zhuge-extract.com

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 开发团队

由ZhugeExtract团队用❤️开发