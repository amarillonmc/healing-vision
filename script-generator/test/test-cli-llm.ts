/**
 * YGOPRO Script Generator - CLI LLM 集成测试
 *
 * 测试 CLI 内置 LLM 的功能
 * 注意：此测试需要已安装 Claude Code 或 OpenCode
 */

import { createParser } from '../src/parser/effect-parser.js';
import { createCLILLMGenerator } from '../src/generator/cli-llm-generator.js';

async function testCLILLM() {
  console.log('=== YGOPRO CLI LLM Generator - 测试 ===\n');

  // 检查是否有可用的 CLI 工具
  console.log('步骤 1: 检测 CLI 工具...');
  let cliLlmGenerator;
  try {
    cliLlmGenerator = createCLILLMGenerator();
    console.log('✓ CLI 工具检测成功\n');
  } catch (error) {
    console.error('✗ CLI 工具检测失败:', error instanceof Error ? error.message : error);
    console.log('\n请安装以下工具之一：');
    console.log('  - Claude Code: npm install -g @anthropic-ai/claude-code');
    console.log('  - OpenCode: npm install -g opencode-cli');
    process.exit(1);
  }

  // 测试复杂效果解析
  console.log('步骤 2: 解析复杂效果文本...');
  const parser = createParser();

  const complexEffect = `这张卡的特殊召唤成功的场合，以自己墓地1只怪兽为对象才能发动。
那只怪兽特殊召唤。这个效果特殊召唤的怪兽在这个效果的发动后，不能作为这张卡的效果的对象。
一回合一次，这张卡被战斗或者对方的卡的效果破坏的场合，可以作为代替把自己墓地1只怪兽除外。`;

  const parseResult = parser.parse(complexEffect, 99999999, 'zh-CN');

  console.log(`解析出 ${parseResult.effects.length} 个效果`);
  console.log(`需要 LLM: ${createCLILLMGenerator.constructor.needsLLM ? '是' : '否'}\n`);

  // 测试 LLM 生成
  console.log('步骤 3: 使用 CLI LLM 生成脚本...');
  console.log('（这可能需要一些时间...）\n');

  try {
    const script = await cliLlmGenerator.generate({
      cardId: 99999999,
      cardName: '测试怪兽',
      effectText: complexEffect,
      parsedEffects: parseResult,
      language: 'zh-CN',
    });

    console.log('✓ 脚本生成成功！\n');
    console.log('=== 生成的 Lua 脚本 ===\n');
    console.log(script);
    console.log('\n=== 脚本结束 ===\n');

    // 清理
    cliLlmGenerator.cleanup();

    console.log('✓ 测试完成！');

  } catch (error) {
    console.error('✗ LLM 生成失败:', error instanceof Error ? error.message : error);
    console.log('\n可能的原因：');
    console.log('  1. CLI 工具未正确安装或配置');
    console.log('  2. 网络连接问题');
    console.log('  3. API 限流或错误');
    cliLlmGenerator.cleanup();
    process.exit(1);
  }
}

// 运行测试
testCLILLM().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
