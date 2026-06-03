# 基于区块链技术的健身房会员管理与成就系统

## 项目简介

本系统是一个基于以太坊区块链的健身房会员管理与成就平台。系统采用**链上 + 链下混合存储**架构：会员卡权益、每日打卡、FitToken 代币、NFT 成就徽章等核心资产数据通过智能合约上链存储，确保透明不可篡改；用户资料、课程信息、预约记录、操作日志等业务数据存储在 MySQL 数据库中，保证查询效率与系统性能。课程管理与预约完全由后端处理，仅在涉及 FitToken 支付时调用代币合约完成链上转账。NFT 徽章元数据由管理员预上传至 Pinata/IPFS，铸造时直接引用已有 CID。前端采用 React + Ethers.js 与区块链交互，后端使用 Node.js (Express) + MySQL 提供 API 服务，智能合约通过 Hardhat 开发并部署到本地 Geth Dev 开发链进行测试。

## 项目状态与开发目标

- **当前目标**：完成一个可本地运行、可演示核心业务闭环的全栈 DApp 原型。
- **运行环境**：本地 Geth Dev 开发链 + 本地 MySQL + 本地前后端服务。
- **核心交付物**：Solidity 智能合约、Hardhat 部署与测试脚本、Express 后端 API、Sequelize 数据模型与迁移、React 前端页面、README 运行说明。
- **实现范围**：优先完成核心功能，扩展功能可在核心闭环稳定后再实现。
- **非生产说明**：本项目默认面向毕业设计演示和本地开发测试，不直接用于生产环境。

## 系统特色

- **链上链下混合架构**：核心权益与资产上链，业务数据存入 MySQL，兼顾可信性与查询效率。
- **钱包签名登录**：使用 MetaMask 钱包地址作为用户身份标识，后端验证签名后签发 JWT。
- **ERC-20 激励机制**：通过 FitToken 奖励用户打卡和课程完成行为。
- **ERC-721 成就徽章**：使用 NFT 记录用户的重要健身成就。
- **低门槛 NFT 领取**：成就 NFT 由后端服务钱包统一铸造，普通用户领取时无需自行支付 gas。
- **教练体系**：教练作为业务实体独立管理，支持会员浏览、收藏，管理员维护教练信息与业绩统计。
- **AI 智能助手**：集成 DeepSeek 大语言模型，为会员提供健身建议、课程咨询、饮食规划等智能问答服务，支持多轮对话与会话管理。
- **暗色毛玻璃 UI**：首页与登录页采用全屏背景图 + 暗色半透明毛玻璃（glassmorphism）设计风格，配合动态粒子和流光动画效果。
- **可演示业务闭环**：支持会员注册、会员卡购买、打卡奖励、课程预约、成就领取和后台管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 智能合约 | Solidity ^0.8.x + Hardhat + Geth Dev 本地链 |
| 后端 | Node.js + Express + MySQL 8.x (Sequelize ORM) |
| 前端 | React 18 + TypeScript + TailwindCSS + Ethers.js v6 + Zustand (状态管理) + Lucide Icons |
| AI 服务 | DeepSeek API (deepseek-chat 模型) |
| 钱包 | MetaMask |
| 代币/NFT | ERC-20 (FitToken) + ERC-721 (成就徽章) |
| IPFS | Pinata (NFT 徽章元数据存储) |
| 静态资源 | 后端 `public/` 目录（首页背景图、教练头像、环境图片等本地资源） |

## 系统架构

```
前端 (React + Ethers.js + MetaMask)
    │ REST API                     │ 链上交互
┌───▼─────────────────┐    ┌───▼───────────────────────┐
│ 后端 (Express)     │    │ Geth Dev 本地开发链          │
│ JWT 认证 + 业务逻辑 │    │ MembershipManager / CheckIn │
│ 成就校验 + 铸造调度 │    │ FitToken / AchievementBadge  │
│ ───────────────── │    └───────────────────────────┘
│ MySQL 8.x          │    ┌───────────────────────────┐
│ 用户/课程/预约/日志 │    │ Pinata/IPFS (NFT元数据)     │
└───────────────────┘    └───────────────────────────┘
```

## 功能实现范围

### 核心功能

- 首页展示（健身房简介、轮播图、热门课程推荐、推荐教练、最新公告、环境图片），暗色毛玻璃风格
- 钱包连接与钱包签名登录
- 会员注册与会员卡购买/续费（链上）
- 每日打卡与连续打卡统计（链上）
- FitToken 代币奖励与消费（链上）
- 课程发布、预约、签到确认与课程评价（MySQL）
- 教练信息管理与展示（MySQL）
- 成就 NFT 手动领取与铸造（链上）
- AI 智能助手（基于 DeepSeek 的健身咨询问答，支持流式响应与会话管理）
- 基础管理后台（用户管理、课程管理、教练管理、成就配置、统计卡片）

### 扩展功能

- 链上事件监听自动同步（断点续传、失败重试）
- 数据统计图表与趋势分析
- 合约暂停与恢复
- Pinata 动态上传（按需生成元数据）
- 链上链下全量数据校验

### 实现优先级说明

核心版本默认采用**管理员预上传 Pinata 元数据 + 前端交易确认后提交 txHash + 后端按需校验链上交易**的实现方式。事件监听自动同步、动态生成 NFT 元数据、链上链下全量校验属于扩展优化，不作为基础版本必须完成的功能。

### 关键业务约束

- 每个钱包地址只能注册一个用户，注册后钱包地址不可修改。
- 每个用户同一自然日只能完成一次链上打卡。
- 同一用户对同一课程只允许存在一条“已预约”状态的记录，取消后可重新预约。
- 同一用户对同一成就只能领取一次 NFT 徽章。
- 所有链上交易哈希在数据库中必须唯一，避免重复提交。
- 课程容量控制由后端和数据库事务保证，已报名人数通过冗余计数器维护（预约+1、取消-1）。
- 普通用户不能直接增发 FitToken，也不能直接调用 NFT 铸造接口。
- 每个用户对每门课程只能评价一次，且仅在签到完成后可评价。

## 功能模块

> 教练不是系统角色，而是由管理员维护的业务数据实体，存储在 MySQL `coaches` 表中，用于课程关联和会员端展示。

### 首页展示模块（未登录可见）

首页面向所有访客（包括未登录用户），用于展示健身房品牌形象与核心信息，吸引潜在会员注册。

#### 1. 健身房简介展示

- 展示健身房名称、品牌标语、核心介绍文案
- 展示健身房地址、联系电话、营业时间等基本信息
- 支持管理员在后台编辑简介内容

#### 2. 轮播图展示

- 首页顶部展示轮播 Banner 图片
- 支持多张图片自动轮播，可配置跳转链接
- 管理员可在后台上传、排序、启用/禁用轮播图

#### 3. 热门课程推荐

- 展示系统推荐的热门课程卡片
- 每张卡片展示课程名称、分类、教练姓名、上课时间、已预约人数
- 点击卡片可跳转至登录页或课程详情页（已登录用户）

#### 4. 优秀教练团队展示

- 展示标记为"推荐"的在职教练卡片（管理员在教练管理中设置是否推荐）
- 每张卡片展示教练照片、姓名、擅长领域、简介摘要
- 点击卡片跳转至公开教练详情页（`/coaches/:id`），展示教练信息与关联课程，但不含收藏功能（需登录后在会员端使用收藏）

#### 5. 最新公告通知

