import {
  createExecutionContext,
  env,
  waitOnExecutionContext
} from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../src/server'

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {}
}

const sampleCharacters = [
  {
    id: 1,
    name: 'Naruto Uzumaki',
    href: 'https://example.com/wiki/Naruto_Uzumaki',
    image_url: 'https://example.com/naruto.jpg',
    summary: 'The main protagonist of the series.',
    personality: 'Naruto is boisterous, exuberant and unorthodox.',
    summarized_personality: 'Boisterous and determined',
    data: [],
    data_length: 0
  },
  {
    id: 2,
    name: 'Sasuke Uchiha',
    href: 'https://example.com/wiki/Sasuke_Uchiha',
    image_url: 'https://example.com/sasuke.jpg',
    summary: "Naruto's rival.",
    personality: 'Sasuke is typically calm, collected, and aloof.',
    summarized_personality: 'Calm and aloof',
    data: [],
    data_length: 0
  }
]

describe('Chat worker', () => {
  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM characters').run()
    const stmt = env.DB.prepare(
      'INSERT INTO characters (id, name, href, image_url, summary, personality, summarized_personality, data, data_length) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const bindings = sampleCharacters
      .slice(0, 1)
      .map((char) =>
        stmt.bind(
          char.id,
          char.name,
          char.href,
          char.image_url,
          char.summary,
          char.personality,
          char.summarized_personality,
          char.data,
          char.data_length
        )
      )
    await env.DB.batch(bindings)
  })

  it('Responds with Not Found for unknown routes', async () => {
    const request = new Request('http://example.com/unknown')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Not found')
  })

  describe('GET /api/characters', () => {
    it('Returns a list of characters', async () => {
      const request = new Request('http://example.com/api/characters')
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(200)
      const { characters } = (await response.json()) as { characters: any[] }
      expect(characters).toBeInstanceOf(Array)
      expect(characters.length).toBe(1)
      expect(characters[0].name).toBe('Naruto Uzumaki')
    })
  })

  describe('GET /api/character/:id', () => {
    it('Returns a single character for a valid ID', async () => {
      const request = new Request('http://example.com/api/character/1')
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(200)
      const { character } = (await response.json()) as { character: any }
      expect(character).toBeDefined()
      expect(character.id).toBe(1)
      expect(character.name).toBe('Naruto Uzumaki')
    })

    it('Returns 404 for a non-existent character ID', async () => {
      const request = new Request('http://example.com/api/character/999')
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(404)
      const body = await response.json()
      expect((body as any).error).toBe('Character not found')
    })

    it('Returns 400 if character ID is missing', async () => {
      const request = new Request('http://example.com/api/character/')
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect((body as any).error).toBe('Character ID is required')
    })
  })

  describe('POST /api/import-characters', () => {
    it('Imports new characters successfully', async () => {
      const newCharacter = [sampleCharacters[1]]
      const request = new Request('http://example.com/api/import-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharacter)
      })
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect((body as any).success).toBe(true)
      expect((body as any).count).toBe(1)

      const result = await env.DB.prepare(
        'SELECT * FROM characters WHERE id = ?'
      )
        .bind(2)
        .first()
      expect(result).not.toBeNull()
      expect((result as any).name).toBe('Sasuke Uchiha')
    })

    it('Returns 400 for an empty array', async () => {
      const request = new Request('http://example.com/api/import-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      })
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect((body as any).error).toBe(
        'Request body must be a non-empty JSON array.'
      )
    })

    it('Returns 500 for invalid JSON', async () => {
      const request = new Request('http://example.com/api/import-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid": "json"'
      })
      const ctx = createExecutionContext()
      const response = await worker.fetch(request, env, ctx)
      await waitOnExecutionContext(ctx)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect((body as any).error).toBe('Failed to import characters')
    })
  })
})
