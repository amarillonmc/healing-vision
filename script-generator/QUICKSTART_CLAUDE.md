# Quick Start: Using in Claude Code/OpenCode

## Step 1: Open the Project

Open this project directory in Claude Code or OpenCode:

```bash
cd /path/to/healing-vision/script-generator
```

## Step 2: Generate Scripts by Natural Language

Just ask me to generate a script! Here are some examples:

### Chinese Examples

```
生成卡片 10000000，效果：这张卡召唤成功时，可以破坏对方场上一张卡
```

```
生成一个卡片脚本，ID 是 10000001，效果是"一回合一次，可以丢弃1张手牌，选择对方场上1张卡破坏"
```

```
帮我生成卡片 10000002，效果：当这张卡被破坏时，可以从卡组特殊召唤一只怪兽
```

### English Examples

```
Generate card 10000003 with effect: "When this card is Normal Summoned: You can destroy 1 card your opponent controls."
```

```
Create a script for card 10000004 with effect "Once per turn: You can discard 1 card; draw 1 card."
```

## Step 3: Review the Generated Script

I'll show you:
- The parsed effect information
- The complete Lua script code
- The file path where it was saved (`output/c<cardId>.lua`)

## Tips

1. **Be specific** - Include all conditions, costs, and timing
2. **Use standard terms** - "destroy", "draw", "summon", "negate", etc.
3. **Specify language** - Add "in English" or "用中文" if needed

## What Happens Behind the Scenes

1. I parse your effect text to understand:
   - Effect type (Ignition, Trigger, Continuous, Quick)
   - Triggers and timing
   - Categories (destroy, draw, search, etc.)
   - Costs and targets

2. I generate complete Lua code using my knowledge of YGOPRO scripting

3. I save it to `output/c<cardId>.lua`

## Example Conversation

```
You: 生成卡片 10000000，效果：这张卡召唤成功时，可以破坏对方场上一张卡

Me: 好的，我来为您生成这个卡片的 YGOPRO Lua 脚本。

[Processing...]

✅ 已解析 1 个效果
✅ 脚本生成成功

📁 文件: output/c10000000.lua
🃏 卡片: 欧贝利斯克之巨神兵 (ID: 10000000)

[Lua code...]

💾 脚本已保存到: output/c10000000.lua
```

## Need Help?

Just ask! You can say things like:
- "解释一下这个脚本怎么工作"
- "这个脚本有问题吗？"
- "帮我优化这个脚本"
- "给这个效果添加一个代价"

I'm here to help you create YGOPRO scripts! 🎴
