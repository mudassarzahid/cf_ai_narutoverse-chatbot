import { useCallback, useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { UIMessage } from "@ai-sdk/react";
import { CharacterSelector } from "@/components/character-selector/CharacterSelector";
import { useCharacterSelection } from "@/hooks/useCharacterSelection";
import { useTheme } from "@/hooks/useTheme";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { DebugView } from "@/components/chat/DebugView";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useToggle } from "@/hooks/useToggle";

export default function Chat() {
  const { theme, toggleTheme } = useTheme();
  const [showDebug, toggleDebug] = useToggle(false);
  const [input, setInput] = useState("");

  const agent = useAgent({
    agent: "chat"
  });

  const {
    messages: agentMessages,
    clearHistory,
    status,
    sendMessage,
    stop
  } = useAgentChat<unknown, UIMessage<{ createdAt: string }>>({
    agent
  });

  const {
    selectedCharacter,
    isCharacterSelected,
    getCharacters,
    getCharacterDetails,
    selectCharacter,
    clearSelection
  } = useCharacterSelection(clearHistory);

  const handleAgentSubmit = useCallback(async () => {
    if (!input.trim() || !selectedCharacter) return;
    const message = input;
    setInput("");

    if (agentMessages.length === 0) {
      const characterResult = await getCharacterDetails(selectedCharacter.id);
      if (characterResult.character) {
        await sendMessage(
          {
            role: "system",
            parts: [
              {
                type: "text",
                text: `CHARACTER_CONTEXT: ${JSON.stringify({
                  id: characterResult.character.id,
                  name: characterResult.character.name,
                  personality: characterResult.character.personality
                })}`
              }
            ]
          },
          { body: {} }
        );
      }
    }

    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: message }]
      },
      {
        body: {
          annotations: {
            hello: "world"
          }
        }
      }
    );
  }, [
    input,
    selectedCharacter,
    agentMessages.length,
    getCharacterDetails,
    sendMessage
  ]);

  if (!isCharacterSelected) {
    return (
      <div className="h-[100vh] w-full">
        <CharacterSelector
          onCharacterSelect={selectCharacter}
          onGetCharacters={getCharacters}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  return (
    <div className="modern-bg flex h-[100vh] w-full items-center justify-center overflow-hidden p-4">
      <div className="glass shadow-2xl relative flex h-[calc(100vh-2rem)] w-full max-w-4xl animate-slide-in-up flex-col overflow-hidden rounded-2xl">
        <ChatHeader
          character={selectedCharacter}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClearHistory={clearHistory}
          onClearSelection={clearSelection}
          showDebug={showDebug}
          onToggleDebug={toggleDebug}
        />

        {showDebug && <DebugView messages={agentMessages} />}

        <MessageList messages={agentMessages} character={selectedCharacter} />

        <ChatInput
          input={input}
          onInputChange={setInput}
          onSubmit={handleAgentSubmit}
          status={status}
          onStop={stop}
        />
      </div>
    </div>
  );
}
