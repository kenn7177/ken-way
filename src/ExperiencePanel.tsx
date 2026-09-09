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
          <h2 id="experience-panel-title">分享一次体验</h2>
          <p>让朋友体验一次行动与奖励。</p>
        </div>
        <div className="experience-panel__card">
          <span className="experience-panel__card-label">示例体验</span>
          <p>示例数据与个人记录分开。</p>
          <button className="primary-button" type="button" onClick={onEnter}><EnterIcon />进入体验</button>
        </div>
        <div className="experience-panel__share">
          <div>
            <strong>分享链接</strong>
            {localOnly && <p>链接目前只在这台电脑上可用。</p>}
          </div>
          <button className="outline-button" type="button" onClick={copyLink} aria-label="复制体验链接">
            {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}{copyState === 'copied' ? '已复制' : '复制链接'}
          </button>
        </div>
        {(copyState === 'failed' || copyState === 'copied') && (
          <p className="experience-panel__status" role="status">
            {copyState === 'copied' ? '链接已复制' : '复制未完成，可以长按或手动选择下面的链接。'}
          </p>
        )}
        {copyState === 'failed' && <p className="experience-panel__url" tabIndex={0}>{demoUrl}</p>}
        <button className="quiet-button experience-panel__quiet" type="button" onClick={onExit}><ExitIcon />关闭</button>
      </section>
    )
  }

  return (
    <section className="experience-panel" aria-labelledby="experience-panel-title">
      <div className="experience-panel__heading">
        <span className="experience-panel__eyebrow">体验模式</span>
        <h2 id="experience-panel-title">先试一小段</h2>
        <p>示例数据可补充或重置，不影响个人记录。</p>
      </div>
      <div className="experience-panel__demo-actions">
        <button className="primary-button experience-panel__primary--glow" type="button" onClick={onRefill}><ReloadIcon />补充示例奖励</button>
        <p>补充各星级示例奖励，不推进保底。</p>
      </div>
      <div className="experience-panel__reset">
        {!confirming ? (
          <button className="outline-button" type="button" onClick={() => setConfirming(true)}>重新开始体验</button>
        ) : (
          <div className="experience-panel__confirm" role="group" aria-describedby="experience-panel-reset-description">
            <strong>确认重新开始体验？</strong>
            <span id="experience-panel-reset-description">当前示例数据会被清空。</span>
            <div>
              <button className="outline-button" type="button" onClick={() => setConfirming(false)}>取消</button>
              <button className="primary-button" type="button" onClick={() => { setConfirming(false); onReset() }}>确认重新开始</button>
            </div>
          </div>
        )}
      </div>
      <button className="quiet-button experience-panel__quiet" type="button" onClick={onExit}><ExitIcon />退出体验</button>
    </section>
  )
}
