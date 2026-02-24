# YGOPRO Script Generator - Claude Code/OpenCode Skill

This skill enables Claude Code or OpenCode to generate YGOPRO Lua scripts from card effect descriptions.

## Usage

Invoke this skill when the user asks to:
- Generate a YGOPRO (游戏王) Lua script for a card
- Convert card effect text into ygopro script code
- Create a Lua script for Yu-Gi-Oh card effects

## Input Requirements

The user should provide:
1. **Card ID** (numeric) - e.g., `10000000`
2. **Effect text** - The card's effect description in Chinese, English, or Japanese
3. **Language** (optional) - Default is `zh-CN` (Chinese)

### Example Inputs

```
Generate a ygopro script for card 10000000 with effect:
"这张卡召唤成功时，可以破坏对方场上一张卡。"
```

```
Create Lua script for:
Card ID: 99999999
Effect: "When this card is Normal Summoned: You can destroy 1 card your opponent controls."
Language: en-US
```

## Output Format

Return a complete, executable YGOPRO Lua script following these conventions:

```lua
--Card Name
function c<ID>.initial_effect(c)
	--Effect registration with proper Duel.CreateEffect(c)
	--Effect properties: Type, Code, Category, Range, etc.
	--Target and Operation functions
end
```

## YGOPRO Script Conventions

### Core Structure

```lua
function c<ID>.initial_effect(c)
	local e1=Effect.CreateEffect(c)
	e1:SetDescription(aux.Stringid(<ID>,<index>))
	e1:SetCategory(<CATEGORY>)      -- e.g., CATEGORY_DESTROY
	e1:SetType(<EFFECT_TYPE>)        -- e.g., EFFECT_TYPE_TRIGGER_O
	e1:SetCode(<EVENT_CODE>)         -- e.g., EVENT_SUMMON_SUCCESS
	e1:SetRange(<LOCATION>)          -- e.g., LOCATION_MZONE
	e1:SetCondition(<condition_func>)
	e1:SetTarget(<target_func>)
	e1:SetOperation(<operation_func>)
	c:RegisterEffect(e1)
end
```

### Effect Types

- `EFFECT_TYPE_IGNITION` (0x1) - Ignition effects (启动效果)
- `EFFECT_TYPE_TRIGGER_O` (0x410) - Optional trigger effects (诱发效果)
- `EFFECT_TYPE_TRIGGER_F` (0x4) - Mandatory trigger effects
- `EFFECT_TYPE_CONTINUOUS` (0x10) - Continuous effects (永续效果)
- `EFFECT_TYPE_QUICK_O` (0x20) - Quick effects (快速效果)
- `EFFECT_TYPE_ACTIVATE` (0x100) - Activate effects (魔法陷阱发动)

### Event Codes

- `EVENT_SUMMON_SUCCESS` (1025) - Summon successful
- `EVENT_SPSUMMON_SUCCESS` (1027) - Special summon successful
- `EVENT_DESTROY` (1010) - Destroyed
- `EVENT_TO_GRAVE` (1016) - Sent to graveyard
- `EVENT_BATTLE_DESTROYING` (1044) - Battle destroying
- `EVENT_PHASE` (0x1000) + phase constant
- `EVENT_FREE_CHAIN` (1002) - Can be activated anytime

### Categories

- `CATEGORY_DESTROY` (0x1) - Destroy
- `CATEGORY_TOHAND` (0x4) - Return to hand
- `CATEGORY_TODECK` (0x8) - Return to deck
- `CATEGORY_REMOVE` (0x2) - Remove from play
- `CATEGORY_TOGRAVE` (0x10) - Send to graveyard
- `CATEGORY_DRAW` (0x80) - Draw cards
- `CATEGORY_SEARCH` (0x200) - Search deck
- `CATEGORY_DAMAGE` (0x100) - Effect damage
- `CATEGORY_RECOVER` (0x200) - Gain LP
- `CATEGORY_SPECIAL_SUMMON` (0x40) - Special summon

### Locations

- `LOCATION_HAND` (0x2) - Hand
- `LOCATION_MZONE` (0x4) - Monster zone
- `LOCATION_SZONE` (0x8) - Spell/Trap zone
- `LOCATION_GRAVE` (0x10) - Graveyard
- `LOCATION_REMOVED` (0x20) - Banished zone
- `LOCATION_DECK` (0x1) - Deck
- `LOCATION_EXTRA` (0x40) - Extra deck
- `LOCATION_ONFIELD` (0xC) - MZONE | SZONE

### Target Function Pattern

```lua
function c<ID>.target(e,tp,eg,ep,ev,re,r,rp,chk,chkc)
	if chkc then return chkc:IsLocation(<loc>) and chkc:IsControler(tp) end
	if chk==0 then return Duel.IsExistingTarget(<filter>,tp,<loc1>,<loc2>,<count>,nil) end
	Duel.Hint(HINT_SELECTMSG,tp,HINTMSG_TARGET)
	Duel.SelectTarget(tp,<filter>,tp,<loc1>,<loc2>,<count>,<count>,nil)
end
```

### Operation Function Pattern

