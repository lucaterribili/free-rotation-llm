import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KeyRound, LogOut, Menu, MoreHorizontal, RefreshCw, Search, Settings, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthGate, ChangeCredentialsModal } from '@/components/auth-gate'
import { CommandPalette } from '@/components/command-palette'
import { openCommandPalette } from '@/components/command-palette-state'
import { ErrorBoundary } from '@/components/error-boundary'
import { SettingsDialog } from '@/components/settings-dialog'
import { UpdatesDialog } from '@/components/updates-dialog'
import { OPEN_UPDATES_EVENT } from '@/lib/updates'
import { Toaster } from '@/components/toaster'
import { UpdateReminder } from '@/components/update-reminder'
import { NewBuildPrompt } from '@/components/new-build-prompt'
import { usePremium } from '@/hooks/use-premium'
import { I18nProvider, useI18n } from '@/i18n'
import { logout } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { ThemeProvider } from '@/theme'
import KeysPage from '@/pages/KeysPage'
import PlaygroundPage from '@/pages/PlaygroundPage'
import FallbackPage from '@/pages/FallbackPage'
import ModelDetailPage from '@/pages/ModelDetailPage'
import FusionPage from '@/pages/FusionPage'
import EmbeddingsPage from '@/pages/EmbeddingsPage'
import ImagePage from '@/pages/ImagePage'
import VideoPage from '@/pages/VideoPage'
import AudioPage from '@/pages/AudioPage'
import SearchPage from '@/pages/SearchPage'
import DecisionPage from '@/pages/DecisionPage'
import MediaDetailPage from '@/pages/MediaDetailPage'
import EmbeddingDetailPage from '@/pages/EmbeddingDetailPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import LogsPage from '@/pages/LogsPage'
import PremiumPage from '@/pages/PremiumPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AgentsPage from '@/pages/AgentsPage'

// Every failed mutation surfaces as an error toast, so no action fails
// silently. A page that already shows the failure inline can opt out with
// `meta: { silenceToast: true }` on the mutation.
const queryClient = new QueryClient({
  // staleTime dedupes the mount storm (#1047) and keeps page-to-page
  // navigation off the network: the Models page alone mounts ~13 queries,
  // several of them the same endpoint from different components, and
  // staleTime 0 refetched every one of them on every navigation and window
  // focus. Cached data renders immediately either way; this only decides
  // whether a background refetch follows. Thirty seconds is shorter than any
  // poller here (refetchInterval still fires on its own clock), and mutations
  // invalidate explicitly, so nothing user-visible goes stale.
  defaultOptions: { queries: { staleTime: 30_000 } },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silenceToast) return
      toast.error(error instanceof Error ? error.message : String(error))
    },
  }),
})

const navItems = [
  { to: '/models', labelKey: 'nav.models' },
  { to: '/playground', labelKey: 'nav.playground' },
  { to: '/keys', labelKey: 'nav.keys' },
  { to: '/agents', labelKey: 'nav.agents' },
  { to: '/analytics', labelKey: 'nav.analytics' },
  { to: '/premium', labelKey: 'nav.premium' },
]

// The modality pages behind "Models"; surfaced in the nav dropdown and
// the mobile submenu so Fusion/Embeddings/Image/Audio are discoverable without
// first landing on the chat table.
const modelItems = [
  { to: '/models/chat', labelKey: 'models.chatModelsTab' },
  { to: '/models/image', labelKey: 'models.imageTab' },
  { to: '/models/video', labelKey: 'models.videoTab' },
  { to: '/models/audio', labelKey: 'models.audioTab' },
  { to: '/models/embeddings', labelKey: 'models.embeddingsTab' },
  { to: '/models/decision', labelKey: 'decision.tab' },
  { to: '/models/search', labelKey: 'search.tab' },
  { to: '/models/fusion', labelKey: 'models.fusionTab' },
]

// The pages that hang off "Analytics". Logs is reachable only from here — it is
// deliberately kept out of navItems so the top bar does not grow a seventh entry.
const analyticsItems = [
  { to: '/analytics', labelKey: 'nav.analytics' },
  { to: '/logs', labelKey: 'nav.logs' },
]

