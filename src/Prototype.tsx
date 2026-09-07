import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig, useIsPresent, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  BackpackIcon,
  BarChartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cross2Icon,
  GearIcon,
  PlusIcon,
  ReaderIcon,
  StarIcon,
  SymbolIcon,
  TimerIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  BottomSheet,
  KeyboardInput,
  KeyboardTextarea,
  MobileScroll,
  useKeyboard,
} from "./mobile";
import {
  completeAction,
  completed,
  dayKey,
  dayOffset,
  decideReward,
  drawReward,
  exchangeReward,
  groups,
  id,
  occurrence,
  redeemReward,
  saveAction,
  saveTemplate,
  tossCoin,
  type Action,
  type Group,
  type Reward,
  type Store,
  type Template,
} from "./model";
import "./prototype.css";
import { SettingsPanel } from "./SettingsPanel";
import { ExperiencePanel } from "./ExperiencePanel";
import { useAppStore } from "./useAppStore";
import { modeFromSearch, refillDemoStore, skipDemoTimer } from "./experience";
import { activateWish, saveBudget, type AppMode } from "./model";
import telegramOrbit from "./tlottie-orbit.json";
import { createTlottieAnimation } from "./tlottie";

type Tab = "today" | "rewards" | "settings";
type Filter = "全部" | "今天" | "未完成" | "已完成";
type Sheet = "action" | "template" | "rules" | "progress" | "sort" | "experience" | "budget" | null;
type Update = (change: (state: Store) => Store) => Store | null;
type TabDirection = "forward" | "backward";
const tabOrder: Tab[] = ["today", "rewards", "settings"];
const labelForReward = {
  pending: "等你决定",
  kept: "还在身边",
  released: "已放下",
  redeemed: "已兑现",
};
const angelAssets = [
  "/assets/angels/angel-01.png",
  "/assets/angels/angel-02.png",
  "/assets/angels/angel-03.png",
  "/assets/angels/angel-04.png",
  "/assets/angels/angel-05.png",
  "/assets/angels/angel-06.png",
] as const;

function randomAngelAsset() {
  const sample = new Uint32Array(1);
  crypto.getRandomValues(sample);
  return angelAssets[sample[0] % angelAssets.length];
}

