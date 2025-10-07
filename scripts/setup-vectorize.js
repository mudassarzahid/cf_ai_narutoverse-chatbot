import characterData from "../data/naruto-characters.json" with { type: "json" };

function chunkText(text, { chunkSize = 500, chunkOverlap = 50 } = {}) {
  if (typeof text !== "string" || !text) return [];
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - chunkOverlap;
  }
  return chunks;
}

function getDataForVectorization() {
  const itemsToVectorize = [];

  for (const character of characterData) {
    if (!character.id) continue;

    const { id: characterId, summary, personality, data } = character;

    const summaryChunks = chunkText(summary);
    summaryChunks.forEach((chunk, index) => {
      itemsToVectorize.push({
        id: `char:${characterId}:summary:${index}`,
        text: chunk,
        metadata: { characterId, text: chunk }
      });
    });

    const personalityChunks = chunkText(personality);
    personalityChunks.forEach((chunk, index) => {
      itemsToVectorize.push({
        id: `char:${characterId}:personality:${index}`,
        text: chunk,
        metadata: { characterId, text: chunk }
      });
    });

    if (Array.isArray(data)) {
      data.forEach((dataItem, dataIndex) => {
        const dataChunks = chunkText(dataItem.text);
        dataChunks.forEach((chunk, chunkIndex) => {
          itemsToVectorize.push({
            id: `char:${characterId}:data:${dataIndex}:${chunkIndex}`,
            text: chunk,
            metadata: { characterId, text: chunk }
          });
        });
      });
    }
  }

  return itemsToVectorize;
}

async function createEmbeddingsBatch(texts, env, batchSize = 50) {
  const allEmbeddings = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    console.log(
      `Creating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`
    );
    const response = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: batch
    });
    allEmbeddings.push(...response.data);
  }
  return allEmbeddings;
}

export async function setupVectorize(env) {
  const index = env.VECTORIZE_INDEX;
  if (!index) throw new Error("Vectorize binding 'VECTORIZE_INDEX' not found.");
  if (!env.AI) throw new Error("AI binding 'AI' not found.");

  try {
    console.log("Deleting all existing vectors...");
    let deletedCount = 0;
    let hasMore = true;
    while (hasMore) {
      const randomVector = Array(768).fill(0);
      const vectors = await index.query(randomVector, { topK: 100 });

      if (vectors.matches.length === 0) {
        hasMore = false;
        break;
      }

      const idsToDelete = vectors.matches.map((v) => v.id);
      await index.deleteByIds(idsToDelete);
      deletedCount += idsToDelete.length;
    }

    const dataToVectorize = getDataForVectorization();
    if (dataToVectorize.length === 0) {
      return { success: true, vectorsInserted: 0 };
    }

    console.log(`${dataToVectorize.length} total text chunks to vectorize`);
    const embeddings = await createEmbeddingsBatch(
      dataToVectorize.map((item) => item.text),
      env
    );

    const vectorsToInsert = dataToVectorize.map((item, i) => ({
      id: item.id,
      values: embeddings[i],
      metadata: item.metadata
    }));

    const batchSize = 100;
    for (let i = 0; i < vectorsToInsert.length; i += batchSize) {
      await index.upsert(vectorsToInsert.slice(i, i + batchSize));
      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectorsToInsert.length / batchSize)}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const describeResponse = await index.describe();

    return { success: true, vectorsInserted: describeResponse.vectors };
  } catch (error) {
    console.error("Error setting up Vectorize index:", error);
    throw error;
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const result = await setupVectorize(env);
      return new Response(
        JSON.stringify({
          message: "🎉 Vectorize index setup completed successfully!",
          ...result
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (e) {
      const errorDetails = e instanceof Error ? e.stack : String(e);
      console.error("Vectorize index setup failed:", errorDetails);
      return new Response(
        JSON.stringify({
          message: "Vectorize index setup failed.",
          error: e.message
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};

export { Chat } from "../src/server.js";