// Nav entries rendered as a split control: the label still navigates, and a
// chevron (desktop) / submenu (mobile) reveals the pages behind it. Keyed by the
// nav entry's `to` so both branches below stay one lookup, not two hardcoded
// special cases.
const navMenus: Record<
  string,
  { ariaKey: string; items: { to: string; labelKey: string }[]; isActive: (pathname: string) => boolean }
> = {
  '/models': {
    ariaKey: 'nav.modelsMenu',
    items: modelItems,
    isActive: (pathname) => pathname.startsWith('/models'),
  },
  '/analytics': {
    ariaKey: 'nav.analyticsMenu',
    items: analyticsItems,
    isActive: (pathname) => pathname.startsWith('/analytics') || pathname.startsWith('/logs'),
  },
}

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

function SideLink({ to, index, children }: { to: string; index: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-baseline gap-3 py-1.5 pl-3 text-[0.95rem] transition-colors',
          isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 transition-colors',
              isActive ? 'bg-brand' : 'bg-transparent group-hover:bg-border',
            )}
          />
          <span className="eyebrow w-5 shrink-0 tabular-nums">{index}</span>
          {children}
        </>
      )}
    </NavLink>
  )
}

function SubLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'block py-1 pl-11 text-[0.8125rem] transition-colors',
          isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  )
}

function Brand() {
  return (
    <Link to="/" className="block transition-opacity hover:opacity-75">
      <span className="font-heading text-[1.4rem] leading-[1.05] tracking-tight">
        Free Rotation
        <br />
        LLM Provider
      </span>
    </Link>
  )
}

// True when the dashboard runs inside the desktop shell (Electron preload
// sets this). The navbar then doubles as the window title bar: draggable,
// padded for the macOS traffic lights, and without the web-only Sign out.
const isDesktopApp = typeof window !== 'undefined'
  && (window as Window & { __FREEAPI_DESKTOP__?: boolean }).__FREEAPI_DESKTOP__ === true

const desktopPlatform = typeof window !== 'undefined'
  ? (window as Window & { __FREEAPI_PLATFORM__?: string }).__FREEAPI_PLATFORM__
  : undefined

const isMacDesktop = isDesktopApp && (
  desktopPlatform ? desktopPlatform === 'darwin' : (typeof navigator !== 'undefined' && /Macintosh|Mac OS X/.test(navigator.userAgent))
)

// The preload's own early classList.add can be lost (it may run before this
// document exists), so the client claims the class itself at module load —
// before the first React paint — keeping html.desktop CSS (transparent body,
// glass backdrop on macOS) reliable.
if (isDesktopApp) {
  document.documentElement.classList.add('desktop')
  if (isMacDesktop) {
    document.documentElement.classList.add('desktop-mac')
  }
}

function AccountMenuItems({
  showUpgrade,
  upgradeLabel,
  settingsLabel,
  updatesLabel,
  signOutLabel,
  changeEmailLabel,
  changePasswordLabel,
  onUpgrade,
  onOpenSettings,
  onOpenUpdates,
  onChangeEmail,
  onChangePassword,
}: {
  showUpgrade: boolean
  upgradeLabel: string
  settingsLabel: string
  updatesLabel: string
  signOutLabel: string
  changeEmailLabel: string
  changePasswordLabel: string
  onUpgrade: () => void
  onOpenSettings: () => void
  onOpenUpdates: () => void
  onChangeEmail: () => void
  onChangePassword: () => void
}) {
  return (
    <>
      {showUpgrade && (
        <DropdownMenuItem onClick={onUpgrade}>
          <Sparkles />
          {upgradeLabel}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onOpenSettings}>
        <Settings />
        {settingsLabel}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onOpenUpdates}>
        <RefreshCw />
        {updatesLabel}
      </DropdownMenuItem>
      {/* Desktop signs in with a hidden local account, so it has no credentials
          to change and no session to end. */}
      {!isDesktopApp && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onChangeEmail}>
            <span className="flex size-4 items-center justify-center font-serif text-xs font-bold">@</span>
            {changeEmailLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onChangePassword}>
            <KeyRound />
            {changePasswordLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut />
            {signOutLabel}
          </DropdownMenuItem>
        </>
      )}
    </>
  )
}

