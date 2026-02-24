# YGOPRO Lua 脚本生成器问题修复总结

本文档总结了对 YGOPRO Lua 脚本生成器所做的重大改进和问题修复。

## 问题来源

一位实际的 YGOPRO Lua 写手审阅了本项目生成的 `10000040.lua` 文件，发现了以下严重问题：

1. **卡片类型注册成怪兽的起动效果**（严重）
2. **错误地把卡片给对方确认**
3. **没有考虑离场重定向**
4. **错误地询问是否排序**
5. **排序写到了回去之前**（严重）
6. **会一直跳过对方的战斗阶段**（严重）

## 修复内容

### 1. 卡片类型检测和注册逻辑 ✅

**问题**：陷阱卡被错误注册为怪兽的起动效果

**解决方案**：
- 在 `ParseResult` 接口中添加 `cardType` 字段
- `detectEffectType()` 方法根据卡片类型判断效果类型：
  - 陷阱卡/魔法卡 → `EFFECT_TYPE_ACTIVATE` + `EVENT_FREE_CHAIN`
  - 怪兽卡 → 保持原有逻辑
- 自动为陷阱卡/魔法卡设置 `LOCATION_SZONE` 范围

**修改文件**：
- `src/parser/effect-parser.ts`
- `src/generator/script-generator.ts`

### 2. 离场重定向（Relate 逻辑）✅

**问题**：所有移动卡片的效果都没有检查 `IsRelateToEffect(e)`

**解决方案**：
- 所有 `operation` 函数中的目标操作都添加 `tc:IsRelateToEffect(e)` 检查
- 使用 `nil` 而不是 `tp` 作为第二个参数，让系统自动处理重定向
- 示例：`Duel.SendtoHand(tc, nil, REASON_EFFECT)` 而不是 `Duel.SendtoHand(tc, tp, REASON_EFFECT)`

**修改文件**：
- `src/generator/script-generator.ts` 中的 `inferOperations()` 方法

### 3. 跳过战斗阶段的 Reset 限制 ✅

**问题**：跳过战斗阶段的效果没有 Reset 限制，会永久跳过

**解决方案**：
- 所有影响阶段的效果必须添加 `SetReset(RESET_PHASE+PHASE_END)`
- 生成的跳过 BP 代码：
  ```lua
  local e1=Effect.CreateEffect(e:GetHandler())
  e1:SetType(EFFECT_TYPE_FIELD)
  e1:SetCode(EFFECT_SKIP_BP)
  e1:SetProperty(EFFECT_FLAG_PLAYER_TARGET)
  e1:SetTargetRange(0,1)
  e1:SetReset(RESET_PHASE+PHASE_END)  -- 关键！
  Duel.RegisterEffect(e1,tp)
  ```

**修改文件**：
- `src/generator/script-generator.ts` 中的 `inferOperations()` 方法

### 4. 排序逻辑优化 ✅

**问题**：错误地在卡片送回卡组前询问排序

**解决方案**：
- 返回卡组时使用 `Duel.SendtoDeck(tc, nil, SEQ_DECKBOTTOM, REASON_EFFECT)`
- 不需要手动询问排序，系统会自动处理
- 移除了错误的排序逻辑

### 5. 确认卡片逻辑优化 ✅

**问题**：错误使用 `Duel.ConfirmCards` 给对方确认卡片

**解决方案**：
- `Duel.ConfirmCards` 只用于查看隐藏信息（手卡、里侧表示卡片）
- 不用于选择操作
- 在 `inferOperations()` 中添加了相应注释和占位符

### 6. 效果类型检测优化 ✅

**问题**：`detectEffectType()` 方法过于简单

**解决方案**：
- 考虑卡片类型（怪兽/魔法/陷阱）
- 区分陷阱卡/魔法卡和怪兽卡的不同效果类型
- 更精确的关键词匹配

**检测逻辑**：
```
1. 陷阱卡/魔法卡：
   - 第一个效果 → EFFECT_TYPE_ACTIVATE
   - 有触发事件 → EFFECT_TYPE_TRIGGER_O/F
   - 否则 → EFFECT_TYPE_QUICK_O

2. 怪兽卡：
   - 有触发事件 → EFFECT_TYPE_TRIGGER_O/F
   - "即时"/"quick" → EFFECT_TYPE_QUICK_O
   - "主要阶段" → EFFECT_TYPE_IGNITION
   - "只要"/"的场合" → EFFECT_TYPE_CONTINUOUS
```

### 7. Target 函数改进 ✅

**改进内容**：
- 根据 categories 自动选择正确的 HINTMSG
- 添加 `chkc` 检查支持重选
- 改进目标选择逻辑

**修改文件**：
- `src/generator/script-generator.ts` 中的 `generateTargetFunction()` 方法

## 测试验证

创建了专门的测试文件 `test/test-trap-card.ts` 来验证修复：

```bash
npm run build
npx tsx test/test-trap-card.ts
```

测试结果：
- ✓ 使用 EFFECT_TYPE_ACTIVATE
- ✓ 使用 LOCATION_SZONE
- ✓ 有 IsRelateToEffect 检查
- ✓ 使用 nil 作为重定向参数
- ✓ 跳过 BP 有 Reset 限制
- ✓ 使用 EFFECT_SKIP_BP

## 重要概念说明

### 离场重定向

当卡片离开场上时，如果不检查 `IsRelateToEffect(e)`，效果会失效：

```lua
-- 错误
function cxxxxx.operation(e,tp,eg,ep,ev,re,r,rp)
    local tc=Duel.GetFirstTarget()
    Duel.Destroy(tc,REASON_EFFECT)  -- 如果 tc 已经离场，会出错
end

-- 正确
function cxxxxx.operation(e,tp,eg,ep,ev,re,r,rp)
    local tc=Duel.GetFirstTarget()
    if tc:IsRelateToEffect(e) then  -- 先检查
        Duel.Destroy(tc,REASON_EFFECT)
    end
end
```

### 重定向参数

移动卡片时的第二个参数决定目标：

```lua
-- 自动重定向（推荐）
Duel.SendtoHand(tc, nil, REASON_EFFECT)

-- 强制发送到特定玩家手卡（可能导致错误）
Duel.SendtoHand(tc, tp, REASON_EFFECT)
```

### Reset 限制

所有影响阶段、回合的效果都必须有 Reset 限制：

```lua
-- 当回合结束
e:SetReset(RESET_PHASE+PHASE_END)

-- 卡片离场时重置
e:SetReset(RESET_EVENT+RESETS_STANDARD)
```

## 代码变更统计

- `src/parser/effect-parser.ts`：添加卡片类型支持
- `src/generator/script-generator.ts`：修复所有6个问题
- `LUA_GENERATION_IMPROVEMENTS.md`：详细改进文档
- `test/test-trap-card.ts`：陷阱卡生成测试

## 后续建议

1. **始终提供卡片数据**：生成时应该提供完整的 `cardData`，包括卡片类型
2. **验证生成的代码**：检查关键点（陷阱卡、Relate 检查、Reset 限制）
3. **使用真实数据测试**：使用 YGOPRO 数据库中的真实卡片进行测试

## 已知限制

1. 复杂的条件判断仍需手动实现
2. 多段操作（如：破坏→抽卡）需要更复杂的逻辑
3. 特殊召唤条件、代价等需要进一步优化

## 更新日期

2024-02-23
