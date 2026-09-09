# Mobile Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

For the product-level lessons extracted from Telegram Web A / K, read `docs/telegram-web-study.md`. Treat that document as interaction research, not as a visual cloning target.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx`, `src/prototype.css`, and focused app-owned leaf components/styles when a domain has a stable boundary. Existing examples include `SettingsPanel.tsx`, `ExperiencePanel.tsx`, and `settings-panels.css`. Do not move product UI into protected runtime files.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- `Prototype.tsx` should remain the product orchestrator, not the permanent home of every leaf UI. Extract a leaf component when its domain is stable, self-contained, reused, or large enough that keeping it inline makes state/interaction rules harder to see. Keep business rules in `model.ts`, storage/repository code, or store helpers rather than moving them into presentational components.
- App-owned component CSS may be split with a stable leaf component when it improves ownership. Keep shared product tokens, app shell, major layout, and cross-domain visual rules in `prototype.css`; do not use `src/styles.css` for product-specific styling.
- Run `npm run check:runtime` before preview or handoff for ordinary interaction/runtime-affecting work. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Product Coherence Contract

These rules apply across Today, Rewards, Settings, demo mode, and future app-owned surfaces.

- Keep the three primary destinations stable: Today, Rewards, Settings. Temporary tasks such as edit, sort, progress, rules, budget, experience tools, and reward decisions should stay contextual rather than becoming additional primary navigation.
- Treat UI as state-driven. When the state changes, the visual hierarchy may change with it. Do not keep every previous illustration, explanation, and action at full prominence after the user's next decision becomes clear.
- Show at most one strong primary action for a single decision state. Secondary choices use outline/secondary treatment; low-priority exits or reversible alternatives use quiet/text treatment. Destructive irreversible actions require clear confirmation.
- Use consistent navigation language: `关闭` closes the current overlay/sheet; `返回` moves to the previous step inside the same flow; `取消` abandons an in-progress edit/confirmation; `退出体验` changes app mode. Do not use these labels interchangeably.
- Prefer short copy that explains the next decision rather than the product philosophy repeatedly. If hierarchy is clear, remove explanatory text instead of adding another sentence.
- Preserve the product identity: paper-like calm, Chinese editorial typography where appropriate, restrained ornament, and a small amount of ritual around rewards. Telegram-inspired work should copy interaction discipline, not Telegram colors, chat metaphors, rounded-card proportions, or branding.
- Keep the app shell visually stable during local transitions. Fixed device chrome and primary app chrome should not move merely because a sheet, reward state, or child screen changes.
- Make motion functional. Primary-tab transitions should be short and directional; sheets should communicate contextual elevation; reward reveal may carry the strongest ritual motion; state changes inside a flow should usually fade, compact, or reweight rather than repeatedly slide the whole screen.
- Respect reduced motion throughout. Any new decorative or navigational animation must have a coherent reduced-motion state, not merely a shorter duration.
- Theme behavior must be centralized through existing root/theme state and shared CSS semantics. Do not add one-off dark/silver color overrides that bypass the product theme attributes unless there is no reusable semantic token.
- Treat freshness as UX. PWA caching must not allow an obsolete app shell to hide a newly published interface. When cache strategy changes, version it explicitly and verify navigation freshness after release.

### Reward Journey state model

Treat the reward journey as a state machine rather than a static long sheet:

`reveal -> undecided -> coin result -> optional second coin -> resolved`

- Reveal: reward and angel/illustration are the visual focus.
- Undecided: reward meaning and the immediate decision are the focus.
- After a coin result: the coin/result and decision actions become the focus; the angel should recede to a supporting thumbnail/mark if retained.
- Resolved: show the result and next useful action; remove obsolete decision controls.
- Default and first-coin states should aim to keep the actual decision actions in the initial viewport on the target phone size. Do not make the user scroll merely to discover the primary choice.

## QA Cadence

Match verification depth to the risk of the change. Do not turn every 1–2 px visual fix into a full release train.

### S0 — copy or isolated visual adjustment

Use for wording, spacing, a small border/shadow fix, or another change that does not alter behavior/data/runtime.

- Run `git diff --check` or the equivalent lightweight diff sanity check.
- Confirm the page opens and the edited state is reachable.
- Prefer asking the user to judge the real rendered result quickly when the remaining question is subjective visual quality.
- Do not run unrelated long suites merely to prove a pixel-level fix.

### S1 — ordinary product interaction

Use for tabs, sheets, reward interaction states, settings behavior, forms, or component refactors that stay inside app-owned UI.

- Run `npm run check:runtime`.
- Run the relevant business/experience/model tests for the changed behavior.
- Run `npm run build`.
- Perform one focused mobile-size interaction check for the affected flow.

### S2 — storage, PWA, protected runtime, deployment

Use for persistence, personal/demo isolation, service worker/cache policy, protected mobile runtime, build/hosting plumbing, or publishing.

- Run the complete relevant runtime/business/Sites checks.
- Verify refresh/persistence or storage isolation when applicable.
- Verify freshness/cache behavior when PWA or publishing is involved.
- After deployment, verify the live entry and only the critical assets/flows affected by the release.

When an existing unrelated test fixture fails, document the limitation and determine whether it is causally related to the current change. Do not indefinitely block a small unrelated fix on a known fixture gap.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.
