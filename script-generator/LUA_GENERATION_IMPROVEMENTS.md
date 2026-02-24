# YGOPRO Lua 脚本生成改进文档

本文档详细说明了对 YGOPRO Lua 脚本生成器所做的关键改进，以解决实际使用中发现的问题。

## 问题总结

1. **卡片类型注册错误** - 陷阱卡被错误注册为怪兽的起动效果
2. **确认卡片逻辑错误** - 错误地使用 `Duel.ConfirmCards` 给对方确认卡片
3. **缺少离场重定向** - 没有考虑 `IsRelateToEffect(e)` 检查
4. **排序逻辑错误** - 错误地询问排序，且排序时机不对
5. **跳过战斗阶段无限制** - 会永久跳过战斗阶段，缺少 Reset 限制

## 解决方案详解

### 1. 卡片类型检测和注册

#### 问题
- 生成器没有正确识别卡片类型（怪兽/魔法/陷阱）
- 陷阱卡被错误注册为怪兽的起动效果 (`EFFECT_TYPE_IGNITION`)

#### 解决方案
- 在 `ParseResult` 接口中添加 `cardType` 字段
- `detectEffectType()` 方法现在根据卡片类型判断效果类型：
  - 陷阱卡/魔法卡第一个效果使用 `EFFECT_TYPE_ACTIVATE` + `EVENT_FREE_CHAIN`
  - 怪兽卡保持原有逻辑
- `generateEffectCode()` 方法添加 `isSpellTrap` 参数
- 陷阱卡/魔法卡效果范围自动设置为 `LOCATION_SZONE`

#### 代码示例
```lua
-- 陷阱卡正确写法
function cxxxxx.initial_effect(c)
    -- 激活效果
    local e1=Effect.CreateEffect(c)
    e1:SetType(EFFECT_TYPE_ACTIVATE)
    e1:SetCode(EVENT_FREE_CHAIN)
    c:RegisterEffect(e1)

    -- 其他效果
    local e2=Effect.CreateEffect(c)
    e2:SetType(EFFECT_TYPE_QUICK_O)
    e2:SetCode(EVENT_FREE_CHAIN)
    e2:SetRange(LOCATION_SZONE)
    e2:SetOperation(cxxxxx.operation)
    c:RegisterEffect(e2)
end
```

### 2. 离场重定向（Relate 逻辑）

#### 问题
- 所有移动卡片的效果都没有检查 `IsRelateToEffect(e)`
- 卡片离开场上后效果会失效

#### 解决方案
- 所有 `operation` 函数中的目标操作都必须先检查 `tc:IsRelateToEffect(e)`
- 使用 `nil` 而不是 `tp` 作为第二个参数，让系统自动处理重定向

#### 正确写法
```lua
function cxxxxx.operation(e,tp,eg,ep,ev,re,r,rp)
    local tc=Duel.GetFirstTarget()
    if tc and tc:IsRelateToEffect(e) then
        Duel.SendtoHand(tc,nil,REASON_EFFECT)  -- 使用 nil 而不是 tp
    end
end
```

#### 为什么使用 nil？
- `Duel.SendtoHand(tc, nil, REASON_EFFECT)` - 系统自动处理重定向
- `Duel.SendtoHand(tc, tp, REASON_EFFECT)` - 强制发送到 tp 玩家手卡，可能导致错误

### 3. 确认卡片 vs 选择卡片

#### 问题
- 错误使用 `Duel.ConfirmCards` 给对方"确认"卡片
- `ConfirmCards` 用于查看隐藏信息，不用于选择

#### 解决方案
区分不同的卡片查看/选择场景：

| 函数 | 用途 | 使用场景 |
|------|------|----------|
| `Duel.ConfirmCards` | 查看隐藏信息 | 查看对方手卡、里侧表示的卡片 |
| `Duel.SelectTarget` | 选择效果对象 | 效果需要选择目标时 |
| `Duel.SelectSelection` | 选择并确认 | 让对方从手卡中选择卡片 |

#### 示例
```lua
-- 错误：使用 ConfirmCards 选择
Duel.ConfirmCards(tp,g)  -- 这只是查看，不能用于选择

-- 正确：让对方从手卡选择
local g=Duel.GetFieldGroup(tp,0,LOCATION_HAND)
Duel.ConfirmCards(tp,g)  -- 先查看
Duel.Hint(HINT_SELECTMSG,tp,HINTMSG_DISCARD)
local sg=g:Select(tp,1,1,nil)  -- 再选择
```

### 4. 排序逻辑

#### 问题
- 错误地在卡片送回卡组前询问排序
- 只有返回卡组时才需要排序，而且应该在送回后立即询问

#### 解决方案
- 只有在返回卡组时才考虑排序
- 使用 `Duel.SendtoDeck(tc, nil, SEQ_DECKBOTTOM, REASON_EFFECT)` 返回卡组底部
- 如果需要保持顺序，使用 `SEQ_DECKTOP` 或 `SEQ_DECKSHUFFLE`

