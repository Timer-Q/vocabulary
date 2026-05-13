# MVP 任务卡（M1，6 周）

> 配套文档：[PRD.md](../PRD.md) · [数据字典](01-数据字典.md) · [接口规范](02-接口规范.md) · [设计规范](03-设计规范.md)  
> 范围：四六级词库 + 词根拆解 + 艾宾浩斯 + 图片 + 5 类例句 + 学练测复 + 微信&抖音同步发布  
> 团队配置（建议）：产品 1 / 设计 1 / 前端 2 / 后端 2 / 内容运营 1

---

## 角色与缩写

- `[FE]` 前端  ·  `[BE]` 后端  ·  `[PM]` 产品  ·  `[UX]` 设计  ·  `[OPS]` 内容运营  ·  `[QA]` 测试

---

## 周一：W1 基础设施 + 设计系统

### W1-01 [PM] 词库选型与冷启动 1000 高频词
- 输入：CET-4/CET-6 词频表
- 输出：1000 高频词清单 + 拆词准确率 ≥95% 的标注

### W1-02 [UX] 设计系统 1.0
- 颜色 / 字体 / 圆角 / 阴影 token
- 核心组件：Button、WordCard、ExampleCard、ProgressRing、RootTag
- 输出：Figma + Variables 导出

### W1-03 [FE] Taro 4 脚手架与双端编译验证
- 初始化 Taro 4 + React 18 + TypeScript + UnoCSS + Zustand
- `src/platform/{weapp,tt}` 适配层骨架
- 双端 Hello World 跑通
- CI：lint + typecheck + 双端打包

### W1-04 [BE] NestJS 脚手架
- NestJS + Supabase Auth/PostgreSQL/Storage + Redis + BullMQ
- `Auth/Word/Example/Learn/Review/Media/Ai/Ad/Stats/Mindmap` 模块骨架
- 全局拦截器（日志、错误码、requestId）
- Sentry + Pino + OTel 接入

### W1-05 [BE] 数据库表结构落地
- 按数据字典创建 Prisma schema
- Migration 跑通
- 种子脚本：1000 高频词导入 + 词根库

---

## 周二：W2 单词与例句基础

### W2-01 [BE] Word/Root API
- `GET /v1/words/:spelling`
- `POST /v1/words/split`（先走缓存，AI 接口预留）
- `GET /v1/roots/:form`

### W2-02 [BE] Example API
- `GET /v1/examples?wordId=&levels=`
- `GET /v1/examples/by-root`
- 索引设计 + 缓存

### W2-03 [OPS] 1000 高频词例句
- 每词 5 类例句各 1 条（可少不可缺基础句和真题句）
- 真题句标注年份与题型
- 经典句标注影视/TED 出处

### W2-04 [FE] WordCard 组件
- 三段着色拆词
- 手势识别（左/右/上/下/双击/长按）
- 翻面动画
- 可访问性：触控区域、对比度

### W2-05 [FE] ExampleCard 组件
- 5 类层级色条
- 中文显隐切换
- 跟读高亮（先静态实现）

### W2-06 [UX] 单词详情页 / 例句列表页 高保真稿

---

## 周三：W3 学习主流程 + SM-2

### W3-01 [BE] SM-2 算法实现
- `services/sm2/`：纯函数、单测覆盖 ≥90%
- 输入 `(easeFactor, intervalDays, result, responseMs)` → 输出新参数
- 五级熟练度映射

### W3-02 [BE] LearnModule
- `GET /v1/learn/today`
- `POST /v1/learn/answer`
- `POST /v1/learn/plan`
- 复习队列 zset：`review:queue:{userId}`

### W3-03 [FE] 学习页主流程
- 卡片栈（最多预渲染 3 张）
- 滑动手势 + 状态机（idle / dragging / committing）
- 进度条 + 今日剩余统计

### W3-04 [FE] 单词详情页
- 拆词动画
- 多媒体 viewer（图片 / 音频）
- 例句列表（按层级筛选）

### W3-05 [FE] 词根详情页（基础版）
- 词根含义 + 派生词列表
- 词根级例句

---

## 周四：W4 复习闭环 + 学习报告

### W4-01 [BE] 复习调度（BullMQ + Redis）
- 每分钟扫描到期 zset → 生成推送任务
- 微信订阅消息发送
- 抖音系统通知发送
- 失败重试 / 死信队列

