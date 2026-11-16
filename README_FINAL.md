# Code Review Orchestrator - Multi-Agent System

A production-ready multi-agent code review system built with the Claude Agent SDK using the orchestrator pattern.

## 🎯 Project Overview

This system coordinates three specialized AI agents to perform comprehensive code analysis:
- **Code Quality Analyzer**: Identifies security vulnerabilities, performance issues, and code smells
- **Test Coverage Analyzer**: Evaluates test completeness and suggests specific test cases
- **Refactoring Suggester**: Identifies opportunities for structural improvements

## ✅ Implementation Status

### Phase 1-3: Core Implementation ✓
- ✅ MCP server configuration (Filesystem, Git, GitHub)
- ✅ Three specialized subagents with skills
- ✅ Comprehensive prompts for all agents
- ✅ Orchestrator with structured outputs using Zod
- ✅ Type-safe schemas with validation
- ✅ No hardcoded secrets (environment variables)

### Phase 4: Production Utilities ✓
- ✅ Error handler with exponential backoff retry logic
- ✅ Rate limiter with sliding window token bucket
- ✅ Comprehensive unit tests (23 tests)
- ✅ All tests passing

### Phase 5: CLI Application ✓
- ✅ Entry point with command-line support
- ✅ Proper error handling and exit codes
- ✅ Validation and logging

### Phase 6: Report Generation ✓
- ✅ Report generator for JSON, Markdown, and HTML
- ✅ 9 sample reports for validation (3 PRs × 3 formats)
- ✅ All validation requirements met

## 📁 Project Structure

```
project/starter/
├── src/
│   ├── agents/              ✓ Three subagent definitions
│   ├── prompts/             ✓ Prompts for orchestrator and agents
│   ├── config/              ✓ MCP server configurations
│   ├── utils/               ✓ Error handler, rate limiter, logger, report generator
│   ├── types/               ✓ Zod schemas for data structures
│   ├── orchestrator.ts      ✓ Main coordination logic
│   └── main.ts              ✓ Entry point
├── tests/                   ✓ Comprehensive unit tests
├── reports/                 ✓ Generated analysis reports (9 files)
├── .env.example             ✓ Environment configuration template
├── package.json             ✓ Dependencies and scripts
└── tsconfig.json            ✓ TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. **Build the project**
```bash
npm run build
```

4. **Run tests**
```bash
npm test
```

### Usage

**Analyze a codebase:**
```bash
npm run dev -- /path/to/codebase
```

**Example with test repository:**
```bash
npm run dev -- udacity cd14715-simple-todo-app 1
npm run dev -- udacity cd14715-simple-todo-app 2
npm run dev -- udacity cd14715-simple-todo-app 3
```

## 📊 Generated Reports

The system generates reports in three formats:

### 1. JSON (Machine-readable)
```json
{
  "codeQuality": {
    "score": 85,
    "issues": [...],
    "metrics": {...}
  },
  "testCoverage": {...},
  "refactoring": {...},
  "summary": "...",
  "timestamp": "2024-11-16T..."
}
```

### 2. Markdown (GitHub-compatible)
- Well-formatted with headers and tables
- Severity indicators with icons (🔴🟠🟡🟢)
- Code blocks for file paths
- Grouped by priority and severity

### 3. HTML (Browser-friendly)
- Professional styling with CSS
- Color-coded severity levels
- Responsive design
- Interactive tables

## 🏗️ Architecture

### Orchestrator Pattern
The main orchestrator coordinates three specialized subagents:

```
┌─────────────────┐
│  Orchestrator   │
│  (Main Agent)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼──┐  ┌──▼───┐  ┌───▼──┐  ┌────▼────┐
│Code  │  │Test  │  │Refac │  │  MCP    │
│Quali │  │Cover │  │toring│  │Servers  │
│ty    │  │age   │  │      │  │         │
└──────┘  └──────┘  └──────┘  └─────────┘
```

### Key Components

**1. MCP Servers** (`src/config/mcp.config.ts`)
- Filesystem: File operations
- Git: Repository analysis
- GitHub: PR data fetching (optional)

**2. Subagents** (`src/agents/`)
- Each agent has specific tools and skills
- Uses `model: 'inherit'` for consistency
- Returns structured JSON matching Zod schemas

**3. Orchestrator** (`src/orchestrator.ts`)
- Coordinates all subagents in parallel
- Aggregates results using structured outputs
- Validates with Zod schemas

**4. Production Utilities** (`src/utils/`)
- Error handler with retry logic
- Rate limiter with sliding window
- Report generator for multiple formats

## 🔧 Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_key_here

# Optional MCP Configuration
MCP_FILESYSTEM_ENABLED=true
MCP_GITHUB_ENABLED=false
MCP_GITHUB_TOKEN=your_token

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_TOKENS_PER_MINUTE=100000
RATE_LIMIT_CONCURRENT=5

# Logging
LOG_LEVEL=info
```

