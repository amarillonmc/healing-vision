import { KEYWORD_MAPPINGS, TRIGGER_PATTERNS, EFFECT_STRUCTURE, KeywordMapping } from './keyword-map.js';
import { Categories, EffectTypes, Events, Locations, Phases, Types } from '../constants/api.js';

export interface ParsedEffect {
  id: string;
  description: string;
  categories: number[];
  triggerEvent?: string;
  effectType: string;
  hasCost: boolean;
  hasTarget: boolean;
  costText?: string;
  targetText?: string;
  operationText: string;
  conditions: string[];
  restrictions: string[];
  keywords: string[];
  rawText: string;
}

export interface ParseResult {
  effects: ParsedEffect[];
  cardId: number;
  rawText: string;
  language: string;
  cardType?: number; // 卡片类型：怪兽/魔法/陷阱
}

export class EffectParser {
  private cardType: number = 0; // 卡片类型

  parse(effectText: string, cardId: number = 0, language: string = 'zh-CN', cardType?: number): ParseResult {
    this.cardType = cardType || 0;
    const effects = this.splitEffects(effectText);
    const parsedEffects = effects.map((text, index) => this.parseSingleEffect(text, index));

    return {
      effects: parsedEffects,
      cardId,
      rawText: effectText,
      language,
      cardType: this.cardType,
    };
  }
  
