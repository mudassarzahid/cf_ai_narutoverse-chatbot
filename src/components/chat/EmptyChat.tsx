import { ChatIcon } from '@phosphor-icons/react'
import { Card } from '@/components/card/Card'
import type { Character } from '@/types'

interface EmptyChatProps {
  character: Character | null
}

export function EmptyChat({ character }: EmptyChatProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="glass hover-lift animate-fade-in mx-auto max-w-lg p-8">
        <div className="space-y-6 text-center">
          <div className="relative">
            <div className="shadow-lg inline-flex rounded-full bg-gradient-to-r from-[#F48120] to-[#FF6B35] p-4">
              <ChatIcon size={32} className="text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="gradient-text text-xl font-bold">
              Start a conversation with {character?.name}
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {character?.summary}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Ready to chat</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
