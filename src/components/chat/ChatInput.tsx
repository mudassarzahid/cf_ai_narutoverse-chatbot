import { PaperPlaneTiltIcon, StopIcon } from '@phosphor-icons/react'
import type { ChatStatus } from 'ai'
import React from 'react'
import { Textarea } from '@/components/textarea/Textarea'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  status: ChatStatus
  onStop: () => void
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  status,
  onStop
}: ChatInputProps) {
  const isGenerating = status === 'submitted' || status === 'streaming'

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault()
    if (!input.trim()) return
    onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass absolute bottom-0 left-0 right-0 z-10 border-t border-white/20 p-4 backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Textarea
            placeholder="Send a message..."
            className="!text-base max-h-[calc(75dvh)] min-h-[24px] w-full resize-none overflow-hidden rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 pb-12 text-slate-900 ring-offset-background backdrop-blur-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-500 md:text-sm"
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault()
                handleSubmit(e)
                e.currentTarget.style.height = 'auto'
              }
            }}
            rows={1}
            style={{ height: 'auto' }}
          />
          <div className="absolute bottom-2 right-2 flex w-fit flex-row justify-end">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="shadow-lg inline-flex h-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-red-500 to-red-600 p-2.5 text-sm font-medium text-white ring-offset-background transition-all duration-300 hover:scale-110 hover:from-red-600 hover:to-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                aria-label="Stop generation"
              >
                <StopIcon size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="shadow-lg inline-flex h-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-slate-600 to-slate-700 p-2.5 text-sm font-medium text-white ring-offset-background transition-all duration-300 hover:scale-110 hover:from-slate-700 hover:to-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <PaperPlaneTiltIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