function Navbar() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [updatesOpen, setUpdatesOpen] = useState(false)
  // The update pill lives outside the navbar; it asks for this dialog by event.
  useEffect(() => {
    const open = () => setUpdatesOpen(true)
    window.addEventListener(OPEN_UPDATES_EVENT, open)
    return () => window.removeEventListener(OPEN_UPDATES_EVENT, open)
  }, [])
  const [credentialsMode, setCredentialsMode] = useState<'password' | 'email' | null>(null)
  const { data: premium, licensed, isLoading: premiumLoading, isError: premiumError } = usePremium()
  const showUpgrade = Boolean(premium) && !licensed && !premiumLoading && !premiumError

  const accountItems = (
    <AccountMenuItems
      showUpgrade={showUpgrade}
      upgradeLabel={t('nav.upgrade')}
      settingsLabel={t('nav.settings')}
      updatesLabel={t('settings.checkForUpdates')}
      signOutLabel={t('nav.signOut')}
      changeEmailLabel={t('auth.changeEmail')}
      changePasswordLabel={t('auth.changePassword')}
      onUpgrade={() => navigate('/premium')}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenUpdates={() => setUpdatesOpen(true)}
      onChangeEmail={() => setCredentialsMode('email')}
      onChangePassword={() => setCredentialsMode('password')}
    />
  )
  const noDrag = isDesktopApp ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) : undefined

  return (
    <>
      {/* Desktop and tablet: a fixed sidebar. The sub-pages of a section open
          under it while the section is active, so nothing hides in a dropdown. */}
      <aside
        className="hidden shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-dvh md:w-64"
        style={isDesktopApp ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties) : undefined}
      >
        <div className={cn('px-6 pb-8 pt-9', isMacDesktop && 'pt-14')}>
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" style={noDrag}>
          {navItems.map((item, index) => {
            const menu = navMenus[item.to]
            const open = menu?.isActive(location.pathname)
            return (
              <div key={item.to}>
                <SideLink to={item.to} index={String(index + 1).padStart(2, '0')}>
                  {t(item.labelKey)}
                </SideLink>
                {menu && open && (
                  <div className="mb-1">
                    {menu.items.map((entry) => (
                      <SubLink key={entry.to} to={entry.to}>
                        {t(entry.labelKey)}
                      </SubLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="space-y-0.5 border-t p-3" style={noDrag}>
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label={t('palette.title')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-3.5" />
            <span className="flex-1">{t('palette.title')}</span>
            <kbd className="eyebrow">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t('nav.openMenu')}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="size-3.5" />
              <span className="flex-1">{t('nav.settings')}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {accountItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Phones: a slim top bar with the brand and the same sections in a menu. */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden"
        style={isDesktopApp ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties) : undefined}
      >
        <Brand />
        <div style={noDrag}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
              aria-label={t('nav.openMenu')}
            >
              <Menu />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                {navItems.map((item) => {
                  const menu = navMenus[item.to]
                  return menu ? (
                    <DropdownMenuSub key={item.to}>
                      <DropdownMenuSubTrigger
                        className={menu.isActive(location.pathname) ? 'bg-accent text-accent-foreground font-medium' : undefined}
                      >
                        {t(item.labelKey)}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {menu.items.map((entry) => (
                          <DropdownMenuItem key={entry.to} onClick={() => navigate(entry.to)}>
                            {t(entry.labelKey)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ) : (
                    <DropdownMenuItem
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      className={location.pathname === item.to ? 'bg-accent text-accent-foreground font-medium' : undefined}
                    >
                      {t(item.labelKey)}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {accountItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UpdatesDialog open={updatesOpen} onOpenChange={setUpdatesOpen} />
      {credentialsMode && (
        <ChangeCredentialsModal mode={credentialsMode} onClose={() => setCredentialsMode(null)} />
      )}
    </>
  )
}

// Keyed by pathname so navigating away from a crashed page resets the boundary.
function PageBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>
}

// Routes that own the whole viewport instead of sitting in the shell's centred,
// padded column. Only the Playground so far: its three columns run edge to edge
// and the transcript scrolls inside its own pane, so the page must be exactly
// as tall as what is left under the navbar — not a centred card with margins.
const FULL_BLEED_ROUTES = new Set(['/playground'])

// The shell's content container. A full-bleed route drops the max-width and the
// padding and becomes a flex child that fills the rest of the screen; every
// other route gets a centred column that is always exactly max-w-6xl wide.
//
// `w-full` is load-bearing, not decoration. This <main> is an item of a COLUMN
// flex container, so its cross axis is the horizontal one — and flexbox only
// stretches an item across the cross axis when neither cross-axis margin is
// auto (CSS Flexbox §9.6). `mx-auto` sets both, so without an explicit width
// the column shrink-to-fits its content instead: the page is only ever as wide
// as the widest thing that has finished rendering. On a page that fills in from
// several independent queries — Analytics fires ten — that turns every arriving
// response into a visible horizontal jump as the column re-fits, and pages
// whose content never reaches 72rem (Analytics, Premium) settle narrower than
// they were designed to be. A definite width makes the column 72rem from the
// first paint, and `mx-auto` goes back to only centring it.
function PageContainer({ children }: { children: ReactNode }) {
  const location = useLocation()
  const fullBleed = FULL_BLEED_ROUTES.has(location.pathname)
  return (
    <main className={fullBleed ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto w-full max-w-6xl px-6 py-10 md:px-12 md:py-12'}>
      {children}
    </main>
  )
}

// The shell column. Padded routes keep `min-h-screen` and scroll as a document;
// a full-bleed route pins the shell to the dynamic viewport instead, because
// min-height alone is a floor, not a ceiling: with an indefinite shell height
// every flex-1 container below grows with its content and the document scrolls
// rather than the one pane (the Playground transcript) that means to.
function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const fullBleed = FULL_BLEED_ROUTES.has(location.pathname)
  return (
    <div className={`flex flex-col md:flex-row ${fullBleed ? 'h-dvh overflow-hidden' : 'min-h-screen'} ${isMacDesktop ? 'desktop-backdrop' : ''}`}>
      {children}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AuthGate>
              {/* Column, so a full-bleed route can claim the height the navbar
                  leaves without anyone having to know how tall the navbar is.
                  Fixed-position children (toaster, palette, reminder) are out of
                  flow, and a padded route stretches to nothing it can show. */}
              <AppShell>
                <Navbar />
                {/* The content column: everything right of the sidebar. */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <PageContainer>
                  <PageBoundary>
                    <Routes>
                      <Route path="/" element={<Navigate to="/models/chat" replace />} />
                      <Route path="/models" element={<Navigate to="/models/chat" replace />} />
                      <Route path="/models/chat" element={<FallbackPage />} />
                      <Route path="/models/chat/:id" element={<ModelDetailPage />} />
                      <Route path="/models/fusion" element={<FusionPage />} />
                      <Route path="/models/embeddings" element={<EmbeddingsPage />} />
                      <Route path="/models/embeddings/:id" element={<EmbeddingDetailPage />} />
                      <Route path="/models/image" element={<ImagePage />} />
                      <Route path="/models/image/:id" element={<MediaDetailPage modality="image" />} />
                      <Route path="/models/video" element={<VideoPage />} />
                      <Route path="/models/video/:id" element={<MediaDetailPage modality="video" />} />
                      <Route path="/models/audio" element={<AudioPage />} />
                      <Route path="/models/audio/:id" element={<MediaDetailPage modality="audio" />} />
                      <Route path="/models/transcription/:id" element={<MediaDetailPage modality="transcription" />} />
                      <Route path="/models/search" element={<SearchPage />} />
                      <Route path="/models/decision" element={<DecisionPage />} />
                      <Route path="/playground" element={<PlaygroundPage />} />
                      <Route path="/keys" element={<KeysPage />} />
                      <Route path="/agents" element={<AgentsPage />} />
                      <Route path="/fallback" element={<Navigate to="/models/chat" replace />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/logs" element={<LogsPage />} />
                      <Route path="/premium" element={<PremiumPage />} />
                      <Route path="/test" element={<Navigate to="/playground" replace />} />
                      <Route path="/health" element={<Navigate to="/keys" replace />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </PageBoundary>
                </PageContainer>
                </div>
                <Toaster />
                <CommandPalette />
                <UpdateReminder />
                <NewBuildPrompt />
              </AppShell>
            </AuthGate>
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
