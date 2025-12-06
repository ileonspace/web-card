# 🪪 Web Card - 全栈个人主页生成器 (Cloudflare D1 版)

> 一个基于 Cloudflare 生态 (Pages + Functions + D1) 构建的极简全栈个人主页系统。
> 支持动态路由、云端数据存储、智能图片压缩及管理员后台。

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Platform](https://img.shields.io/badge/Platform-Cloudflare_Pages-orange)
![Database](https://img.shields.io/badge/Database-Cloudflare_D1-blue)

[请在此处替换为你自己的项目截图，例如：screenshot.png]

🔗 **在线演示**: [https://web-card.pages.dev](https://web-card.pages.dev) (请替换为你自己的链接)

## ✨ 核心特性

这是一个无需购买服务器、完全免费托管的全栈应用：

- ⚡️ **无服务器架构**：后端由 Cloudflare Pages Functions 驱动，全球边缘节点响应。
- 💾 **D1 云数据库**：使用 Cloudflare D1 (SQLite) 存储用户数据，持久化保存。
- 🖼️ **智能图片处理**：前端利用 Canvas API 自动裁剪、居中并压缩图片（Base64），极大节省带宽和数据库额度。
- 🔄 **自动保存机制**：内置防抖动（Debounce）逻辑，修改内容后自动同步至云端。
- 🌗 **多模式支持**：
  - **编辑模式**：登录后可所见即所得地编辑文字、图标和头像。
  - **访客模式**：生成的公开链接（`domain.com/username`）为只读展示页。
  - **夜间模式**：支持一键切换深色/浅色主题。
- 🛡️ **管理员后台**：内置 Admin 控制台，支持查看用户列表、封禁/解封违规账号、删除用户。
- 🔐 **安全设计**：管理员权限基于 Cloudflare 环境变量验证，无需在代码中硬编码密码。

## 🛠️ 技术栈

- **前端**：HTML5, CSS3, Vanilla JavaScript (无框架依赖)
- **后端**：Cloudflare Pages Functions (Node.js Environment)
- **数据库**：Cloudflare D1 (Serverless SQL Database)
- **图标库**：RemixIcon

## 🚀 部署指南 (零成本)

只需拥有一个 GitHub 账号和 Cloudflare 账号，即可免费部署。

### 1. 获取代码
Fork 本仓库到你的 GitHub 账号。

### 2. Cloudflare Pages 设置
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. 选择你 Fork 的仓库 (`web-card`)。
4. **构建配置 (Build configuration)**：
   - **Framework preset**: `None` (必须选 None)
   - **Build command**: (保持为空，不要填任何东西)
   - **Build output directory**: `.` (填一个英文句号，代表根目录)
5. 点击 **Save and Deploy**。

### 3. 创建并初始化数据库 (D1)
1. 在 Cloudflare 后台，进入 **Storage & Databases** -> **D1**。
2. 点击 **Create**，创建一个数据库，命名为 `web-card-db`。
3. 进入该数据库的 **Console** 标签页，粘贴并执行以下 SQL 语句：

```sql
CREATE TABLE users (
    name TEXT PRIMARY KEY,
    data TEXT,
    status TEXT DEFAULT 'active',
    ban_until INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

4. 绑定数据库
回到你的 Pages 项目页面 -> Settings -> Functions。

找到 D1 Database Bindings 部分。

点击 Add binding：

Variable name: DB (注意：必须是大写，与代码一致)

D1 Database: 选择刚才创建的 web-card-db。

点击 Save。

5. 设置管理员权限 (环境变量)
为了启用后台管理功能，你需要配置环境变量：

进入 Pages 项目页面 -> Settings -> Environment variables。

添加以下两个变量：

ADMIN_USER: admin (或者你想要的管理员用户名)

ADMIN_PASS: your_secure_password (设置一个复杂的管理员密码)

点击 Save。

6. 前端配置适配 & 重新部署
修改仓库中的 index.html 文件（约第 330 行）：

JavaScript

const FRONTEND_ADMIN_NAME = 'admin'; // 确保这里的值与你环境变量 ADMIN_USER 一致
重要步骤：回到 Cloudflare Pages 的 Deployments 页面，点击最新的部署记录右侧的三个点，选择 Retry deployment（重试部署）。 注意：修改环境变量和绑定数据库后，必须重新部署一次才会生效。

📖 使用说明
👤 普通用户
访问首页，点击 登录 -> 去注册。

注册并登录后，点击文字直接编辑，点击图标修改样式（支持 RemixIcon 代码）。

点击头像上传本地图片（系统会自动压缩至 20-30KB）。

系统会自动保存修改。

点击右上角 生成链接，复制 URL 分享给朋友。

⚙️ 管理员
使用你在环境变量中设置的 ADMIN_USER 账号登录。

顶部工具栏会出现紫色的 ⚙️ 管理 按钮。

点击进入管理面板，可以查看所有注册用户。

支持操作：

禁用：封禁用户，使其主页显示“账号已封禁”。

解封：恢复用户正常状态。

删除：永久删除用户数据。

📂 项目结构
Plaintext

/
├── index.html        # 前端入口 (包含所有 UI 和 JS 逻辑)
├── _redirects        # Cloudflare 路由配置 (处理 SPA 路由)
├── _headers          # 强制 UTF-8 编码配置
└── functions/        # 后端 Serverless 函数
    └── api/
        ├── user.js   # 处理用户数据的查/改/增
        └── admin.js  # 处理管理员鉴权及操作
📄 License
MIT License. Feel free to use and modify.