- 展示最新的系统公告列表（最多展示最近 5 条）
- 每条公告展示标题、发布时间、摘要
- 点击可展开查看公告全文
- 管理员在后台发布、编辑、删除公告

#### 6. 健身房环境图片展示

- 以图片画廊形式展示健身房内部环境照片
- 支持点击放大预览
- 管理员在后台上传、排序、删除环境图片

### 会员端功能

#### 1. 个人中心

- **钱包签名登录**：通过 MetaMask 连接钱包并签名完成身份认证，后端验证签名后签发 JWT
- **会员注册**：首次登录时填写基本信息（昵称、头像、手机号），存入 MySQL，钱包地址与会员身份上链
- **个人资料管理**：修改昵称、头像、手机号等个人信息
- **会员卡购买/续费**：通过智能合约支付 ETH 购买或续费会员卡，会员卡有效期存储在链上，交易确认后将交易哈希提交给后端记录。价格方案：
  - 月卡：0.01 ETH（30 天）
  - 季卡：0.025 ETH（90 天）
  - 年卡：0.08 ETH（365 天）
- **会员信息查询**：查看会员卡有效期（链上）、会员等级、个人资料与历史记录
- **会员等级展示**：后端根据打卡次数和课程完成数据计算等级，用于展示和简单权益区分，不上链。升级规则：
  - 普通：默认等级
  - 银卡：打卡 ≥ 30 次 或 完成课程 ≥ 10
  - 金卡：打卡 ≥ 100 次 且 完成课程 ≥ 30
  - 钻石：打卡 ≥ 300 次 且 完成课程 ≥ 100
- **钱包身份**：钱包地址作为链上身份标识，注册后不允许修改

#### 2. 课程预约

- **课程列表查看**：查看所有已上架且未结束的课程，展示名称、教练、时间、地点、费用、已预约/最大人数等信息，支持分类筛选：
  - 按课程类型筛选：瑜伽、动感单车、普拉提、游泳、器械训练等
  - 按时间范围筛选：今日、本周、本月
- **课程详情查看**：展示课程完整信息，包括：
  - 课程名称、上课时间、上课地点
  - 授课教练信息（姓名、简介、擅长领域）
  - 课程难度等级、适合人群说明
  - 已预约人数 / 最大预约人数
  - FitToken 费用（若有）
- **在线预约课程**：选择课程后通过后端 API 预约，后端检查容量并创建预约记录。若课程需要 FitToken 支付，前端先调用代币合约完成链上转账，后端验证交易哈希后确认预约
- **取消预约**：在课程开始前指定时间内可取消（如开课前 2 小时），后端更新 MySQL 预约状态。链上 FitToken 退款不作为核心功能强制实现
- **我的预约记录**：查看个人所有预约记录及状态（已预约、已签到、已取消、已过期）。已过期状态由后端查询时根据课程开始时间自动判断，无需定时任务
- **课程评价**：签到完成的课程可进行评分（1-5分）和文字评价，评价关联课程和教练，用于教练详情页展示

#### 3. 教练浏览

- **教练列表**：浏览所有在职教练，支持按擅长领域筛选
- **教练详情**：查看教练简介、擅长领域、授课课程列表、课程评价记录
- **教练收藏**：收藏感兴趣的教练，方便后续查看其课程动态

#### 4. 健身打卡

- **每日打卡**：通过前端触发链上打卡交易，合约记录打卡日期并自动计算连续打卡天数
- **连续打卡追踪**：合约自动计算连续天数，达到里程碑（7天、30天、100天）自动发放 FitToken 奖励
- **打卡记录查看**：查看历史打卡记录、连续天数、总打卡次数。链上记录保证不可伪造，MySQL 记录运动类型、运动时长等展示字段
- **防重复打卡**：每个钱包地址每日只能打卡一次，由合约根据日期判断

#### 5. 成就徽章

- **成就列表**：查看所有成就定义及领取状态，已满足条件的展示"可领取"标识
- **领取成就 NFT**：点击"领取"按钮 → 后端校验条件是否满足 → 后端以服务钱包调用合约铸造 ERC-721 NFT → 记录到 MySQL。用户无需自行支付 gas
- **我的徽章**：查看已获得的 NFT 徽章，展示徽章图片、名称、稀有度与获得时间
- **稀有度等级**：徽章分为普通、稀有、史诗、传说四个等级

#### 6. FitToken 代币

- **余额查询**：前端直接调用链上 `balanceOf(address)` 实时查询代币余额
- **代币获取**：每日打卡奖励（合约自动发放）、连续打卡里程碑奖励（合约自动发放）、课程签到完成奖励（管理员确认签到后，后端以服务钱包调用 `FitToken.mint` 发放 +20 FIT）
- **代币消费**：支付课程预约费用（链上转账至系统收款地址，即合约 owner 地址）

#### 7. AI 智能助手

- **智能问答**：集成 DeepSeek 大语言模型，为会员提供健身建议、课程咨询、饮食规划等服务
- **流式响应**：采用 SSE（Server-Sent Events）流式传输，实时逐字显示 AI 回复
- **上下文感知**：AI 助手自动获取用户的打卡记录、课程预约、会员信息等数据，提供个性化建议
- **会话管理**：支持多轮对话，自动保存历史会话记录，可创建新会话或切换历史会话
- **自动标题**：根据首条消息自动生成会话标题

### 管理端功能

#### 1. 数据统计

- **统计面板**：展示用户总数、教练总数、课程总数、今日打卡数、预约总数、NFT 成就总数等统计卡片

> **管理员范围说明**：管理员默认只使用管理端功能，不作为普通会员使用会员端功能（不打卡、不预约、不领取成就）。如需体验会员功能，可另注册一个普通会员账号。

#### 2. 用户管理

- **用户列表**：查看所有注册用户，展示钱包地址、昵称、角色、会员等级、注册时间
- **角色修改**：修改用户角色（会员/管理员）

#### 3. 教练管理

- **教练列表**：查看所有教练，支持按姓名、状态搜索
- **添加教练**：录入基本信息（姓名、手机号）、擅长领域、个人简介、照片上传（存储在后端 `uploads/` 目录，数据库存相对路径）
- **编辑教练信息**：修改教练资料与擅长领域
- **教练状态管理**：设置在职/离职状态，离职教练不在会员端展示
- **教练课程安排**：查看教练关联的课程列表与排期
- **教练业绩统计**：统计授课数量、课程评价平均分

#### 4. 课程管理

- **课程列表**：查看所有课程，展示名称、分类、关联教练、时间、容量、报名人数、上架状态，支持按分类、状态、教练筛选
- **添加课程**：填写课程信息，包括：
  - 基本信息：课程名称、所属分类（预定义枚举：瑜伽、动感单车、普拉提、游泳、器械训练等）、课程描述、难度等级（入门/初级/中级/高级）、适合人群
  - 指定授课教练（从教练列表中选择在职教练）
  - 设置上课时间（开始时间和结束时间，每条记录代表一次具体排课）与地点
  - 设置最大预约人数
  - 设置 FitToken 费用（可选，为 0 表示免费课程）
- **编辑课程**：修改课程基本信息、教练、时间、容量等
- **删除课程**：删除课程前需确认无有效预约记录，有预约时禁止删除并提示
- **课程上下架**：控制课程是否在会员端可见。下架后会员端不再展示该课程，已有预约不受影响

#### 5. 成就配置

