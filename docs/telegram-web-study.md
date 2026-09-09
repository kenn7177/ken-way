# Telegram Web 研究与「行间」产品统一原则

这份文档不是视觉临摹清单。目标是研究 Telegram Web A / K 中长期可复用的产品机制，并把适合「行间」的部分转成后续 agent 可以执行的约束。

## 研究对象

- Telegram Web K：<https://github.com/TelegramOrg/Telegram-web-k>
- Telegram Web A（仓库名仍为 Telegram-web-z）：<https://github.com/TelegramOrg/Telegram-web-z>

重点参考：

- Web K `src/components/appNavigationController.ts`
- Web A `src/components/ui/Transition.tsx`
- Web A `src/components/ui/` 的 UI primitive 组织
- Web A `src/serviceWorker/`
- 两个项目 README 中关于 PWA、缓存、动画和渐进式界面的说明

## 最值得学习的不是外观，而是 8 个机制

### 1. 全局壳稳定，局部状态变化

Telegram 的导航、主要上下文和固定 chrome 不会因为局部操作反复重建。内容可以推入、弹出、切换，但用户始终知道自己在哪里。

对「行间」：

- 今天 / 奖励 / 设置三大入口继续保持稳定，不把临时操作升级成新的一级页面。
- 新增、编辑、排序、进度、规则、预算等保持为上下文 sheet。
- 奖励“启程”属于一次局部旅程，不应让底部导航、页面身份和背景内容同时发生剧烈变化。

### 2. 状态驱动视觉层级

Telegram 在状态变化后会改变界面主角，而不是把之前所有元素原封不动地保留。

对「行间」奖励流程，统一按状态机理解：

`揭晓 -> 待决定 -> 第一次掷币 -> 第二次掷币/停止 -> 已收下或已放下`

要求：

- 揭晓时：奖励与天使是主角。
- 掷币后：硬币结果与决定动作成为主角，天使退为缩略视觉。
- 已决定后：结果与下一步成为主角，不继续展示完整决策控件。
- 同一状态最多一个强主按钮；次要动作降级为 outline / quiet / text action。

### 3. 先反馈，再完成

Web A 明确强调 optimistic / progressive interfaces。用户操作后先让界面确认“我收到你的动作了”，后台或后续逻辑再完成。

对「行间」：

- 完成行动后立刻显示完成态和轻量反馈，再进入奖励流程。
- 切换筛选、主题、设置时即时反映，不等待额外确认页。
- 复制、导出、重置等动作使用短状态反馈，不用重复弹出说明。
- 任何可恢复的操作优先即时执行 + 可理解反馈；高破坏性操作才二次确认。

### 4. 导航与返回语义集中管理

Web K 用集中式 navigation controller 统一处理 popup、menu、search、media、settings 等不同层级的 back / Escape / history，而不是各组件自行解释“返回”。

对「行间」：

- `关闭` = 关闭当前 sheet / journey，不改变一级 tab。
- `返回` = 回到同一任务流上一层。
- `退出体验` = 离开 demo 模式，属于模式切换，不等同于关闭弹层。
- 打开新 sheet 前先关闭键盘；浏览器返回/模拟返回不应留下孤立弹层。
- 不在不同面板中混用“关闭 / 返回 / 取消 / 退出”表达同一行为。

### 5. 动画是导航语义，不是装饰

Web A 把 Transition 做成中央 primitive，并区分 slide、fade、reveal、vertical 等语义，同时可在不能/不应动画时关闭。

对「行间」：

- 一级 tab：短、轻、方向明确；不要做奖励式大动画。
- sheet：只表达“从当前上下文浮起”，不抢主页面视觉。
- 奖励揭晓：允许最明显的仪式感，但持续时间要短，且 `减少动态效果` 时完整降级。
- 状态内变化优先淡入/尺寸收束，不反复整屏滑动。
- 固定 chrome 不跟着内容动画。

### 6. 交互原语集中，而不是每个页面手搓

