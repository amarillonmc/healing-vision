#!/usr/bin/env node

/**
 * YGOPRO Script Generator - Simple wrapper for Claude Code/OpenCode
 *
 * This is a simple JS wrapper that makes it easier to call from Claude Code/OpenCode
 *
 * Usage in Claude Code/OpenCode:
 *   Just say "generate card 10000000 with effect: ..."
 *   Or use: /generate 10000000 "effect text"
 */

import { createReader } from '../../dist/data/cdb-reader.js';
import { createParser } from '../../dist/parser/effect-parser.js';
import { createGenerator } from '../../dist/generator/script-generator.js';
import { createCLILLMGenerator } from '../../dist/generator/cli-llm-generator.js';
import * as fs from 'fs';
import * as path from 'path';

export async function generate(cardId, effectText, language = 'zh-CN') {
  const id = parseInt(cardId);
  if (isNaN(id)) {
    throw new Error(`Invalid card ID: ${cardId}`);
  }

  console.log(`\n📝 Generating script for card ${id}...`);
  console.log(`📄 Effect: ${effectText.substring(0, 100)}${effectText.length > 100 ? '...' : ''}`);
  console.log(`🌐 Language: ${language}\n`);

  // Open database reader
  const reader = createReader(language);
  reader.open();

  const cardData = reader.getFullCard(id);
  const cardName = cardData?.name ?? `Card ${id}`;

  if (cardData) {
    console.log(`🃏 Found card: ${cardName}`);
  } else {
    console.log(`⚠️  Card ${id} not found in database, using generic name`);
  }

  reader.close();

  // Parse effect
  const parser = createParser();
  const parsedEffects = parser.parse(effectText, id, language);

  console.log(`✅ Parsed ${parsedEffects.effects.length} effect(s)\n`);

  // Determine generator
  let scriptContent;

  try {
    console.log(`🤖 Attempting to use CLI LLM generator...`);
    const cliLlmGenerator = createCLILLMGenerator();
    scriptContent = await cliLlmGenerator.generate({
      cardId: id,
      cardName,
      effectText,
      parsedEffects,
      cardData: cardData ?? undefined,
      language,
    });
    cliLlmGenerator.cleanup();
    console.log(`✅ Generated using CLI LLM\n`);
  } catch (error) {
    console.log(`⚠️  CLI LLM failed, using basic generator...\n`);
    const generator = createGenerator();
    const result = generator.generate({
      cardId: id,
      cardName,
      effects: parsedEffects,
      cardData: cardData ?? undefined,
      language,
    });
    scriptContent = result.content;
    console.log(`✅ Generated using basic generator\n`);
  }

  // Save to output directory
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `c${id}.lua`);
  fs.writeFileSync(filePath, scriptContent, 'utf-8');

  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log(`✨ Script generated successfully!`);
  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log(`\n📁 File: ${filePath}`);
  console.log(`🃏 Card: ${cardName} (ID: ${id})`);
  console.log(`\n───────────────────────────────────────────────────────────────`);
  console.log(`Generated Lua Script:`);
  console.log(`───────────────────────────────────────────────────────────────\n`);
  console.log(scriptContent);
  console.log(`\n───────────────────────────────────────────────────────────────`);
  console.log(`💾 Script saved to: ${filePath}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  return { content: scriptContent, filePath, cardName };
}

// If run directly with node
if (process.argv[1] && process.argv[1].endsWith('generate.mjs')) {
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const cardId = args[0];
    const effectText = args[1];
    const language = args[2] || 'zh-CN';
    generate(cardId, effectText, language).catch(console.error);
  } else {
    console.error('Usage: node generate.mjs <cardId> <effectText> [language]');
    console.error('Example: node generate.mjs 10000000 "这张卡的攻击力上升500"');
  }
}
