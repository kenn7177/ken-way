# 行间 · 行动与生活的期待

一个以行动清单、轻量奖励和本地优先记录为核心的移动端 Web 原型。

## 本地运行

```bash
npm install
npm run dev
```

普通 app-owned 交互改动在交接前至少运行：

```bash
npm run check:runtime
npm run build
```

涉及 Sites 打包、托管或发布时再运行：

```bash
npm run test:sites
```

纯文案或孤立视觉小修按 `AGENTS.md` 的 S0 级 QA 处理，不必把完整发布检查当作每次像素级调整的硬性门槛。

## 多 agent 协作约定

- 每项独立改动使用单独分支或工作树，完成后通过 Pull Request 合并到 `main`。
- 产品界面以 `src/Prototype.tsx` 与 `src/prototype.css` 为主要编排与共享样式入口；当领域边界稳定时，可以拆成 app-owned leaf component / style。受保护移动端 runtime 与具体编辑边界以 `AGENTS.md` 为准。
- Telegram Web A / K 的研究结论和「行间」统一交互原则见 `docs/telegram-web-study.md`。学习的是状态、导航、反馈、动画与缓存机制，不复制 Telegram 的视觉品牌。
- 不要改写 `.openai/hosting.json` 的既有 `project_id`，也不要在没有明确发布指令时部署站点。
- 普通交互、存储/PWA、发布分别按 `AGENTS.md` 的 S1 / S2 级别验证；已知且与当前修改无关的历史 fixture 问题应记录限制，而不是无限拖长小修流程。

## 数据边界

当前版本没有数据库。个人记录保存在浏览器本地存储；体验模式使用当前浏览器会话存储，重新开始体验即可还原样本数据。
