import { ParsedEffect, ParseResult } from '../parser/effect-parser.js';
import { FullCard } from '../data/cdb-reader.js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface CLILLMGenerationOptions {
  cardId: number;
  cardName: string;
  effectText: string;
  parsedEffects: ParseResult;
  cardData?: FullCard;
  similarScripts?: string[];
  language: string;
}

export interface CLILLMConfig {
  provider: 'claude-code' | 'open-code';
  model?: string;
}

const SYSTEM_PROMPT = `You are an expert Yu-Gi-Oh! card script developer. Your task is to generate valid Lua scripts for ygopro based on card effect descriptions.

Key conventions:
1. Each card has a function c<ID>.initial_effect(c) as entry point
2. Effects are created with Duel.CreateEffect(c)
3. Register effects with c:RegisterEffect(e)
4. Use proper event codes (EVENT_SUMMON_SUCCESS, EVENT_TO_GRAVE, etc.)
5. Use proper effect types (EFFECT_TYPE_IGNITION, EFFECT_TYPE_TRIGGER_O, etc.)
6. Use proper categories (CATEGORY_DESTROY, CATEGORY_TOHAND, etc.)
7. Implement complete target and operation functions with proper logic
8. Use aux.SelectUnselectCard for card selection when needed
9. Use Duel.CheckReleaseGroup for release cost checks
10. Use Duel.IsExistingTarget for target existence checks

Output only the Lua script, no explanations.`;

/**
 * CLI LLM Generator - 使用 Claude Code 或 OpenCode 内置的 LLM
 *
 * 这个类通过调用 CLI 工具的命令来使用内置的 LLM 能力
 */
export class CLILLMGenerator {
  private config: CLILLMConfig;
  private tempDir: string;

  constructor(config?: Partial<CLILLMConfig>) {
    this.config = {
      provider: config?.provider || this.detectProvider(),
      model: config?.model,
    };
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ygo-gen-'));
  }

  private detectProvider(): 'claude-code' | 'open-code' {
    // 尝试检测可用的 CLI 工具
    try {
      execSync('claude --version', { stdio: 'ignore' });
      return 'claude-code';
    } catch {
      try {
        execSync('opencode --version', { stdio: 'ignore' });
        return 'open-code';
      } catch {
        throw new Error(
          'No supported CLI tool found. Please install Claude Code or OpenCode.'
        );
      }
    }
  }

  async generate(options: CLILLMGenerationOptions): Promise<string> {
    const prompt = this.buildPrompt(options);

    switch (this.config.provider) {
      case 'claude-code':
        return this.callClaudeCode(prompt);
      case 'open-code':
        return this.callOpenCode(prompt);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private buildPrompt(options: CLILLMGenerationOptions): string {
    const { cardId, cardName, effectText, cardData, similarScripts, language } = options;

    let prompt = `Generate a ygopro Lua script for this card:

Card ID: ${cardId}
Card Name: ${cardName}
Language: ${language}

Effect Text:
${effectText}
`;

    if (cardData) {
      prompt += `
Card Data:
- Type: ${cardData.type}
- Attribute: ${cardData.attribute}
- Race: ${cardData.race}
- Level/Rank/Link: ${cardData.level}
- ATK/DEF: ${cardData.attack}/${cardData.defense}
`;
    }

    if (similarScripts && similarScripts.length > 0) {
      prompt += `
Reference similar scripts:
${similarScripts.map((s, i) => `--- Example ${i + 1} ---\n${s}`).join('\n\n')}
`;
    }

    prompt += `
Generate the complete Lua script. Follow ygopro conventions exactly.
Make sure to:
1. Implement complete target function with proper Duel.SelectTarget calls
2. Implement complete operation function with proper effect execution
3. Use correct effect codes and categories
4. Include proper cost checks and conditions
5. Handle edge cases properly

Output ONLY the Lua code, no markdown formatting, no explanations.`;

    return prompt;
  }

  private async callClaudeCode(prompt: string): Promise<string> {
    try {
      // 使用 Claude Code 的 ask 命令
      const result = execSync(
        `claude ask "${this.escapePrompt(prompt)}"`,
        {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 120000, // 2 分钟超时
        }
      );

      return this.extractLuaCode(result.trim());
    } catch (error) {
      throw new Error(
        `Failed to call Claude Code: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  private async callOpenCode(prompt: string): Promise<string> {
    try {
      // 使用 OpenCode 的 ask 命令
      const result = execSync(
        `opencode ask "${this.escapePrompt(prompt)}"`,
        {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 120000, // 2 分钟超时
        }
      );

      return this.extractLuaCode(result.trim());
    } catch (error) {
      throw new Error(
        `Failed to call OpenCode: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  private escapePrompt(prompt: string): string {
    // 转义提示中的特殊字符，以便在命令行中使用
    return prompt
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\$/g, '\\$');
  }

  private extractLuaCode(text: string): string {
    // 移除可能的 markdown 代码块标记
    const codeBlockMatch = text.match(/```lua\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    const simpleBlockMatch = text.match(/```\n([\s\S]*?)```/);
    if (simpleBlockMatch) {
      return simpleBlockMatch[1].trim();
    }

    // 检查是否直接包含 Lua 代码
    if (text.includes('function c') && text.includes('initial_effect')) {
      return text.trim();
    }

    throw new Error('No valid Lua code found in CLI LLM response');
  }

  static needsLLM(parsedEffects: ParseResult): boolean {
    for (const effect of parsedEffects.effects) {
      // 复杂条件需要 LLM
      if (effect.conditions.length > 2) return true;
      // 复杂限制需要 LLM
      if (effect.restrictions.length > 2) return true;
      // 缺少关键词信息需要 LLM
      if (effect.keywords.length < 2) return true;
      // 缺少触发事件的诱发效果需要 LLM
      if (!effect.triggerEvent && effect.effectType.includes('TRIGGER')) return true;
      // 没有识别出效果类型需要 LLM
      if (!effect.effectType || effect.effectType === 'UNKNOWN') return true;
    }
    return false;
  }

  cleanup(): void {
    // 清理临时文件
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

export function createCLILLMGenerator(
  config?: Partial<CLILLMConfig>
): CLILLMGenerator {
  return new CLILLMGenerator(config);
}