- **成就列表**：查看所有成就定义
- **创建成就**：设置成就名称、描述、条件类型、条件阈值、稀有度等级
- **Pinata CID 填写**：管理员预先将徽章图片和 JSON 元数据通过 Pinata 上传到 IPFS，获得 CID 后填写到成就定义中，铸造时直接使用 `ipfs://{CID}` 作为 tokenURI
- **编辑成就**：修改成就定义与条件

#### 6. 预约管理

- **预约记录列表**：查看所有预约记录，展示用户、课程、预约时间、状态
- **确认签到**：确认学员课程签到，后端记录签到状态并以服务钱包调用 `FitToken` 合约的 `mint` 方法向用户发放课程完成奖励（+20 FIT）

#### 7. 交易日志

- **交易记录列表**：查看所有 FitToken 交易记录，包括发送方、接收方、数量、类型、链上交易哈希

#### 8. 首页内容管理

- **健身房简介编辑**：编辑健身房名称、标语、介绍文案、地址、联系电话、营业时间（全局唯一配置，只有一条记录）
- **轮播图管理**：上传轮播图片、设置跳转链接、调整排序权重、启用/禁用单张轮播图
- **公告管理**：发布新公告（标题、内容、是否置顶）、编辑已有公告、删除公告
- **环境图片管理**：上传健身房环境照片、设置描述文字、设置排序权重、删除图片
- **推荐教练设置**：在教练管理中增加"是否首页推荐"开关字段

## 角色权限设计

### 角色定义

系统仅设置两个用户角色。教练作为业务数据实体独立管理，不作为用户角色。

| 角色 | 标识 | 说明 |
|------|------|------|
| 会员 (member) | `role = 'member'` | 默认注册角色，享有基础健身服务 |
| 管理员 (admin) | `role = 'admin'` | 系统最高权限，后端 API 全权限 |

> **关于教练**：教练是管理员在后台维护的业务实体（存储在 `coaches` 表），用于关联课程和会员端展示，不参与系统登录和权限控制。

### 功能权限矩阵

| 功能模块 | 操作 | 游客 | 会员 | 管理员 |
|----------|------|:----:|:----:|:------:|
| **首页展示** | 查看健身房简介、轮播图、热门课程、推荐教练、公告、环境图片 | ✔ | ✔ | ✔ |
| **身份认证** | 钱包连接与签名登录 | ✘ | ✔ | ✔ |
| | 修改个人资料（昵称/头像/手机号） | ✘ | ✔ | ✔ |
| **会员管理** | 购买/续费会员卡（ETH 支付） | ✘ | ✔ | ✘ |
| | 查看会员卡有效期与等级 | ✘ | ✔ | ✔ |
| **健身打卡** | 每日打卡（链上） | ✘ | ✔ | ✘ |
| | 查看打卡记录与连续天数 | ✘ | ✔ | ✔ |
| **课程预约** | 浏览课程列表 | ✘ | ✔ | ✔ |
| | 预约/取消课程 | ✘ | ✔ | ✘ |
| | 查看自己的预约记录 | ✘ | ✔ | ✘ |
| | 使用 FitToken 支付课程费用 | ✘ | ✔ | ✘ |
| | 课程评价（签到后评分） | ✘ | ✔ | ✘ |
| **教练浏览** | 查看教练列表与详情 | ✘ | ✔ | ✔ |
| | 收藏/取消收藏教练 | ✘ | ✔ | ✘ |
| **成就徽章** | 查看成就列表与领取状态 | ✘ | ✔ | ✔ |
| | 领取成就 NFT | ✘ | ✔ | ✘ |
| | 查看已获得的 NFT 徽章 | ✘ | ✔ | ✔ |
| **代币系统** | 查看 FitToken 余额（链上） | ✘ | ✔ | ✔ |
| **管理后台** | 用户管理（列表查看、角色修改） | ✘ | ✘ | ✔ |
| | 教练管理（增删改、状态、业绩） | ✘ | ✘ | ✔ |
| | 课程管理（增删改、上下架） | ✘ | ✘ | ✔ |
| | 成就配置（定义、CID 填写） | ✘ | ✘ | ✔ |
| | 预约管理（查看、确认签到） | ✘ | ✘ | ✔ |
| | 交易日志查看 | ✘ | ✘ | ✔ |
| | 数据统计面板 | ✘ | ✘ | ✔ |
| | 首页内容管理（简介/轮播图/公告/环境图片） | ✘ | ✘ | ✔ |

**权限控制实现**：前端根据 JWT 角色动态渲染导航；后端 JWT 中间件 + 角色中间件校验 API 权限，未授权返回 403；链上合约使用 `Ownable`，owner 固定为服务钱包地址，与数据库多 admin 无关。

## FitToken 奖励规则

| 行为 | 奖励/消耗 |
|------|-----------|
| 每日打卡 | +10 FIT |
| 连续打卡 7 天 | +50 FIT |
| 连续打卡 30 天 | +300 FIT |
| 完成课程签到 | +20 FIT |
| 连续打卡 100 天 | +1000 FIT |
| 预约普通课程 | -30 FIT |

FitToken 采用 18 位小数精度（`decimals = 18`），以上数值均为人类可读单位，实际合约交互时需乘以 10¹⁸。

FitToken 的增发权限由 `FitToken` 合约控制，仅授权给系统管理员地址、`CheckIn` 合约或后端服务钱包等受信任角色。普通用户不能自行增发 FitToken。

## 智能合约说明

| 合约名称 | 文件 | 说明 |
|----------|------|------|
| `MembershipManager` | `contracts/MembershipManager.sol` | 会员注册、会员卡购买与续费、有效期管理 |
| `CheckIn` | `contracts/CheckIn.sol` | 每日打卡、连续打卡追踪、里程碑奖励自动发放 |
| `AchievementBadge` | `contracts/AchievementBadge.sol` | ERC-721 成就徽章铸造，仅 owner 可调用 |
| `FitToken` | `contracts/FitToken.sol` | ERC-20 健身代币发放与流通 |

### 合约接口定义

#### FitToken (ERC-20)

```solidity
// 继承 OpenZeppelin ERC20, Ownable
constructor(address initialOwner)  // initialOwner 为服务钱包地址

// 核心方法
function mint(address to, uint256 amount) external onlyMinter;   // 增发代币，仅授权地址可调用
function addMinter(address minter) external onlyOwner;            // 添加授权铸造者（CheckIn 合约、服务钱包）
function removeMinter(address minter) external onlyOwner;

// 事件
event Minted(address indexed to, uint256 amount);
```

#### MembershipManager

```solidity
constructor(address initialOwner)

// 核心方法
function register() external;                                      // 会员注册（链上记录钱包地址）
function purchaseMembership(uint8 planType) external payable;      // 购买会员卡（planType: 1=月卡, 2=季卡, 3=年卡）
function getMembershipInfo(address user) external view returns (
    bool isRegistered,
    uint256 expiresAt,
    uint8 currentPlan
);

// 价格常量
// MONTHLY_PRICE = 0.01 ether;  QUARTERLY_PRICE = 0.025 ether;  YEARLY_PRICE = 0.08 ether;

// 事件
event MemberRegistered(address indexed member);
event MembershipPurchased(address indexed member, uint8 planType, uint256 expiresAt, uint256 amount);
```

#### CheckIn

