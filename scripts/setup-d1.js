import characterData from '../data/naruto-characters.json' with { type: 'json' }

const CHUNK_SIZE = 5

export default {
  async fetch(request, env, ctx) {
    try {
      const totalChunks = Math.ceil(characterData.length / CHUNK_SIZE)
      console.log(
        `Preparing to insert ${characterData.length} records in ${totalChunks} chunks.`
      )

      const stmt = env.DB.prepare(
        'INSERT INTO characters (id, name, href, image_url, summary, personality, summarized_personality, data, data_length) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )

      for (let i = 0; i < characterData.length; i += CHUNK_SIZE) {
        const chunk = characterData.slice(i, i + CHUNK_SIZE)
        const chunkNumber = i / CHUNK_SIZE + 1
        console.log(`Processing chunk ${chunkNumber} of ${totalChunks}...`)

        const bindings = chunk.map((char) =>
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
        )

        await env.DB.batch(bindings)
        console.log(`Successfully inserted chunk ${chunkNumber}.`)
      }

      const { count } = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM characters'
      ).first()

      const result = {
        message: `D1 setup completed successfully. Total characters inserted: ${count}.`,
        success: true,
        count: count
      }

      console.log(result.message)
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (e) {
      console.error('D1 setup failed:', e.stack)
      return new Response(
        JSON.stringify({ message: 'D1 setup failed.', error: e.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

export class Chat {}
