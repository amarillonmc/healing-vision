#!/usr/bin/env node

/**
 * YGOPRO Script Generator Skill for Claude Code/OpenCode
 *
 * Usage: /generate <cardId> <effectText> [language]
 *
 * Examples:
 *   /generate 10000000 "这张卡召唤成功时，可以破坏对方场上一张卡"
 *   /generate 10000001 "When this card is Normal Summoned: You can destroy 1 card your opponent controls." en-US
 *   /generate 10000002 "Return all cards you control to the bottom of your deck" en-US
 */

import { createReader, Language } from '../../../src/data/cdb-reader.js';
import { createParser } from '../../../src/parser/effect-parser.js';
import { createGenerator } from '../../../src/generator/script-generator.js';
import { createCLILLMGenerator } from '../../../src/generator/cli-llm-generator.js';
import * as fs from 'fs';
import * as path from 'path';

interface GenerateInput {
  cardId: number;
  effectText: string;
  language?: Language;
}

/**
 * Parse user input into GenerateInput
 * Supports multiple formats:
 * - "/generate 10000000 effect text"
 * - "/generate 10000000 effect text zh-CN"
 * - "/generate cardId:10000000 effect:Return cards... lang:en-US"
 */
function parseInput(args: string[]): GenerateInput {
  if (args.length === 0) {
    throw new Error('Card ID is required');
  }

  // Try to parse card ID from first argument
  const cardId = parseInt(args[0], 10);
  if (isNaN(cardId)) {
    throw new Error(`Invalid card ID: ${args[0]}`);
  }

  // Rest is effect text (possibly ending with language code)
  let effectText = args.slice(1).join(' ');

  // Detect language at the end (zh-CN, en-US, ja-JP)
  let language: Language = 'zh-CN';
  const langMatch = effectText.match(/\s(zh-CN|en-US|ja-JP)\s*$/i);
  if (langMatch) {
    language = langMatch[1] as Language;
    effectText = effectText.replace(/\s(zh-CN|en-US|ja-JP)\s*$/i, '').trim();
  }

  if (!effectText) {
    throw new Error('Effect text is required');
  }

  return { cardId, effectText, language };
}

/**
 * Generate Lua script for the given card and effect
 */
async function generateScript(input: GenerateInput): Promise<{ content: string; filePath: string; cardName: string }> {
  const { cardId, effectText, language = 'zh-CN' } = input;

  console.log(`\n📝 Generating script for card ${cardId}...`);
  console.log(`📄 Effect: ${effectText.substring(0, 100)}${effectText.length > 100 ? '...' : ''}`);
  console.log(`🌐 Language: ${language}\n`);

  // Open database reader
  const reader = createReader(language);
  reader.open();

  const cardData = reader.getFullCard(cardId);
  const cardName = cardData?.name ?? `Card ${cardId}`;

  if (cardData) {
    console.log(`🃏 Found card: ${cardName}`);
  } else {
    console.log(`⚠️  Card ${cardId} not found in database, using generic name`);
  }

  reader.close();

  // Parse effect
  const parser = createParser();
  const parsedEffects = parser.parse(effectText, cardId, language);

  console.log(`✅ Parsed ${parsedEffects.effects.length} effect(s)\n`);

  // Determine generator (try CLI LLM first, fallback to basic)
  let scriptContent: string;

  try {
    console.log(`🤖 Attempting to use CLI LLM generator...`);
    const cliLlmGenerator = createCLILLMGenerator();
    scriptContent = await cliLlmGenerator.generate({
      cardId,
      cardName,
      effectText,
      parsedEffects,
      cardData: cardData ?? undefined,
      language,
    });
    cliLlmGenerator.cleanup();
    console.log(`✅ Generated using CLI LLM\n`);
  } catch (error) {
    console.log(`⚠️  CLI LLM failed (${error instanceof Error ? error.message : error})`);
    console.log(`📋 Falling back to basic generator...\n`);
    const generator = createGenerator();
    const result = generator.generate({
      cardId,
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

  const filePath = path.join(outputDir, `c${cardId}.lua`);
  fs.writeFileSync(filePath, scriptContent, 'utf-8');

  return { content: scriptContent, filePath, cardName };
}

/**
 * Main skill function - called by Claude Code/OpenCode
 */
export async function generateSkill(args: string[]): Promise<void> {
  try {
    const input = parseInput(args);
    const { content, filePath, cardName } = await generateScript(input);

    console.log(`═══════════════════════════════════════════════════════════════`);
    console.log(`✨ Script generated successfully!`);
    console.log(`═══════════════════════════════════════════════════════════════`);
    console.log(`\n📁 File: ${filePath}`);
    console.log(`🃏 Card: ${cardName} (ID: ${input.cardId})`);
    console.log(`\n───────────────────────────────────────────────────────────────`);
    console.log(`Generated Lua Script:`);
    console.log(`───────────────────────────────────────────────────────────────\n`);
    console.log(content);
    console.log(`\n───────────────────────────────────────────────────────────────`);
    console.log(`💾 Script saved to: ${filePath}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}\n`);
    console.log(`Usage: /generate <cardId> <effectText> [language]\n`);
    console.log(`Examples:`);
    console.log(`  /generate 10000000 "这张卡召唤成功时，可以破坏对方场上一张卡"`);
    console.log(`  /generate 10000001 "When this card is Normal Summoned: You can destroy 1 card your opponent controls." en-US\n`);
    throw error;
  }
}

// Allow running directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  generateSkill(args).catch(console.error);
}

export default generateSkill;
