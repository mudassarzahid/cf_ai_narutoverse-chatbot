import {
  BugIcon,
  MoonIcon,
  SunIcon,
  TrashIcon,
  UserIcon
} from '@phosphor-icons/react'

import { Avatar } from '@/components/avatar/Avatar'
import { Button } from '@/components/button/Button'
import { Toggle } from '@/components/toggle/Toggle'
import type { Theme } from '@/hooks/useTheme'
import type { Character } from '@/types'

interface ChatHeaderProps {
  character: Character | null
  theme: Theme
  onToggleTheme: () => void
  onClearHistory: () => void
  onClearSelection: () => void
  showDebug: boolean
  onToggleDebug: () => void
}

export function ChatHeader({
  character,
  theme,
  onToggleTheme,
  onClearHistory,
  onClearSelection,
  showDebug,
  onToggleDebug
}: ChatHeaderProps) {
  return (
    <div className="glass sticky top-0 z-10 flex items-center gap-3 border-b border-white/20 px-6 py-4 backdrop-blur-md dark:border-white/10">
      <div className="flex-1">
        <div className="flex animate-slide-in-left items-center gap-3">
          <Avatar
            username={character?.name || 'Character'}
            image={character?.image_url}
            className="h-10 w-10 ring-2 ring-green-500 transition-all duration-300 hover:ring-green-400"
          />
          <div>
            <h2 className="gradient-text font-bold text-lg">
              {character?.name}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Online</p>
          </div>
        </div>
      </div>

      <div className="flex animate-slide-in-right items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-slate-200/80 px-3 py-1.5 backdrop-blur-sm dark:bg-slate-700/50">
          <BugIcon size={16} className="text-slate-700 dark:text-slate-300" />
          <Toggle
            toggled={showDebug}
            aria-label="Toggle debug mode"
            onClick={onToggleDebug}
          />
        </div>

        <Button
          variant="ghost"
          size="md"
          shape="circular"
          className="h-10 w-10 transition-all duration-300 hover:scale-110 hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? (
            <SunIcon size={20} className="text-orange-300" />
          ) : (
            <MoonIcon size={20} className="text-blue-400" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="md"
          shape="circular"
          className="h-10 w-10 transition-all duration-300 hover:scale-110 hover:bg-red-100 dark:hover:bg-red-900/30"
          onClick={onClearHistory}
        >
          <TrashIcon size={20} className="text-red-500 dark:text-red-400" />
        </Button>

        <Button
          variant="ghost"
          size="md"
          shape="circular"
          className="h-10 w-10 transition-all duration-300 hover:scale-110 hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
          onClick={onClearSelection}
        >
          <UserIcon size={20} className="text-slate-600 dark:text-slate-300" />
        </Button>
      </div>
    </div>
  )
}
