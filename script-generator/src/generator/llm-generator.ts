import { ParsedEffect, ParseResult } from '../parser/effect-parser.js';
import { FullCard } from '../data/cdb-reader.js';

export interface LLMGenerationOptions {
  cardId: number;
  cardName: string;
  effectText: string;
  parsedEffects: ParseResult;
  cardData?: FullCard;
  similarScripts?: string[];
  language: string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

const SYSTEM_PROMPT = `You are an expert Yu-Gi-Oh! card script developer. Your task is to generate valid Lua scripts for ygopro based on card effect descriptions.

Key conventions:
1. Each card has a function c<ID>.initial_effect(c) as entry point
2. Effects are created with Duel.CreateEffect(c)
3. Register effects with c:RegisterEffect(e)
4. Use proper event codes (EVENT_SUMMON_SUCCESS, EVENT_TO_GRAVE, etc.)
5. Use proper effect types (EFFECT_TYPE_IGNITION, EFFECT_TYPE_TRIGGER_O, etc.)
6. Use proper categories (CATEGORY_DESTROY, CATEGORY_TOHAND, etc.)

Output only the Lua script, no explanations.`;

export class LLMGenerator {
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      provider: config?.provider || 'openai',
      model: config?.model,
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: config?.baseUrl,
    };
  }

  async generate(options: LLMGenerationOptions): Promise<string> {
    const prompt = this.buildPrompt(options);
    
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      default:
        return this.callLocal(prompt);
    }
  }

  private buildPrompt(options: LLMGenerationOptions): string {
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
Generate the complete Lua script. Follow ygopro conventions exactly.`;

    return prompt;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    return this.extractLuaCode(data.choices[0].message.content);
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json() as { content: { text: string }[] };
    return this.extractLuaCode(data.content[0].text);
  }

  private async callLocal(prompt: string): Promise<string> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'llama3',
        prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    return this.extractLuaCode(data.response);
  }

  private extractLuaCode(text: string): string {
    const codeBlockMatch = text.match(/```lua\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    const simpleBlockMatch = text.match(/```\n([\s\S]*?)```/);
    if (simpleBlockMatch) {
      return simpleBlockMatch[1].trim();
    }
    
    if (text.includes('function c') && text.includes('initial_effect')) {
      return text.trim();
    }
    
    throw new Error('No valid Lua code found in LLM response');
  }

  static needsLLM(parsedEffects: ParseResult): boolean {
    for (const effect of parsedEffects.effects) {
      if (effect.conditions.length > 2) return true;
      if (effect.restrictions.length > 2) return true;
      if (effect.keywords.length < 2) return true;
      if (!effect.triggerEvent && effect.effectType.includes('TRIGGER')) return true;
    }
    return false;
  }
}

export function createLLMGenerator(config?: Partial<LLMConfig>): LLMGenerator {
  return new LLMGenerator(config);
}
