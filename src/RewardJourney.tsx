import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SymbolIcon } from "@radix-ui/react-icons";
import { decideReward, tossCoin, type Reward, type Store } from "./model";

type Update = (change: (state: Store) => Store) => Store | null;
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

export function RewardJourney({
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
  const stage = reveal
    ? "reveal"
    : reward.status !== "pending"
      ? "resolved"
      : reward.coins.length === 0
        ? "undecided"
        : reward.coins.length === 1
          ? "coin-result"
          : "second-coin";
  const [angelAsset] = useState(() => randomAngelAsset());
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = contentRef.current?.closest<HTMLElement>(".sheet-content");
    scroller?.scrollTo({ top: 0, behavior: "auto" });
  }, [reveal, reward.coins.length, reward.status]);
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
    <div className="journey-content" data-journey-stage={stage} ref={contentRef}>
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
            <div className="reward-angel-stage" aria-hidden={stage !== "undecided"}>
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
                    <div className="coin-result" aria-busy={flipping}>
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
                  <p className="coin-invitation">想收下就确认；拿不准，可掷一次硬币。</p>
                )}
                {reward.coins.length === 2 && !flipping && (
                  <p className="coin-history">
                    两次结果：{reward.coins.map((c) => (c === "heads" ? "正面" : "反面")).join(" / ")} · 决定仍在你。
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
                    {reward.status === "kept" ? "查看奖励" : "关闭"}
                  </button>
                  <button className="quiet-button" onClick={onClose}>
                    关闭
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