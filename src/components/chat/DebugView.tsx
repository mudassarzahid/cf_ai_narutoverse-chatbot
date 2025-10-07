import type { UIMessage } from '@ai-sdk/react'

interface DebugViewProps {
  messages: UIMessage[]
}

export function DebugView({ messages }: DebugViewProps) {
  return (
    <div className="border-b border-neutral-200 bg-neutral-450 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        Debug View
      </h3>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <pre
            key={m.id}
            className="overflow-scroll rounded border bg-neutral-450 p-2 text-xs dark:bg-neutral-900"
          >
            {JSON.stringify(m, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  )
}
