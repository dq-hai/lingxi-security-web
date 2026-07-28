# 灵犀安全 · 反诈管控平台 Web 端

灵犀安全反诈管控平台的 Web 管理后台，为管理员提供全国反诈态势监控、风险任务追踪、策略校验和用户管理等能力。配合 Android 客户端使用，形成"端侧采集 + 后台研判 + 联动处置"的完整反诈闭环。

## 功能模块

### 数据驾驶舱
- 全国诈骗风险热力地图（基于 ECharts），支持拖拽、缩放
- 实时风险预警流，高危事件优先展示
- 核心指标总览：注册用户、今日任务、高危预警、处置率
- 联动处置链路可视化（信号捕获 → 链路判定 → 任务编排 → 闭环复盘）

### 风险监测中心
- RAG 溯源任务列表，支持按 taskId、风险等级筛选
- 任务详情面板：风险评分、判定理由、原始证据
- 高危/中危/低危三级标注

### 策略实验室
- URL / 二维码校验：提交可疑链接或上传截图进行检测
- 异步 RAG 分析：提交内容后通过 WebSocket 实时接收分析结果
- 任务状态补查

### 用户中心
- 业务用户凭证管理（注册/登录获取 Token）
- 守护对象绑定与列表管理
- 用户资料同步
- 受保护接口调试

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite 5 |
| UI 组件 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 图表 | ECharts 5 |
| 样式 | SCSS |
| HTTP | Axios |
| 实时通信 | WebSocket |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（离线模式，使用本地管理员账号）
npm run dev

# 启动开发服务器（在线模式，连接后端 API）
npm run dev:online

# 构建生产版本
npm run build
```

离线模式下使用默认管理员账号 `admin / admin123` 登录，无需后端服务即可预览全部页面。

## 项目结构

```
src/
├── api/            # API 请求封装
├── assets/         # 静态资源（地图数据、地址库、样式）
├── components/     # 公共组件（RiskCard、DataChart）
├── directives/     # 自定义指令（滚动动画）
├── hooks/          # 组合式函数（认证、WebSocket）
├── router/         # 路由配置与导航守卫
└── views/          # 页面视图
    ├── Login.vue         # 管理员登录
    ├── Dashboard.vue     # 数据驾驶舱
    ├── RiskMonitor.vue   # 风险监测中心
    ├── Strategy.vue      # 策略实验室
    ├── UserCenter.vue    # 用户中心
    └── AdminProfile.vue  # 管理员个人中心
```

## 登录模式

平台支持三种管理员登录模式，通过环境变量 `VITE_ADMIN_LOGIN_MODE` 配置：

- **offline**（默认）：本地离线登录，适用于开发调试
- **online**：连接后端管理员登录接口
- **auto**：优先在线登录，失败时自动降级为离线登录

## 相关项目

- 后端服务：提供 RESTful API 与 WebSocket 推送
- Android 客户端：面向普通用户的反诈检测 App