```solidity
constructor(address fitTokenAddress, address initialOwner)

// 核心方法
function checkIn() external;   // 每日打卡，合约内部使用 block.timestamp / 86400 (UTC日) 判断是否重复
function getCheckInInfo(address user) external view returns (
    uint256 totalCount,        // 总打卡次数
    uint256 currentStreak,     // 当前连续天数
    uint256 lastCheckInDay     // 最后打卡日（UTC天数）
);

// 里程碑奖励（合约内自动发放 FitToken）
// 每次打卡: +10 FIT
// 连续 7 天: +50 FIT
// 连续 30 天: +300 FIT
// 连续 100 天: +1000 FIT

// 事件
event CheckedIn(address indexed user, uint256 timestamp, uint256 streak, uint256 totalCount);
event MilestoneReward(address indexed user, uint256 streak, uint256 reward);
```

> **日期判断说明**：合约使用 `block.timestamp / 86400` 计算 UTC 天数判断是否同一天和连续天数。前端展示时转换为用户本地时区。

#### AchievementBadge (ERC-721)

```solidity
// 继承 OpenZeppelin ERC721URIStorage, Ownable
constructor(address initialOwner)

// 核心方法（仅 owner/服务钱包可调用）
function mintBadge(address to, string calldata tokenURI) external onlyOwner returns (uint256 tokenId);
function getBadgesByOwner(address owner) external view returns (uint256[] memory tokenIds);

// 事件
event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
```

### 合约部署顺序与依赖

```
1. 部署 FitToken → 获得 fitTokenAddress
2. 部署 MembershipManager
3. 部署 CheckIn(fitTokenAddress) → 获得 checkInAddress
4. 部署 AchievementBadge
5. 调用 FitToken.addMinter(checkInAddress) → 授权 CheckIn 合约铸造代币
6. 调用 FitToken.addMinter(serviceWalletAddress) → 授权服务钱包铸造代币
7. 将所有合约地址写入后端 .env 和前端 contractAddresses 配置
```

## 数据库设计 (MySQL)

### 主要数据表

> 所有表默认包含 `id` (主键自增)、`created_at`、`updated_at` 字段（Sequelize `timestamps: true`）。外键字段使用 `snake_case`，如 `user_id`、`coach_id`。字符串字段默认 `VARCHAR(255)`，长文本用 `TEXT`。

| 表名 | 字段说明 |
|------|----------|
| `users` | `wallet_address` VARCHAR(42) 唯一非空, `nickname` VARCHAR(50), `avatar` VARCHAR(255) 存相对路径如 `uploads/avatars/xxx.jpg`, `phone` VARCHAR(20), `role` ENUM('member','admin') 默认 'member', `member_level` ENUM('normal','silver','gold','diamond') 默认 'normal', `nonce` VARCHAR(64) 用于钱包签名登录的一次性随机串 |
| `memberships` | `user_id` 外键→users, `plan_type` TINYINT(1=月卡/2=季卡/3=年卡), `purchased_at` DATETIME, `expires_at` DATETIME, `amount` DECIMAL(18,8) ETH金额, `tx_hash` VARCHAR(66) 唯一 |
| `coaches` | `name` VARCHAR(50) 非空, `phone` VARCHAR(20) 唯一, `specialties` VARCHAR(255) 逗号分隔如 "瑜伽,普拉提", `bio` TEXT, `avatar` VARCHAR(255) 存相对路径 `uploads/coaches/xxx.jpg`, `status` ENUM('active','inactive') 默认 'active', `is_recommended` BOOLEAN 默认 false |
| `coach_favorites` | `user_id` 外键→users, `coach_id` 外键→coaches |
| `courses` | `title` VARCHAR(100) 非空, `category` VARCHAR(30) 应用层枚举校验(瑜伽/动感单车/普拉提/游泳/器械训练/其他), `coach_id` 外键→coaches, `start_time` DATETIME, `end_time` DATETIME, `location` VARCHAR(100), `max_capacity` INT, `enrolled_count` INT 默认 0(冗余计数器,事务保证≥0), `fit_token_cost` INT 默认 0(人类可读单位), `description` TEXT, `difficulty` ENUM('beginner','elementary','intermediate','advanced'), `suitable_for` VARCHAR(255), `status` ENUM('active','inactive') 默认 'active' |
| `bookings` | `user_id` 外键→users, `course_id` 外键→courses, `status` ENUM('pending_payment','booked','checked_in','cancelled') 默认 'booked'（付费课程先创建 pending_payment 状态锁定名额,支付确认后转为 booked；已过期状态由查询时根据 course.start_time 动态判断,不持久化）, `tx_hash` VARCHAR(66) 可为空(免费课程无链上交易) |
| `course_reviews` | `user_id` 外键→users, `course_id` 外键→courses, `coach_id` 外键→coaches, `rating` TINYINT(1-5), `content` TEXT |
| `checkins` | `user_id` 外键→users, `check_in_date` DATE, `exercise_type` VARCHAR(50) 如 "跑步/器械/游泳", `duration_minutes` INT 运动时长(分钟), `tx_hash` VARCHAR(66) 唯一 |
| `achievements` | `name` VARCHAR(100) 非空, `description` TEXT, `condition_type` VARCHAR(30) 如 'checkin_total'/'checkin_streak'/'course_complete', `condition_value` INT 阈值, `badge_image_cid` VARCHAR(100), `metadata_cid` VARCHAR(100), `rarity` ENUM('common','rare','epic','legendary') |
| `user_achievements` | `user_id` 外键→users, `achievement_id` 外键→achievements, `nft_token_id` INT 链上 NFT tokenId, `mint_tx_hash` VARCHAR(66) |
| `token_transactions` | `from_address` VARCHAR(42), `to_address` VARCHAR(42), `amount` DECIMAL(36,18), `type` ENUM('checkin_reward','milestone_reward','course_reward','course_payment') 交易类型, `tx_hash` VARCHAR(66) 唯一 |
| `gym_info` | `name` VARCHAR(100), `slogan` VARCHAR(255), `description` TEXT, `address` VARCHAR(255), `phone` VARCHAR(20), `business_hours` VARCHAR(100) 如 "08:00-22:00", 全局唯一一条记录(通过种子数据初始化,仅支持编辑不支持删除) |
| `carousels` | `image_url` VARCHAR(255) 存相对路径, `link_url` VARCHAR(255) 可为空, `sort_order` INT 默认 0(越大越靠前), `is_enabled` BOOLEAN 默认 true |
| `announcements` | `title` VARCHAR(200) 非空, `content` TEXT, `is_pinned` BOOLEAN 默认 false, `status` ENUM('draft','published') 默认 'published'（草稿不在首页展示） |
| `gallery_images` | `image_url` VARCHAR(255) 存相对路径, `description` VARCHAR(255), `sort_order` INT 默认 0 |
| `chat_sessions` | `user_id` 外键→users, `title` VARCHAR(100) 默认 '新对话' |
| `chat_messages` | `session_id` 外键→chat_sessions, `role` ENUM('user','assistant'), `content` TEXT |

> **`token_transactions` 记录范围说明**：基础版本中，打卡奖励和里程碑奖励由 CheckIn 合约自动发放，前端打卡交易确认后将 txHash 提交后端，后端解析交易日志（receipt logs）提取 FitToken Transfer 事件并写入 `token_transactions`。课程完成奖励由后端服务钱包 mint，直接记录。课程支付由前端提交 txHash 后记录。

### 关键索引与唯一约束