  private splitEffects(text: string): string[] {
    const effects: string[] = [];
    
    const patterns = [
      /【(.+?)】/g,
      /●(.+?)(?=●|$)/g,
      /①(.+?)(?=②|③|④|⑤|$)/g,
      /②(.+?)(?=③|④|⑤|$)/g,
      /③(.+?)(?=④|⑤|$)/g,
      /④(.+?)(?=⑤|$)/g,
      /⑤(.+)/g,
    ];
    
    let found = false;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        effects.push(...matches.map(m => m.trim()));
        found = true;
      }
    }
    
    if (!found) {
      effects.push(text);
    }
    
    return effects.filter(e => e.length > 0);
  }
  
  private parseSingleEffect(text: string, index: number): ParsedEffect {
    const cleanText = this.cleanText(text);
    const keywords = this.extractKeywords(cleanText);
    const categories = this.extractCategories(keywords);
    const triggerEvent = this.detectTriggerEvent(cleanText);
    const effectType = this.detectEffectType(cleanText, triggerEvent);
    const hasCost = this.detectCost(cleanText);
    const hasTarget = this.detectTarget(cleanText);
    const conditions = this.extractConditions(cleanText);
    const restrictions = this.extractRestrictions(cleanText);
    
    return {
      id: `effect_${index}`,
      description: cleanText,
      categories,
      triggerEvent,
      effectType,
      hasCost,
      hasTarget,
      conditions,
      restrictions,
      keywords: keywords.map(k => k.keywords).flat(),
      rawText: text,
      operationText: cleanText,
    };
  }
  
  private cleanText(text: string): string {
    return text
      .replace(/【.*?】/g, '')
      .replace(/[①②③④⑤]/g, '')
      .replace(/●/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private extractKeywords(text: string): KeywordMapping[] {
    const found: KeywordMapping[] = [];
    const lowerText = text.toLowerCase();
    
    for (const mapping of KEYWORD_MAPPINGS) {
      for (const keyword of mapping.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          found.push(mapping);
          break;
        }
      }
    }
    
    return found;
  }
  
  private extractCategories(mappings: KeywordMapping[]): number[] {
    const categories = new Set<number>();
    
    for (const mapping of mappings) {
      if (mapping.category) {
        categories.add(mapping.category);
      }
    }
    
    return Array.from(categories);
  }
  
  private detectTriggerEvent(text: string): string | undefined {
    for (const pattern of TRIGGER_PATTERNS) {
      if (pattern.pattern.test(text)) {
        return pattern.code;
      }
    }
    return undefined;
  }
  
  private detectEffectType(text: string, triggerEvent?: string): string {
    const lowerText = text.toLowerCase();

    // 陷阱卡和魔法卡的特殊处理
    const isTrap = (this.cardType & Types.TRAP) !== 0;
    const isSpell = (this.cardType & Types.SPELL) !== 0;
    const isMonster = (this.cardType & Types.MONSTER) !== 0;

    // 对于陷阱卡和魔法卡，第一个效果通常是激活效果
    if (isTrap || isSpell) {
      if (triggerEvent) {
        if (lowerText.includes('可以') || lowerText.includes('能')) {
          return 'EFFECT_TYPE_QUICK_O'; // 即时诱发效果
        }
        return 'EFFECT_TYPE_TRIGGER_F'; // 诱发必发效果
      }
      // 没有触发事件的陷阱卡效果是诱发即时效果
      if (lowerText.includes('即时') || lowerText.includes('quick')) {
        return 'EFFECT_TYPE_QUICK_O';
      }
      return 'EFFECT_TYPE_TRIGGER_O'; // 默认为诱发效果
    }

    // 怪兽卡的效果类型判断
    if (triggerEvent) {
      if (lowerText.includes('可以') || lowerText.includes('能')) {
        return 'EFFECT_TYPE_TRIGGER_O';
      }
      return 'EFFECT_TYPE_TRIGGER_F';
    }

    // 检测诱发即时效果（Quick Effect）
    if (lowerText.includes('即时') || lowerText.includes('quick') ||
        (lowerText.includes('对手') && lowerText.includes('回合') && lowerText.includes('能'))) {
      return 'EFFECT_TYPE_QUICK_O';
    }

    // 检测起动效果
    if (lowerText.includes('主要阶段') && !lowerText.includes('对手')) {
      return 'EFFECT_TYPE_IGNITION';
    }

    // 检测永续效果
    if (lowerText.includes('只要') || (lowerText.includes('的场合') && !lowerText.includes('可以')) ||
        lowerText.includes('持续') || lowerText.includes('continuous')) {
      return 'EFFECT_TYPE_CONTINUOUS';
    }

    // 默认返回起动效果
    return 'EFFECT_TYPE_IGNITION';
  }
  
  private detectCost(text: string): boolean {
    const lowerText = text.toLowerCase();
    return EFFECT_STRUCTURE.COST.some(kw => 
      lowerText.includes(kw.toLowerCase()) && 
      (lowerText.includes('支付') || lowerText.includes('丢弃') || lowerText.includes('解放') || lowerText.includes('除外'))
    );
  }
  
  private detectTarget(text: string): boolean {
    const lowerText = text.toLowerCase();
    return EFFECT_STRUCTURE.TARGET.some(kw => lowerText.includes(kw.toLowerCase()));
  }
  
  private extractConditions(text: string): string[] {
    const conditions: string[] = [];
    const patterns = [
      /(.+?)的场合/,
      /只有(.+?)才/,
      /当(.+?)时/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        conditions.push(match[1] || match[0]);
      }
    }
    
    return conditions;
  }
  
  private extractRestrictions(text: string): string[] {
    const restrictions: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('不能')) {
      const match = text.match(/不能(.+?)(?:。|，|,|$)/);
      if (match) {
        restrictions.push(`cannot ${match[1]}`);
      }
    }
    
    if (lowerText.includes('1回合') && lowerText.includes('1次')) {
      restrictions.push('once per turn');
    }
    
    return restrictions;
  }
  
  detectSpecialSummonType(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('融合召唤') || lowerText.includes('fusion')) {
      return 'fusion';
    }
    if (lowerText.includes('同调召唤') || lowerText.includes('synchro')) {
      return 'synchro';
    }
    if (lowerText.includes('超量召唤') || lowerText.includes('xyz')) {
      return 'xyz';
    }
    if (lowerText.includes('连接召唤') || lowerText.includes('link')) {
      return 'link';
    }
    if (lowerText.includes('仪式召唤') || lowerText.includes('ritual')) {
      return 'ritual';
    }
    if (lowerText.includes('灵摆召唤') || lowerText.includes('pendulum')) {
      return 'pendulum';
    }
    
    return null;
  }
  
  extractNumbers(text: string): number[] {
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.map(Number) : [];
  }
  
  isMonsterEffect(text: string): boolean {
    return text.includes('怪兽') || text.includes('攻击力') || text.includes('守备力');
  }
  
  isSpellTrapEffect(text: string): boolean {
    return text.includes('魔法') || text.includes('陷阱') || text.includes('卡') && !text.includes('怪兽卡');
  }
}

export function createParser(): EffectParser {
  return new EffectParser();
}
