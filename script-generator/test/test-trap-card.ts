/**
 * 测试陷阱卡生成的正确性
 */

import { EffectParser } from '../src/parser/effect-parser.js';
import { ScriptGenerator } from '../src/generator/script-generator.js';
import { Types } from '../src/constants/api.js';

console.log('=== YGOPRO Lua Script Generator - 陷阱卡生成测试 ===\n');

// 测试1: 破坏效果的陷阱卡
console.log('测试 1: 破坏效果的陷阱卡');
console.log('-------------------');

const destroyTrapData = {
  id: 10000041,
  alias: 0,
  setcode: 0,
  type: Types.TRAP | Types.NORMAL,
  level: 0,
  attribute: 0,
  race: 0,
  attack: 0,
  defense: 0,
  lscale: 0,
  rscale: 0,
  link: 0,
  name: '破坏陷阱',
  desc: '①：选择对方场上1只怪兽破坏。那之后，可以跳过下次战斗阶段。',
  str1: '', str2: '', str3: '', str4: '',
  str5: '', str6: '', str7: '', str8: '',
  str9: '', str10: '', str11: '', str12: '',
  str13: '', str14: '', str15: '', str16: '',
};

const parser = new EffectParser();
const generator = new ScriptGenerator();

const parseResult1 = parser.parse(destroyTrapData.desc, destroyTrapData.id, 'zh-CN', destroyTrapData.type);
const result1 = generator.generate({
  cardId: destroyTrapData.id,
  cardName: destroyTrapData.name,
  effects: parseResult1,
  cardData: destroyTrapData,
  language: 'zh-CN',
});

console.log('生成的代码片段:');
console.log(result1.content.substring(result1.content.indexOf('function c'), result1.content.indexOf('function c') + 500));

console.log('\n验证:');
console.log('✓ 使用 EFFECT_TYPE_ACTIVATE:', result1.content.includes('EFFECT_TYPE_ACTIVATE'));
console.log('✓ 使用 LOCATION_SZONE:', result1.content.includes('LOCATION_SZONE'));
console.log('✓ 有 IsRelateToEffect 检查:', result1.content.includes('IsRelateToEffect'));

// 测试2: 加入手卡的陷阱卡
console.log('\n测试 2: 加入手卡效果的陷阱卡');
console.log('-------------------');

const handTrapData = {
  ...destroyTrapData,
  id: 10000042,
  name: '加入手卡陷阱',
  desc: '①：选择对方场上1只怪兽，将其加入手卡。',
};

const parseResult2 = parser.parse(handTrapData.desc, handTrapData.id, 'zh-CN', handTrapData.type);
const result2 = generator.generate({
  cardId: handTrapData.id,
  cardName: handTrapData.name,
  effects: parseResult2,
  cardData: handTrapData,
  language: 'zh-CN',
});

console.log('生成的操作代码:');
const opMatch = result2.content.match(/function c\d+\.operation[\s\S]*?end/);
if (opMatch) {
  console.log(opMatch[0]);
}

console.log('\n验证:');
console.log('✓ 使用 nil 作为重定向参数:', result2.content.includes('SendtoHand(tc,nil'));

// 测试3: 跳过战斗阶段的陷阱卡
console.log('\n测试 3: 跳过战斗阶段的陷阱卡');
console.log('-------------------');

const skipBpTrapData = {
  ...destroyTrapData,
  id: 10000043,
  name: '跳过BP陷阱',
  desc: '①：跳过下次战斗阶段。', // 简单的跳过BP效果
};

const parseResult3 = parser.parse(skipBpTrapData.desc, skipBpTrapData.id, 'zh-CN', skipBpTrapData.type);
const result3 = generator.generate({
  cardId: skipBpTrapData.id,
  cardName: skipBpTrapData.name,
  effects: parseResult3,
  cardData: skipBpTrapData,
  language: 'zh-CN',
});

console.log('生成的操作代码:');
const opMatch3 = result3.content.match(/function c\d+\.operation[\s\S]*?end/);
if (opMatch3) {
  console.log(opMatch3[0]);
}

console.log('\n验证:');
console.log('✓ 跳过 BP 有 Reset 限制:', result3.content.includes('RESET_PHASE+PHASE_END'));
console.log('✓ 使用 EFFECT_SKIP_BP:', result3.content.includes('EFFECT_SKIP_BP'));

console.log('\n所有测试完成！');
