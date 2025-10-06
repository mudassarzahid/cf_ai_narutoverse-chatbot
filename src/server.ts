import { routeAgentRequest } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  streamText,
  type StreamTextOnFinishCallback,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet,
  type UIMessage
} from "ai";
import { cleanupMessages } from "./utils";
import { env } from "cloudflare:workers";
import { createWorkersAI } from "workers-ai-provider";

const workersai = createWorkersAI({ binding: env.AI });
const model = workersai("@cf/meta/llama-3.1-8b-instruct-fp8");

export class Chat extends AIChatAgent<Env> {
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        let cleanedMessages = cleanupMessages(this.messages);
        let characterContext: {
          id: number;
          name: string;
          personality: string;
        } | null = null;
        for (const message of cleanedMessages) {
          if (message.role === "system" && message.parts) {
            for (const part of message.parts) {
              if (
                part.type === "text" &&
                part.text.startsWith("CHARACTER_CONTEXT:")
              ) {
                try {
                  const contextData = JSON.parse(
                    part.text.replace("CHARACTER_CONTEXT:", "")
                  );
                  characterContext = {
                    id: contextData.id,
                    name: contextData.name,
                    personality: contextData.personality
                  };
                } catch (error) {
                  console.error("Error parsing character context:", error);
                }
              }
            }
          }
        }

        let ragContext = "";
        if (characterContext) {
          const latestUserMessage = cleanedMessages
            .filter((m) => m.role === "user")
            .pop();

          if (latestUserMessage?.parts) {
            const userText = latestUserMessage.parts
              .filter((part) => part.type === "text")
              .map((part) => (part as any).text)
              .join(" ");

            if (userText.trim()) {
              try {
                if (env.AI && env.VECTORIZE_INDEX) {
                  const embeddingResponse = await env.AI.run(
                    "@cf/baai/bge-base-en-v1.5",
                    {
                      text: [userText]
                    }
                  );

                  // @ts-ignore
                  if (embeddingResponse.data?.[0]) {
                    // @ts-ignore
                    const queryEmbedding = embeddingResponse.data[0];
                    const results = await env.VECTORIZE_INDEX.query(
                      queryEmbedding,
                      {
                        topK: 3,
                        returnMetadata: true,
                        filter: { characterId: characterContext.id }
                      }
                    );

                    if (results.matches.length > 0) {
                      const formattedResults = results.matches
                        .map((match: any) => `- ${match.metadata.text}`)
                        .join("\n");

                      ragContext = `\n\n**ADDITIONAL CONTEXT (for your reference only):**\n${formattedResults}`;

                      const ragContextMessage: UIMessage = {
                        id: `rag-context-${Date.now()}`,
                        role: "system",
                        parts: [
                          {
                            type: "text",
                            text: `RAG_CONTEXT_FETCHED:\n${formattedResults}`
                          }
                        ]
                      };
                      writer.write({
                        type: "data-message",
                        data: ragContextMessage
                      });
                      this.messages.push(ragContextMessage);
                      cleanedMessages.push(ragContextMessage);
                    }
                  }
                }
              } catch (error) {
                console.error("Error fetching RAG context:", error);
              }
            }
          }
        }

        const finalMessagesToModel = cleanedMessages.filter(
          (m) =>
            !(
              m.role === "system" &&
              m.parts?.[0]?.type === "text" &&
              (m.parts[0] as any).text?.startsWith("CHARACTER_CONTEXT:")
            ) &&
            !(
              m.role === "system" &&
              m.parts?.[0]?.type === "text" &&
              (m.parts[0] as any).text?.startsWith("RAG_CONTEXT_FETCHED:")
            )
        );

        if (finalMessagesToModel.length === 0) {
          return;
        }

        let systemPrompt = `You are a role-playing chatbot.`;
        if (characterContext) {
          systemPrompt = `You are ${characterContext.name}.
Respond as this character, embodying their personality: "${characterContext.personality}"
${ragContext}
Stay in character. Do not mention that you are an AI or roleplaying.`;
        }

        try {
          const result = streamText({
            system: systemPrompt,
            messages: convertToModelMessages(finalMessagesToModel),
            model,
            onFinish: onFinish as unknown as StreamTextOnFinishCallback<{}>
          });

          writer.merge(result.toUIMessageStream());
        } catch (error) {
          console.error("Error in streamText:", error);
          writer.write({
            type: "data-message",
            data: {
              id: `error-${Date.now()}`,
              role: "assistant",
              parts: [
                {
                  type: "text",
                  text: "I apologize, but I encountered an error. Please try again."
                }
              ]
            }
          });
        }
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    if (
      url.pathname === "/api/import-characters" &&
      request.method === "POST"
    ) {
      try {
        const characters: any[] = await request.json();
        if (!Array.isArray(characters) || characters.length === 0) {
          return Response.json(
            { error: "Request body must be a non-empty JSON array." },
            { status: 400 }
          );
        }

        const stmt = env.DB.prepare(
          "INSERT INTO characters (id, name, href, image_url, summary, personality, summarized_personality, data, data_length) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        const bindings = characters.map((char) =>
          stmt.bind(
            char.id,
            char.name,
            char.href,
            char.image_url,
            char.summary,
            char.personality,
            char.summarized_personality,
            JSON.stringify(char.data),
            char.data_length
          )
        );

        await env.DB.batch(bindings);

        return Response.json({ success: true, count: bindings.length });
      } catch (error: any) {
        console.error("Error importing characters:", error);
        return Response.json(
          { error: "Failed to import characters", message: error.message },
          { status: 500 }
        );
      }
    }

    if (url.pathname === "/api/characters") {
      try {
        const { results } = await env.DB.prepare(
          `
          SELECT id, name, summary, image_url FROM characters ORDER BY name
        `
        ).all();

        return Response.json({ characters: results || [] });
      } catch (error) {
        console.error("Error fetching characters:", error);
        return Response.json(
          { error: "Failed to fetch characters" },
          { status: 500 }
        );
      }
    }

    if (url.pathname.startsWith("/api/character/")) {
      try {
        const characterId = url.pathname.split("/").pop();
        if (!characterId) {
          return Response.json(
            { error: "Character ID is required" },
            { status: 400 }
          );
        }
        const character = await env.DB.prepare(
          `
          SELECT id, name, summary, image_url, personality FROM characters WHERE id = ?
        `
        )
          .bind(characterId)
          .first();

        if (!character) {
          return Response.json(
            { error: "Character not found" },
            { status: 404 }
          );
        }

        return Response.json({ character });
      } catch (error) {
        console.error("Error fetching character:", error);
        return Response.json(
          { error: "Failed to fetch character" },
          { status: 500 }
        );
      }
    }

    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) {
      return agentResponse;
    }
    return new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
