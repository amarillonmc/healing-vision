# YGOPRO Script Generator - 使用示例

本文档提供了 YGOPRO 脚本生成器的详细使用示例。

## 目录

- [基本用法](#基本用法)
- [效果类型示例](#效果类型示例)
- [高级功能](#高级功能)
- [API 参考](#api-参考)

## 基本用法

### 1. 解析效果文本

```bash
npm run dev parse "这张卡召唤成功时，可以破坏对方场上一张卡"
```

输出：
```
=== Parse Result ===

Total effects: 1

--- e1 ---
Type: EFFECT_TYPE_TRIGGER_O
Categories: 0x1
Trigger: EVENT_SUMMON_SUCCESS
Has cost: false
Has target: true
Keywords: 破坏, destroy, 场上, field, 召唤成功
```

### 2. 生成完整脚本

```bash
npm run dev generate -i 10000000 -e "效果文本" -l zh-CN
```

参数说明：
- `-i, --id <number>`: 卡片 ID
- `-e, --effect <text>`: 效果文本或文件路径
- `-l, --lang <language>`: 语言 (zh-CN, en-US, ja-JP)
- `-o, --output <path>`: 输出目录 (默认: ./output)
- `--setcode <number>`: 自定义 setcode
- `--dry-run`: 只打印不写入文件

### 3. 搜索卡片

```bash
npm run dev search "黑魔术士" -l zh-CN
```

### 4. 查看卡片信息

```bash
npm run dev info 10000000 -l zh-CN
```

## 效果类型示例

### 启动效果 (Ignition Effect)

**效果文本**: "这张卡可以丢弃1张手牌，破坏对方场上一张卡。"

```bash
npm run dev parse "一回合一次，可以丢弃1张手牌，选择对方场上1张卡破坏。"
```

生成代码结构：
```lua
function c10000000.initial_effect(c)
    local e1=Effect.CreateEffect(c)
    e1:SetCategory(CATEGORY_DESTROY)
    e1:SetType(EFFECT_TYPE_IGNITION)
    e1:SetRange(LOCATION_MZONE)
    e1:SetCountLimit(1)
    -- ... cost, target, operation
end
```

### 诱发效果 (Trigger Effect)

**效果文本**: "这张卡召唤成功时，可以抽1张卡。"

```bash
npm run dev parse "这张卡召唤成功时，可以从卡组抽1张卡。"
```

生成代码结构：
```lua
function c10000000.initial_effect(c)
    local e1=Effect.CreateEffect(c)
    e1:SetCategory(CATEGORY_DRAW)
    e1:SetType(EFFECT_TYPE_TRIGGER_O)
    e1:SetCode(EVENT_SUMMON_SUCCESS)
    e1:SetRange(LOCATION_MZONE)
    -- ... target, operation
end
```

### 永续效果 (Continuous Effect)

**效果文本**: "这张卡的攻击力上升500。"

```bash
npm run dev parse "这张卡的攻击力上升500。"
```

生成代码结构：
```lua
function c10000000.initial_effect(c)
    local e1=Effect.CreateEffect(c)
    e1:SetType(EFFECT_TYPE_SINGLE)
    e1:SetCode(EFFECT_UPDATE_ATTACK)
    e1:SetRange(LOCATION_MZONE)
    e1:SetValue(500)
end
```

### 快速效果 (Quick Effect)

**效果文本**: "对方回合也能发动，丢弃1张手牌，使这张卡的攻击力上升1000。"

```bash
npm run dev parse "对方回合也能发动，丢弃1张手牌，这张卡的攻击力上升1000。"
```

生成代码结构：
```lua
function c10000000.initial_effect(c)
    local e1=Effect.CreateEffect(c)
    e1:SetCategory(CATEGORY_ATKCHANGE)
    e1:SetType(EFFECT_TYPE_QUICK_O)
    e1:SetRange(LOCATION_MZONE)
    e1:SetCode(EVENT_FREE_CHAIN)
    e1:SetHintTiming(TIMINGS_CHECK_MONSTER)
    -- ... cost, operation
end
```

## 高级功能

### 使用 LLM 处理复杂效果

对于复杂效果，可以使用 LLM 进行辅助生成：

```bash
npm run dev generate -i 10000000 -e "复杂效果文本" --use-llm
```

### 自定义 Setcode

```bash
npm run dev generate -i 10000000 -e "效果文本" --setcode 0x1234
```

### 批量生成

创建一个包含多个效果文本的文件：

```bash
# effects.txt
卡片1|效果文本1
卡片2|效果文本2
```

然后使用脚本批量处理。

## API 参考

### 解析器 API

```typescript
import { createParser } from './dist/parser/effect-parser.js';

const parser = createParser();
const result = parser.parse(effectText, cardId, language);

// result.effects: Array<ParsedEffect>
// result.effects[0].effectType: 效果类型
// result.effects[0].categories: 效果分类
// result.effects[0].triggerEvent: 触发事件
// result.effects[0].hasCost: 是否有代价
// result.effects[0].hasTarget: 是否有对象
```

### 生成器 API

```typescript
import { createGenerator } from './dist/generator/script-generator.js';

const generator = createGenerator();
const script = generator.generate({
    cardId: 10000000,
    cardName: '卡片名称',
    effects: parseResult,
    language: 'zh-CN',
    customSetcode: 0x1234,
});

// script.content: 生成的 Lua 脚本
// script.warnings: 警告信息数组
```

### 数据库读取器 API

```typescript
import { createReader } from './dist/data/cdb-reader.js';

const reader = createReader('zh-CN');
reader.open();

const card = reader.getFullCard(10000000);
// card.id, card.name, card.desc, card.type, etc.

const cards = reader.searchCards('黑魔术士', 10);

reader.close();
```

## 常量参考

### 位置 (Locations)

```typescript
Locations.HAND        // 2   - 手牌
Locations.MZONE       // 4   - 怪兽区
Locations.SZONE       // 8   - 魔法陷阱区
Locations.GRAVE       // 16  - 墓地
Locations.REMOVE      // 32  - 除外区
Locations.EXTRA       // 64  - 额外卡组
Locations.DECK        // 1   - 卡组
Locations.ONFIELD     // 12  - 场上 (MZONE | SZONE)
```

### 效果类型 (EffectTypes)

```typescript
EffectTypes.IGNITION     // 1024 - 启动效果
EffectTypes.TRIGGER      // 512  - 诱发效果
EffectTypes.CONTINUOUS   // 16   - 永续效果
EffectTypes.QUICK_O      // 32   - 快速效果
EffectTypes.ACTIVATE     // 256  - 启动效果（魔法陷阱）
```

### 事件 (Events)

```typescript
Events.SUMMON_SUCCESS    // 1025 - 召唤成功
Events.DESTROY           // 1010 - 破坏
Events.DAMAGE            // 1048 - 受到伤害
Events.DRAW              // 1062 - 抽卡
Events.PRE_ATTACK        // 1086 - 攻击宣言
Events.END_PHASE         // 1065 - 结束阶段
```

### 分类 (Categories)

```typescript
Categories.DESTROY       // 1    - 破坏
Categories.REMOVE        // 2    - 除外
Categories.HAND          // 4    - 手牌相关
Categories.DECK          // 8    - 卡组相关
Categories.GRAVE         // 16   - 墓地相关
Categories.DAMAGE        // 256  - 伤害
Categories.DRAW          // 128  - 抽卡
Categories.SEARCH        // 512  - 检索
```

## 常见问题

### Q: 如何处理多效果卡片？

A: 在效果文本中使用换行或分号分隔不同效果，解析器会自动识别。

### Q: 生成的脚本需要手动修改吗？

A: 对于简单的效果，生成的脚本通常可以直接使用。对于复杂效果，可能需要手动调整 target 和 operation 函数的逻辑。

### Q: 如何添加自定义效果逻辑？

A: 可以修改 `src/generator/script-generator.ts` 中的生成逻辑，或在生成的脚本基础上手动编辑。

### Q: 支持哪些语言？

A: 目前支持中文 (zh-CN)、英文 (en-US)、日文 (ja-JP) 等。添加更多语言需要在 `src/parser/keyword-map.ts` 中添加相应的关键词映射。
