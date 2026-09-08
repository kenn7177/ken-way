# Design QA — settings simplification and visitor experience

Source visual truth: `C:/Users/kingdom/Desktop/photo_2026-09-05_15-25-56.png` (694 × 1280). It defines the paper-white list language, fine separators, quiet green accent, compact mobile rhythm and line-icon density. It does not specify a settings or visitor-experience screen; those are intentional extensions of the established visual system.

Browser-rendered implementation evidence:

- `C:/Users/kingdom/Documents/Codex/2026-09-05/web-telegram-runner-telegram-30-telegram/outputs/settings-demo/01-experience-panel-reduced.png`
- `C:/Users/kingdom/Documents/Codex/2026-09-05/web-telegram-runner-telegram-30-telegram/outputs/settings-demo/02-dark-rules-sheet.png`

Viewport: 390 × 844 CSS px for the mobile flow check. The app is intentionally unframed; no device bezel, status chrome or simulated home indicator is part of the current target.

## State and interactions checked

1. Personal settings now shows exactly five actions: dark mode, reduced motion, export, experience/share, and about/rules.
2. Experience/share opens a separate bottom sheet. Local preview correctly says the copied link is only available on the current computer; successful copy feedback appears only after the copy call resolves.
3. `?demo=1` opens a session-isolated sample with the banner, six actions, split work, a timed action, 1600 example glow and reward samples.
4. The demo timer can be started and then skipped through the explicit demo-only control; it does not award XP until the normal completion action is taken.
5. Resetting demo data requires an inline confirmation. After confirmation the sample returns to six open actions, zero XP and 1600 example glow. Exiting demo returns to the existing personal record.
6. The personal budget editor rejects a ¥100 value when the active star wish costs ¥500 and retains the existing ¥800 value.
7. Deep theme plus reduced motion was checked with the About/Rules sheet open. The sheet inherits the same dark paper palette and has an explicit close button.

## Required fidelity surfaces

- **Typography:** primary setting labels are 16px; explanations use 14px with stronger muted text than the earlier 11px copy. Sheet titles retain the established heavier hierarchy.
- **Spacing and layout rhythm:** two compact setting groups replace the former long settings feed. The five actions fit within the first screen at the checked mobile viewport. The unframed runtime uses the visible viewport instead of the previous 54px/852px device geometry for its root and sheet height.
- **Colors and tokens:** paper white, thin borders and green action color remain unchanged. The dark variables now reach document-level portal content, so sheets and the page share one palette.
- **Image quality:** no new decorative or representational images were introduced. Existing RMB coin assets remain unchanged.
- **Copy:** “体验模式 · 示例数据”, reset confirmation, export labels and local-preview wording explicitly distinguish visitors’ sample records from personal records.

## Comparison history

1. Before this pass, the settings page repeated brand copy and onboarding, mixed budget and trial logic with preferences, and did not provide a separate visitor environment. The earlier audit screenshots recorded this state.
2. The current pass removed the duplicate settings content, moved budget and star configuration to the reward pool, replaced trial with experience/share, and captured the reduced-motion experience panel plus dark rules sheet. No actionable P0/P1/P2 visual drift remains against the paper-list design language.

## Residual limits

- This verifies the browser-visible mobile viewport and key experience paths, not every physical browser safe-area combination.
- The browser reported a Motion reduced-motion advisory during the intentional preference check, rather than an app exception. No application console errors were observed in this pass.
- The published `?demo=1` link was opened after deployment and showed the independent sample banner, six actions and 1600 example glow without console errors.

final result: passed

---

# Design QA — silver-paper switch verification (2026-09-07)

This section supersedes the immediately following earlier silver-paper report where it made visual claims from a scaled browser stage. The older report is retained above as history; the claims below use only this run's DOM, computed-style, screenshot, test-run, and source inspection evidence.

## Browser flow and evidence

Target: `http://127.0.0.1:4173/?demo=1` in Edge. The initial screenshot showed the demo banner, six open actions, 1600 example glow, and the Today/Rewards/Settings navigation. The browser viewport was a desktop-width stage (the `.paper-app` DOM rect measured approximately 1544 × 796 CSS px), so this run does **not** claim a 390 × 844 or physical-mobile viewport match. DOM dimensions, not screenshot scale, were used for geometry checks.