```lua
function c<ID>.operation(e,tp,eg,ep,ev,re,r,rp)
	local tc=Duel.GetFirstTarget()
	if tc:IsRelateToEffect(e) then
		Duel.<action>(tc,REASON_EFFECT)
	end
end
```

### Cost Function Pattern

```lua
function c<ID>.cost(e,tp,eg,ep,ev,re,r,rp,chk)
	if chk==0 then return Duel.CheckReleaseGroup(tp,<filter>,1,nil) end
	Duel.Hint(HINT_SELECTMSG,tp,HINTMSG_RELEASE)
	local g=Duel.SelectReleaseGroup(tp,<filter>,1,1,nil)
	Duel.Release(g,REASON_COST)
end
```

## Effect Type Detection Guide

### Trigger Effects (诱发效果)

Look for:
- "When..." / "～时候"
- "If..." / "～场合"
- "可以" (optional trigger)

### Ignition Effects (启动效果)

Look for:
- "During your Main Phase" / "主要阶段"
- "You can" / "可以"
- No specific trigger timing

### Continuous Effects (永续效果)

Look for:
- "While..." / "只要"
- "Gains..." / "得到"
- Passive modifications

### Quick Effects (快速效果)

Look for:
- "During either player's turn" / "双方回合"
- "Can be activated" / "能发动"
- "(Quick Effect)" / "（快速效果）"

## Common Patterns

### Destroy Effects

```lua
--Target
Duel.IsExistingTarget(aux.TRUE,tp,0,LOCATION_ONFIELD,1,nil)
--Operation
Duel.Destroy(Duel.GetTargetsRelateToChain(),REASON_EFFECT)
```

### Draw Effects

```lua
--Target
Duel.IsPlayerCanDraw(tp,1)
--Operation
Duel.Draw(tp,1,REASON_EFFECT)
```

### Special Summon Effects

```lua
--Target
Duel.IsExistingMatchingCard(<filter>,tp,<loc>,<loc>,1,nil)
--Operation
Duel.SpecialSummon(<group>,SUMMON_TYPE_<TYPE>,tp,tp,false,false)
```

### Search Effects

```lua
--Target
Duel.IsExistingMatchingCard(<filter>,tp,LOCATION_DECK,0,1,nil)
--Operation
Duel.SearchDeck(tp,tp,<group>,<pos>)
```

### Gain ATK/DEF

```lua
--Continuous
e1:SetType(EFFECT_TYPE_SINGLE)
e1:SetCode(EFFECT_UPDATE_ATTACK)
e1:SetValue(<amount>)
```

## Common Conditions

```lua
-- Turn count limit
Duel.GetTurnPlayer()==tp and Duel.GetCurrentPhase()==PHASE_<NAME>

-- Once per turn
Duel.IsExistingMatchingCard(<filter>,tp,LOCATION_MZONE,0,1,nil)

-- Card existence
Duel.IsExistingMatchingCard(Card.IsFaceup,tp,LOCATION_ONFIELD,0,1,nil)

-- Control check
e:GetHandler():IsControler(tp)
```

## Important Notes

1. **Always** use `aux.Stringid(id,index)` for effect descriptions
2. **Always** call `c:RegisterEffect(e)` to register effects
3. **Always** check `tc:IsRelateToEffect(e)` before operating on targets
4. **Always** use proper reason constants (REASON_EFFECT, REASON_COST, etc.)
5. **Never** forget to handle "if chk==0" in target functions
6. **Always** set proper categories matching the effect's actions
7. **Use** `Duel.GetOperatedGroup()` for cards operated on by effects
8. **Use** `Duel.SelectTarget()` with proper HINTMSG values
9. **Remember** to set CountLimit for once-per-turn effects

## Example Complete Script

```lua
--Sample Monster
function c10000000.initial_effect(c)
	--Summon success: Destroy 1 opponent's card
	local e1=Effect.CreateEffect(c)
	e1:SetDescription(aux.Stringid(10000000,0))
	e1:SetCategory(CATEGORY_DESTROY)
	e1:SetType(EFFECT_TYPE_TRIGGER_O)
	e1:SetCode(EVENT_SUMMON_SUCCESS)
	e1:SetRange(LOCATION_MZONE)
	e1:SetTarget(c10000000.destg)
	e1:SetOperation(c10000000.desop)
	c:RegisterEffect(e1)
end
function c10000000.destg(e,tp,eg,ep,ev,re,r,rp,chk,chkc)
	if chkc then return chkc:IsOnField() and chkc:IsControler(1-tp) end
	if chk==0 then return Duel.IsExistingTarget(aux.TRUE,tp,0,LOCATION_ONFIELD,1,nil) end
	Duel.Hint(HINT_SELECTMSG,tp,HINTMSG_DESTROY)
	Duel.SelectTarget(tp,nil,tp,0,LOCATION_ONFIELD,1,1,nil)
end
function c10000000.desop(e,tp,eg,ep,ev,re,r,rp)
	local tc=Duel.GetFirstTarget()
	if tc:IsRelateToEffect(e) then
		Duel.Destroy(tc,REASON_EFFECT)
	end
end
```

## Return Only The Code

When invoked, return ONLY the Lua script code without explanations, markdown formatting, or additional text. The user should be able to directly use the returned code.