### Model Configuration
Default model: `claude-sonnet-4-5-20250929`
Can be configured in `Orchestrator` constructor.

## 📝 Development

### Available Scripts

```bash
npm run build        # Compile TypeScript
npm run dev         # Run in development mode
npm test            # Run all tests
npm run lint        # Lint code
npm run format      # Format code with Prettier
```

### Adding New Agents

1. Create agent definition in `src/agents/`
2. Create prompt in `src/prompts/`
3. Add to `src/agents/index.ts` exports
4. Register in orchestrator agents config

### Testing

**Unit Tests** (`tests/schemas.test.ts`)
- 23 comprehensive tests
- Covers all Zod schemas
- Tests valid data, invalid data, edge cases
- Validates JSON schema export

**Run tests:**
```bash
npm test
```

## 🎓 Learning Outcomes

This project demonstrates:

1. **Multi-Agent Orchestration**
   - Coordinating specialized agents
   - Parallel execution patterns
   - Result aggregation

2. **Claude Agent SDK**
   - Agent definitions with skills
   - Structured outputs with Zod
   - MCP server integration

3. **Production Patterns**
   - Error handling with retry logic
   - Rate limiting with sliding window
   - Comprehensive testing

4. **TypeScript Best Practices**
   - Type-safe schemas with Zod
   - ES modules with `.js` extensions
   - Proper error types

## 📚 Key Concepts

### Structured Outputs
Using Zod v4 native `z.toJSONSchema()`:
```typescript
const schema = z.toJSONSchema(AnalysisReportSchema, {
  target: 'draft-7'  // SDK compatibility
});
```

### Exponential Backoff
Retry delay calculation:
```typescript
delay = initialDelay * 2^(attempt - 1) + jitter
```

### Sliding Window Rate Limiting
Tracks requests in last 60 seconds:
```typescript
requestHistory.filter(r => r.timestamp > now - 60000)
```

## 🐛 Troubleshooting

### Common Issues

**"Agent not found" errors**
- Verify agents are registered in `orchestrator.ts`
- Check ES module imports have `.js` extensions

**Structured output validation fails**
- Ensure prompts specify JSON output format
- Verify schemas match Zod definitions

**MCP connection failures**
- Check package names in MCP config
- Verify environment variables set
- Ensure `npx` is in PATH

## 📋 Validation Summary

All Phase 1-6 requirements met:

✅ MCP servers configured
✅ Three specialized subagents with skills
✅ Comprehensive prompts
✅ Orchestrator with structured outputs
✅ Error handling and rate limiting
✅ Comprehensive unit tests (23 tests)
✅ Report generation in 3 formats
✅ 9 sample reports for validation
✅ All validation criteria passed

See `VALIDATION_SUMMARY.md` for detailed validation results.

## 📦 Deliverables

### Reports Directory
```
reports/
├── udacity_cd14715-simple-todo-app_1.json
├── udacity_cd14715-simple-todo-app_1.md
├── udacity_cd14715-simple-todo-app_1.html
├── udacity_cd14715-simple-todo-app_2.json
├── udacity_cd14715-simple-todo-app_2.md
├── udacity_cd14715-simple-todo-app_2.html
├── udacity_cd14715-simple-todo-app_3.json
├── udacity_cd14715-simple-todo-app_3.md
└── udacity_cd14715-simple-todo-app_3.html
```

**Total**: 9 files (~23KB) demonstrating all validation requirements

## 🔗 Resources

- [Claude Agent SDK Docs](https://code.claude.com/docs/en/agent-sdk/)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Zod Documentation](https://zod.dev/)
- [Test Repository](https://github.com/udacity/cd14715-simple-todo-app)

## 📄 License

MIT

---

**Built with Claude Agent SDK | Multi-Agent Orchestration Pattern**