### W4-02 [BE] 学习报告 API
- `GET /v1/learn/report?period=week`
- 聚合：背词量、正确率、连续打卡、词根掌握地图

### W4-03 [FE] 复习页
- 与学习页复用主流程，仅入参不同
- 减压模式弹窗（量超阈值时）
- 错词自动归集 UI

### W4-04 [FE] 学习报告页
- ECharts mini / 自绘 canvas 图表
- 词根掌握地图（紧凑版）
- 连续打卡日历

### W4-05 [FE] 进度环 ProgressRing
- 五等分弧线
- 数据驱动动画

---

## 周五：W5 平台适配 + 主题 + 媒体

### W5-01 [BE] AuthModule 双端
- `POST /v1/auth/login`：weapp / tt 双逻辑
- Supabase Auth 会话桥接 + refresh token 返回
- 用户表写入与新老用户标识

### W5-02 [FE] platform 适配层落地
- `auth.login()`
- `notify.subscribe()`
- `ad.showRewardedAd()`（M1 仅打桩，M3 启用）
- 业务层零感知调用

### W5-03 [FE] 暗黑模式
- 跟随系统
- 手动切换开关
- 全组件双主题校验

### W5-04 [BE] MediaModule
- 图片/音频上传与 Supabase Storage 签名 URL
- 高频词配图入库（OPS 协助）

### W5-05 [FE] 微信 Skyline 启用与性能调优
- `app.json` 切换
- 关键页面 60fps 验证
- 抖音端兜底测试

### W5-06 [FE] 分享功能
- `onShareAppMessage` 共用
- 单词分享卡 / 学习成就分享卡

---

## 周六：W6 联调 / 性能 / 提审

### W6-01 [QA] 测试用例
- 学练测复主流程回归
- 边界：弱网、大数据量复习、连续打卡
- 双端兼容矩阵

### W6-02 [FE+BE] 性能优化
- 主包 <2MB
- 关键接口 P95 <500ms
- 学习页内存监控
- 图片懒加载 + 占位

### W6-03 [BE] 压测与监控
- 1k QPS 压测
- 核心接口告警阈值
- 学习中断恢复方案

### W6-04 [PM] 双端提审
- 微信小程序提审材料
- 抖音小程序提审材料
- 隐私协议 / 用户协议 / 备案

### W6-05 [PM] 内测灰度
- 内部 30 用户灰度 3 天
- 反馈分类与分级
- 上线前修复阻塞性问题

---

## 关键里程碑

| 里程碑 | 时间点 | 验收标准 |
| --- | --- | --- |
| MS1 双端打包跑通 | W1 末 | weapp/tt 双端能打开首页 |
| MS2 单词核心可读 | W2 末 | 1000 高频词均可查看拆解 + 例句 |
| MS3 学习闭环可用 | W3 末 | 完成"看-练-记-复"基础闭环 |
| MS4 复习按时触达 | W4 末 | 订阅消息/系统通知到达率 ≥95% |
| MS5 双端体验对齐 | W5 末 | 复用率 ≥90%，平台差异在适配层内 |
| MS6 提审通过 | W6 末 | 双端通过审核 |

---

## 风险登记

| 风险 | 等级 | 触发条件 | 缓解 |
| --- | --- | --- | --- |
| 词根标注准确率不足 | 高 | 抽样错误率 >5% | 引入语言学顾问审核 + AI 校验 |
| 抖音端 Skyline 不可用 | 中 | 渲染异常 | 抖音端走标准 WebView |
| 内容冷启动量不够 | 中 | 1000 词例句不齐 | OPS 优先保证 200 个最高频词全例句 |
| 订阅消息触达率低 | 中 | <80% | 多模板 + 系统通知双通道 |
| 双端登录差异大 | 低 | 登录失败 | 适配层 + 单元测试覆盖 |

---

## 验收清单（M1 上线前）

- [ ] 微信端首页 → 学习 → 复习 → 报告 全流程通畅
- [ ] 抖音端同上
- [ ] 双端代码复用率 ≥90%
- [ ] 1000 高频词、≥3000 条例句、5000+ 词根全部入库
- [ ] SM-2 算法单元测试覆盖率 ≥90%
- [ ] P95 接口响应 <500ms
- [ ] 主包 <2MB
- [ ] 双端通过审核
- [ ] Sentry / 监控 / 埋点 全部正常上报
- [ ] 隐私协议、用户协议、备案齐全
