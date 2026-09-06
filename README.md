# 行间 · 行动与生活的期待

一个以行动清单、轻量奖励和本地优先记录为核心的移动端 Web 原型。

## 本地运行

```bash
npm install
npm run dev
```

在提交或交接前运行：

```bash
npm run check:runtime
npm run build
npm run test:sites
```

## 多 agent 协作约定

- 每项独立改动使用单独分支或工作树，完成后通过 Pull Request 合并到 `main`。
- 产品界面只在 `src/Prototype.tsx` 与 `src/prototype.css` 中修改；移动端运行时文件受 `AGENTS.md` 保护。
- 不要改写 `.openai/hosting.json` 的既有 `project_id`，也不要在没有明确发布指令时部署站点。
- 运行构建与测试后，再提交可供其他 agent 接手的改动。

## 数据边界

当前版本没有数据库。个人记录保存在浏览器本地存储；体验模式使用当前浏览器会话存储，重新开始体验即可还原样本数据。