Web A 单独维护 Button、ListItem、Modal、Menu、Tab、Transition、InfiniteScroll、Notification 等原语。规模大并不是理由，反而更需要一致的 primitive。

对「行间」：

短期不建立庞大 design system，但要保持以下共享语义：

- Primary action
- Secondary / outline action
- Quiet / text action
- Settings row
- Section label
- List row
- Bottom sheet
- Toast / status feedback
- Segmented / tab control

当同一种交互出现第三次时，优先抽成 app-owned leaf component，而不是复制 JSX/CSS。

### 7. 缓存是产品体验的一部分

Web A 明确把 multi-level caching 与 PWA 当作核心能力。缓存不能只追求“离线能开”，还必须避免旧壳长期覆盖新版本。

对「行间」：

- 页面导航继续采用 freshness 优先的策略；静态资产可缓存，但 app shell 必须可更新。
- Service Worker 每次策略变化明确升级缓存版本。
- 发布后验证线上入口、关键 bundle/asset 和 SW 版本即可，不为小视觉改动做超长发布仪式。
- 若用户看到“怎么还是旧的”，先查缓存与版本，不要立刻继续叠 CSS 修补。

### 8. 测试强度必须匹配改动风险

Telegram 级复杂客户端需要大量工程防线，但「行间」是移动 Web 原型，不能把每次 2px 视觉修复都当成完整 release train。

统一 QA 分级：

**S0 文案/纯视觉小修**
- `git diff --check`
- 页面能打开、目标状态能到达
- 交给用户在真实页面主观确认

**S1 普通产品交互修改**
- `npm run check:runtime`
- 相关业务测试
- `npm run build`
- 关键手机尺寸快速检查

**S2 数据、存储、PWA、runtime、发布相关修改**
- 完整 runtime / business / Sites 检查
- 刷新与存储隔离
- 线上/发布后 freshness 验证

不要因为存在与当前修改无关的历史 fixture 失败而无限延长一次视觉小修；要记录限制并继续。

## 「行间」的统一产品气质

Telegram 值得学的是高效率和低摩擦，但「行间」不应该变成聊天软件。

保留：

- 纸面、留白、中文标题、轻仪式感
- “行动确定，奖励随机”的产品核心
- 天使、硬币、微光等具有情绪价值的视觉符号

吸收 Telegram：

- 信息密度更克制
- 状态反馈更快
- 导航语义更稳定
- 弹层更短、更任务化
- 状态改变后视觉重点跟着改变
- 重复交互由 primitive 统一

避免：

- 为了“像 Telegram”复制蓝色、聊天气泡、圆角比例或菜单样式
- 同一页面同时出现多套视觉语言
- 用长说明弥补层级不清
- 每次修改都新增一个只服务单场景的交互规则

## 当前仓库的协调结论

1. `Prototype.tsx` 已经承担过多职责，继续无限增长会降低一致性和维护性。
2. 现实代码已经有 `SettingsPanel.tsx`、`ExperiencePanel.tsx` 和独立 CSS，因此“产品 UI 只能写在 Prototype.tsx / prototype.css”这条旧规则应改成“受保护 runtime 不动，app-owned UI 可按领域拆 leaf component”。
3. 不建议此刻做大爆炸式重构。优先抽离已经稳定且边界清楚的领域：奖励 Journey、Today 列表、Reward 列表/池；状态和业务函数仍由 model/store 管理。
4. 主题、按钮、列表、sheet、反馈等视觉语义先统一，再考虑更深组件拆分。
5. 线上部署仍必须由用户明确要求；普通协调工作只到分支/PR和本地验证。

## 后续实现顺序

1. 先更新协作规范与编辑边界。
2. 收敛交互词汇和按钮层级。
3. 把奖励 Journey 明确成状态驱动布局。
4. 清理 Today / Rewards / Settings 中重复或互相冲突的 CSS 语义。
5. 只在稳定边界拆组件，不改业务模型。
6. 最后做一次 390×844 的整体走查，由用户主观验收视觉，不把小差异拖成长期 QA。
