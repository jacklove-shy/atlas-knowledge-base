# Atlas — Knowledge Base

面向 AI 应用前端岗位的知识库问答作品集项目，展示文档来源管理、检索状态、答案引用和来源预览等 RAG 产品交互。

## 功能

- 文档来源列表、搜索和选择
- 展示索引状态与知识库概览
- 基于知识库的问答演示，答案附带引用
- 点击引用可查看原始资料片段
- 支持上传 TXT 和 Markdown 内容；其他格式可加入演示列表
- 响应式布局与空状态、无匹配结果、处理中状态

## 本地运行

需要 Node.js 20+。

```bash
pnpm install
pnpm dev
```

## 演示说明

此项目使用本地样例资料和轻量级关键词匹配模拟检索与回答，不会将上传的文件发送到远端。TXT 和 Markdown 文件会在浏览器读取文本；PDF 和 Word 文件目前只显示在来源列表中，不解析正文。真实部署时应接入安全的服务端文档解析、向量检索和模型 API，并对引用片段做权限校验。

## 技术栈

- React 18 + TypeScript
- Vite
- lucide-react
- CSS Grid / Flexbox

## 开发脚本

- `pnpm dev` — 启动开发服务器
- `pnpm build` — TypeScript 检查并构建生产资源
- `pnpm preview` — 预览生产构建

## License

MIT

