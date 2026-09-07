import { resolveRarity, secureRandomInt, type PityState } from "./engine.ts";

export const STORAGE_KEY = "paper-actions:v1";
export type AppMode = "personal" | "demo";
export const groups = ["生活", "工作", "学习"] as const;
export type Group = (typeof groups)[number];
export type Action = {
  id: string;
  title: string;
  minimum: string;
  group: Group;
  kind: "habit" | "todo";
  due: string;
  priority: "高" | "中" | "普通";
  minutes: number;
  steps: string[];
  created: string;
  archived: boolean;
};
export type Completion = {
  id: string;
  actionId: string;
  day: string;
  title: string;
  eligible: boolean;
  used: boolean;
};
export type Template = {
  id: string;
  title: string;
  description: string;
  rarity: 3 | 4 | 5;
  minutes: number;
  cost: number;
  active: boolean;
};
export type Reward = {
  id: string;
  completionId: string;
  title: string;
  description: string;
  rarity: 3 | 4 | 5;
  date: string;
  status: "pending" | "kept" | "released" | "redeemed";
  coins: ("heads" | "tails")[];
  source: string;
  isExample?: boolean;
};
export type GlowRecord = {
  id: string;
  amount: number;
  source: string;
  date: string;
};
export type Store = {
  version: 1;
  actions: Action[];
  completions: Completion[];
  rewards: Reward[];
  templates: Template[];
  steps: Record<string, number[]>;
  timers: Record<string, number>;
  xp: number;
  glow: number;
  glowHistory?: GlowRecord[];
  pity: PityState;
  wishId: string;
  budget: number;
  trial: boolean;
  reduced: boolean;
  dark: boolean;
  silverPaper?: boolean;
  onboarded: boolean;
};

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dayOffset(amount: number, day = dayKey()): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}
export function id() {
  return crypto.randomUUID();
}
export function initialStore(day = dayKey()): Store {
  const seeds: [string, string, Group, Action["priority"], string, Action["kind"], string[]][] = [
    [
      "读完《设计中的设计》第三章",
      "认真读 5 页，记下一句有用的话",
      "学习",
      "高",
      dayOffset(-1, day),
      "todo",
      [],
    ],
    ["练一首喜欢的曲子", "慢慢弹完最想练的 8 小节", "生活", "中", day, "habit", []],
    [
      "跟着音乐跳一小段",
      "热身，再学会一个八拍",
      "生活",
      "普通",
      day,
      "habit",
      ["活动肩颈与脚踝", "练习一个八拍"],
    ],
    ["出门走走，让身体醒过来", "穿上鞋，走到街角再回来", "生活", "普通", day, "habit", []],
    [
      "把新想法记成一页",
      "写下一个问题和一个可行的小步骤",
      "工作",
      "普通",
      dayOffset(1, day),
      "todo",
      [],
    ],
    ["给自己留一段阅读时间", "翻开书，读完两页就好", "学习", "普通", "", "todo", []],
  ];
  const actions = seeds.map(
    ([title, minimum, group, priority, due, kind, steps], index): Action => ({
      id: `seed-${index}`,
      title,
      minimum,
      group,
      priority,
      due,
      kind,
      steps,
      minutes: 0,
      created: dayOffset(-2, day),
      archived: false,
    }),
  );
  return {
    version: 1,
    actions,
    completions: [],
    rewards: [],
    steps: {},
    timers: {},
    xp: 0,
    glow: 0,
    glowHistory: [],
    pity: { pullsSinceFive: 0, pullsSinceFourPlus: 0 },
    budget: 800,
    wishId: "wish-1",
    trial: false,
    reduced: false,
    dark: false,
    onboarded: true,
    templates: [
      {
        id: "micro-1",
        title: "放一首歌，什么也不做",
        description: "完整听完一首喜欢的歌。",
        rarity: 3,
        minutes: 5,
        cost: 0,
        active: true,
      },
      {
        id: "micro-2",
        title: "为自己泡一杯热茶",
        description: "把注意力放回手里的温度。",
        rarity: 3,
        minutes: 5,
        cost: 0,
        active: true,
      },
      {
        id: "micro-3",
        title: "到窗边看看远处",
        description: "离开屏幕，给眼睛与心情一个停顿。",
        rarity: 3,
        minutes: 3,
        cost: 0,
        active: true,
      },
      {
        id: "four-1",
        title: "去一家一直想去的咖啡馆",
        description: "找个靠窗的位置，留一小时给自己。",
        rarity: 4,
        minutes: 60,
        cost: 45,
        active: true,
      },
      {
        id: "four-2",
        title: "看一场喜欢的电影",
        description: "认真享受一个属于故事的晚上。",
        rarity: 4,
        minutes: 120,
        cost: 60,
        active: true,
      },
      {
        id: "wish-1",
        title: "给自己一个周末的小旅行",
        description: "去一座想去的小城，慢慢走、慢慢看。",
        rarity: 5,
        minutes: 480,
        cost: 500,
        active: true,
      },
    ],
  };
}
export function completed(store: Store, action: Action, day = dayKey()) {
  return store.completions.find(
    (entry) => entry.actionId === action.id && (action.kind === "todo" || entry.day === day),
  );
}
export function occurrence(action: Action, day = dayKey()) {
  return `${action.id}:${action.kind === "habit" ? day : "once"}`;
}
export function todayDraws(store: Store, day = dayKey()) {
  return store.rewards.filter((r) => r.date === day && r.completionId !== "exchange").length;
}
export function completeAction(
  store: Store,
  actionId: string,
  day = dayKey(),
  now = Date.now(),
  mode: AppMode = "personal",
): Store {
  const action = store.actions.find((a) => a.id === actionId && !a.archived);
  if (!action) throw new Error("这条行动已不在清单里。");
  if (completed(store, action, day)) return store;
  const key = occurrence(action, day);
  if ((store.steps[key]?.length ?? 0) < action.steps.length)
    throw new Error("先完成下面的小步骤，再记录整条行动。");
  if (action.minutes > 0 && (!store.timers[key] || store.timers[key] > now))
    throw new Error("计时还没有结束。");
  const next = structuredClone(store);
  const count =
    todayDraws(store, day) +
    store.completions.filter((c) => c.day === day && c.eligible && !c.used).length;
  next.completions.unshift({
    id: id(),
    actionId,
    title: action.title,
    day,
    eligible: mode === "demo" || (action.created < day && count < 5),
    used: false,
  });
  next.xp += 24;
  delete next.timers[key];
  return next;
}
export function drawReward(
  store: Store,
  completionId: string,
  day = dayKey(),
  roll = secureRandomInt(10000),
  pick = secureRandomInt(10000),
  mode: AppMode = "personal",
): Store {
  const completion = store.completions.find((c) => c.id === completionId);
  if (!completion || completion.used) return store;
  if (!completion.eligible || completion.day !== day)
    throw new Error("这次行动已记录。启程需要今天的有效资格。");
  if (mode !== "demo" && todayDraws(store, day) >= 5)
    throw new Error("今天的 5 次启程已经用完，行动仍然值得记录。");
  const result = resolveRarity(store.pity, roll);
  const pool = store.templates.filter(
    (t) => t.active && t.rarity === result.rarity && (result.rarity !== 5 || t.id === store.wishId),
  );
  if (!pool.length) throw new Error("先在奖励池中设置好这一星级的奖励。");
  const template = pool[pick % pool.length];
  const next = structuredClone(store);
  next.completions.find((c) => c.id === completionId)!.used = true;
  next.pity = result.pityAfter;
  next.glow += result.microGlowDelta;
  if (result.microGlowDelta > 0) {
    next.glowHistory = [
      {
        id: id(),
        amount: result.microGlowDelta,
        source: completion.title,
        date: day,
      },
      ...(next.glowHistory ?? []),
    ];
  }
  next.rewards.unshift({
    id: id(),
    completionId,
    title: template.title,
    description: template.description,
    rarity: result.rarity,
    date: day,
    status: "pending",
    coins: [],
    source: completion.title,
  });
  return next;
}
export function tossCoin(
  store: Store,
  rewardId: string,
  result: "heads" | "tails" = secureRandomInt(2) === 0 ? "heads" : "tails",
): Store {
  const reward = store.rewards.find((r) => r.id === rewardId);
  if (!reward || reward.status !== "pending" || reward.coins.length >= 2) return store;
  const next = structuredClone(store);
  next.rewards.find((r) => r.id === rewardId)!.coins.push(result);
  return next;
}
export function decideReward(store: Store, rewardId: string, decision: "kept" | "released"): Store {
  const reward = store.rewards.find((r) => r.id === rewardId);
  if (!reward || reward.status !== "pending") return store;
  const next = structuredClone(store);
  next.rewards.find((r) => r.id === rewardId)!.status = decision;
  return next;
}
export function redeemReward(store: Store, rewardId: string): Store {
  if (store.rewards.find((r) => r.id === rewardId)?.status !== "kept") return store;
  const next = structuredClone(store);
  next.rewards.find((r) => r.id === rewardId)!.status = "redeemed";
  return next;
}
export function exchangeReward(store: Store, templateId: string, day = dayKey()): Store {
  const template = store.templates.find((t) => t.id === templateId && t.active && t.rarity === 4);
  if (!template || store.glow < 800) throw new Error("兑换一份四星奖励需要 800 微光。");
  const next = structuredClone(store);
  next.glow -= 800;
  next.rewards.unshift({
    id: id(),
    completionId: "exchange",
    title: template.title,
    description: template.description,
    rarity: 4,
    date: day,
    status: "kept",
    coins: [],
    source: "800 微光兑换",
  });
  return next;
}
export function saveAction(store: Store, draft: Action): Store {
  if (!draft.title.trim() || !draft.minimum.trim())
    throw new Error("请填写行动名称和今天做到哪里。");
  if (!Number.isFinite(draft.minutes) || draft.minutes < 0 || draft.minutes > 180)
    throw new Error("计时请填写 0–180 分钟。");
  const next = structuredClone(store);
  const index = next.actions.findIndex((a) => a.id === draft.id);
  const sanitized = {
    ...draft,
    title: draft.title.trim(),
    minimum: draft.minimum.trim(),
    steps: draft.steps.map((s) => s.trim()).filter(Boolean),
  };
  if (index >= 0) next.actions[index] = sanitized;
  else next.actions.push(sanitized);
  return next;
}
export function saveTemplate(store: Store, draft: Template): Store {
  if (
    !draft.title.trim() ||
    !Number.isFinite(draft.cost) ||
    !validMoney(draft.cost) ||
    !Number.isFinite(draft.minutes) ||
    draft.minutes < 1
  )
    throw new Error("请填写奖励名称、有效时长和费用。");
  const existing = store.templates.find((template) => template.id === draft.id);
  if (existing && existing.rarity !== draft.rarity)
    throw new Error("已有奖励的星级不能更改，请新建一份奖励。");
  if (draft.id === store.wishId) {
    if (draft.rarity !== 5 || !draft.active)
      throw new Error("当前星愿必须是一份参与抽取的五星奖励。");
    if (draft.cost > store.budget)
      throw new Error("星愿费用超过本月预算，请先调整奖励池中的预算。");
  }
  const next = structuredClone(store);
  const index = next.templates.findIndex((t) => t.id === draft.id);
  if (index >= 0) next.templates[index] = draft;
  else next.templates.push(draft);
  return next;
}
export function loadStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialStore();
  const data = JSON.parse(raw) as Store;
  if (
    data.version !== 1 ||
    !Array.isArray(data.actions) ||
    !Array.isArray(data.completions) ||
    !Array.isArray(data.rewards) ||
    !Array.isArray(data.templates) ||
    !data.pity
  )
    throw new Error("本地记录无法读取。请先导出备份，避免覆盖原记录。");
  return { ...data, trial: false };
}

function validMoney(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
}

export function saveBudget(store: Store, amount: number): Store {
  if (!validMoney(amount)) throw new Error("请填写非负金额，最多保留两位小数。");
  const currentWish = store.templates.find((template) => template.id === store.wishId);
  if (currentWish && currentWish.cost > amount)
    throw new Error(`当前星愿需要 ¥${currentWish.cost}，请先调整星愿或提高预算。`);
  return { ...store, budget: amount };
}

export function activateWish(store: Store, templateId: string): Store {
  const template = store.templates.find((item) => item.id === templateId && item.rarity === 5 && item.active);
  if (!template) throw new Error("请选择一份参与抽取的五星星愿。");
  if (template.cost > store.budget)
    throw new Error("星愿费用超过本月预算，请先调整奖励池中的预算。");
  return { ...store, wishId: template.id };
}