| 表名 | 关键约束 |
|------|----------|
| `users` | `wallet_address` 唯一，保证一个钱包只对应一个用户 |
| `memberships` | `tx_hash` 唯一，避免重复记录同一笔会员购买交易 |
| `coaches` | `phone` 唯一，保证教练信息不重复 |
| `coach_favorites` | `user_id + coach_id` 唯一，避免重复收藏同一教练 |
| `bookings` | 业务层限制：同一用户对同一课程只允许存在一条状态为“已预约”的记录，取消后可重新预约 |
| `checkins` | `tx_hash` 唯一，避免重复提交同一笔打卡交易 |
| `user_achievements` | `user_id + achievement_id` 唯一，避免重复领取同一成就 |
| `course_reviews` | `user_id + course_id` 唯一，每个用户对每门课程只能评价一次 |
| `token_transactions` | `tx_hash` 唯一，保证链上代币交易幂等 |

### Sequelize 模型关联

```
User hasMany Membership, Booking, CheckIn, UserAchievement, CoachFavorite, CourseReview, ChatSession
Coach hasMany Course, CoachFavorite, CourseReview
Course belongsTo Coach; hasMany Booking, CourseReview
Booking belongsTo User, Course
CourseReview belongsTo User, Course, Coach
CoachFavorite belongsTo User, Coach
Achievement hasMany UserAchievement
UserAchievement belongsTo User, Achievement
ChatSession belongsTo User; hasMany ChatMessage
ChatMessage belongsTo ChatSession
```

> 关联定义统一在 `models/index.js` 中完成，各模型文件只定义字段和配置。

### 补充说明

- **成就校验**：基础版本中成就条件由后端基于 MySQL 数据校验（半中心化），链上 NFT 仅记录最终凭证。
- **数据同步**：前端发起链上交易 → 等待确认 → 提交 txHash 给后端 → 后端写入 MySQL。链上为权威数据源，MySQL 为展示缓存。
- **预约"已过期"判断**：`bookings` 表不存储"已过期"状态，查询时后端根据关联课程的 `start_time` 动态判断：若 `status='booked'` 且 `course.start_time < NOW()`，则视为已过期。无需定时任务。

## 链上链下职责边界

### 数据分层原则

| 分层 | 存储位置 | 特征 | 示例 |
|------|----------|------|------|
| 权益层 | 链上（智能合约） | 不可篡改、透明可验证 | 会员卡有效期、代币余额、NFT 所有权、打卡记录 |
| 业务层 | MySQL | 高效查询、灵活变更 | 用户资料、课程详情、预约记录、会员等级 |
| 资产元数据层 | Pinata / IPFS | 内容寻址、持久化 | NFT 徽章图片与描述 JSON（管理员预上传） |

**判断依据**：承载经济价值或需要不可篡改证明的数据上链；纯展示、高频变更、隐私相关的数据留在 MySQL。

**简要分工**：会员卡有效期、打卡记录、FitToken 余额、NFT 所有权由链上管理；课程、预约、教练、评价、会员等级由 MySQL 管理；NFT 元数据由 Pinata/IPFS 存储。课程仅在涉及 FitToken 支付时触发链上交易。连续打卡天数完全由 `CheckIn` 合约计算，后端不参与。

## 项目结构

```
├── contracts/                # Solidity 智能合约
│   ├── MembershipManager.sol
│   ├── CheckIn.sol
│   ├── AchievementBadge.sol
│   └── FitToken.sol
├── scripts/                  # 部署脚本
│   └── deploy.js
├── test/                     # 合约单元测试
│   ├── MembershipManager.test.js
│   ├── CheckIn.test.js
│   ├── AchievementBadge.test.js
│   └── FitToken.test.js
├── backend/                  # Node.js 后端服务
│   ├── src/
│   │   ├── config/           # 配置文件（数据库、区块链）
│   │   │   ├── database.js
│   │   │   └── blockchain.js
│   │   ├── models/           # Sequelize 数据模型
│   │   │   ├── index.js      # 模型加载与关联定义
│   │   │   ├── User.js
│   │   │   ├── Membership.js
│   │   │   ├── Coach.js
│   │   │   ├── CoachFavorite.js
│   │   │   ├── Course.js
│   │   │   ├── Booking.js
│   │   │   ├── CourseReview.js
│   │   │   ├── CheckIn.js
│   │   │   ├── Achievement.js
│   │   │   ├── UserAchievement.js
│   │   │   ├── TokenTransaction.js
│   │   │   ├── GymInfo.js
│   │   │   ├── Carousel.js
│   │   │   ├── Announcement.js
│   │   │   ├── GalleryImage.js
│   │   │   ├── ChatSession.js
│   │   │   └── ChatMessage.js
│   │   ├── routes/           # API 路由
│   │   │   ├── auth.js       # 认证：nonce 获取、签名登录、注册
│   │   │   ├── user.js       # 用户：个人资料、会员信息
│   │   │   ├── course.js     # 课程：列表、详情、预约、评价
│   │   │   ├── coach.js      # 教练：列表、详情、收藏
│   │   │   ├── checkin.js    # 打卡：提交打卡、记录查询
│   │   │   ├── achievement.js # 成就：列表、领取
│   │   │   ├── homepage.js   # 首页：聚合数据（公开）
│   │   │   ├── upload.js     # 文件上传（图片）
│   │   │   ├── ai.js         # AI 智能助手（对话、会话管理）
│   │   │   └── admin/        # 管理端路由
│   │   │       ├── users.js
│   │   │       ├── coaches.js
│   │   │       ├── courses.js
│   │   │       ├── achievements.js
│   │   │       ├── bookings.js
│   │   │       ├── transactions.js
│   │   │       ├── homepage.js  # 首页内容管理
│   │   │       └── stats.js     # 统计面板
│   │   ├── services/         # 业务逻辑层
│   │   │   ├── achievementService.js  # 成就条件校验与铸造调度
│   │   │   ├── blockchainService.js   # 链上交互（调用合约）
│   │   │   └── aiService.js           # DeepSeek AI 对话服务
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.js       # JWT 验证 + 角色校验
│   │   │   ├── upload.js     # multer 文件上传配置
│   │   │   └── errorHandler.js
│   │   └── app.js
│   ├── uploads/              # 上传文件存储目录（已加入 .gitignore）
│   │   ├── avatars/          # 用户头像
│   │   ├── coaches/          # 教练照片
│   │   ├── carousels/        # 轮播图
│   │   └── gallery/          # 环境图片
│   ├── public/               # 静态资源目录（首页背景图、预置图片等）
│   │   ├── homepage-bg.jpg   # 首页全屏背景图
│   │   ├── coaches/          # 教练预置头像
│   │   └── gallery/          # 环境预置图片
│   ├── migrations/           # 数据库迁移文件
│   ├── seeders/              # 数据库种子数据
│   ├── .env.example          # 环境变量模板
│   └── package.json
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/       # 通用 UI 组件
│   │   ├── hooks/            # 自定义 Hooks（合约交互、认证状态）
│   │   ├── pages/            # 页面组件（按路由划分）
│   │   │   ├── CoachDetailPage.tsx  # 公开教练详情页
│   │   │   ├── LoginPage.tsx       # 登录页（暗色毛玻璃 + 动态效果）
│   │   │   ├── HomePage.tsx        # 首页（暗色毛玻璃风格）
│   │   │   ├── member/             # 会员端页面
│   │   │   │   └── AIAssistant.tsx  # AI 智能助手页面
│   │   │   └── admin/              # 管理端页面
│   │   ├── services/         # API 请求层（axios 封装）
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── abis/             # 合约 ABI JSON
│   │   ├── utils/            # 工具函数（格式化、合约地址配置等）
│   │   └── App.tsx           # 根组件与路由配置
│   ├── public/
│   └── package.json
├── .gitignore                # 忽略 node_modules/, .env, uploads/, artifacts/, cache/
├── hardhat.config.js         # Hardhat 配置（连接本地 Geth）
├── package.json
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x
- MySQL >= 8.0
- Geth (Go-Ethereum) >= 1.13.x
- MetaMask 浏览器插件
- Pinata 账户（免费版即可，获取 API Key 和 Secret）

### 1. 启动本地 Geth Dev 开发链

```bash
# 以 Dev 模式启动 Geth（自动出块、预置开发者账户有大量余额，无需创世区块配置）
geth --dev --http --http.addr "0.0.0.0" --http.port 8545 \
     --http.corsdomain "*" --http.api "eth,net,web3,personal,miner" \
     --allow-insecure-unlock
