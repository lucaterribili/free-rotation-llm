import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n'

// Modality tabs shared by the Models pages. From md up the sidebar already lists
// these pages under "Models", so the tabs only show on phones.
// Industry-standard layout: one "Models" section, modality as a tab — chat
// routing (cross-model fallback), embeddings routing (same-model,
// cross-provider fallback), and fusion (multi-model synthesis) are different
// machines behind one roof.
export function ModelsTabs() {
  const { t } = useI18n()
  const tab = (isActive: boolean) =>
    `-mb-px inline-flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 pt-1 text-sm transition-colors ${
      isActive ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
    }`
  return (
    <div className="flex max-w-full gap-5 overflow-x-auto border-b md:hidden [&>a]:shrink-0">
      <NavLink to="/models/chat" className={({ isActive }) => tab(isActive)}>{t('models.chatModelsTab')}</NavLink>
      <NavLink to="/models/image" className={({ isActive }) => tab(isActive)}>{t('models.imageTab')}</NavLink>
      <NavLink to="/models/video" className={({ isActive }) => tab(isActive)}>{t('models.videoTab')}</NavLink>
      <NavLink to="/models/audio" className={({ isActive }) => tab(isActive)}>{t('models.audioTab')}</NavLink>
      <NavLink to="/models/embeddings" className={({ isActive }) => tab(isActive)}>{t('models.embeddingsTab')}</NavLink>
      <NavLink to="/models/decision" className={({ isActive }) => tab(isActive)}>{t('decision.tab')}</NavLink>
      <NavLink to="/models/search" className={({ isActive }) => tab(isActive)}>{t('search.tab')}</NavLink>
      <NavLink to="/models/fusion" className={({ isActive }) => tab(isActive)}>{t('models.fusionTab')}</NavLink>
    </div>
  )
}