export default function Prototype() {
  const [mode] = useState(() => modeFromSearch(window.location.search));
  const { store, current, error, setError, update, repository, exportRecord } = useAppStore(mode);
  const [tab, setTab] = useState<Tab>("today");
  const [tabDirection, setTabDirection] = useState<TabDirection>("forward");
  const [filter, setFilter] = useState<Filter>("全部");
  const [group, setGroup] = useState<Group | null>(null);
  const [sort, setSort] = useState<"手动" | "优先级" | "日期">("手动");
  const [rewardTab, setRewardTab] = useState("身边");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [actionDraft, setActionDraft] = useState<Action | null>(null);
  const [templateDraft, setTemplateDraft] = useState<Template | null>(null);
  const [journey, setJourney] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [toast, setToast] = useState("");
  const [clock, setClock] = useState(Date.now());
  const [redeemId, setRedeemId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const keyboard = useKeyboard();
  const reducedSystem = useReducedMotion();
  const reduced = store.reduced || Boolean(reducedSystem);
  const today = dayKey(new Date(clock));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3800);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  useEffect(() => {
    const root = document.documentElement;
    const oldTheme = root.dataset.paperTheme;
    const oldStyle = root.dataset.paperStyle;
    const oldMotion = root.dataset.paperReduced;
    root.dataset.paperTheme = store.dark ? "dark" : "light";
    root.dataset.paperStyle = store.silverPaper === true ? "silver" : "classic";
    root.dataset.paperReduced = String(reduced);
    return () => {
      if (oldTheme === undefined) delete root.dataset.paperTheme; else root.dataset.paperTheme = oldTheme;
      if (oldStyle === undefined) delete root.dataset.paperStyle; else root.dataset.paperStyle = oldStyle;
      if (oldMotion === undefined) delete root.dataset.paperReduced; else root.dataset.paperReduced = oldMotion;
    };
  }, [store.dark, store.silverPaper, reduced]);
  const demoUrl = new URL("/?demo=1", window.location.origin).href;
  const localOnly = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  function switchMode(next: AppMode) {
    keyboard.hide();
    window.location.assign(next === "demo" ? demoUrl : new URL("/", window.location.origin).href);
  }
  function resetExperience() {
    try { keyboard.hide(); repository.reset(); window.location.reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "体验重置失败，请重试。"); }
  }
  function openBudget() { setBudgetDraft(String(store.budget)); openSheet("budget"); }
  function navigate(next: Tab) {
    keyboard.hide();
    if (next !== tab) {
      setTabDirection(tabOrder.indexOf(next) > tabOrder.indexOf(tab) ? "forward" : "backward");
    }
    setTab(next);
    setError("");
  }
  function openSheet(next: Sheet) {
    keyboard.hide();
    setError("");
    setSheet(next);
  }
  function editAction(action?: Action) {
    setActionDraft(
      action
        ? structuredClone(action)
        : {
            id: id(),
            title: "",
            minimum: "",
            group: "生活",
            kind: "habit",
            due: today,
            priority: "普通",
            minutes: 0,
            steps: [],
            created: today,
            archived: false,
          },
    );
    openSheet("action");
  }
  function editTemplate(template?: Template) {
    setTemplateDraft(
      template
        ? { ...template }
        : { id: id(), title: "", description: "", rarity: 4, minutes: 30, cost: 0, active: true },
    );
    openSheet("template");
  }
  function finish(action: Action) {
    const before = current.current;
    const next = update((s) => completeAction(s, action.id, today, Date.now(), mode));
    if (next && next !== before)
      setToast(
        next.completions[0].eligible
          ? "已完成 · +24 XP，现在可以启程"
          : "已完成 · +24 XP，每一步都算数",
      );
  }
  function launch(completionId: string) {
    keyboard.hide();
    const existing = current.current.rewards.find((r) => r.completionId === completionId);
    if (existing) {
      setJourney(existing.id);
      return;
    }
    const next = update((s) => drawReward(s, completionId, today, undefined, undefined, mode));
    if (next) {
      const reward = next.rewards.find((r) => r.completionId === completionId);
      if (reward) {
        setJourney(reward.id);
        setReveal(true);
        timerRef.current = setTimeout(() => setReveal(false), reduced ? 80 : 700);
      }
    }
  }
  function exportData() {
    try {
      const record = exportRecord();
      const blob = new Blob([record.content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = record.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setToast(mode === "demo" ? "体验记录已导出" : "记录已导出");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "导出未完成，请重试。"); }
  }
  const actions = store.actions.filter((a) => !a.archived);
  const doneToday = store.completions.filter((c) => c.day === today).length;
  const openCount = actions.filter((a) => !completed(store, a, today)).length;
  const weekStart = dayOffset(-((new Date(`${today}T12:00`).getDay() + 6) % 7), today);
  const weekly = store.completions.filter((c) => c.day >= weekStart && c.day <= today).length;
  const filtered = actions.filter(
    (a) =>
      (!group || a.group === group) &&
      (filter === "全部" ||
        (filter === "今天" && (a.kind === "habit" || a.due === today)) ||
        (filter === "未完成" && !completed(store, a, today)) ||
        (filter === "已完成" && completed(store, a, today))),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === "优先级"
      ? ["高", "中", "普通"].indexOf(a.priority) - ["高", "中", "普通"].indexOf(b.priority)
      : sort === "日期"
        ? (a.due || "9999").localeCompare(b.due || "9999")
        : 0,
  );
  const buckets = ["逾期", "今天", "明天", "以后", "没排期", "已完成"];
  const bucket = (a: Action) =>
    completed(store, a, today)
      ? "已完成"
      : a.kind === "habit"
        ? "今天"
        : !a.due
          ? "没排期"
          : a.due < today
            ? "逾期"
            : a.due === today
              ? "今天"
              : a.due === dayOffset(1, today)
                ? "明天"
                : "以后";
  const activeReward = store.rewards.find((r) => r.id === journey);
  const selectedRedeem = store.rewards.find((r) => r.id === redeemId);
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <div
        data-tab={tab}
        data-mode={mode}
        className={`paper-app ${store.dark ? "paper-dark" : ""} ${reduced ? "paper-reduced" : ""}`}
      >
        <header className="paper-header">
          <div>
            <h1>
              {tab === "today" ? "行间" : tab === "rewards" ? "留下来的好运" : "设置"}
            </h1>
            {tab !== "settings" && <p>{tab === "today" ? `${openCount} OPEN` : `${store.rewards.filter((r) => r.status === "kept").length} KEPT`}</p>}
          </div>
          <div className="header-tools">
            {tab === "today" && <IconButton label="查看行动进度" onClick={() => openSheet("progress")}><BarChartIcon /></IconButton>}
          </div>
        </header>
        {mode === "demo" && <div className="demo-banner"><span>体验模式 · 示例数据</span><div><button onClick={() => openSheet("experience")}>体验工具</button><button onClick={() => switchMode("personal")}>退出</button></div></div>}
        <MobileScroll className="paper-scroll">
          <AnimatePresence initial={false} mode="wait">
          <TabPanel key={tab} direction={tabDirection} reduced={reduced}>
            {error && !sheet && !journey && (
              <p className="paper-error" role="alert">
                {error}
              </p>
            )}
            {tab === "today" && (
              <>
                <div className="filter-row">
                  <div className="segmented" aria-label="行动筛选">
                    {(["全部", "今天", "未完成", "已完成"] as Filter[]).map((f) => (
                      <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <button className="sort-control" onClick={() => openSheet("sort")}>
                    排序
                    <ChevronDownIcon />
                  </button>
                </div>
                {group && (
                  <button className="group-reset" onClick={() => setGroup(null)}>
                    {group}分组 <Cross2Icon /> 清除筛选
                  </button>
                )}
                <div className="action-list">
                  {buckets.map((section) => {
                    const entries = sorted.filter((a) => bucket(a) === section);
                    if (!entries.length) return null;
                    return (
                      <section key={section}>
                        <SectionLabel title={section} detail={String(entries.length)} />
                        <AnimatePresence initial={false}>
                          {entries.map((action) => (
                            <ActionRow
                              key={action.id}
                              action={action}
                              mode={mode}
                              reduced={reduced}
                              store={store}
                              day={today}
                              now={clock}
                              onEdit={() => editAction(action)}
                              onComplete={() => finish(action)}
                              onLaunch={launch}
                              update={update}
                            />
                          ))}
                        </AnimatePresence>
                      </section>
                    );
                  })}
                  {!filtered.length && (
                    <Empty
                      icon={<CheckIcon />}
                      title={filter === "已完成" ? "还没有完成记录" : "暂无行动"}
                      copy={
                        filter === "已完成"
                          ? "完成的行动会留在这里。"
                          : "换个筛选，或添加一小步。"
                      }
                    />
                  )}
                </div>
                <section className="today-overview" aria-label="本周行动概览">
                  <SectionLabel title="这一周" />
                  <div className="week-stats">
                    <Metric value={weekly} label="本周完成" />
                    <Metric value={doneToday * 24} label="今日 XP" />
                    <Metric value={store.rewards.filter((r) => r.status === "pending").length} label="待决定" />
                  </div>
                  <SectionLabel title="按分组" detail={`${openCount} 件行动`} />
                  <div className="group-progress">
                    {groups.map((g) => {
                      const list = actions.filter((a) => a.group === g);
                      const count = list.filter((a) => completed(store, a, today)).length;
                      return (
                        <button
                          key={g}
                          className={group === g ? "selected" : ""}
                          aria-pressed={group === g}
                          onClick={() => setGroup(group === g ? null : g)}
                        >
                          <span>{g}</span>
                          <progress max={list.length || 1} value={count} />
                          <small>
                            {count}/{list.length}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
            {tab === "rewards" && (
              <>
                {rewardTab === "奖励池" && <div className="reward-balance">
                  <span>当前微光</span>
                  <strong>
                    {store.glow}
                    <small> 微光</small>
                  </strong>
                </div>}
                <div className="segmented reward-tabs">
                  {["身边", "待决定", "过往", "奖励池"].map((t) => (
                    <button key={t} aria-pressed={t === rewardTab} onClick={() => setRewardTab(t)}>
                      {t}
                      {t === "待决定" && store.rewards.some((r) => r.status === "pending") && <i />}
                    </button>
                  ))}
                </div>
               {rewardTab === "奖励池" ? (
                 <>
                    <SectionLabel title="获取记录" />
                    <div className="glow-history">
                      {(store.glowHistory ?? []).slice(0, 8).map((record) => (
                        <div className="glow-history-row" key={record.id}>
                          <div>
                            <strong>{record.source}</strong>
                            <small>{record.date.slice(5)}</small>
                          </div>
                          <b>+{record.amount}</b>
                        </div>
                      ))}
                      {!store.glowHistory?.length && (
                        <p className="field-help">完成三星奖励后，获取记录会出现在这里。</p>
                      )}
                    </div>
                    <button className="budget-summary" onClick={openBudget}><div><span>本月奖励预算</span><strong>¥{store.budget}</strong></div><span>编辑预算 <ChevronRightIcon /></span></button>
                  <SectionLabel title="当前星愿" />
                    {store.templates
                      .filter((t) => t.id === store.wishId)
                      .map((t) => (
                        <TemplateRow
                          key={t.id}
                          template={t}
                          activeWish
                          onEdit={() => editTemplate(t)}
                        />
                      ))}
                    <SectionLabel title="四星奖励" detail="800 微光可兑换" />
                    {store.templates
                      .filter((t) => t.rarity === 4)
                      .map((t) => (
                        <TemplateRow
                          key={t.id}
                          template={t}
                          onEdit={() => editTemplate(t)}
                          extra={
                            <button
                              className="text-button"
                              disabled={store.glow < 800 || !t.active}
                              onClick={() => {
                                if (update((s) => exchangeReward(s, t.id, today)))
                                  setToast("四星奖励已放入「身边」");
                              }}
                            >
                              兑换 · 800
                            </button>
                          }
                        />
                      ))}
                    <SectionLabel title="三星微体验" detail="每次固定 +20 微光" />
                    {store.templates
                      .filter((t) => t.rarity === 3)
                      .map((t) => (
                        <TemplateRow key={t.id} template={t} onEdit={() => editTemplate(t)} />
                      ))}
                    {store.templates.some((t) => t.rarity === 5 && t.id !== store.wishId) && (
                      <>
                        <SectionLabel title="其他星愿" />
                        {store.templates
                          .filter((t) => t.rarity === 5 && t.id !== store.wishId)
                          .map((t) => (
                            <TemplateRow
                              key={t.id}
                              template={t}
                              onEdit={() => editTemplate(t)}
                              extra={
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    if (!update((s) => activateWish(s, t.id))) return;
                              setToast("当前星愿已更新，保底继续累计");
                                  }}
                                >
                                  设为当前
                                </button>
                              }
                            />
                          ))}
                      </>
                    )}
                    <button className="outline-button full-width" onClick={() => editTemplate()}>
                      <PlusIcon /> 添加一份期待
                    </button>
                  </>
                ) : (
                  <div className="reward-list">
                    {store.rewards
                      .filter((r) =>
                        rewardTab === "身边"
                          ? r.status === "kept"
                          : rewardTab === "待决定"
                            ? r.status === "pending"
                            : ["released", "redeemed"].includes(r.status),
                      )
                      .map((r) => (
                        <button
                          className="reward-row"
                          key={r.id}
                          onClick={() =>
                            r.status === "kept" ? setRedeemId(r.id) : setJourney(r.id)
                          }
                        >
                          <StarIcon className={`rarity rarity-${r.rarity}`} />
                          <div>
                            <h2>{r.title}</h2>
                            <p>
                              {r.rarity} 星 · {rewardTab === "过往" ? `${labelForReward[r.status]} · ` : ""}{r.date.slice(5)}
                            </p>
                          </div>
                          <ChevronRightIcon />
                        </button>
                      ))}
                    {!store.rewards.some((r) =>
                      rewardTab === "身边"
                        ? r.status === "kept"
                        : rewardTab === "待决定"
                          ? r.status === "pending"
                          : ["released", "redeemed"].includes(r.status),
                    ) && (
                      <Empty
                        icon={<BackpackIcon />}
                        title={
                          rewardTab === "待决定"
                            ? "没有悬而未决的好运"
                            : rewardTab === "过往"
                              ? "故事还在慢慢开始"
                              : "给好运留一个位置"
                        }
                        copy="从今天的一件小事开始。得到的奖励，可以按自己的节奏决定和兑现。"
                      />
                    )}
                  </div>
                )}
              </>
            )}
            {tab === "settings" && <SettingsPanel dark={store.dark} reduced={store.reduced} mode={mode}
            silverPaper={store.silverPaper === true}
            onToggleSilverPaper={() => update((s) => ({ ...s, silverPaper: s.silverPaper !== true }))}
            onToggleDark={() => update((s) => ({ ...s, dark: !s.dark }))}
            onToggleReduced={() => update((s) => ({ ...s, reduced: !s.reduced }))}
            onExport={exportData} onExperience={() => openSheet("experience")} onAbout={() => openSheet("rules")} />}
          </TabPanel>
          </AnimatePresence>
        </MobileScroll>
        {tab === "today" && (
          <div className="paper-composer">
            <button onClick={() => editAction()}>
              <PlusIcon />
              <span>为今天留下一小步</span>
            </button>
          </div>
        )}
        <nav className="paper-nav" aria-label="主要导航">
          {(
            [
              ["today", "今天", <ReaderIcon />],
              ["rewards", "奖励", <BackpackIcon />],
              ["settings", "设置", <GearIcon />],
            ] as [Tab, string, ReactNode][]
          ).map(([value, label, icon]) => (
            <button
              key={value}
              aria-current={tab === value ? "page" : undefined}
              onClick={() => navigate(value)}
            >
              {tab === value && (
                <motion.span
                  layoutId="nav-current"
                  className="nav-current"
                  transition={{ type: "spring", stiffness: 440, damping: 36 }}
                />
              )}
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <AnimatePresence>
          {toast && (
            <motion.output
              className="paper-toast"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-live="polite"
            >
              <TelegramEmotion
                reduced={reduced}
                glyph={toastEmotion(toast)}
                animated={isEmotionalToast(toast)}
              />
              {toast}
            </motion.output>
          )}
        </AnimatePresence>
        <BottomSheet
          reducedMotion={reduced}
          open={sheet !== null}
          onOpenChange={(open) => {
            if (!open) {
              keyboard.hide();
              setSheet(null);
              setError("");
            }
          }}
          title={
            sheet === "action"
              ? store.actions.some((a) => a.id === actionDraft?.id)
                ? "设定这条行动"
                : "新建行动"
              : sheet === "template"
                ? "一份生活的期待"
                : sheet === "sort"
                  ? "清单排序"
                  : sheet === "rules"
                    ? "关于启程"
                    : sheet === "experience"
                      ? "体验与分享"
                      : sheet === "budget" ? "本月奖励预算"
                      : "行动的足迹"
          }
          snap={sheet === "action" || sheet === "template" ? 0.91 : 0.8}
        >
          <div className="paper-sheet-content">
            {error && (
              <p className="paper-error" role="alert">
                {error}
              </p>
            )}
            {sheet === "action" && actionDraft && (
              <ActionForm
                draft={actionDraft}
                setDraft={setActionDraft}
                onSave={() => {
                  if (update((s) => saveAction(s, actionDraft))) {
                    keyboard.hide();
                    setSheet(null);
                    setToast("行动已保存");
                  }
                }}
                onArchive={
                  store.actions.some((a) => a.id === actionDraft.id)
                    ? () => {
                        update((s) => ({
                          ...s,
                          actions: s.actions.map((a) =>
                            a.id === actionDraft.id ? { ...a, archived: true } : a,
                          ),
                        }));
                        keyboard.hide();
                        setSheet(null);
                        setToast("行动已归档，历史仍保留");
                      }
                    : undefined
                }
              />
            )}
            {sheet === "template" && templateDraft && (
              <TemplateForm
                draft={templateDraft}
                existing={store.templates.some((t) => t.id === templateDraft.id)}
                setDraft={setTemplateDraft}
                onSave={() => {
                  if (update((s) => saveTemplate(s, templateDraft))) {
                    keyboard.hide();
                    setSheet(null);
                    setToast("奖励已保存");
                  }
                }}
              />
            )}
            {sheet === "sort" && (
              <>
                {(["手动", "优先级", "日期"] as const).map((item) => (
                  <button
                    className="choice-row"
                    key={item}
                    onClick={() => {
                      setSort(item);
                      setSheet(null);
                    }}
                  >
                    {item === "手动" ? "添加顺序" : item}
                    {sort === item && <CheckIcon />}
                  </button>
                ))}
              </>
            )}
            {sheet === "rules" && <><div className="about-summary"><h2>行间</h2><p>一张行动清单，一点生活的期待。</p><p>{mode === "demo" ? "这里使用独立的示例数据，关闭本次会话后可以重新体验。" : "记录保存在当前浏览器，不会自动同步到其他设备。可以随时导出一份记录。"}</p></div><details className="rules-disclosure"><summary>查看完整启程规则</summary><Rules mode={mode} /></details></>}
            {sheet === "progress" && (
              <>
                <div className="week-stats">
                  <Metric value={store.xp} label="累计 XP" />
                  <Metric value={store.completions.length} label="已完成行动" />
                  <Metric value={store.rewards.filter((reward) => !reward.isExample && reward.completionId !== 'exchange').length} label="已启程" />
                </div>
                <SectionLabel title="五星进度" detail={`${store.pity.pullsSinceFive} / 45`} />
                <progress className="wide-progress" value={store.pity.pullsSinceFive} max={45} />
                <SectionLabel
                  title="四星以上进度"
                  detail={`${store.pity.pullsSinceFourPlus} / 10`}
                />
                <progress
                  className="wide-progress"
                  value={store.pity.pullsSinceFourPlus}
                  max={10}
                />
                <p className="field-help">休息、换星愿或放下奖励，保底仍会累计。</p>
                <SectionLabel title="最近完成" />
                {store.completions.slice(0, 6).map((c) => (
                  <div className="history-line" key={c.id}>
                    <span>{c.title}</span>
                    <small>+24 XP</small>
                  </div>
                ))}
                {!store.completions.length && <p className="field-help">第一步会从今天开始。</p>}
              </>
            )}
            {sheet === "experience" && <ExperiencePanel mode={mode} demoUrl={demoUrl} localOnly={localOnly}
              onEnter={() => switchMode("demo")}
              onExit={() => mode === "demo" ? switchMode("personal") : setSheet(null)}
              onRefill={() => { if (update((s) => refillDemoStore(s, mode, today))) setToast("已补充三份示例奖励"); }}
              onReset={resetExperience} />}
            {sheet === "budget" && <form className="paper-form" onSubmit={(event) => {
              event.preventDefault();
              if (!budgetDraft.trim()) { setError("请填写预算金额。"); return; }
              if (update((s) => saveBudget(s, Number(budgetDraft)))) { keyboard.hide(); setSheet(null); setToast("本月预算已保存"); }
            }}><Field label="本月预算（元）"><KeyboardInput inputMode="decimal" value={budgetDraft} onChange={(event) => setBudgetDraft(event.target.value)} autoFocus /></Field>
              <p className="field-help">当前星愿 ¥{store.templates.find((t) => t.id === store.wishId)?.cost ?? 0}；仅作预算，不会支付。</p>
              <button type="submit" className="primary-button full-width">保存预算</button><button type="button" className="quiet-button full-width" onClick={() => { keyboard.hide(); setSheet(null); }}>取消</button>
            </form>}
          </div>
        </BottomSheet>
        <BottomSheet
          reducedMotion={reduced}
          open={Boolean(activeReward)}
          onOpenChange={(open) => {
            if (!open) {
              setJourney(null);
              setReveal(false);
              setError("");
            }
          }}
          title={activeReward?.status === "pending" ? "这一程，留下了" : "这一份好运"}
          snap={0.78}
        >
          {activeReward && (
            <Journey
              key={activeReward.id}
              reward={activeReward}
              reveal={reveal}
              reduced={reduced}
              update={update}
              error={error}
              onClose={() => {
                setJourney(null);
                setReveal(false);
              }}
              onToRewards={() => {
                setJourney(null);
                setRewardTab("身边");
                navigate("rewards");
              }}
            />
          )}
        </BottomSheet>
        <BottomSheet
          reducedMotion={reduced}
          open={Boolean(selectedRedeem)}
          onOpenChange={(open) => {
            if (!open) setRedeemId(null);
          }}
          title="现在享受这份奖励吗？"
          description="兑现后会移到过往，仍然保留记录。"
          snap={0.45}
        >
          <div className="paper-sheet-content">
            <h2>{selectedRedeem?.title}</h2>
            <p className="field-help">{selectedRedeem?.description}</p>
            <button
              className="primary-button full-width"
              onClick={() => {
                if (redeemId && update((s) => redeemReward(s, redeemId))) {
                  setRedeemId(null);
                  setToast("已兑现，把这份美好留在今天");
                }
              }}
            >
              确认已兑现
            </button>
            <button className="quiet-button full-width" onClick={() => setRedeemId(null)}>
              晚一点
            </button>
          </div>
        </BottomSheet>
      </div>
    </MotionConfig>
  );
}

function isEmotionalToast(toast: string) {
  return toast.startsWith("已完成") || toast.startsWith("已兑现") || toast.includes("已放入");
}

function toastEmotion(toast: string) {
  if (toast.startsWith("已完成")) return "✦";
  if (toast.startsWith("已兑现")) return "☺";
  if (toast.includes("已放入")) return "★";
  return "·";
}

function TelegramEmotion({
  reduced,
  glyph,
  animated,
}: {
  reduced: boolean;
  glyph: string;
  animated: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!animated) return;
    let cancelled = false;
    let frame = 0;
    let animation: Awaited<ReturnType<typeof createTlottieAnimation>> | undefined;

    void createTlottieAnimation(telegramOrbit)
      .then((next) => {
        animation = next;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (cancelled || !canvas || !context) {
          next.dispose();
          return;
        }

        const size = Math.ceil(42 * Math.min(window.devicePixelRatio || 1, 2));
        canvas.width = size;
        canvas.height = size;
        const paint = (time: number) => {
          next.render(context, time / 1000 * next.frameRate, size, size);
          if (!reduced && !cancelled) frame = requestAnimationFrame(paint);
        };
        paint(0);
      })
      .catch(() => {
        // The glyph remains a graceful fallback if WebAssembly is unavailable.
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      animation?.dispose();
    };
  }, [animated, reduced]);

  return (
    <span className={`telegram-emotion ${animated ? "is-animated" : ""}`} aria-hidden="true">
      {animated && <canvas ref={canvasRef} />}
      <span>{glyph}</span>
    </span>
  );
}

function TabPanel({
  direction,
  reduced,
  children,
}: {
  direction: TabDirection;
  reduced: boolean;
  children: ReactNode;
}) {
  const isPresent = useIsPresent();
  const distance = direction === "forward" ? 28 : -28;

  return (
    <motion.main
      aria-hidden={!isPresent}
      className="paper-content"
      data-transition-phase={isPresent ? "active" : "leaving"}
      initial={reduced ? false : { opacity: 0, x: distance }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -distance * 0.58 }}
      transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 0.8, 0.24, 1] }}
    >
      {children}
    </motion.main>
  );
}

function ActionRow({
  action,
  mode,
  reduced,
  store,
  day,
  now,
  onEdit,
  onComplete,
  onLaunch,
  update,
}: {
  action: Action;
  mode: AppMode;
  reduced: boolean;
  store: Store;
  day: string;
  now: number;
  onEdit: () => void;
  onComplete: () => void;
  onLaunch: (id: string) => void;
  update: Update;
}) {
  const [expanded, setExpanded] = useState(false);
  const c = completed(store, action, day);
  const key = occurrence(action, day);
  const steps = store.steps[key] ?? [];
  const end = store.timers[key];
  const time = end ? Math.max(0, Math.ceil((end - now) / 1000)) : action.minutes * 60;
  const waiting = action.minutes > 0 && (!end || time > 0);
  const done = Boolean(c);
  const activeGrant = c?.eligible && !c.used && c.day === day;
  const reward = c && store.rewards.find((r) => r.completionId === c.id);
  return (
    <motion.article
      layout
      initial={false}
      animate={{ backgroundColor: done ? "rgba(47, 94, 74, 0.07)" : "rgba(47, 94, 74, 0)" }}
      transition={reduced
        ? { duration: 0 }
        : {
            layout: { type: "spring", stiffness: 400, damping: 36 },
            backgroundColor: { duration: 0.22, ease: "easeOut" },
          }}
      className={`action-row priority-${action.priority} ${c ? "is-done" : ""}`}
    >
      <div className="action-main">
        <motion.button
          className="task-check"
          aria-label={`完成 ${action.title}`}
          aria-pressed={done}
          disabled={done}
          initial={false}
          animate={done && !reduced ? { scale: [1, 1.17, 1] } : { scale: 1 }}
          whileTap={!done && !reduced ? { scale: 0.86 } : undefined}
          transition={{ duration: reduced ? 0 : 0.26, ease: [0.22, 0.8, 0.24, 1] }}
          onClick={() => {
            if (action.steps.length || waiting) {
              setExpanded(true);
              return;
            }
            onComplete();
          }}
        >
          {c && <CheckIcon />}
        </motion.button>
        <button
          className="action-copy"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <h2>{action.title}</h2>
          <p>
            <span className="group-tag">{action.group}</span>
            <span
              className={
                action.due && action.due < day && action.kind === "todo" && !c ? "overdue-text" : ""
              }
            >
              {action.kind === "habit"
                ? "每日"
                : action.due === day
                  ? "今天"
                  : action.due === dayOffset(1, day)
                    ? "明天"
                    : action.due < day && action.due
                      ? "已逾期"
                      : action.due
                        ? action.due.slice(5)
                        : "没排期"}
            </span>
            {action.priority !== "普通" && <span>{action.priority}</span>}
            {action.minutes > 0 && <span>{action.minutes} 分钟</span>}
          </p>
        </button>
        {activeGrant ? (
          <button className="journey-cta" onClick={() => onLaunch(c!.id)}>
            启程
            <ArrowRightIcon />
          </button>
        ) : reward?.status === "pending" ? (
          <button className="journey-cta" onClick={() => onLaunch(c!.id)}>
            继续
          </button>
        ) : (
          <IconButton label={`编辑 ${action.title}`} onClick={onEdit}>
            <DotsHorizontalIcon />
          </IconButton>
        )}
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="action-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <p className="minimum">{action.minimum}</p>
            {action.steps.map((step, index) => (
              <button
                className="subtask"
                key={index}
                disabled={Boolean(c)}
                aria-pressed={steps.includes(index)}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    steps: {
                      ...s.steps,
                      [key]: steps.includes(index)
                        ? steps.filter((n) => n !== index)
                        : [...steps, index],
                    },
                  }))
                }
              >
                <span className="small-check">{steps.includes(index) && <CheckIcon />}</span>
                {step}
              </button>
            ))}
            {action.minutes > 0 && !c && (
              <div className="timer-line">
                <TimerIcon />
                <strong>
                  {String(Math.floor(time / 60)).padStart(2, "0")}:
                  {String(time % 60).padStart(2, "0")}
                </strong>
                {!end ? (
                  <button
                    className="text-button"
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        timers: { ...s.timers, [key]: now + action.minutes * 60000 },
                      }))
                    }
                  >
                    开始计时
                  </button>
                ) : time > 0 ? (
                  <><span>专注这一小段</span>{mode === "demo" && <button className="text-button" onClick={() => update((s) => skipDemoTimer(s, action.id, mode, day, now))}>跳过等待（体验）</button>}</>
                ) : (
                  <span>计时完成</span>
                )}
              </div>
            )}
            {!c ? (
              <button
                className="outline-button"
                disabled={steps.length < action.steps.length || waiting}
                onClick={onComplete}
              >
                完成这一步 <CheckIcon />
              </button>
            ) : (
              <p className="completion-note">
                已记录 · +24 XP
                {!c.eligible ? " · 今日先把行动做好" : c.day !== day ? " · 当日启程资格已结束" : ""}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
function Journey({
  reward,
  reveal,
  reduced,
  update,
  error,
  onClose,
  onToRewards,
}: {
  reward: Reward;
  reveal: boolean;
  reduced: boolean;
  update: Update;
  error: string;
  onClose: () => void;
  onToRewards: () => void;
}) {
  const [flipping, setFlipping] = useState(false);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = reward.coins.at(-1);
  const [angelAsset] = useState(() => randomAngelAsset());
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function flip() {
    if (lock.current || reward.coins.length >= 2) return;
    lock.current = true;
    const next = update((s) => tossCoin(s, reward.id));
    if (!next) {
      lock.current = false;
      return;
    }
    setFlipping(true);
    timer.current = setTimeout(
      () => {
        setFlipping(false);
        lock.current = false;
      },
      reduced ? 80 : 1100,
    );
  }
  return (
    <div className="journey-content">
      {error && (
        <p className="paper-error" role="alert">
          {error}
        </p>
      )}
      <AnimatePresence mode="wait">
        {reveal ? (
          <motion.div
            key="revealing"
            className="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="seal-stage" aria-hidden="true">
              <div className="confetti">
                <span className="confetti-piece c0" />
                <span className="confetti-piece c1" />
                <span className="confetti-piece c2" />
                <span className="confetti-piece c3" />
                <span className="confetti-piece c4" />
                <span className="confetti-piece c5" />
                <span className="confetti-piece c6" />
                <span className="confetti-piece c7" />
                <span className="confetti-piece c8" />
                <span className="confetti-piece c9" />
              </div>
              <motion.div
                className="seal"
                initial={{ scale: 0.25, rotate: -18, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 340, damping: 13, mass: 0.9 }}
              >
                <svg viewBox="0 0 80 80" width="84" height="84" aria-hidden="true">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="var(--red)" strokeWidth="2.6" />
                  <circle cx="40" cy="40" r="26" fill="none" stroke="var(--red)" strokeWidth="1.1" opacity=".55" />
                  <text
                    x="40"
                    y="50"
                    textAnchor="middle"
                    fontSize="24"
                    fontWeight="700"
                    fontFamily="Georgia,'Songti SC','Noto Serif SC','SimSun',serif"
                    fill="var(--red)"
                  >
                    记
                  </text>
                </svg>
              </motion.div>
            </div>
            <p>给刚才的一小步，一点回响。</p>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="reward-angel-stage">
              <img className="reward-angel" src={angelAsset} alt="" aria-hidden="true" />
            </div>
            <h2>{reward.title}</h2>
            <p className="reward-description">{reward.description}</p>
            <p className="reward-origin">
              {reward.completionId !== "exchange" && <>来自「{reward.source}」</>}
            </p>
            {reward.status === "pending" ? (
              <>
                {(last || flipping) && (
                  <div className="coin-result">
                    <motion.div
                      className="coin-material"
                      animate={
                        flipping && !reduced
                          ? { rotateY: [0, 720, last === "heads" ? 1440 : 1620], y: [0, -16, 0] }
                          : { rotateY: last === "heads" ? 0 : 180, y: 0 }
                      }
                      transition={{ duration: 1.05, ease: "easeInOut" }}
                    >
                      <img
                        className="coin-side coin-side-eagle"
                        src="/assets/coin/liberty-eagle.png"
                        alt=""
                        aria-hidden="true"
                      />
                      <img
                        className="coin-side coin-side-portrait"
                        src="/assets/coin/liberty-portrait.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </motion.div>
                    <output aria-live="polite">
                      {flipping
                        ? "硬币翻转中…"
                        : `${last === "heads" ? "正面" : "反面"}`}
                    </output>
                    <p>
                      {flipping
                        ? "留意你正在期待哪一面。"
                        : "这个结果，让你松了口气，还是有点不甘心？"}
                    </p>
                  </div>
                )}
                {!last && (
                  <p className="coin-invitation">
                    想要就收下；
                    <br />
                    拿不准，再问一次硬币。
                  </p>
                )}
                {reward.coins.length === 2 && !flipping && (
                  <p className="coin-history">
                    两次结果：
                    {reward.coins.map((c) => (c === "heads" ? "正面" : "反面")).join(" / ")}
                    <br />
                    两次为止，决定仍在你。
                  </p>
                )}
                <div className="journey-actions">
                  <button
                    className="primary-button"
                    disabled={flipping}
                    onClick={() => update((s) => decideReward(s, reward.id, "kept"))}
                  >
                    收下这份奖励
                  </button>
                  {reward.coins.length < 2 && (
                    <button className="outline-button" disabled={flipping} onClick={flip}>
                      <SymbolIcon />
                      {last ? "再掷一次" : "掷硬币"}
                    </button>
                  )}
                  {last && (
                    <button
                      className="quiet-button"
                      disabled={flipping}
                      onClick={() => update((s) => decideReward(s, reward.id, "released"))}
                    >
                      这次先放下
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="resolution">
                  {reward.status === "kept"
                    ? "已收下，随时可以兑现。"
                    : reward.status === "released"
                      ? "已放下，行动记录仍保留。"
                      : "已兑现，慢慢享受。"}
                </p>
                <div className="journey-actions">
                  <button
                    className="primary-button"
                    onClick={reward.status === "kept" ? onToRewards : onClose}
                  >
                    {reward.status === "kept" ? "去看看奖励" : "回到清单"}
                  </button>
                  <button className="quiet-button" onClick={onClose}>
                    继续今天
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function ActionForm({
  draft,
  setDraft,
  onSave,
  onArchive,
}: {
  draft: Action;
  setDraft: (a: Action) => void;
  onSave: () => void;
  onArchive?: () => void;
}) {
  const keyboard = useKeyboard();
  return (
    <form
      className="paper-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Field label="行动名称">
        <KeyboardInput
          value={draft.title}
          placeholder="例如：练一首喜欢的曲子"
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          required
        />
      </Field>
      <Field label="今天做到哪里就够了">
        <KeyboardTextarea
          value={draft.minimum}
          placeholder="写一个足够小的完成标准"
          onChange={(e) => setDraft({ ...draft, minimum: e.target.value })}
          required
        />
      </Field>
      <div className="form-grid">
        <Field label="分组">
          <select
            value={draft.group}
            onFocus={() => keyboard.hide()}
            onChange={(e) => setDraft({ ...draft, group: e.target.value as Group })}
          >
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="行动方式">
          <select
            value={draft.kind}
            onFocus={() => keyboard.hide()}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value as Action["kind"] })}
          >
            <option value="habit">每日行动</option>
            <option value="todo">一次行动</option>
          </select>
        </Field>
        <Field label="安排日期">
          <KeyboardInput
            type="date"
            value={draft.due}
            onChange={(e) => setDraft({ ...draft, due: e.target.value })}
          />
        </Field>
        <Field label="优先级">
          <select
            value={draft.priority}
            onFocus={() => keyboard.hide()}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value as Action["priority"] })}
          >
            {["普通", "中", "高"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="计时（分钟，0 为不计时）">
        <KeyboardInput
          type="number"
          min={0}
          max={180}
          value={draft.minutes}
          onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })}
        />
      </Field>
      <Field label="小步骤（每行一个，可选）">
        <KeyboardTextarea
          value={draft.steps.join("\n")}
          onChange={(e) =>
            setDraft({ ...draft, steps: e.target.value ? e.target.value.split("\n") : [] })
          }
        />
      </Field>
      <p className="field-help">
        小步骤只记进度；完成行动获得 XP。新行动次日可启程。
      </p>
      <button className="primary-button full-width" type="submit">
        保存行动
      </button>
      {onArchive && (
        <button type="button" className="quiet-button full-width" onClick={onArchive}>
          归档这条行动
        </button>
      )}
    </form>
  );
}
function TemplateForm({
  draft,
  existing,
  setDraft,
  onSave,
}: {
  draft: Template;
  existing: boolean;
  setDraft: (t: Template) => void;
  onSave: () => void;
}) {
  return (
    <form
      className="paper-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Field label="奖励名称">
        <KeyboardInput
          required
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </Field>
      <Field label="为什么期待它">
        <KeyboardTextarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </Field>
      <Field label="星级">
        <select
          value={draft.rarity}
          disabled={existing}
          onChange={(e) => setDraft({ ...draft, rarity: Number(e.target.value) as 3 | 4 | 5 })}
        >
          <option value={3}>三星 · 微体验</option>
          <option value={4}>四星 · 生活体验</option>
          <option value={5}>五星 · 当前星愿</option>
        </select>
      </Field>
      <div className="form-grid">
        <Field label="预计时长（分钟）">
          <KeyboardInput
            type="number"
            min={1}
            value={draft.minutes}
            onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })}
          />
        </Field>
        <Field label="预计费用（元）">
          <KeyboardInput
            type="number"
            min={0}
            value={draft.cost}
            onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })}
          />
        </Field>
      </div>
      <button className="primary-button full-width">保存奖励</button>
    </form>
  );
}
function Rules({ mode }: { mode: AppMode }) {
  return (
    <div className="rules">
      <h2>行动先发生，好运随后来。</h2>
      <p>
        完成整条行动，固定获得 24 XP。小步骤只记录进度。
        {mode === "demo"
          ? "当前为体验模式，新行动可立即启程，不受每日上限影响。示例奖励不会推进保底。"
          : "每天前 5 个符合条件的行动可以启程，新建行动从次日开始。超过上限仍获得 XP。"}
      </p>
      <SectionLabel title="每一次启程" />
      <dl>
        {[
          ["五星基础概率", "1%"],
          ["四星基础概率", "5.1%"],
          ["五星软保底", "第 36 次起，每次 +10%"],
          ["五星硬保底", "第 45 次必得"],
          ["四星以上保底", "每 10 次至少一次"],
        ].map(([a, b]) => (
          <div key={a}>
            <dt>{a}</dt>
            <dd>{b}</dd>
          </div>
        ))}
      </dl>
      <SectionLabel title="决定仍然属于你" />
      <p>
        正反面各
        50%。最多掷两次，结果保存后不会重掷；无论硬币怎么说，都可以收下或放下。放下奖励不会扣除 XP
        。
      </p>
      <p>没有连续签到要求，没有错过惩罚，也不会让基本生活需求取决于随机。</p>
    </div>
  );
}
function TemplateRow({
  template,
  activeWish,
  onEdit,
  extra,
}: {
  template: Template;
  activeWish?: boolean;
  onEdit: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className={`template-row ${activeWish ? "active-wish" : ""}`}>
      <button onClick={onEdit}>
        <StarIcon className={`rarity rarity-${template.rarity}`} />
        <div>
          <h2>{template.title}</h2>
          <p>
            {template.minutes} 分钟 · {template.cost ? `¥${template.cost}` : "不花钱"}
            {activeWish ? " · 当前星愿" : ""}
          </p>
        </div>
        <ChevronRightIcon />
      </button>
      {extra}
    </div>
  );
}
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="icon-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
function SectionLabel({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="section-label">
      <span>{title}</span>
      {detail && <small>{detail}</small>}
      <hr />
    </div>
  );
}
function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function Empty({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
