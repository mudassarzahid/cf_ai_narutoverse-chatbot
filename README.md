## NarutoVerse Chatbot - Powered by Cloudflare

<p align="center">Example chat showcasing the Chatbot's ability to impersonate the character's personality, reference specific plot points
thanks to querying the RAG database, and overall engage in a coherent conversation.</p>

### Built With

This project is built entirely on the Cloudflare stack. The backend is a serverless Cloudflare Worker written
in `TypeScript`:

* _Cloudflare D1_ for the relational character database.
* _Cloudflare Vectorize_ for the vector database to enable RAG.
* _Cloudflare AI_ for running the LLM (`Llama 3.3`) and embedding models.
* _Cloudflare Durable Objects_ for managing stateful chat sessions.

The frontend is developed in `TypeScript` using `React` and `Vite`, styled with `Tailwind CSS`.

### How does it work?

1. **One-Time Data Setup**:
   The project relies on two initial setup scripts that must be run before starting the application.
    * _D1 Database Population_: A script reads the `naruto-characters.json` file and inserts all character metadata (
      e.g. name, summary, personality, story data) into a Cloudflare D1 database. Note: I obtained permission by
      Fandom.com to scrape that data from NarutoWiki. This repository does not contain the scraping script.
    * _Vectorize Index Creation_: A second script reads the same JSON file, splits the data into smaller chunks,
      creates embeddings for each chunk using Cloudflare AI's `@cf/baai/bge-base-en-v1.5` model, and stores these
      vectors in a Cloudflare Vectorize index.

2. **Conversation Initialization**:
   When a user selects a character on the frontend, their main information (ID, name, personality) are fetched from the D1
   database. This information is sent as an initial `system` message to a unique Durable Object instance which manages
   the chat session.

3. **Conversational RAG AI**:
   With each new user message, the following workflow is executed on the backend:

    * The user's input text is converted into an embedding vector using Cloudflare AI.
    * This new vector is used to query the Cloudflare Vectorize database. The query is filtered to only search for
      context related to the specific character the user is chatting with. It returns the 3 most relevant text chunks.
    * A final system prompt is constructed, combining a base instruction, the character's personality, and the
      context retrieved from the RAG query.
    * This prompt, along with the conversation history, is sent to the LLama-3.3 model running on Cloudflare AI.
    * The LLM-generated response is streamed token-by-token back to the frontend.

### Run locally

To get a local copy up and running, follow these steps.

#### Prerequisites

* Node.js (`>=18.0.0`) and npm
* A [Cloudflare account](https://www.google.com/search?q=https://dash.cloudflare.com/sign-up)
* The `wrangler` CLI: `npm install -g wrangler`

#### 1. Clone the repository

```shell
git clone git@github.com:mudassarzahid/cloudflare-ai-naruto-chatbot.git
cd cloudflare-ai-naruto-chatbot
```

#### 2. Install dependencies

```shell
npm install
```

#### 3. Configure Cloudflare

1. **Create `.dev.vars` file**
   ```shell
   touch .dev.vars
   # See .dev.vars.example
   ```
   
2. **Log in to Wrangler**
   ```shell
   wrangler login
   ```
3. **Create a D1 Database**
   ```shell
   npx wrangler d1 create characters
   # Let wrangler update your wrangler.jsonc file
   npx wrangler d1 execute characters --command "CREATE TABLE characters (id INTEGER PRIMARY KEY, name TEXT, href TEXT, image_url TEXT, summary TEXT, personality TEXT, summarized_personality TEXT, data TEXT, data_length INTEGER);" --remote
   npm run setup:d1
   curl http://localhost:8787
   ```
4. **Create a Vectorize Index**
   ```shell
   npm run setup:vectorize
   curl http://localhost:8787
   ```

#### 5. Run the App

```shell
npm run start
```

#### 6. Open `http://localhost:5173/` in your browser and start chatting\!