```

### 2. 配置 MySQL 数据库

```sql
-- 登录 MySQL 后执行
CREATE DATABASE gym_blockchain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gym_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gym_blockchain.* TO 'gym_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：


# Geth Dev 本地开发链
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=1337

# 合约部署账户私钥（本地 Geth Dev 账户，禁止提交真实私钥）
DEPLOYER_PRIVATE_KEY=0x_your_geth_dev_private_key

# Pinata IPFS 配置（用于管理员预上传徽章元数据）
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# 服务钱包（后端用于调用合约铸造 NFT、发放奖励）
SERVICE_WALLET_PRIVATE_KEY=0x_your_service_wallet_private_key

# 智能合约地址（部署后自动输出，手动填入）
FITTOKEN_CONTRACT_ADDRESS=0x...
MEMBERSHIP_CONTRACT_ADDRESS=0x...
CHECKIN_CONTRACT_ADDRESS=0x...
ACHIEVEMENT_CONTRACT_ADDRESS=0x...

# DeepSeek AI 配置（AI 智能助手功能）
DEEPSEEK_API_KEY=your_deepseek_api_key

# 后端服务
PORT=3001
JWT_SECRET=your_jwt_secret
```

### 4. 安装依赖并部署

```bash
# 克隆项目
git clone https://github.com/your-repo/blockchain-gym.git
cd blockchain-gym

# 安装合约依赖
npm install

# 部署智能合约到本地 Geth Dev 开发链
npx hardhat run scripts/deploy.js --network geth_local

# 安装并启动后端
cd backend
npm install
npx sequelize-cli db:migrate    # 执行数据库迁移
npx sequelize-cli db:seed:all   # 填充种子数据（见下方种子数据规范）
npm run dev                     # 启动后端服务 (http://localhost:3001)

# 安装并启动前端
cd ../frontend
npm install
npm run dev                     # 启动前端 (http://localhost:5173)
```

建议本地开发时使用多个终端分别启动：

- **终端 1**：启动 Geth Dev 开发链。
- **终端 2**：部署智能合约。
- **终端 3**：启动后端服务。
- **终端 4**：启动前端服务。

### 5. MetaMask 配置

1. 打开 MetaMask，添加自定义网络：
   - 网络名称：`Geth Local`
   - RPC URL：`http://127.0.0.1:8545`
   - 链 ID：`1337`
   - 货币符号：`ETH`
2. 导入 Geth 开发者账户私钥（启动 Geth 时控制台输出）

### 6. Pinata 配置说明

