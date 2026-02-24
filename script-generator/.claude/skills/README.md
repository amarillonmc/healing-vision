# YGOPRO Script Generator Skills

This directory contains Claude Code/OpenCode skills for the YGOPRO Script Generator.

## Available Skills

### `/generate` - Generate YGOPRO Lua Script

Generate a YGOPRO Lua script from card effect text.

**Usage:**

Just tell Claude Code/OpenCode what you want:

```
Generate card 10000000 with effect: "这张卡召唤成功时，可以破坏对方场上一张卡"
```

Or use the slash command:

```
/generate 10000000 "这张卡召唤成功时，可以破坏对方场上一张卡"
```

**Parameters:**
- `cardId` (required): The card's numeric ID
- `effectText` (required): The card's effect description
- `language` (optional): Language code - `zh-CN` (default), `en-US`, or `ja-JP`

**Examples:**

```
# Chinese
Generate card 10000000 with effect "这张卡召唤成功时，可以破坏对方场上一张卡"

# English
Generate card 10000001 with effect "When this card is Normal Summoned: You can destroy 1 card your opponent controls." in English

# Complex effect
Generate card 10000002 with effect "Return all cards you control to the bottom of your deck in any order, if you do, gain 1200 LP for each" en-US

# With language code
/generate 10000000 "这张卡的攻击力上升500" zh-CN
```

## How It Works

1. The skill parses the card effect text to identify:
   - Effect type (Ignition, Trigger, Continuous, Quick)
   - Trigger events
   - Categories (Destroy, Draw, Search, etc.)
   - Costs and targets
   - Conditions and restrictions

2. It attempts to use Claude Code/OpenCode's built-in LLM to generate complete, working Lua code

3. If LLM is unavailable, it falls back to a rule-based generator that creates a skeleton script

4. The generated script is saved to `./output/c<cardId>.lua`

## Generated Scripts

Scripts are saved to the `output/` directory in the project root, named as `c<cardId>.lua`.

For example, card ID 10000000 generates `output/c10000000.lua`.

## Tips

- For complex effects, be as specific as possible in your description
- Include all conditions, costs, and timing information
- The generator works best with standard effect patterns (destroy, draw, summon, search, etc.)
- Very unique or complex effects may require manual refinement after generation

## Troubleshooting

**"Card not found in database"**
- The generator will still work, but won't include card name/type/race/attribute
- Make sure your YGOPRO database is in the expected location

**"CLI LLM failed"**
- This is normal if you don't have Claude Code or OpenCode configured
- The generator will fall back to the basic rule-based generator
- You can still get a working script, but may need to fill in some TODOs

**Script has TODOs**
- The rule-based generator leaves TODOs for complex logic
- You'll need to implement these manually
- Or try again with more detailed effect description
