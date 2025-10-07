import type { UIMessage } from '@ai-sdk/react'
import { useCallback, useEffect, useRef } from 'react'
import type { Character } from '@/types'
import { EmptyChat } from './EmptyChat'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: UIMessage[]
  character: Character | null
}

export function MessageList({ messages, character }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const visibleMessages = messages.filter((m) => m.role !== 'system')

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4 pb-24">
      {visibleMessages.length === 0 ? (
        <EmptyChat character={character} />
      ) : (
        visibleMessages.map((m) => <MessageBubble key={m.id} message={m} />)
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
