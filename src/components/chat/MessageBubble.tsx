import type { UIMessage } from "@ai-sdk/react";
import { Card } from "@/components/card/Card";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

interface MessageBubbleProps {
  message: UIMessage;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`animate-slide-in-up ${
        isUser ? "animate-slide-in-right" : "animate-slide-in-left"
      }`}
    >
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`flex min-w-0 max-w-[85%] gap-3 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {isUser && <div className="w-8 flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            {message.parts?.map((part, i) => {
              if (part.type !== "text") return null;
              return (
                <div key={i} className="min-w-0">
                  <Card
                    className={`message-bubble hover-lift relative min-w-0 break-words rounded-2xl p-4 shadow-lg ${
                      isUser
                        ? "rounded-br-md bg-gradient-to-r from-slate-600 to-slate-700 text-white"
                        : "glass rounded-bl-md text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <MemoizedMarkdown
                      id={`${message.id}-${i}`}
                      content={part.text}
                    />
                  </Card>
                  <p
                    className={`mt-2 px-1 text-xs text-slate-500 dark:text-slate-400 ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(
                      // @ts-ignore
                      message.metadata?.createdAt
                        ? // @ts-ignore
                          new Date(message.metadata.createdAt)
                        : new Date()
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
