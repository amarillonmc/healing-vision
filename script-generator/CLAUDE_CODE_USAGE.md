# Using YGOPRO Script Generator with Claude Code/OpenCode

This guide shows how to use the YGOPRO Script Generator directly within Claude Code or OpenCode.

## Quick Start

1. **Open this project in Claude Code/OpenCode**
   ```bash
   cd /path/to/script-generator
   ```

2. **Generate a script by simply asking**
   ```
   Generate card 10000000 with effect: "这张卡召唤成功时，可以破坏对方场上一张卡"
   ```

   Or in English:
   ```
   Generate card 10000001 with effect: "When this card is Normal Summoned: You can destroy 1 card your opponent controls." in English
   ```

## How It Works

When you ask to generate a card script in Claude Code/OpenCode, I will:

1. Parse the card effect text to identify effect type, triggers, categories, etc.
2. Use my AI capabilities to generate complete, working Lua code
3. Save the script to `output/c<cardId>.lua` in your project
4. Display the generated code for your review

## Examples

### Simple Chinese Effect
```
Generate card 10000000 with effect "这张卡的攻击力上升500"
```

### Simple English Effect
```
Generate card 10000001 with effect "This card gains 500 ATK" in English
```

### Complex Trigger Effect
```
Generate card 10000002 with effect "When this card is Normal Summoned: You can destroy 1 card your opponent controls. If you do, you can draw 1 card." en-US
```

### Multi-Condition Effect
```
Generate card 10000003 with effect "Once per turn, during your Main Phase: You can discard 1 card; destroy 1 card on the field. If this card destroys an opponent's card by battle, you can draw 1 card."
```

### Quick Effect
```
Generate card 10000004 with effect "(Quick Effect): You can discard 1 card; negate the activation of a card effect, and if you do, destroy that card." en-US
```

## Supported Languages

- **Chinese (zh-CN)**: Default
- **English (en-US)**: Specify "in English" or "en-US"
- **Japanese (ja-JP)**: Specify "in Japanese" or "ja-JP"

## What You Get

For each generation, you'll receive:

1. **Parsed effect information** - Effect type, categories, triggers
2. **Generated Lua script** - Complete, ready-to-use code
3. **File location** - Path to the saved script file
4. **Card information** - Card name and ID (if found in database)

## Tips for Best Results

1. **Be specific** - Include all conditions, costs, and timing
2. **Use standard terminology** - "destroy", "draw", "summon", "negate", etc.
3. **Mention timing** - "When...", "If...", "During your Main Phase", etc.
4. **Specify costs** - "discard 1 card", "pay 1000 LP", "tribute 1 monster"
5. **Include limitations** - "once per turn", "while you control X", etc.

## Example Conversation

```
You: Generate card 10000005 with effect "这张卡召唤成功时，可以从卡组检索一只怪兽"

Me: I'll generate a YGOPRO Lua script for that card effect.

[Generates script...]

Here's your generated script:
[lua code...]

Saved to: output/c10000005.lua
```

## Troubleshooting

**"Card not found in database"**
- The script will still be generated correctly
- It just won't include the card's name from the database
- You can manually add the card name in a comment

**Script has TODOs**
- For very complex effects, some parts may need manual implementation
- The TODOs will indicate what needs to be filled in
- You can ask me to help implement those parts

**Wrong effect type detected**
- Try being more specific about the timing
- Use phrases like "When this card is X" for trigger effects
- Use "You can... during your Main Phase" for ignition effects

## Advanced Usage

You can also ask me to:

- "Generate multiple cards at once" - Provide a list of cards and effects
- "Compare two generated scripts" - I can explain differences
- "Optimize a generated script" - Make it more efficient
- "Add a custom effect to card X" - Modify existing scripts
- "Explain how this script works" - I'll break down the code

## File Structure

Generated scripts are saved to:
```
output/
├── c10000000.lua
├── c10000001.lua
└── c10000002.lua
```

Each file is a complete, standalone YGOPRO Lua script ready to use in the YGOPRO simulator.
