import { CheckIcon, CopyIcon, EnterIcon, ExitIcon, ReloadIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import './settings-panels.css'

export type ExperiencePanelProps = {
  mode: 'personal' | 'demo'
  demoUrl: string
  localOnly: boolean
  onEnter: () => void
  onExit: () => void
  onRefill: () => void
  onReset: () => void
}

export function ExperiencePanel({ mode, demoUrl, localOnly, onEnter, onExit, onRefill, onReset }: ExperiencePanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [confirming, setConfirming] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(demoUrl)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  if (mode === 'personal') {
    return (
      <section className="experience-panel" aria-labelledby="experience-panel-title">
        <div className="experience-panel__heading">
          <span className="experience-panel__eyebrow">体验与分享</span>
          <h2 id="experience-panel-title">把这一程交给朋友</h2>
          <p>单独打开一份轻量示例，让对方感受一次从行动到收下奖励的过程。</p>
        </div>
        <div className="experience-panel__card">
          <span className="experience-panel__card-label">示例体验</span>
          <p>体验使用独立的示例数据，不会改变你的个人记录。</p>
          <button className="experience-panel__primary" type="button" onClick={onEnter}><EnterIcon />进入体验</button>
        </div>
        <div className="experience-panel__share">
          <div>
            <strong>分享链接</strong>
            <p>{localOnly ? '链接目前只在这台电脑上可用。' : '复制链接，邀请朋友一起试试。'}</p>
          </div>
          <button className="experience-panel__outline" type="button" onClick={copyLink} aria-label="复制体验链接">
            {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}{copyState === 'copied' ? '已复制' : '复制链接'}
          </button>
        </div>
        {(copyState === 'failed' || copyState === 'copied') && (
          <p className="experience-panel__status" role="status">
            {copyState === 'copied' ? '链接已复制到剪贴板。' : '复制未完成，可以长按或手动选择下面的链接。'}
          </p>
        )}
        {copyState === 'failed' && <p className="experience-panel__url" tabIndex={0}>{demoUrl}</p>}
        <button className="experience-panel__quiet" type="button" onClick={onExit}><ExitIcon />返回设置</button>
      </section>
    )
  }

  return (
    <section className="experience-panel" aria-labelledby="experience-panel-title">
      <div className="experience-panel__heading">
        <span className="experience-panel__eyebrow">体验模式</span>
        <h2 id="experience-panel-title">先试一小段</h2>
        <p>这里的内容是示例数据，可以随时补充或重新开始，不会影响个人记录。</p>
      </div>
      <div className="experience-panel__demo-actions">
        <button className="experience-panel__primary experience-panel__primary--glow" type="button" onClick={onRefill}><ReloadIcon />补充示例奖励与微光</button>
        <p>补充 3 / 4 / 5 示例奖励与 1600 示例微光，示例结果不会推进保底。</p>
      </div>
      <div className="experience-panel__reset">
        {!confirming ? (
          <button className="experience-panel__outline" type="button" onClick={() => setConfirming(true)}>重新开始体验</button>
        ) : (
          <div className="experience-panel__confirm" role="group" aria-describedby="experience-panel-reset-description">
            <strong>确认重新开始体验？</strong>
            <span id="experience-panel-reset-description">当前示例数据会被清空。</span>
            <div>
              <button className="experience-panel__outline" type="button" onClick={() => setConfirming(false)}>取消</button>
              <button className="experience-panel__primary" type="button" onClick={() => { setConfirming(false); onReset() }}>确认重新开始</button>
            </div>
          </div>
        )}
      </div>
      <button className="experience-panel__quiet" type="button" onClick={onExit}><ExitIcon />退出体验</button>
    </section>
  )
}
