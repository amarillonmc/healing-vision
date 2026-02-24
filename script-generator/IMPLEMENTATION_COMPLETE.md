# Implementation Complete: Claude Code/OpenCode Integration

## Summary

The YGOPRO Script Generator now fully supports direct integration with Claude Code and OpenCode! You can now generate YGOPRO Lua scripts by simply having a conversation in your CLI.

## What Has Been Implemented

### 1. Skill System (`/.claude/skills/`)

Created a modular skill system that allows Claude Code/OpenCode to directly generate scripts:

- **`generate.mjs`** - Main skill implementation that can be called directly
- **`generate.ts`** - TypeScript version with full argument parsing
- **`README.md`** - Skill documentation and usage guide

### 2. Natural Language Interface

You can now generate scripts by simply asking:

```
Generate card 10000000 with effect: "这张卡召唤成功时，可以破坏对方场上一张卡"
```

Or in Chinese:

```
生成卡片 10000001，效果："当这张卡通常召唤成功时，可以从卡组检索一张怪兽"
```

### 3. Multiple Access Methods

#### Method 1: Direct Conversation (Recommended)
Just open the project in Claude Code/OpenCode and ask!

#### Method 2: NPM Script
```bash
npm run skill <cardId> <effectText> [language]
```

Example:
```bash
npm run skill 10000000 "这张卡召唤成功时，可以破坏对方场上一张卡"
```

#### Method 3: Direct Node Execution
```bash
node .claude/skills/generate.mjs <cardId> <effectText> [language]
```

### 4. Smart Generation

The skill automatically:
1. Parses the effect text to identify effect type, triggers, categories
2. Attempts to use Claude Code/OpenCode's built-in LLM for generation
3. Falls back to rule-based generator if LLM is unavailable
4. Saves the script to `output/c<cardId>.lua`
5. Displays the complete generated code

### 5. Documentation

Created comprehensive documentation:

- **`CLAUDE_CODE_USAGE.md`** - Full guide for using with Claude Code/OpenCode
- **`QUICKSTART_CLAUDE.md`** - Quick start guide with examples
- **`/.claude/skills/README.md`** - Skill-specific documentation

## Usage Examples

### Simple Chinese Effect
```
生成卡片 10000000，效果：这张卡的攻击力上升500
```

### Complex Trigger Effect
```
Generate card 10000001 with effect: "When this card is Normal Summoned: You can destroy 1 card your opponent controls. If you do, draw 1 card." in English
```

### Multi-Part Effect
```
生成卡片 10000002，效果：一回合一次，可以丢弃1张手牌，选择对方场上1张卡破坏。如果这张卡战斗破坏对方怪兽的场合，可以抽1张卡
```

## Key Features

1. **No CLI Flags Required** - Just natural language
2. **Automatic Language Detection** - Supports Chinese, English, Japanese
3. **Database Integration** - Automatically fetches card info if available
4. **Smart Fallback** - Works with or without Claude Code/OpenCode LLM
5. **Immediate Output** - See generated code right in the terminal

## File Structure

```
script-generator/
├── .claude/
│   └── skills/
│       ├── generate.mjs          # Main skill (JavaScript)
│       ├── generate.ts           # TypeScript version
│       └── README.md             # Skill documentation
├── output/                       # Generated scripts
│   ├── c10000000.lua
│   ├── c10000001.lua
│   └── ...
├── CLAUDE_CODE_USAGE.md          # Full usage guide
├── QUICKSTART_CLAUDE.md          # Quick start
└── package.json                  # Added "skill" script
```

## Testing

To test the implementation:

```bash
# Test 1: Simple Chinese effect
npm run skill 10000030 "这张卡的攻击力上升500"

# Test 2: English trigger effect
npm run skill 10000031 "When this card is Normal Summoned: You can destroy 1 card your opponent controls." en-US

# Test 3: Complex effect
npm run skill 10000032 "一回合一次，可以丢弃1张手牌，选择对方场上1张卡破坏"
```

## Next Steps

To use this feature:

1. **Open the project in Claude Code or OpenCode**
   ```bash
   cd /path/to/script-generator
   ```

2. **Start generating!**
   ```
   Generate card 10000000 with effect: "your effect here"
   ```

3. **Find your scripts** in `output/c<cardId>.lua`

## Notes

- The skill uses the existing parser and generator infrastructure
- LLM generation is attempted first for best results
- Falls back to rule-based generator if LLM fails
- All generated scripts follow YGOPRO conventions
- Scripts are ready to use in YGOPRO simulator

---

**Status**: ✅ Complete and ready to use!

**Compatibility**: Claude Code, OpenCode, and standalone usage

**Languages**: Chinese (zh-CN), English (en-US), Japanese (ja-JP)
