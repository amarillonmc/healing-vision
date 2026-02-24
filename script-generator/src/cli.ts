#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createReader, CDBReader, Language } from './data/cdb-reader.js';
import { createParser, EffectParser } from './parser/effect-parser.js';
import { createGenerator, ScriptGenerator } from './generator/script-generator.js';
import { createLLMGenerator, LLMGenerator } from './generator/llm-generator.js';
import { createCLILLMGenerator, CLILLMGenerator } from './generator/cli-llm-generator.js';
import { createValidator, LuaValidator } from './validator/lua-validator.js';

const program = new Command();

program
  .name('ygo-gen')
  .description('Generate ygopro Lua scripts from card effect text')
  .version('0.2.0');

program
  .command('generate')
  .description('Generate a Lua script for a card')
  .requiredOption('-i, --id <number>', 'Card ID')
  .option('-e, --effect <text>', 'Effect text (or path to file). For complex effects, use a file path instead.')
  .option('-f, --file <path>', 'Path to file containing effect text (alternative to -e)')
  .option('-l, --lang <language>', 'Language (zh-CN, en-US, ja-JP)', 'zh-CN')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('--setcode <number>', 'Custom setcode')
  .option('--use-llm', 'Use LLM for complex effects (requires API key)', false)
  .option('--use-cli-llm', 'Use CLI built-in LLM (Claude Code or OpenCode)', false)
  .option('--llm-provider <provider>', 'CLI LLM provider (claude-code or open-code)', 'auto-detect')
  .option('--dry-run', 'Print script without writing file', false)
  .action(async (options) => {
    const cardId = parseInt(options.id, 10);
    const language = options.lang as Language;
    const outputDir = options.output;

    // Get effect text from either -e, -f, or stdin
    let effectText = '';
    if (options.file) {
      effectText = fs.readFileSync(options.file, 'utf-8');
    } else if (options.effect) {
      effectText = options.effect;
      if (fs.existsSync(effectText)) {
        effectText = fs.readFileSync(effectText, 'utf-8');
      }
    } else {
      console.error('Error: Either --effect or --file must be specified');
      process.exit(1);
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

      // 决定使用哪种生成方式
      const useCLI = options.useCliLlm;
      const useAPI = options.useLlm;
      const needsLLM = CLILLMGenerator.needsLLM(parsedEffects);

      // 当用户明确指定 --use-cli-llm 时，强制使用 CLI LLM
      // 否则，仅当效果复杂到需要 LLM 时才使用
      if (useCLI) {
        console.log('Using CLI built-in LLM...');
        const cliLlmGenerator = createCLILLMGenerator({
          provider: options.llmProvider === 'auto-detect' ? undefined : options.llmProvider,
        });
        try {
          scriptContent = await cliLlmGenerator.generate({
            cardId,
            cardName,
            effectText,
            parsedEffects,
            cardData,
            language,
          });
          cliLlmGenerator.cleanup();
        } catch (error) {
          console.error('CLI LLM failed, falling back to basic generator...');
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
      } else if (useAPI && LLMGenerator.needsLLM(parsedEffects)) {
        console.log('Using API LLM for complex effects...');
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

program
  .command('validate')
  .description('Validate a Lua script file')
  .argument('<file>', 'Lua script file to validate')
  .option('--card-id <number>', 'Card ID for validation')
  .action((file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const script = fs.readFileSync(file, 'utf-8');
      const validator = createValidator();

      console.log(`Validating ${file}...\n`);

      const result = validator.validate(
        script,
        options.cardId ? parseInt(options.cardId, 10) : undefined
      );

      const report = validator.formatReport(result);
      console.log(report);

      if (!result.valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Run built-in tests')
  .action(() => {
    console.log('Running built-in tests...\n');

    const validator = createValidator();

    // 测试用例
    const testScripts = [
      {
        name: 'Valid simple script',
        script: `
function c10000000.initial_effect(c)
  local e1=Effect.CreateEffect(c)
  e1:SetDescription(aux.Stringid(10000000,0))
  e1:SetCategory(CATEGORY_DESTROY)
  e1:SetType(EFFECT_TYPE_TRIGGER_O)
  e1:SetCode(EVENT_SUMMON_SUCCESS)
  e1:SetRange(LOCATION_MZONE)
  e1:SetTarget(c10000000.target)
  e1:SetOperation(c10000000.operation)
  c:RegisterEffect(e1)
end
function c10000000.target(e,tp,eg,ep,ev,re,r,rp,chk,chkc)
  if chkc then return chkc:IsOnField() end
  if chk==0 then return Duel.IsExistingTarget(aux.TRUE,tp,0,LOCATION_ONFIELD,1,nil) end
  Duel.Hint(HINT_SELECTMSG,tp,HINTMSG_DESTROY)
  Duel.SelectTarget(tp,nil,tp,0,LOCATION_ONFIELD,1,1,nil)
end
function c10000000.operation(e,tp,eg,ep,ev,re,r,rp)
  local tc=Duel.GetFirstTarget()
  if tc:IsRelateToEffect(e) then
    Duel.Destroy(tc,REASON_EFFECT)
  end
end
`,
      },
      {
        name: 'Missing initial_effect',
        script: `
function c10000000.target(e,tp,eg,ep,ev,re,r,rp,chk)
  if chk==0 then return true end
end
`,
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testScripts) {
      console.log(`Test: ${test.name}`);
      const result = validator.validate(test.script);
      const report = validator.formatReport(result);

      console.log(`Score: ${result.score}/100`);

      if (result.valid || result.score > 60) {
        console.log('✓ PASSED\n');
        passed++;
      } else {
        console.log('✗ FAILED');
        console.log(report);
        console.log();
        failed++;
      }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passed}/${testScripts.length}`);
    console.log(`Failed: ${failed}/${testScripts.length}`);

    if (failed > 0) {
      process.exit(1);
    }
  });

program.parse();
