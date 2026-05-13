# MVP 设计稿（垂直切片）

> 配套：[PRD.md](../PRD.md) · [设计规范](03-设计规范.md) · [MVP 任务卡](04-MVP任务卡.md)  
> 范围：可运行的前端 MVP 垂直切片；视觉与交互对齐设计规范，数据以 `app/src/data/mvp.ts` 为 SSOT，远端 `/learn/today` 成功时合并增强。

---

## 1. 信息架构

| 入口 | 页面 | 说明 |
| --- | --- | --- |
| Tab | 首页 | 今日任务、计划摘要、进入新词/复习、报告入口 |
| Tab | 学习 | 会话态：卡片栈、进度、熟练度、例句、作答 |
| Tab | 我的 | 连续学习、今日进度、跳转报告 |
| 二级 | 单词详情 | 拼写、音标、拆词、媒体区、完整例句 |
| 二级 | 词根详情 | 词源、含义、派生词、词根级例句 |
| 二级 | 学习报告 | 周趋势、正确率、词根掌握、成就 |

非 Tab 页通过 `Taro.navigateTo` 打开；学习会话模式在 Zustand 中设置后 `switchTab` 到学习 Tab。

---

## 2. 首页（学习中心）

**布局（自上而下）**

1. **Hero**：品牌渐变底 + 一句话价值 + 副文案（与现有一致，略收紧行宽）。
2. **今日计划卡**：表面 `surface`、圆角 `radius-lg`、阴影 `shadow-md`。展示「新词 / 复习」目标值（来自 store 的 `planSummary` 或默认 10/20）。
3. **双主按钮行**：「开始新词」「开始复习」—— Primary / Secondary；最小触控高度 88rpx。
4. **轻量词根成长**：一行文案 + 3 个 RootTag 占位（展示已覆盖词根形态），点击进入对应词根详情。
5. **学习报告入口**：Ghost 风格文字链或次级按钮。

**空/加载**

- 首屏无独立 loading；`hydrateToday` 在后台执行，失败静默使用本地 MVP 数据。

---

## 3. 学习 Tab（会话）

**顶栏**

- 标题随模式：「今日新词」/「到期复习」。
- 副标题：今日小步前进类鼓励文案（减压，不展示「还差 X 个」）。

**进度区**

- 横向进度条：`当前索引+1 / 队列长度`。
- **ProgressRing**：五级熟练度，与当前词 `wordMastery[id]` 绑定；点击可出简短说明（可选 Tooltip 用 Toast）。

**卡片区**

- **WordCard**：主视觉；拆词段 stagger 入场（CSS animation-delay）。
- 手势：水平滑动超过阈值 → 陌生（左）/ 熟练（右）；垂直上滑 → 提示「进入词根」并 `navigateTo` 词根详情（取第一个 `type==='root'` 且有 `rootId` 的段，否则第一个 root 段）。
- 按钮兜底：四档 **陌生 / 模糊 / 认识 / 熟练**（映射 API `unknown | vague | known | mastered`），满足无障碍与「不知道手势」的用户。
- 翻面：点击卡片右上角「例句」或整卡次要热区切换背面，背面展示首条例句预览 + 「查看全部」跳转单词详情。
- 发音：双按钮「英」「美」；无 URL 时 Toast「音频准备中」。

**例句区**

- **ExampleList**：筛选 Chips（全部 / 基础 / 真题 / …）；翻译默认隐藏，点击「译」切换；静态高亮：根据 `highlightSpans` 渲染包裹（无 spans 则整句无高亮）。

**会话结束**

- 队列完成后展示 **完成态**：今日已学数量、鼓励文案、按钮「回首页」「再练一组」（重新 `startSession` 同模式）。

---

## 4. 单词详情

- 顶部：拼写 + 音标 + 熟练度环。
- 拆词区：同 WordCard 段样式，段可点击跳转词根详情（`rootId` 映射 `form` 由数据字典完成，MVP 用 `mvp` 静态映射）。
- 媒体区：有图则 `Image` + 圆角；无图则玻璃拟态占位插画文案。
- 例句：完整 ExampleList，默认筛选「全部」。

---

## 5. 词根详情

- 标题：词根形态（大字号）。
- Meta：词源标签 pill + 核心含义。
- 引申义段落（若有）。
- 派生词：chip 列表，点击跳转单词详情（`navigateTo` + spelling）。
- 词根级例句：1～3 条 ExampleCard。

---

## 6. 学习报告

- 顶部周期文案「近 7 日」。
- 迷你趋势：7 根竖条或折线占位（纯 CSS），表示每日投入分钟数。
- 数字摘要：正确率、新词数、复习数、连续天数。
- 词根掌握：列表 + 百分比进度条（浅底 + 品牌渐变填充）。
- 成就：2～3 条卡片式勋章文案。

---

## 7. 视觉与 Token

严格复用 [app/src/styles/tokens.scss](../app/src/styles/tokens.scss) 中已有 CSS 变量；例句层级色条与设计规范 §2.4 一致。不引入第二套主色。

---

## 8. 动效与性能

- 卡片拖拽：`transform + opacity`，松手回弹或飞出用 `transition` 300ms，`cubic-bezier(0.4, 0, 0.2, 1)`。
- 尊重 `prefers-reduced-motion`：减弱 stagger 与位移动画（`@media (prefers-reduced-motion: reduce)` 将 animation 时长置 0.01ms 或禁用）。

---

## 9. 与后端契约

- `GET /v1/learn/today?userId=1`：成功则解析 `newWords` / `reviewWords` 为单词摘要，并按 `spelling` 与 MVP 数据合并得到完整 `WordDetail + examples`。
- `POST /v1/learn/answer`：提交后更新本地 `wordMastery`；失败仅 Toast，仍以本地算法感更新熟练度（可选：调用 `app/src/services/sm2` 保持一致性）。MVP 采用 **成功用服务端返回 mastery，失败用本地 sm2**。

---

## 10. 验收对照（本切片）

- [ ] 首页可启动新词/复习并进入学习 Tab。
- [ ] 学习页完成多张卡片作答与翻面、例句筛选。
- [ ] 单词详情、词根详情、报告页可独立打开且视觉统一。
- [ ] 无新增 `any`；类型集中在 `types/learning.ts` 与 `services/api/types.ts`。
