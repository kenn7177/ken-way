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
