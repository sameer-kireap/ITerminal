# iTerminal — AI-Native Investment Intelligence Terminal

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange.svg)](https://www.trychroma.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Orchestration-green.svg)](https://www.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent%20Workflows-purple.svg)](https://langchain-ai.github.io/langgraph/)

> **iTerminal** is an AI-native investment intelligence terminal engineered to continuously ingest, normalize, analyze, and synthesize investment-critical information across global financial news, regulatory disclosures, and market events into evidence-backed, actionable decision support.

---

## 1. Project Overview

### What iTerminal Is
iTerminal is an AI-driven investment research and intelligence engine designed to operate as a continuous 24/7 research analyst. It continuously monitors the information landscape, transforms raw unstructured data into structured investment events, indexes semantic representations for low-latency retrieval, and exposes both deterministic query interfaces and LangGraph-powered autonomous research agents.

### The Problem It Solves
Modern financial analysts and investment teams face severe structural friction:
1. **Information Overload & Fragmentation**: Market signals are scattered across regulatory portals (SEC EDGAR), financial news feeds, PR wires, corporate IR pages, and industry outlets.
2. **Signal-to-Noise Deficit**: Hundreds of articles report the same wire syndication with minor headline alterations, burying critical primary disclosures.
3. **Latency vs. Depth Trade-Off**: Breaking news requires sub-minute alerts, while investment committee decisions require rigorous historical cross-referencing and multi-source corroboration.
4. **LLM Hallucination in Finance**: Generic LLM interfaces fabricate facts, conflate fiscal years, and lack verifiable audit trails to primary disclosures.

### The Core Idea: The Intelligence Transformation Chain
Investment intelligence is distinct from raw news aggregation. iTerminal enforces a strict four-stage data progression:

```text
Raw Data (8-K filing payload / RSS XML)
   ↓
Information (Nvidia filed an 8-K disclosing a $2B data center revenue beat)
   ↓
Intelligence (3rd consecutive guidance raise; exceeds consensus by 14%; margins expand +180 bps)
   ↓
Decision Support (LangGraph research agent synthesizes peer impact across semiconductor supply chains with source citations)
```

### Who It Is For
* **Buy-Side Research Analysts (Hedge Funds & Asset Managers)**: Real-time alerting on portfolio holdings, rapid thesis stress-testing, and automated earnings-filing cross-checks.
* **Sell-Side Equity Analysts**: Rapid drafting of company overview notes, historical peer comparisons, and event-driven commentary.
* **Private Equity & VC Deal Teams**: Continuous thematic monitoring of target sectors, competitor landscape changes, and executive movements.
* **Professional Investment Research Teams**: Systematic automation of daily monitoring routines with zero-tolerance for uncited claims.

### What Makes iTerminal Different from a Normal News Aggregator
| Dimension | Traditional News Aggregator | iTerminal |
| :--- | :--- | :--- |
| **Ingestion** | Passive RSS polling / headline scraping | Multi-mode hybrid ingestion (webhooks, streaming, adaptive polling) |
| **Deduplication** | Naive URL string matching | Three-tier deduplication: exact URL/content hash, MinHash/SimHash near-dedup, and entity-event clustering |
| **Extraction** | Keyword matching / regex tags | Named entity recognition (tickers, CIK, executives), event classification, and importance scoring |
| **Retrieval** | Simple lexical search (keyword queries) | Hybrid RAG combining filtered metadata search and dense embeddings in ChromaDB |
| **Analysis** | None (user must read raw articles) | Automated extraction of key financial figures, guidance changes, and thesis impact |
| **Research Mode** | Static link directory | LangGraph agentic workflows equipped with search, filing retrieval, and financial calculation tools |
| **Verifiability** | Links to search results | Strict inline citations linking every claim to source URLs, publication timestamps, and ingestion hashes |

---

## 2. Core Capabilities & Status

To maintain engineering integrity, features are explicitly demarcated by implementation phase:

| Capability | Scope & Function | Status |
| :--- | :--- | :--- |
| **Architecture Specification** | Exhaustive end-to-end design, data contracts, and failure recovery protocols | **Implemented** (`01_complete_system_design.md`) |
| **Canonical Event Schema** | Standardized `InvestmentEvent` and `Entity` Pydantic models with provenance metadata | **Implemented** (Design specification) |
| **Source Ingestion Connectors** | Modular connectors for SEC EDGAR (RSS/API), financial wire RSS, and Webhook receivers | **Planned** |
| **Three-Tier Deduplication** | Level 1 (SHA-256 hash), Level 2 (SimHash near-duplicate), Level 3 (Event clustering) | **Planned** |
| **Entity & Event Classification** | Hybrid extraction for tickers, companies, event types (M&A, earnings, guidance, regulatory) | **Planned** |
| **Investment Relevance Scoring** | Deterministic heuristics combined with structured LLM scoring (0.0 – 1.0) | **Planned** |
| **Vector Storage (ChromaDB)** | Dedicated collections (`articles_v1`, `filings_v1`) with deterministic chunk IDs | **Planned** |
| **Grounded Financial RAG** | Context-filtered retrieval, chunk deduplication, and citation-enforced generation | **Planned** |
| **LangGraph Research Workflows** | Stateful multi-step investigation agents with dynamic tool execution and reflection | **Planned** |
| **Real-Time Alerts Engine** | Low-latency event matching against user watchlists via Redis Pub/Sub | **Planned** |
| **FastAPI Service Layer** | Asynchronous REST and streaming WebSocket endpoints for UI integration | **Planned** |

---

## 3. System Architecture

### Conceptual Pipeline Flow

```text
                       [ External Data Sources ]
           (SEC EDGAR, Financial RSS, News APIs, Webhooks)
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Ingestion Layer │ (Connectors, Rate Limiters,
                         └────────┬────────┘  Adaptive Polling)
                                  │ Raw Payloads
                                  ▼
                       ┌──────────────────────┐
                       │ Normalization Layer  │ (Canonical InvestmentEvent)
                       └──────────┬───────────┘
                                  │ Normalized Events
                                  ▼
                       ┌──────────────────────┐
                       │ Deduplication Engine │ (L1 Hash, L2 SimHash,
                       └──────────┬───────────┘  L3 Event Clustering)
                                  │ Unique Events
                                  ▼
                       ┌──────────────────────┐
                       │   Event Processing   │ (NER, Event Classification,
                       └──────────┬───────────┘  Importance Scoring)
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌────────────────────┐          ┌────────────────────┐
       │   PostgreSQL DB    │          │ ChromaDB (Vectors) │
       │ (Articles, Events, │          │ (Embeddings, Text  │
       │  Entities, Alerts) │          │  Chunks, Metadata) │
       └──────────┬─────────┘          └──────────┬─────────┘
                  │                               │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   RAG Engine    │ (Metadata Filtering,
                         └────────┬────────┘  Context Builder, Citations)
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │   LangGraph Agents    │ (Multi-Step Research,
                      └───────────┬───────────┘  Tool Use, Verification)
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  FastAPI Layer  │ (REST Endpoints,
                         └────────┬────────┘  WebSocket Feeds)
                                  │
                                  ▼
                      [ iTerminal UI / Clients ]
```

### Major Architectural Components
1. **Ingestion Engine**: Asynchronous workers operating independent source connectors. Enforces rate limits, handles provider connection failures, and ingests without blocking downstream pipelines.
2. **Normalization & Provenance**: Transforms raw XML/JSON/HTML into the project's canonical `InvestmentEvent` model. Captures both `published_at` (source timestamp) and `ingested_at` (system timestamp).
3. **Deduplication Engine**: Filters out exact cross-postings and syndicated duplicates before compute-heavy AI processing occurs.
4. **Processing & Enrichment**: Deterministic rule engines handle date parsing and initial category routing; LLMs are invoked strictly for semantic entity resolution and contextual importance scoring.
5. **Dual-Store Persistence**:
   * **PostgreSQL**: ACID-compliant storage for companies, events, raw article payloads, entity relationships, and user watchlists.
   * **ChromaDB**: Dedicated vector store indexing article and filing chunks alongside rich filter metadata (ticker, event type, date).
   * **Redis**: Ephemeral cache for dedup sets (`seen_urls`), rate limit counters, and real-time alert dispatch.
6. **RAG & Agent Layer**: RAG handles bounded retrieval for immediate questions; LangGraph coordinates multi-step investigations requiring sequential tool calls.
7. **FastAPI Interface**: Asynchronous gateway serving REST endpoints for search and ingestion, plus streaming interfaces for long-running research tasks.

---

## 4. RAG Architecture

iTerminal treats RAG as a precision information pipeline rather than an indiscriminate context-stuffing mechanism.

```text
Raw Document ──► Semantic Chunking ──► Deterministic IDs ──► ChromaDB Vector Store
                                                                     │
User Query ──► Hybrid Filtered Retrieval (Ticker, Date, Event Type) ─┘
                     │
                     ▼
             Context Assembly (Token-budgeted, source-tagged)
                     │
                     ▼
             LLM Generation with Strict Citation Grounding
```

### 1. Document Ingestion & Chunking
* Documents are pre-processed to remove markup boilerplate while preserving section hierarchies (e.g., "Item 2.02 Results of Operations and Financial Condition" in 8-K filings).
* Chunking utilizes a semantic, sliding-window approach (typically 500–800 tokens with 10–15% overlap). Chunks never break mid-sentence or mid-financial table.

### 2. Rich Chunk Metadata
Every chunk written to ChromaDB carries structured metadata for pre-retrieval filtering:
```json
{
  "article_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "source": "sec_edgar",
  "ticker": "NVDA",
  "cik": "0001045810",
  "event_type": "earnings_release",
  "published_at": "2026-02-25T21:05:00Z",
  "chunk_index": 2,
  "source_url": "https://www.sec.gov/Archives/edgar/data/..."
}
```

### 3. Deterministic Embeddings & ChromaDB Storage
* Chunk IDs are deterministic hashes: `sha256(source + ":" + source_id + ":" + chunk_index)`. This ensures re-indexing or re-ingestion is strictly idempotent.
* ChromaDB collections are versioned (e.g., `articles_v1`, `filings_v1`) to allow zero-downtime embedding model migrations.

### 4. Retrieval & Filtering
* Queries are first enriched with target metadata constraints (e.g., `ticker == "NVDA"` AND `published_at >= now() - 30d`).
* ChromaDB executes metadata-filtered vector search, preventing semantic drift across unrelated companies.

### 5. Context Construction & Citation Enforcement
* Retrieved chunks are deduplicated and assembled into a formatted prompt buffer with explicit source indices:
  ```text
  [Source 1] (NVDA | SEC 8-K | 2026-02-25): Data center revenue reached $18.4B...
  [Source 2] (Reuters | 2026-02-25): Nvidia beat Wall Street consensus...
  ```
* The prompt contract mandates that every factual assertion cite its source token (e.g., `According to Nvidia's 8-K filing [Source 1]...`). Unbacked model assertions are rejected by output validation.

---

## 5. Agent Architecture

We maintain a strict boundary between simple LLM calls, deterministic pipelines, and autonomous agents:

```text
Deterministic Code ──► Predictable parsing, hash dedup, date sorting (Zero LLM)
AI Pipeline        ──► Fixed sequence: Classify ──► Extract ──► Summarize (Static DAG)
RAG Pipeline       ──► Retrieve ──► Assemble Context ──► Synthesize Answer (Single-turn)
LangGraph Workflow ──► Stateful, multi-step research loop with tools & branching (Dynamic Agent)
```

### Distinct Execution Tiers

| Architecture Tier | Execution Pattern | When Used |
| :--- | :--- | :--- |
| **Deterministic Pipeline** | Pure algorithmic code (Python / SQL) | URL hashing, SimHash, regex extraction, schema validation |
| **Direct LLM Call** | Single prompt $\rightarrow$ Structured output | Article classification, sentiment scoring, executive summary generation |
| **RAG Pipeline** | Vector query $\rightarrow$ Prompt $\rightarrow$ Answer | Answering direct queries: *"What was Tesla's Q3 automotive gross margin?"* |
| **LangGraph Workflow** | Cyclic state graph with tool feedback | Multi-step research: *"Analyze recent executive departures across US regional banks and correlate with commercial real estate exposure."* |

### LangGraph Research Workflow Design
When a user launches an exploratory research task, LangGraph manages the stateful loop:

```text
                ┌──────────────┐
                │  User Query  │
                └──────┬───────┘
                       ▼
                 ┌───────────┐
                 │ Plan Step │
                 └─────┬─────┘
                       ▼
           ┌───────────────────────┐
           │ Tool Selection Node   │
           └───────────┬───────────┘
                       ▼
        ┌─────────────────────────────┐
        │     Execute Tools (Async)   │
        │ - search_chromadb           │
        │ - get_company_filings       │
        │ - run_sql_metric_query      │
        └──────────────┬──────────────┘
                       ▼
           ┌───────────────────────┐
           │   Synthesize & Reflect│
           └───────────┬───────────┘
                       │
             Is info sufficient?
             ├── No (Iterations < Max) ──► Loop back to Plan Step
             └── Yes / Max reached     ──► Final Evidence-Backed Synthesis
```

* **State**: Strongly typed Pydantic/TypedDict state holding user question, retrieved documents, execution plan, tool call history, and evaluation checkpoints.
* **Tools**: Strictly isolated asynchronous functions:
  * `query_vector_store(query, filters, top_k)`
  * `get_sec_filing(ticker, form_type, year)`
  * `fetch_company_events(ticker, start_date, end_date)`
  * `calculate_metric(expression)`
* **Guardrails**: Hard recursion limits (e.g., max 5 iterations) and deterministic timeout triggers to eliminate infinite agent loops and unbounded token consumption.

---

## 6. Project Structure

### Current Repository Layout
As the project is currently in the architectural blueprint phase, the active repository contains the formal system design document:

```text
.
├── 01_complete_system_design.md    # Complete end-to-end system design & specifications
├── README.md                       # High-level architecture, roadmap, and usage documentation
└── AGENTS.md                       # Engineering constraints and conventions for AI coding agents
```

### Planned Target Architecture
When source implementation commences, the repository will follow a modular service layout:

```text
iterminal/
├── app/
│   ├── api/                    # FastAPI routes, dependencies, and exception handlers
│   │   ├── v1/
│   │   │   ├── articles.py     # Article querying & event feeds
│   │   │   ├── ingestion.py    # Webhook receivers & manual ingest triggers
│   │   │   └── research.py     # RAG queries & LangGraph agent endpoints
│   │   └── deps.py             # Database, Redis, and ChromaDB session dependencies
│   ├── core/                   # Centralized configuration and logging
│   │   ├── config.py           # Pydantic BaseSettings (env validation)
│   │   └── logging.py          # Structured logging
│   ├── ingestion/              # Source connectors & polling workers
│   │   ├── base.py             # Abstract base connector
│   │   ├── edgar.py            # SEC EDGAR RSS/API connector
│   │   └── rss.py              # Financial wire RSS connector
│   ├── processing/             # Pipeline components
│   │   ├── normalizer.py       # Raw payload to InvestmentEvent transformation
│   │   ├── deduplicator.py     # L1/L2/L3 deduplication routines
│   │   └── classifier.py       # Event tagging & importance scoring
│   ├── rag/                    # Retrieval-Augmented Generation subsystem
│   │   ├── chunker.py          # Document chunking logic
│   │   ├── embeddings.py       # Embedding model abstraction
│   │   ├── vectorstore.py      # ChromaDB client & collection management
│   │   └── retriever.py        # Filtered hybrid retrieval & context builder
│   ├── agents/                 # LangGraph workflows
│   │   ├── state.py            # Agent state definitions
│   │   ├── tools.py            # Research tools (vector search, DB query, calculator)
│   │   └── researcher.py       # Multi-step research graph definition
│   ├── models/                 # Domain and persistent data models
│   │   ├── domain.py           # Canonical InvestmentEvent and Entity models
│   │   └── tables.py           # SQLAlchemy PostgreSQL tables
│   └── workers/                # Background task executors
│       └── ingestion_worker.py # Continuous ingestion process
├── tests/
│   ├── unit/                   # Fast deterministic tests (dedup, normalization)
│   ├── integration/            # Component tests (ChromaDB, PostgreSQL, FastAPI)
│   └── eval/                   # RAG retrieval and citation accuracy evaluations
├── pyproject.toml              # Project dependencies & tool configurations
└── docker-compose.yml          # PostgreSQL, Redis, and ChromaDB local services
```

---

## 7. Setup & Installation

### Prerequisites
* Python 3.11+
* Docker & Docker Compose (for PostgreSQL and Redis)
* Virtual environment manager (`venv` or `poetry`)

### 1. Environment Configuration
Clone the repository and prepare your environment variables:

```bash
# Clone repository
git clone https://github.com/your-org/iterminal.git
cd ITerminal

# Create and activate Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# Copy example environment configuration
cp .env.example .env
```

### 2. Install Dependencies (Planned)
Once `pyproject.toml` is initialized:

```bash
pip install --upgrade pip
pip install -e ".[dev]"
```

*Core runtime dependencies include: `fastapi`, `uvicorn[standard]`, `pydantic>=2.0`, `chromadb`, `langchain`, `langgraph`, `sqlalchemy[asyncio]`, `asyncpg`, `redis`, `httpx`.*

### 3. Start Infrastructure Services
Launch local backing services using Docker Compose:

```bash
docker compose up -d postgres redis
```

### 4. ChromaDB Setup
ChromaDB operates in persistent local directory mode for development, eliminating external service dependencies:

```bash
mkdir -p ./data/chroma
```

### 5. Running the Application (Planned)
```bash
# Start FastAPI application
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# In a separate terminal, start the background ingestion worker
python -m app.workers.ingestion_worker
```

### 6. Running Tests (Planned)
```bash
# Run unit and integration tests
pytest

# Run tests with coverage
pytest --cov=app tests/
```

---

## 8. Configuration

All configuration is managed via environment variables and loaded through `pydantic-settings`. Never commit actual secrets or credentials.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | string | `development` | Runtime environment (`development`, `staging`, `production`) |
| `LOG_LEVEL` | string | `INFO` | Application log verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `API_V1_PREFIX` | string | `/api/v1` | Root prefix for versioned API endpoints |
| `DATABASE_URL` | string | `postgresql+asyncpg://postgres:postgres@localhost:5432/iterminal` | PostgreSQL connection string |
| `REDIS_URL` | string | `redis://localhost:6379/0` | Redis connection string |
| `CHROMA_PERSIST_DIRECTORY` | string | `./data/chroma` | Local filesystem path for ChromaDB storage |
| `OPENAI_API_KEY` | string | *None* | Primary LLM provider key |
| `ANTHROPIC_API_KEY` | string | *None* | Secondary/fallback LLM provider key |
| `EMBEDDING_MODEL` | string | `text-embedding-3-small` | Model used for vector embeddings |
| `MAX_AGENT_ITERATIONS` | integer | `5` | Recursion ceiling for LangGraph research agents |

---

## 9. Planned API Specification

When the API service layer is implemented, the following endpoints will form the core contract:

### 1. Ingest Event Payload
* **Method & Path**: `POST /api/v1/ingestion/event`
* **Purpose**: Ingest a raw external event payload (webhook receiver or manual dispatch).
* **Request Body**:
  ```json
  {
    "source": "sec_edgar",
    "source_id": "0001045810-26-000012",
    "url": "https://www.sec.gov/Archives/edgar/data/...",
    "title": "NVIDIA CORP - Form 8-K",
    "body": "Item 2.02 Results of Operations and Financial Condition...",
    "published_at": "2026-02-25T21:05:00Z",
    "raw_payload": {}
  }
  ```
* **Response**: `202 Accepted`
  ```json
  {
    "status": "accepted",
    "event_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "content_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
  }
  ```

### 2. Query Processed Articles
* **Method & Path**: `GET /api/v1/articles`
* **Purpose**: Query normalized, deduplicated articles with structured filters.
* **Query Parameters**: `ticker` (string), `event_type` (string), `since` (ISO datetime), `limit` (int).
* **Response**: `200 OK`
  ```json
  {
    "items": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "title": "Nvidia Reports Q4 Fiscal 2026 Financial Results",
        "published_at": "2026-02-25T21:05:00Z",
        "importance_score": 0.94,
        "event_type": "earnings_release",
        "entities": [{"name": "NVIDIA", "type": "company", "ticker": "NVDA"}]
      }
    ],
    "total": 1
  }
  ```

### 3. Grounded RAG Query
* **Method & Path**: `POST /api/v1/research/query`
* **Purpose**: Execute an immediate, single-turn RAG search with strict source grounding.
* **Request Body**:
  ```json
  {
    "query": "What did Nvidia report for data center revenue growth?",
    "filters": {"ticker": "NVDA", "since": "2026-01-01T00:00:00Z"}
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "answer": "Nvidia reported data center revenue of $18.4 billion for Q4, representing 409% year-over-year growth [Source 1].",
    "citations": [
      {
        "source_index": 1,
        "source": "sec_edgar",
        "source_url": "https://www.sec.gov/Archives/edgar/data/...",
        "published_at": "2026-02-25T21:05:00Z",
        "content_hash": "a591a6d40..."
      }
    ]
  }
  ```

### 4. Dispatch Agentic Research Task
* **Method & Path**: `POST /api/v1/research/deep-dive`
* **Purpose**: Dispatch a multi-step LangGraph research workflow.
* **Request Body**:
  ```json
  {
    "topic": "Semiconductor supply chain vulnerability to Taiwan geopolitical tensions",
    "tickers": ["NVDA", "TSM", "AMD"],
    "max_iterations": 4
  }
  ```
* **Response**: `202 Accepted`
  ```json
  {
    "task_id": "c3d5f992-80f4-4ea7-9a99-813cbf2b810d",
    "status": "in_progress",
    "status_url": "/api/v1/research/tasks/c3d5f992-80f4-4ea7-9a99-813cbf2b810d"
  }
  ```

---

## 10. Development & Extension Workflows

### 1. Adding a New Data Source
1. **Create Connector**: Inherit from `app.ingestion.base.BaseConnector` in `app/ingestion/<source_name>.py`.
2. **Implement Methods**:
   * `async def poll() -> list[dict]`: Fetch raw payloads respecting rate limits.
   * `def normalize(raw: dict) -> InvestmentEvent`: Map raw fields to canonical `InvestmentEvent`.
3. **Register Worker**: Add the connector to `app.workers.ingestion_worker` schedule.
4. **Unit Test**: Test parser against mock JSON/XML fixtures without live network calls.

### 2. Adding a New RAG Retrieval Pipeline
1. **Define Filter Parameters**: Extend query filters in `app/rag/retriever.py` to support new domain fields.
2. **Optimize Chunk Strategy**: If adding a novel document type (e.g., transcripts vs 10-Ks), create a specific chunking parser in `app/rag/chunker.py`.
3. **Write Evaluation**: Validate context retrieval precision in `tests/eval/test_rag.py`.

### 3. Adding a New LangGraph Research Workflow
1. **Define State**: Extend `TypedDict` in `app/agents/state.py` to track workflow-specific variables.
2. **Define Nodes & Tools**: Create pure async node functions and tools in `app/agents/tools.py`.
3. **Assemble Graph**: In `app/agents/researcher.py`, instantiate `StateGraph`, declare transitions, configure conditional exit gates, and compile with recursion limits.
4. **Test Determinism**: Unit test node transitions using mock tool outputs.

---

## 11. Core Design Principles

* **Async by Default**: All I/O-bound operations (network requests, database queries, ChromaDB reads, LLM API calls) use native Python `async`/`await`. Never block the event loop.
* **Separation of Ingestion from Reasoning**: Fast, high-throughput ingestion must never wait on slow, non-deterministic LLM operations. Ingestion buffers into persistent queues; processing consumes downstream.
* **Grounded, Evidence-Backed Responses**: No LLM synthesis is emitted without traceable primary citations (source URL, publication timestamp, content hash).
* **Idempotent Ingestion & Storage**: Every ingestion and vector write operation is deterministic and idempotent. Re-running a feed or replaying a queue produces identical state.
* **Deterministic Tools First**: Solve deduplication, parsing, mathematical calculations, and filtering with deterministic algorithms. Use LLMs strictly for semantic tasks where code cannot suffice.
* **Graceful Degradation**: If an LLM provider throttles or fails, the terminal falls back to secondary providers or delivers clean, un-summarized primary documents without crashing.
