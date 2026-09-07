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
}: {
  label: string
  checked: boolean
  onToggle: () => void
  icon: ReactNode
}) {
  return (
    <button className="settings-panel__row" type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onToggle}>
      <span className="settings-panel__icon" aria-hidden="true">{icon}</span>
      <span className="settings-panel__copy">
        <strong>{label}</strong>
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
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button className="settings-panel__row" type="button" onClick={onClick}>
      <span className="settings-panel__icon" aria-hidden="true">{icon}</span>
      <span className="settings-panel__copy">
        <strong>{label}</strong>
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
        <SwitchRow label="银白纸面" checked={silverPaper} onToggle={onToggleSilverPaper} icon={<ReaderIcon />} />
        <SwitchRow
          label="深色模式"
          checked={dark}
          onToggle={onToggleDark}
          icon={<MoonIcon />}
        />
        <SwitchRow
          label="减少动态效果"
          checked={reduced}
          onToggle={onToggleReduced}
          icon={<SymbolIcon />}
        />
      </div>

      <div className="settings-panel__section" aria-label="设置选项">
        <ActionRow
          label={mode === 'demo' ? '导出体验记录' : '导出记录'}
          icon={<DownloadIcon />}
          onClick={onExport}
        />
        <ActionRow label="体验与分享" icon={<ChevronRightIcon />} onClick={onExperience} />
        <ActionRow label="关于与规则" icon={<InfoCircledIcon />} onClick={onAbout} />
      </div>
    </section>
  )
}