1. Settings exposed exactly the three preference switches (`银白纸面`, `深色模式`, `减少动态效果`) plus export, experience/share, and about/rules actions.
2. Clicking `银白纸面` changed `html[data-paper-style]` from `classic` to `silver` and its switch to `aria-checked=true` without changing demo content.
3. Reloading preserved the silver selection. Switching `深色模式` produced the combination `data-paper-style=silver`, `data-paper-theme=dark`; computed `.bottom-sheet` background was `rgb(35, 39, 33)` when the rules and experience sheets were open.
4. The About/Rules sheet opened, had a visible `关闭面板` control, and retained the concise demo-isolation copy. The Experience/Share sheet opened with `体验模式`, `先试一小段`, `补充示例奖励与微光`, `重新开始体验`, and `退出体验`; its dark silver sheet background was also `rgb(35, 39, 33)`.
5. Toggling silver off and dark off yielded `data-paper-style=classic`, `data-paper-theme=light`; toggling dark on yielded `classic/dark` and computed app background `rgb(35, 39, 33)`. Reloading preserved the final classic/dark combination.
6. The demo remained visibly labeled `体验模式 · 示例数据`, with six actions and 1600 example glow throughout. No app console warnings or errors were captured (`tab.dev.logs` returned `[]`).

## Automated checks

- `npm.cmd run check:runtime`: passed; 28 protected files intact.
- `npm.cmd run build`: passed; TypeScript, Vite output, `dist/server/index.js`, and hosting metadata prepared.
- `node --test tests/business.test.mjs tests/experience.test.mjs tests/model.test.mjs`: passed, 25/25.
- `git diff --check`: passed (only normal CRLF conversion warnings from Git).
- `npm.cmd run test:runtime`: 5/8 passed; 3 existing mobile-runtime fixture failures are unrelated to the theme switch. The failures were missing `keyboard-dock`/`device-picker` fixture elements in tests 6–8, not silver/classic or theme assertions.

## CSS scope inspection

Silver overrides are scoped through `html[data-paper-style="silver"]` (including the `:where(...)` variants), and the root sets the data attribute from the optional `store.silverPaper === true` boolean. No unscoped silver selector was found. One dead selector is worth cleanup later: `:where(html[data-paper-style="silver"]) html[data-paper-theme=dark] ...` cannot match because an `html` element cannot contain another `html`; the later top-level dark selector currently covers the same sheet behavior, so this is a low-risk P3 maintainability issue rather than a user-visible failure.

## Verdict and limits

Theme switch behavior, refresh persistence, all four classic/silver × light/dark combinations, portal sheets, concise copy, demo labeling, and runtime/build/business checks were verified. The silver theme is **functionally passed** in this run. A physical/mobile-size visual comparison and the failed unrelated runtime fixture tests remain unverified; do not treat this report as full mobile-runtime acceptance.

final result: passed

## Follow-up mobile and storage isolation evidence (2026-09-07)

- A fresh Playwright context was run at an explicit `390 × 844` CSS viewport (device scale factor 1). Both before and after the switch, `window.innerWidth/innerHeight` were exactly `[390,844]` and the `.paper-app` rect was exactly `390 × 844`; this is the real DOM-size check, not the scaled CUA stage.
- The accepted 390 × 844 screenshot is saved at `C:/Users/kingdom/Documents/Codex/2026-09-05/web-telegram-runner-telegram-30-telegram/work/paper-actions/qa-silver-390x844.png`. It shows the silver/light Settings page, enabled `银白纸面` switch, paper texture, concise rows, and bottom navigation without clipping.
- In a fresh isolated context, a new personal page started as `classic/light` with no storage keys. Turning silver on created only `paper-actions:v1` in local storage. Opening `?demo=1` then started as independent `classic/light` while preserving the personal local key; demo changes created `paper-actions:demo:v1` in session storage. Returning to personal retained personal silver, demonstrating theme state does not cross between the two banks.
- The CUA in-app tab was left at `http://127.0.0.1:4173/?demo=1`, Settings, silver/light, with switch value 1, and marked deliverable. Tab id: `1`.