#### 示例
```lua
-- 返回卡组（不需要排序）
Duel.SendtoDeck(tc,nil,SEQ_DECKBOTTOM,REASON_EFFECT)

-- 返回卡组顶部（需要洗切）
Duel.SendtoDeck(tc,nil,SEQ_DECKTOP,REASON_EFFECT)
Duel.ShuffleDeck(tp)  -- 洗切

-- 从墓地返回卡组并排序
local g=Duel.GetMatchingGroup(...)
if g:GetCount()>0 then
    Duel.SendtoDeck(g,nil,SEQ_DECKBOTTOM,REASON_EFFECT)
    -- 注意：不需要手动询问排序，系统会自动处理
end
```

### 5. 跳过战斗阶段的 Reset 限制

#### 问题
- 跳过战斗阶段的效果没有 Reset 限制
- 会永久跳过战斗阶段（严重 Bug）

#### 解决方案
所有影响阶段的效果必须添加 Reset 限制：
```lua
e:SetReset(RESET_PHASE+PHASE_END)  -- 当回合结束
e:SetReset(RESET_EVENT+RESETS_STANDARD)  -- 卡片离场时重置
```

#### 正确写法
```lua
function cxxxxx.operation(e,tp,eg,ep,ev,re,r,rp)
    local e1=Effect.CreateEffect(e:GetHandler())
    e1:SetType(EFFECT_TYPE_FIELD)
    e1:SetCode(EFFECT_SKIP_BP)
    e1:SetProperty(EFFECT_FLAG_PLAYER_TARGET)
    e1:SetTargetRange(0,1)  -- 对方
    e1:SetReset(RESET_PHASE+PHASE_END)  -- 必须添加！
    Duel.RegisterEffect(e1,tp)
end
```

### 6. 效果类型检测优化

#### 改进
- `detectEffectType()` 方法现在考虑卡片类型
- 区分陷阱卡/魔法卡和怪兽卡的不同效果类型
- 更精确的关键词匹配

#### 检测逻辑
```
1. 如果是陷阱卡/魔法卡：
   - 第一个效果 → EFFECT_TYPE_ACTIVATE
   - 有触发事件 → EFFECT_TYPE_TRIGGER_O/F
   - 否则 → EFFECT_TYPE_QUICK_O

2. 如果是怪兽卡：
   - 有触发事件 → EFFECT_TYPE_TRIGGER_O/F
   - "即时"/"quick" → EFFECT_TYPE_QUICK_O
   - "主要阶段" → EFFECT_TYPE_IGNITION
   - "只要"/"的场合" → EFFECT_TYPE_CONTINUOUS
```

### 7. Target 函数改进

#### 改进
- 添加 `Duel.SetOperationInfo()` 用于操作提示
- 根据 categories 自动选择正确的 HINTMSG
- 添加 `chkc` 检查支持重选

#### 示例
```lua
function cxxxxx.target(e,tp,eg,ep,ev,re,r,rp,chk,chkc)
    if chkc then return chkc:IsLocation(LOCATION_ONFIELD) end
    if chk==0 then return Duel.IsExistingTarget(nil,tp,LOCATION_ONFIELD,LOCATION_ONFIELD,1,nil) end
    Duel.Hint(HINT_SELECTMSG,tp,HINTMSG_DESTROY)
    Duel.SelectTarget(tp,nil,tp,LOCATION_ONFIELD,LOCATION_ONFIELD,1,1,nil)
end
```

## 使用建议

1. **始终提供卡片数据**
   ```typescript
   const cardData = await cdbReader.getFullCard(cardId);
   const options = {
     cardId,
     cardName: cardData.name,
     effects: parseResult,
     cardData,  // 重要！提供完整卡片数据
     language: 'zh-CN'
   };
   ```

2. **验证生成的代码**
   - 检查陷阱卡是否使用 `EFFECT_TYPE_ACTIVATE`
   - 检查所有 `operation` 是否有 `IsRelateToEffect` 检查
   - 检查影响阶段的效果是否有 `SetReset`

3. **测试重点**
   - 陷阱卡/魔法卡的激活
   - 目标离开场上的情况
   - 跳过阶段效果的持续时间
   - 返回卡组时的排序行为

## 常见错误对照表

| 错误 | 正确 |
|------|------|
| `e1:SetType(EFFECT_TYPE_IGNITION)` (陷阱卡) | `e1:SetType(EFFECT_TYPE_ACTIVATE)` |
| `Duel.SendtoHand(tc,tp,REASON_EFFECT)` | `Duel.SendtoHand(tc,nil,REASON_EFFECT)` |
| `if tc then` | `if tc and tc:IsRelateToEffect(e) then` |
| 没有 `SetReset` 的跳过 BP | `e1:SetReset(RESET_PHASE+PHASE_END)` |
| `Duel.ConfirmCards` 用于选择 | `Duel.SelectTarget` |

## 更新日志

### 2024-02-23
- 修复卡片类型检测，正确处理陷阱卡/魔法卡
- 添加离场重定向支持
- 修复跳过战斗阶段的 Reset 限制
- 优化效果类型检测逻辑
- 改进 target 和 operation 函数生成
