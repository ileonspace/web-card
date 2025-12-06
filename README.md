# 🪪 Web Card - 全栈个人主页生成器

> 基于 Cloudflare 生态 (Pages + D1 + Functions) 构建的极简全栈应用。
> 零成本部署、无服务器架构、支持动态路由与管理员后台。

![Status](https://img.shields.io/badge/Status-Active-success)
![Platform](https://img.shields.io/badge/Platform-Cloudflare_Pages-orange)
![Database](https://img.shields.io/badge/Database-Cloudflare_D1-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📖 项目简介

**Web Card** 是一个运行在边缘网络上的个人主页生成系统。用户可以注册账号、在线编辑资料、上传头像（自动压缩）、并生成专属的公开展示链接。

系统内置了完整的权限管理模块，管理员可以通过独立后台对用户进行封禁或删除操作。所有数据存储在 Cloudflare D1 数据库中，前端通过 Cloudflare Pages Functions 进行交互。

## ✨ 核心功能

* **⚡️ 全栈无服务器**：前端静态托管 + 后端 Serverless Functions，毫秒级响应。
* **💾 云端数据库**：集成 Cloudflare D1 (SQLite)，数据持久化存储。
* **🖼️ 智能图片处理**：前端 Canvas 自动裁剪、居中并压缩图片（Base64），极大节省带宽与存储。
* **🔄 自动保存 (Auto-Save)**：内置防抖动机制，编辑内容静默同步至云端。
* **🌗 双模式 UI**：支持 **访客模式** (只读展示) 和 **编辑模式** (所见即所得)，自带夜间模式。
* **🛡️ 管理员后台**：内置 Admin 控制台，支持查看用户列表、封禁/解封、删除用户。
* **🔐 安全验证**：管理员权限基于 Cloudflare 环境变量验证，彻底分离代码与密钥。

## 🛠️ 技术栈

* **Frontend**: HTML5, CSS3, Vanilla JavaScript
* **Backend**: Cloudflare Pages Functions (Node.js Environment)
* **Database**: Cloudflare D1 (Serverless SQL)
* **Icons**: RemixIcon

## 🚀 部署指南 (零成本)

只需 5 步，即可免费部署属于你的全栈系统。

### 1. 获取代码
Fork 本仓库到你的 GitHub 账号。

### 2. 创建 Cloudflare Pages 项目
1.  登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2.  进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3.  选择你 Fork 的仓库。
4.  **构建配置 (Build configuration)** - ⚠️ **非常重要**：
    * **Framework preset**: `None`
    * **Build command**: `(留空，不要填任何内容)`
    * **Build output directory**: `.` `(填一个英文句号)`
5.  点击 **Save and Deploy**。

### 3. 创建数据库 (D1)
1.  在 Cloudflare 后台，进入 **Storage & Databases** -> **D1**。
2.  点击 **Create**，创建一个数据库，命名为 `web-card-db`。
3.  进入该数据库的 **Console** 标签页，粘贴并执行以下 SQL 初始化表结构：

```sql
CREATE TABLE users (
    name TEXT PRIMARY KEY,
    data TEXT,
    status TEXT DEFAULT 'active',
    ban_until INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
