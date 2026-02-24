/**
 * YGOPRO Script Generator - 示例测试
 *
 * 这是一个简单的测试文件，展示如何使用脚本生成器的各个组件
 * 注意：此测试不需要实际的数据库文件
 */

import { createParser } from '../src/parser/effect-parser.js';
import { createGenerator } from '../src/generator/script-generator.js';
import { Categories, EffectTypes, Events, Locations } from '../src/constants/api.js';

console.log('=== YGOPRO Lua Script Generator - 示例测试 ===\n');

// 示例 1: 解析简单的效果文本
console.log('示例 1: 解析效果文本');
console.log('-------------------');
const parser = createParser();

const effectText = '这张卡召唤成功时，可以破坏对方场上一张卡。选择对方场上1张卡破坏。';
const parseResult = parser.parse(effectText, 99999999, 'zh-CN');

console.log(`效果文本: ${effectText}`);
console.log(`解析出 ${parseResult.effects.length} 个效果`);
parseResult.effects.forEach((effect, index) => {
  console.log(`\n效果 ${index + 1}:`);
  console.log(`  类型: ${effect.effectType}`);
  console.log(`  分类: ${effect.categories.map(c => '0x' + c.toString(16)).join(', ')}`);
  console.log(`  触发事件: ${effect.triggerEvent || '无'}`);
  console.log(`  有代价: ${effect.hasCost}`);
  console.log(`  有对象: ${effect.hasTarget}`);
  console.log(`  关键词: ${effect.keywords.slice(0, 5).join(', ')}`);
});

// 示例 2: 生成 Lua 脚本（不依赖数据库）
console.log('\n\n示例 2: 生成 Lua 脚本');
console.log('-------------------');
const generator = createGenerator();

const scriptResult = generator.generate({
  cardId: 99999999,
  cardName: '测试怪兽',
  effects: parseResult,
  language: 'zh-CN',
});

console.log('生成的 Lua 脚本:');
console.log('-------------------');
console.log(scriptResult.content);
console.log('-------------------');

// 示例 3: 测试不同的效果类型
console.log('\n\n示例 3: 测试不同效果类型');
console.log('-------------------');

const testEffects = [
  '这张卡攻击力上升500。',
  '这张卡被破坏时，可以从卡组特殊召唤1只怪兽。',
  '一回合一次，可以丢弃1张手牌，从卡组抽1张卡。',
  '准备阶段时，可以回复1000基本分。',
];

testEffects.forEach((text, index) => {
  console.log(`\n测试 ${index + 1}: ${text}`);
  const result = parser.parse(text, 99999990 + index, 'zh-CN');
  console.log(`  效果类型: ${result.effects[0]?.effectType || '未知'}`);
  console.log(`  关键词: ${result.effects[0]?.keywords.slice(0, 3).join(', ') || '无'}`);
});

// 示例 4: 展示 API 常量
console.log('\n\n示例 4: YGOPRO API 常量');
console.log('-------------------');
console.log('位置常量 (Locations):');
console.log(`  HAND: ${Locations.HAND}`);
console.log(`  MZONE: ${Locations.MZONE}`);
console.log(`  GRAVE: ${Locations.GRAVE}`);
console.log(`  DECK: ${Locations.DECK}`);

console.log('\n效果类型常量 (EffectTypes):');
console.log(`  IGNITION: ${EffectTypes.IGNITION} (启动效果)`);
console.log(`  TRIGGER: ${EffectTypes.TRIGGER} (诱发效果)`);
console.log(`  CONTINUOUS: ${EffectTypes.CONTINUOUS} (永续效果)`);
console.log(`  QUICK_O: ${EffectTypes.QUICK_O} (快速效果)`);

console.log('\n事件常量 (Events):');
console.log(`  SUMMON_SUCCESS: ${Events.SUMMON_SUCCESS} (召唤成功)`);
console.log(`  DAMAGE: ${Events.DAMAGE} (受到伤害)`);
console.log(`  DESTROY: ${Events.DESTROY} (破坏)`);

console.log('\n分类常量 (Categories):');
console.log(`  TO_GRAVE: ${Categories.TO_GRAVE} (送去墓地)`);
console.log(`  DESTROY: ${Categories.DESTROY} (破坏)`);
console.log(`  DAMAGE: ${Categories.DAMAGE} (伤害)`);
console.log(`  DRAW: ${Categories.DRAW} (抽卡)`);

console.log('\n=== 测试完成 ===');
