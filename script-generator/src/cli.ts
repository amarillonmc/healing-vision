#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createReader, CDBReader, Language } from './data/cdb-reader.js';
import { createParser, EffectParser } from './parser/effect-parser.js';
import { createGenerator, ScriptGenerator } from './generator/script-generator.js';
import { createLLMGenerator, LLMGenerator } from './generator/llm-generator.js';

const program = new Command();

program
  .name('ygo-gen')
  .description('Generate ygopro Lua scripts from card effect text')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate a Lua script for a card')
  .requiredOption('-i, --id <number>', 'Card ID')
  .requiredOption('-e, --effect <text>', 'Effect text (or path to file)')
  .option('-l, --lang <language>', 'Language (zh-CN, en-US, ja-JP)', 'zh-CN')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('--setcode <number>', 'Custom setcode')
  .option('--use-llm', 'Use LLM for complex effects', false)
  .option('--dry-run', 'Print script without writing file', false)
  .action(async (options) => {
    const cardId = parseInt(options.id, 10);
    const language = options.lang as Language;
    const outputDir = options.output;
    
    let effectText = options.effect;
    if (fs.existsSync(effectText)) {
      effectText = fs.readFileSync(effectText, 'utf-8');
    }
    
    console.log(`Generating script for card ${cardId}...`);
    
    try {
      const reader = createReader(language);
      reader.open();

      const cardData = reader.getFullCard(cardId) ?? undefined;
      const cardName = cardData?.name ?? `Card ${cardId}`;

      reader.close();

      const parser = createParser();
      const parsedEffects = parser.parse(effectText, cardId, language);

      console.log(`Parsed ${parsedEffects.effects.length} effect(s)`);

      let scriptContent: string;

      if (options.useLlm && LLMGenerator.needsLLM(parsedEffects)) {
        console.log('Using LLM for complex effects...');
        const llmGenerator = createLLMGenerator();
        scriptContent = await llmGenerator.generate({
          cardId,
          cardName,
          effectText,
          parsedEffects,
          cardData,
          language,
        });
      } else {
        const generator = createGenerator();
        const result = generator.generate({
          cardId,
          cardName,
          effects: parsedEffects,
          cardData,
          language,
          customSetcode: options.setcode ? parseInt(options.setcode, 10) : undefined,
        });
        scriptContent = result.content;
      }
      
      if (options.dryRun) {
        console.log('\n--- Generated Script ---\n');
        console.log(scriptContent);
        console.log('\n--- End of Script ---\n');
      } else {
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, `c${cardId}.lua`);
        fs.writeFileSync(outputPath, scriptContent);
        console.log(`Script saved to: ${outputPath}`);
      }
      
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for cards in the database')
  .argument('<query>', 'Search query')
  .option('-l, --lang <language>', 'Language', 'zh-CN')
  .option('-n, --limit <number>', 'Maximum results', '10')
  .action((query, options) => {
    const language = options.lang as Language;
    const limit = parseInt(options.limit, 10);
    
    try {
      const reader = createReader(language);
      reader.open();
      
      const cards = reader.searchCards(query, limit);
      
      console.log(`Found ${cards.length} card(s):\n`);
      for (const card of cards) {
        console.log(`[${card.id}] ${card.name}`);
        console.log(`  ${card.desc.substring(0, 100)}...`);
        console.log();
      }
      
      reader.close();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Get card information')
  .argument('<id>', 'Card ID')
  .option('-l, --lang <language>', 'Language', 'zh-CN')
  .action((id, options) => {
    const cardId = parseInt(id, 10);
    const language = options.lang as Language;
    
    try {
      const reader = createReader(language);
      reader.open();

      const card = reader.getFullCard(cardId) ?? undefined;

      if (card === undefined) {
        console.log(`Card ${cardId} not found`);
        return;
      }

      console.log(`\n=== ${card.name} ===`);
      console.log(`ID: ${card.id}`);
      console.log(`Type: 0x${card.type.toString(16)}`);
      console.log(`Attribute: 0x${card.attribute.toString(16)}`);
      console.log(`Race: 0x${card.race.toString(16)}`);
      console.log(`Level: ${card.level}`);
      console.log(`ATK/DEF: ${card.attack}/${card.defense}`);
      console.log(`\nEffect:\n${card.desc}`);

      reader.close();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('parse')
  .description('Parse effect text and show analysis')
  .argument('<text>', 'Effect text to parse')
  .option('-l, --lang <language>', 'Language', 'zh-CN')
  .action((text, options) => {
    const language = options.lang;
    const parser = createParser();
    
    const result = parser.parse(text, 0, language);
    
    console.log('\n=== Parse Result ===\n');
    console.log(`Total effects: ${result.effects.length}`);
    
    for (const effect of result.effects) {
      console.log(`\n--- ${effect.id} ---`);
      console.log(`Type: ${effect.effectType}`);
      console.log(`Categories: ${effect.categories.map(c => `0x${c.toString(16)}`).join(', ') || 'none'}`);
      console.log(`Trigger: ${effect.triggerEvent || 'none'}`);
      console.log(`Has cost: ${effect.hasCost}`);
      console.log(`Has target: ${effect.hasTarget}`);
      console.log(`Keywords: ${effect.keywords.slice(0, 10).join(', ')}`);
      if (effect.conditions.length) {
        console.log(`Conditions: ${effect.conditions.join('; ')}`);
      }
      if (effect.restrictions.length) {
        console.log(`Restrictions: ${effect.restrictions.join('; ')}`);
      }
    }
  });

program.parse();
