import type { ReactNode } from 'react'
import {
  ChevronRightIcon,
  DownloadIcon,
  InfoCircledIcon,
  MoonIcon,
  ReaderIcon,
  SymbolIcon,
} from '@radix-ui/react-icons'
import './settings-panels.css'

export type SettingsPanelProps = {
  dark: boolean
  silverPaper: boolean
  onToggleSilverPaper: () => void
  reduced: boolean
  mode: 'personal' | 'demo'
  onToggleDark: () => void
  onToggleReduced: () => void
  onExport: () => void
  onExperience: () => void
  onAbout: () => void
}

function SwitchRow({
  label,
  checked,
  onToggle,
  icon,
  description,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  icon: ReactNode
  description: string
}) {
  return (
    <button className="settings-panel__row" type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onToggle}>
      <span className="settings-panel__icon" aria-hidden="true">{icon}</span>
      <span className="settings-panel__copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <span className={`settings-panel__switch${checked ? ' is-on' : ''}`} aria-hidden="true">
        <span aria-hidden="true" />
      </span>
    </button>
  )
}

function ActionRow({
  label,
  icon,
  onClick,
  description,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  description: string
}) {
  return (
    <button className="settings-panel__row" type="button" onClick={onClick}>
      <span className="settings-panel__icon" aria-hidden="true">{icon}</span>
      <span className="settings-panel__copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <ChevronRightIcon className="settings-panel__chevron" aria-hidden="true" />
    </button>
  )
}

export function SettingsPanel({
  dark,
  silverPaper,
  onToggleSilverPaper,
  reduced,
  mode,
  onToggleDark,
  onToggleReduced,
  onExport,
  onExperience,
  onAbout,
}: SettingsPanelProps) {
  return (
    <section className="settings-panel" aria-label="设置选项">
      <div className="settings-panel__section" aria-label="设置选项">
        <SwitchRow label="银白纸面" description="用更轻的纸张纹理阅读" checked={silverPaper} onToggle={onToggleSilverPaper} icon={<ReaderIcon />} />
        <SwitchRow
          label="深色模式"
          description="在暗处保留舒适对比"
          checked={dark}
          onToggle={onToggleDark}
          icon={<MoonIcon />}
        />
        <SwitchRow
          label="减少动态效果"
          description="把转场改为即时反馈"
          checked={reduced}
          onToggle={onToggleReduced}
          icon={<SymbolIcon />}
        />
      </div>

      <div className="settings-panel__section" aria-label="设置选项">
        <ActionRow
          label={mode === 'demo' ? '导出体验记录' : '导出记录'}
          description="保存当前状态的副本"
          icon={<DownloadIcon />}
          onClick={onExport}
        />
        <ActionRow label="体验与分享" description="在独立示例数据中试用" icon={<ChevronRightIcon />} onClick={onExperience} />
        <ActionRow label="关于与规则" description="查看启程、保底与决定方式" icon={<InfoCircledIcon />} onClick={onAbout} />
      </div>
    </section>
  )
}