Updated verdict: mobile 390 × 844 DOM geometry, screenshot readability, personal default classic, and personal/demo theme-storage isolation are now tested. The remaining three runtime fixture failures listed above are unrelated protected-runtime test failures.

## Final regression — rewards, assets, PWA (2026-09-08)

- `node --experimental-strip-types --test tests/business.test.mjs tests/experience.test.mjs`: 25/25 passed.
- `npm.cmd run check:runtime`, `npm.cmd run build`, and `npm.cmd run test:sites`: all passed. Sites tests were 4/4.
- `public/assets/angels/angel-01.png` through `angel-06.png` all exist and have alpha transparency. Dimensions: 01–04 and 06 are 1122 × 1402; 05 is 1086 × 1448.
- Static HTTP checks from the local app returned 200 for `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, and `/icons/icon-512.png`. Manifest parsing confirmed `display=standalone`, `start_url=/`, `scope=/`, and 192/512 PNG icons. In a browser context, Service Worker registration and controller were both present after load (`registered=true`, `controller=true`).
- The fresh 390 × 844 UI context showed Today without a numeric glow balance; the Rewards page source/UI exposes the balance only in the `奖励池` tab (`当前微光`), while tab switching was exercised for `身边`, `待决定`, `过往`, and `奖励池`. No reward modal was fully reached through the seeded split-action path in this run because the intermediate completion action remained disabled until its step state changed; therefore modal-specific visual assertions are not marked as directly browser-passed here. Source inspection confirms the result branch has no `.reward-stars` render and uses only `正面`/`反面` for coin output, with no `可以去` or `先不去` strings in `Prototype.tsx`.
- The CUA in-app tab remains at `http://127.0.0.1:4173/?demo=1`, Settings, silver/light, with the switch enabled, and was marked deliverable.

Final regression verdict: build, business logic, assets, PWA endpoints/registration, storage normalization, and theme compatibility passed. Reward-modal interaction itself remains a named evidence limit rather than an unverified pass.

Final implementation note: the dead nested-html selector noted above was removed and the scoped silver CSS was formatted. The timer field retains “0 为不计时” and the substeps field retains “可选”. This report verifies the theme-switch feature and responsive behavior; it does not claim pixel-identical reproduction of the generated concept.

## Final visible reward flow correction (2026-09-08)

- A fresh `?demo=1` CUA flow completed `出门走走，让身体醒过来`, opened the reward modal, and visibly showed one randomly selected supplied angel image in the former three-star slot.
- The modal no longer rendered the three star icons or the phrases “可以去” / “先不去”; after the coin interaction the visible outcomes were the concise labels “正面” / “反面”. The reward source line remained, without an inline microglow amount.
- The `奖励池` tab visibly showed `当前微光`, an `获取记录` section, and dated `+20` / `+1600` rows. The other Rewards tabs did not show the microglow balance, keeping the system implicit during ordinary interactions.
- The same local browser session retained the silver-paper setting and stayed at `http://127.0.0.1:4173/?demo=1` for handoff.

Final result: passed.

## 启程后奖励抽屉交互优化（2026-09-08）

- 参照用户提供的奖励抽屉截图，对同一 `?demo=1` 本地页面进行了窄屏复现：奖励图、标题、说明和首要按钮现在在首屏形成完整层级，未掷币时不再需要先滚动才能看到“收下这份奖励”。
- 提示文案压缩为单行“想收下就确认；拿不准，可掷一次硬币。”，避免被固定操作区截断；两次结果也改为单行摘要。
- 操作区采用轻量吸底反馈：未产生硬币结果时保持决策按钮可达；出现硬币结果后恢复内容流，避免吸底区遮住硬币、结果文案或标题。
- 通过 `useLayoutEffect` 在奖励状态、掷币次数或揭示阶段切换时将抽屉滚动位置复位到内容起点，避免浏览器滚动锚定把标题顶出可视区域。
- 交互回归：打开待决定奖励 → 首屏显示天使与两个决策按钮 → 掷硬币后显示硬币与“正面”结果 → 第二次掷币后显示“两次结果”和最终决策按钮；未观察到控制台错误。

Final result: passed.
