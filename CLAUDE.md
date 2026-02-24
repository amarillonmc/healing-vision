# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Build the project
cd script-generator && npm run build

# Run tests
npm test                    # Basic functionality test (no dependencies)
npm run test:cli-llm       # CLI LLM integration test (requires Claude Code or OpenCode)

# Development mode
npm run dev -- [command]    # Run CLI in dev mode with tsx

# Extract YGOPRO API constants (requires ygopro-core)
npm run extract-api
```

## Project Architecture

This is a YGOPRO Lua script generator that converts card effect text into executable Lua scripts for the YGOPRO simulator. The project consists of three main components:

### High-Level Flow

1. **Effect Parser** (`src/parser/`) - Parses natural language card effects into structured data
2. **Script Generator** (`src/generator/`) - Converts parsed data into Lua scripts
3. **Database Layer** (`src/data/`) - Reads card data from SQLite databases (optional)

### Generator Selection Strategy

The CLI tool automatically selects the appropriate generator based on effect complexity:

- **Simple effects** → `ScriptGenerator` (rule-based, fast)
- **Complex effects** → `CLILLMGenerator` (uses Claude Code/OpenCode CLI, recommended)
- **Cloud deployment** → `LLMGenerator` (requires API keys)

The decision logic is in `CLILLMGenerator.needsLLM()` - checks for complex conditions, restrictions, and keyword coverage.

### Key Components

**`src/parser/effect-parser.ts`** - Core parsing logic that:
- Tokenizes effect text by sentences/phrases
- Maps keywords to YGOPRO API constants via `keyword-map.ts`
- Determines effect type (IGNITION, TRIGGER, CONTINUOUS, QUICK)
- Extracts triggers, costs, targets, conditions, and restrictions

**`src/parser/keyword-map.ts`** - Bidirectional mappings between:
- Natural language keywords (Chinese/English/Japanese) → YGOPRO API constants
- Trigger patterns → Event codes
- Effect categories and types

**`src/generator/script-generator.ts`** - Rule-based generator that:
- Creates standard `initial_effect(c)` function structure
- Generates effect registration with proper categories/types/codes
- Creates skeleton `target` and `operation` functions
- Leaves TODOs for complex logic not handled by rules

**`src/generator/cli-llm-generator.ts`** - CLI-integrated LLM generator:
- Auto-detects `claude` or `opencode` CLI tools via `execSync()`
- Calls CLI's `ask` command with structured prompts
- Falls back to `ScriptGenerator` on failure
- Requires cleanup via `cleanup()` method (removes temp files)

**`src/constants/api.ts`** - Complete YGOPRO API constant definitions extracted from ygopro-core:
- Locations (HAND, MZONE, GRAVE, etc.)
- Effect types (IGNITION, TRIGGER, CONTINUOUS, QUICK_O)
- Event codes (SUMMON_SUCCESS, DESTROY, DAMAGE, etc.)
- Categories (TO_GRAVE, DESTROY, DRAW, etc.)

### Database Integration (Optional)

The database is optional - the generator works without it but produces better output when card data is available.

**`src/data/cdb-reader.ts`** - SQLite database reader for YGOPRO card databases:
- Reads from `locales/{lang}/cards.cdb` relative to project root
- Queries `datas` table for card stats (type, attribute, race, level, atk/def)
- Queries `texts` table for card name/description in multiple languages
- Returns `FullCard` (combined data + text) or `null` if not found

**Database path configuration** is in `DB_PATHS` constant - expects YGOPRO databases at `../../../ygopro-database/locales/{lang}/cards.cdb`

## Important Implementation Details

### CLI LLM Integration

The `CLILLMGenerator` uses shell execution to call external CLI tools:

```typescript
execSync(`claude ask "${escapedPrompt}"`, { timeout: 120000 })
```

**Critical**: When using `CLILLMGenerator`, always call `cleanup()` after generation to remove temporary files.

### Effect Parsing Limitations

The parser is keyword-based and has limitations:
- Requires good keyword coverage in `keyword-map.ts`
- May miss complex conditional logic
- Leaves TODOs in generated code for unhandled patterns
- Works best for standard effect patterns (destroy, draw, summon, etc.)

### Code Generation Style

Generated Lua follows YGOPRO conventions:
- Function name: `c{cardId}.initial_effect(c)`
- Effect creation: `Duel.CreateEffect(c)` with fluent setters
- Registration: `c:RegisterEffect(e)`
- Callbacks: Separate `target` and `operation` functions per effect
- Constants: Uses global YGOPRO constants (CATEGORY_*, EFFECT_TYPE_*, etc.)

### Type Safety

The codebase uses TypeScript with strict types. Key interfaces:
- `ParsedEffect` - Structured effect data from parser
- `ParseResult` - Container with effects array and metadata
- `FullCard` - Combined card data and text from database
- `GenerationOptions` / `CLILLMGenerationOptions` - Generator inputs

## Testing

Tests are located in `test/`:
- `test-example.ts` - Basic parser and generator tests (no external dependencies)
- `test-cli-llm.ts` - CLI LLM integration tests (requires Claude Code or OpenCode installed)

Tests use `tsx` for direct TypeScript execution without compilation.

## Known Issues

- **Database dependency**: Database path is hardcoded and expects YGOPRO databases in specific relative location
- **Keyword coverage**: Parser only handles keywords defined in `keyword-map.ts`
- **Complex effects**: Generator leaves TODOs for logic not covered by rules
- **CLI tool requirement**: CLI LLM requires separate installation of Claude Code or OpenCode