1. 注册 [Pinata](https://www.pinata.cloud/) 账户
2. 进入 API Keys 页面，创建新的 API Key
3. 将 `API Key` 和 `API Secret` 填入 `backend/.env`
4. 管理员预先将徽章图片和元数据 JSON 通过 Pinata 上传到 IPFS，获得 CID 后填写到成就定义表中，铸造 NFT 时直接引用

### 7. 种子数据规范

执行 `npx sequelize-cli db:seed:all` 后应包含以下初始数据，确保首页有内容展示、管理员可登录：

| 数据 | 数量 | 说明 |
|------|------|------|
| 管理员账户 | 1 | `wallet_address` 为合约部署者地址（Geth Dev 账户），`role='admin'` |
| 健身房简介 (`gym_info`) | 1 | 填充默认名称、标语、介绍、地址、电话、营业时间 |
| 轮播图 (`carousels`) | 2-3 | 示例 Banner 图片（可使用占位图 URL），`is_enabled=true` |
| 公告 (`announcements`) | 3-5 | 示例公告（含 1 条置顶），`status='published'` |
| 教练 (`coaches`) | 5-8 | 涵盖不同擅长领域，其中 3 个设为 `is_recommended=true` |
| 课程 (`courses`) | 10+ | 涵盖各分类和难度等级，关联不同教练，`status='active'`，时间设为未来日期 |
| 环境图片 (`gallery_images`) | 4-6 | 示例环境照片（可使用占位图 URL） |
| 成就定义 (`achievements`) | 5-8 | 覆盖各条件类型和稀有度，如：首次打卡(common)、连续7天(rare)、连续30天(epic)、连续100天(legendary)、完成10节课(rare) |

> 种子数据中的图片可使用 `https://placehold.co/800x400?text=Banner1` 等占位图，部署后管理员通过后台替换为实际图片。

## 合约测试

```bash
npx hardhat test                              # 运行全部测试
npx hardhat test --network geth_local          # 在本地 Geth 上测试
npx hardhat test test/CheckIn.test.js          # 指定合约测试
npx hardhat coverage                           # 测试覆盖率
```

> Hardhat 配置见 `hardhat.config.js`，私钥通过 `.env` 管理，禁止提交到代码仓库。

## 核心业务流程

```
访客浏览首页(简介/轮播图/热门课程/推荐教练/公告/环境图片)
       │
       └── 用户连接钱包 → 钱包签名登录 → 注册会员 → 购买会员卡(ETH支付,链上)
              │
              ├── 每日打卡(链上) → 获得 FitToken → 连续打卡触发里程碑奖励
              │
              ├── 浏览课程 → 预约课程(FitToken支付可选) → 管理员确认签到 → FitToken奖励
              │
              └── 满足成就条件 → 点击"领取"→ 后端校验并铸造 NFT 徽章 → 个人中心展示
```

## MetaMask 交互说明

- **身份认证**：用户通过 MetaMask 连接钱包并签名 nonce 完成登录，后端验证后签发 JWT，后续 API 不再依赖 MetaMask。
- **链上交易**（需 MetaMask 确认，消耗 gas）：会员卡购买/续费（ETH → `MembershipManager`）、每日打卡（`CheckIn`）、FitToken 课程支付（代币转账）。交易确认后前端将 txHash 提交后端。
- **链上查询**（无需确认，不消耗 gas）：会员卡有效期、FitToken 余额、打卡状态、NFT 持有情况。
- **不涉及 MetaMask**：课程管理与预约、成就 NFT 铸造（服务钱包代付 gas）、教练浏览与收藏、后台管理均走后端 API。

**后端 txHash 校验规则**：交易必须存在且成功、发送方为当前用户钱包、接收方为系统合约地址、调用方法与业务匹配、金额一致、txHash 未被使用过。

## 钱包签名登录时序

```
前端                              后端                              数据库
 │                                 │                                 │
 │  1. 连接 MetaMask 获取地址       │                                 │
 │──── GET /api/auth/nonce ───────▶│                                 │
 │     { walletAddress }           │  生成随机 nonce                   │
 │                                 │── 存入/更新 users.nonce ────────▶│
 │◀─── { nonce } ─────────────────│                                 │
 │                                 │                                 │
 │  2. MetaMask 签名               │                                 │
 │  message = "Welcome to GymChain! Sign this message to verify your identity.\n\nNonce: {nonce}"
 │  signature = await signer.signMessage(message)
 │                                 │                                 │
 │──── POST /api/auth/login ──────▶│                                 │
 │     { walletAddress, signature }│  3. ecrecover 验证签名            │
 │                                 │     恢复地址 == walletAddress?    │
 │                                 │     校验 nonce 匹配?              │
 │                                 │── 更新 nonce（一次性失效）─────────▶│
 │                                 │                                 │
 │                                 │  4. 查询用户是否已注册              │
 │                                 │     已注册：签发 JWT (含 id,role)  │
 │                                 │     未注册：返回 needRegister 标记  │
 │◀─── { token, user, needRegister }│                                │
 │                                 │                                 │
 │  5.（若需注册）填写昵称等信息      │                                 │
 │──── POST /api/auth/register ───▶│  创建用户记录 + 链上注册           │
 │     { walletAddress, nickname,  │                                 │
 │       phone, txHash }           │── INSERT users ────────────────▶│
 │◀─── { token, user } ──────────│                                 │
```

> **签名消息格式固定**，前后端必须一致。`nonce` 每次请求重新生成，签名验证后立即更新，防止重放攻击。

## REST API 端点设计

### 全局约定

- **基础路径**：`/api`
- **认证方式**：需要登录的接口在 Header 传递 `Authorization: Bearer <token>`
- **鉴权标记**：🔓 公开（无需登录）、🔑 会员/管理员（需 JWT）、🛡️ 仅管理员
- **分页参数**：列表接口统一使用 `?page=1&pageSize=10`，响应格式 `{ list: [], total, page, pageSize }`
- **错误响应**：`{ error: true, message: "错误描述", code: "ERROR_CODE" }`
- **成功响应**：`{ error: false, data: {...} }` 或 `{ error: false, ...分页字段 }`

### 公开接口（首页 + 认证）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:----:|------|
| GET | `/api/homepage` | 🔓 | 首页聚合数据（简介+轮播图+热门课程+推荐教练+公告+环境图片） |
| GET | `/api/homepage/announcements/:id` | 🔓 | 公告详情 |
| GET | `/api/homepage/coaches/:id` | 🔓 | 首页教练详情（公开信息+关联课程+评分统计，不含收藏状态） |
| GET | `/api/auth/nonce` | 🔓 | 获取登录 nonce，参数 `?walletAddress=0x...` |
| POST | `/api/auth/login` | 🔓 | 钱包签名登录 |
| POST | `/api/auth/register` | 🔓 | 新用户注册（首次登录后调用） |

### 会员端接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:----:|------|
| GET | `/api/user/profile` | 🔑 | 获取个人资料 |
| PUT | `/api/user/profile` | 🔑 | 更新个人资料（昵称/头像/手机号） |
| POST | `/api/user/avatar` | 🔑 | 上传头像图片 |
| GET | `/api/user/membership` | 🔑 | 获取会员卡信息 |
| POST | `/api/user/membership` | 🔑 | 提交会员卡购买/续费 txHash |
| GET | `/api/courses` | 🔑 | 课程列表（分页、筛选 `?category=&timeRange=&page=&pageSize=`） |
| GET | `/api/courses/:id` | 🔑 | 课程详情 |
| POST | `/api/courses/:id/book` | 🔑 | 预约课程 |
| POST | `/api/courses/:id/cancel` | 🔑 | 取消预约 |
| POST | `/api/courses/:id/confirm-payment` | 🔑 | 提交 FitToken 支付 txHash，确认付费预约 |
| POST | `/api/courses/:id/review` | 🔑 | 课程评价 |
| GET | `/api/bookings` | 🔑 | 我的预约记录（分页） |
| GET | `/api/coaches` | 🔑 | 教练列表（筛选 `?specialty=`） |
| GET | `/api/coaches/:id` | 🔑 | 教练详情（含收藏状态） |
| POST | `/api/coaches/:id/favorite` | 🔑 | 收藏/取消收藏教练（toggle） |
| GET | `/api/coaches/favorites` | 🔑 | 我的收藏教练列表 |
| POST | `/api/checkins` | 🔑 | 提交打卡 txHash |
| GET | `/api/checkins` | 🔑 | 我的打卡记录（分页） |
| GET | `/api/achievements` | 🔑 | 成就列表（含领取状态） |
| POST | `/api/achievements/:id/claim` | 🔑 | 领取成就 NFT |
| GET | `/api/achievements/badges` | 🔑 | 我的徽章列表 |

### 管理端接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:----:|------|
| GET | `/api/admin/stats` | 🛡️ | 统计面板数据 |
| GET | `/api/admin/users` | 🛡️ | 用户列表（分页、搜索） |
| PUT | `/api/admin/users/:id/role` | 🛡️ | 修改用户角色 |
| GET | `/api/admin/coaches` | 🛡️ | 教练列表（分页） |
| POST | `/api/admin/coaches` | 🛡️ | 添加教练 |
| PUT | `/api/admin/coaches/:id` | 🛡️ | 编辑教练 |
| PUT | `/api/admin/coaches/:id/status` | 🛡️ | 教练状态（在职/离职） |
| PUT | `/api/admin/coaches/:id/recommend` | 🛡️ | 设置/取消首页推荐 |
| GET | `/api/admin/courses` | 🛡️ | 课程列表（分页、筛选） |
| POST | `/api/admin/courses` | 🛡️ | 添加课程 |
| PUT | `/api/admin/courses/:id` | 🛡️ | 编辑课程 |
| DELETE | `/api/admin/courses/:id` | 🛡️ | 删除课程（无有效预约时） |
| PUT | `/api/admin/courses/:id/status` | 🛡️ | 课程上下架 |
| GET | `/api/admin/bookings` | 🛡️ | 预约记录列表（分页） |
| PUT | `/api/admin/bookings/:id/checkin` | 🛡️ | 确认签到 + 发放 FitToken |
| GET | `/api/admin/achievements` | 🛡️ | 成就列表 |
| POST | `/api/admin/achievements` | 🛡️ | 创建成就定义 |
| PUT | `/api/admin/achievements/:id` | 🛡️ | 编辑成就 |
| GET | `/api/admin/transactions` | 🛡️ | 交易日志（分页） |
| GET | `/api/admin/homepage/gym-info` | 🛡️ | 获取健身房简介 |
| PUT | `/api/admin/homepage/gym-info` | 🛡️ | 编辑健身房简介 |
| GET | `/api/admin/homepage/carousels` | 🛡️ | 轮播图列表 |
| POST | `/api/admin/homepage/carousels` | 🛡️ | 上传轮播图 |
| PUT | `/api/admin/homepage/carousels/:id` | 🛡️ | 编辑轮播图（排序/启用/链接） |
| DELETE | `/api/admin/homepage/carousels/:id` | 🛡️ | 删除轮播图 |
| GET | `/api/admin/homepage/announcements` | 🛡️ | 公告列表 |
| POST | `/api/admin/homepage/announcements` | 🛡️ | 发布公告 |
| PUT | `/api/admin/homepage/announcements/:id` | 🛡️ | 编辑公告 |
| DELETE | `/api/admin/homepage/announcements/:id` | 🛡️ | 删除公告 |
| GET | `/api/admin/homepage/gallery` | 🛡️ | 环境图片列表 |
| POST | `/api/admin/homepage/gallery` | 🛡️ | 上传环境图片 |
| PUT | `/api/admin/homepage/gallery/:id` | 🛡️ | 编辑图片（排序/描述） |
| DELETE | `/api/admin/homepage/gallery/:id` | 🛡️ | 删除环境图片 |

### 文件上传接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:----:|------|
| POST | `/api/upload/image` | 🔑 | 通用图片上传，返回 `{ url: "uploads/xxx/filename.jpg" }` |

### AI 智能助手接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|:----:|------|
| POST | `/api/ai/chat` | 🔑 | 发送消息并获取 AI 流式响应（SSE） |
| GET | `/api/ai/sessions` | 🔑 | 获取用户的所有会话列表 |
| DELETE | `/api/ai/sessions/:id` | 🔑 | 删除指定会话及其消息 |
| GET | `/api/ai/sessions/:id/messages` | 🔑 | 获取指定会话的消息历史 |

> 使用 `multer` 中间件处理 `multipart/form-data`，字段名 `file`。接受格式：jpg/jpeg/png/webp。单文件最大 5MB。按类型存储到 `uploads/` 对应子目录。后端通过 `express.static` 提供 `/uploads` 静态文件访问。

## 前端路由设计

| 路由路径 | 页面名称 | 鉴权要求 | 说明 |
|----------|----------|----------|------|
| `/` | 首页 | 无 | 游客可见，健身房介绍与各模块展示 |
| `/login` | 登录页 | 无 | MetaMask 连接与签名登录（暗色毛玻璃 + 动态粒子效果） |
| `/register` | 注册页 | 无 | 首次登录后填写个人信息 |
| `/coaches/:id` | 公开教练详情 | 无 | 首页推荐教练详情（公开访问，不含收藏） |
| `/member/dashboard` | 会员中心 | 会员 | 个人资料、会员卡、等级 |
| `/member/courses` | 课程列表 | 会员 | 浏览课程、筛选、搜索 |
| `/member/courses/:id` | 课程详情 | 会员 | 课程信息、预约操作、评价 |
| `/member/bookings` | 我的预约 | 会员 | 预约记录列表 |
| `/member/coaches` | 教练列表 | 会员 | 浏览教练、收藏 |
| `/member/coaches/:id` | 教练详情 | 会员 | 教练信息、课程、评价 |
| `/member/checkin` | 健身打卡 | 会员 | 打卡操作、打卡记录 |
| `/member/achievements` | 成就徽章 | 会员 | 成就列表、领取、我的徽章 |
| `/member/ai-assistant` | AI 智能助手 | 会员 | DeepSeek 驱动的智能健身顾问 |
| `/admin/dashboard` | 管理面板 | 管理员 | 统计卡片 |
| `/admin/users` | 用户管理 | 管理员 | 用户列表、角色修改 |
| `/admin/coaches` | 教练管理 | 管理员 | 教练增删改、推荐设置 |
| `/admin/courses` | 课程管理 | 管理员 | 课程增删改、上下架 |
| `/admin/bookings` | 预约管理 | 管理员 | 预约列表、确认签到 |
| `/admin/achievements` | 成就配置 | 管理员 | 成就定义管理 |
| `/admin/transactions` | 交易日志 | 管理员 | FitToken 交易记录 |
| `/admin/homepage` | 首页管理 | 管理员 | 简介/轮播图/公告/环境图片 |

> 前端使用 `react-router-dom` v6 实现路由。会员端和管理端使用不同的 Layout 组件。路由守卫通过 `ProtectedRoute` 组件实现，未登录跳转 `/login`，权限不足跳转 `/`。

### 前端 Zustand Store 划分

| Store | 职责 |
|-------|------|
| `useAuthStore` | 钱包连接状态、JWT token、用户信息（id/role/nickname）、登录/登出方法 |
| `useContractStore` | 合约实例缓存、provider/signer、合约地址配置 |

### 前端 UI 设计风格

- **首页**：全屏背景图 + `bg-black/50` 遮罩 + 暗色毛玻璃卡片（`bg-white/10 backdrop-blur-md`），标题带 `text-shadow` 增强可读性
- **登录页**：共享首页背景图 + 浮动钱包图标动画 + 脉冲光环 + 按钮流光扫过效果 + 背景粒子上浮 + 入场淡入动画
- **导航栏/页脚**：暗色半透明（`bg-black/40 backdrop-blur-md`），与首页背景融为一体
- **信息卡片**：暗色毛玻璃边框（`border-white/20`），hover 时亮度微增
- **交易日志**：零地址（`0x000...`）发送方自动显示为绿色「系统铸造」标签

> 其余页面数据（课程列表、教练列表等）通过组件内 `useEffect` + API 请求获取，不做全局缓存。

## 全局开发约定

### 后端约定

- **CORS**：`app.use(cors({ origin: 'http://localhost:5173', credentials: true }))`
- **静态文件**：`app.use('/uploads', express.static('uploads'))` 和 `app.use('/public', express.static('public'))`
- **分页默认值**：`page=1, pageSize=10, 最大 pageSize=50`
- **错误码约定**：400 参数错误、401 未登录、403 无权限、404 资源不存在、409 冲突（重复操作）、500 服务器错误
- **日志**：使用 `console.log` 即可（毕设级别），关键操作记录到控制台

### 前端约定

- **API 封装**：使用 `axios` 创建实例，baseURL 为 `http://localhost:3001/api`，请求拦截器自动附加 JWT
- **合约地址**：统一在 `utils/contractAddresses.ts` 中配置，部署后手动更新
- **样式**：TailwindCSS utility-first，不写自定义 CSS 文件
- **响应式**：页面至少适配 1280px 以上桌面端

### FitToken 课程支付时序

```
1. 用户点击"预约课程"
2. 前端调用后端 POST /api/courses/:id/book（不含 txHash）
3. 后端检查课程容量和用户预约状态
   - 若课程免费（fit_token_cost=0）→ 直接创建 booking(status=booked) → 完成
   - 若需付费 → 创建 booking(status=pending_payment) → 返回待支付信息
4. 前端调用 FitToken.transfer(ownerAddress, amount) → MetaMask 确认
5. 交易确认后，前端调用 POST /api/courses/:id/confirm-payment { txHash }
6. 后端验证 txHash → 更新 booking(status=booked) → 记录 token_transactions
7. 若超时未支付（如 30 分钟），后端查询时自动将 pending_payment 标记为 cancelled
```

> 通过先创建"待支付"预约锁定名额，避免支付竞态问题。超时未支付自动释放名额。

## 安全机制

- **合约安全**：OpenZeppelin ReentrancyGuard + Ownable + Solidity 0.8.x 内置溢出检查
- **API 安全**：JWT + 钱包签名验证，登录 nonce 一次性使用，Sequelize 参数化查询防 SQL 注入
- **密钥保护**：服务钱包私钥、Pinata API Key 均通过 `.env` 管理，禁止提交代码仓库
- **链上交易校验 + 幂等**：见 MetaMask 交互说明中 txHash 校验规则

## 当前限制

- 面向本地开发和毕设演示，不适合直接部署生产环境。
- 成就校验属半中心化设计；服务钱包私钥通过 `.env` 管理；课程容量控制依赖数据库事务。
- NFT 元数据采用管理员预上传 Pinata；链上事件监听、动态上传、全量校验属于扩展功能。

## License

MIT License
