import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  environments: {
    ssr: {
      keepProcessEnv: true
    }
  },
  test: {
    deps: {
      optimizer: {
        ssr: {
          include: ['ajv']
        }
      }
    },
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' }
      }
    }
  }
})
