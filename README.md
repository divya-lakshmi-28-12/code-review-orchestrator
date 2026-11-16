# Code Review Orchestrator

Multi-agent code review system using the orchestrator pattern with Claude Agent SDK.

## Project Structure

```
project/starter/
├── src/
│   ├── agents/              # Three subagent definitions
│   ├── prompts/             # Prompts for orchestrator and subagents
│   ├── config/              # MCP server configurations
│   ├── utils/               # Utilities (error handler, rate limiter, logger, report generator)
│   ├── types/               # Zod schemas for all data structures
│   ├── orchestrator.ts      # Main coordination logic
│   └── main.ts              # Entry point with validation
├── tests/                   # Unit tests
├── .claude/skills/          # Claude skills
└── .env.example             # Environment template
```

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run: `npm start`

## Development

- `npm run dev` - Run in development mode
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code
