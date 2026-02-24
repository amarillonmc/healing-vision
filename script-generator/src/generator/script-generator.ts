import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { ParsedEffect, ParseResult } from '../parser/effect-parser.js';
import { FullCard } from '../data/cdb-reader.js';
import { Types } from '../constants/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GenerationOptions {
  cardId: number;
  cardName: string;
  effects: ParseResult;
  cardData?: FullCard;
  language: string;
  customSetcode?: number;
}

export interface GeneratedScript {
  filename: string;
  content: string;
  cardId: number;
}

export class ScriptGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
  }

  generate(options: GenerationOptions): GeneratedScript {
    const { cardId, cardName, effects, cardData, language } = options;

    // 获取卡片类型
    const cardType = cardData?.type || effects.cardType || 0;
    const isTrap = (cardType & Types.TRAP) !== 0;
    const isSpell = (cardType & Types.SPELL) !== 0;

    const effectCodes = effects.effects.map((effect, index) =>
      this.generateEffectCode(effect, cardId, index, cardData, isTrap || isSpell)
    );

    const helperFunctions = this.generateHelpers(effects.effects, cardId);

    const template = this.getBaseTemplate(isTrap || isSpell);
    const content = ejs.render(template, {
      cardId,
      cardName,
      effects: effectCodes.join('\n'),
      helperFunctions,
      language,
    });

    return {
      filename: `c${cardId}.lua`,
      content: this.formatLua(content),
      cardId,
    };
  }

  private generateEffectCode(effect: ParsedEffect, cardId: number, index: number, cardData?: FullCard, isSpellTrap: boolean = false): string {
    const lines: string[] = [];
    const effectVar = `e${index + 1}`;

    lines.push(`-- ${this.getEffectComment(effect, index)}`);
    lines.push(`local ${effectVar}=Effect.CreateEffect(c)`);

    if (effect.description) {
      lines.push(`${effectVar}:SetDescription(aux.Stringid(${cardId},${index}))`);
    }

    const categories = this.formatCategories(effect.categories);
    if (categories) {
      lines.push(`${effectVar}:SetCategory(${categories})`);
    }

    // 对于陷阱卡和魔法卡，第一个效果通常需要设置为 EFFECT_TYPE_ACTIVATE
    if (isSpellTrap && index === 0) {
      lines.push(`${effectVar}:SetType(EFFECT_TYPE_ACTIVATE)`);
      lines.push(`${effectVar}:SetCode(EVENT_FREE_CHAIN)`);
    } else {
      lines.push(`${effectVar}:SetType(${effect.effectType})`);
      if (effect.triggerEvent) {
        lines.push(`${effectVar}:SetCode(${effect.triggerEvent})`);
      }
    }

    const range = this.inferRange(effect, cardData, isSpellTrap);
    if (range) {
      lines.push(`${effectVar}:SetRange(${range})`);
    }

    if (effect.hasCost) {
      lines.push(`${effectVar}:SetCost(c${cardId}.cost${index > 0 ? index + 1 : ''})`);
    }

    if (effect.hasTarget) {
      lines.push(`${effectVar}:SetTarget(c${cardId}.target${index > 0 ? index + 1 : ''})`);
    }

    lines.push(`${effectVar}:SetOperation(c${cardId}.operation${index > 0 ? index + 1 : ''})`);

    if (effect.restrictions.includes('once per turn')) {
      lines.push(`${effectVar}:SetCountLimit(1)`);
    }

    lines.push(`c:RegisterEffect(${effectVar})`);

    return lines.join('\n\t');
  }

  private generateHelpers(effects: ParsedEffect[], cardId: number): string {
    const helpers: string[] = [];
    
    effects.forEach((effect, index) => {
      const suffix = index > 0 ? (index + 1).toString() : '';
      
      if (effect.hasCost) {
        helpers.push(this.generateCostFunction(effect, cardId, suffix));
      }
      
      if (effect.hasTarget) {
        helpers.push(this.generateTargetFunction(effect, cardId, suffix));
      }
      
      helpers.push(this.generateOperationFunction(effect, cardId, suffix));
    });
    
    return helpers.join('\n');
  }

  private generateCostFunction(effect: ParsedEffect, cardId: number, suffix: string): string {
    const lines: string[] = [];
    lines.push(`function c${cardId}.cost${suffix}(e,tp,eg,ep,ev,re,r,rp,chk)`);
    lines.push(`\tif chk==0 then return true end`);
    lines.push(`\t-- TODO: Implement cost logic for: ${effect.description}`);
    lines.push(`end`);
    return lines.join('\n');
  }

  private generateTargetFunction(effect: ParsedEffect, cardId: number, suffix: string): string {
    const lines: string[] = [];
    const categories = effect.categories;

    // 根据 categories 确定 Hint Message 类型
    let hintMsg = 'HINTMSG_TARGET';
    let hintCode = 'HINTMSG_TARGET';

    if (categories.includes(1)) { // CATEGORY_DESTROY
      hintCode = 'HINTMSG_DESTROY';
    } else if (categories.includes(0x4)) { // CATEGORY_TOHAND
      hintCode = 'HINTMSG_ATOHAND';
    } else if (categories.includes(0x8)) { // CATEGORY_TODECK
      hintCode = 'HINTMSG_TODECK';
    } else if (categories.includes(0x10)) { // CATEGORY_TOGRAVE
      hintCode = 'HINTMSG_TOGRAVE';
    } else if (categories.includes(0x20)) { // CATEGORY_REMOVE
      hintCode = 'HINTMSG_REMOVE';
    } else if (categories.includes(0x40)) { // CATEGORY_SPECIAL_SUMMON
      hintCode = 'HINTMSG_SPSUMMON';
    }

    lines.push(`function c${cardId}.target${suffix}(e,tp,eg,ep,ev,re,r,rp,chk,chkc)`);
    lines.push(`\tif chkc then return chkc:IsLocation(LOCATION_ONFIELD) and chkc:IsControler(tp) end`);

    // 添加操作提示信息
    if (effect.categories.length > 0) {
      const categoryConst = this.formatCategories(effect.categories);
      lines.push(`\tif chk==0 then return Duel.IsExistingTarget(nil,tp,LOCATION_ONFIELD,LOCATION_ONFIELD,1,nil) end`);
      lines.push(`\tDuel.Hint(HINT_SELECTMSG,tp,${hintCode})`);
    } else {
      lines.push(`\tif chk==0 then return true end`);
    }

    lines.push(`\tDuel.SelectTarget(tp,nil,tp,LOCATION_ONFIELD,LOCATION_ONFIELD,1,1,nil)`);
    lines.push(`\t-- TODO: Implement target logic for: ${effect.description}`);
    lines.push(`end`);
    return lines.join('\n');
  }

  private generateOperationFunction(effect: ParsedEffect, cardId: number, suffix: string): string {
    const lines: string[] = [];
    lines.push(`function c${cardId}.operation${suffix}(e,tp,eg,ep,ev,re,r,rp)`);
    lines.push(`\tlocal tc=Duel.GetFirstTarget()`);

    const operations = this.inferOperations(effect);
    if (operations) {
      lines.push(`\t${operations}`);
    }
    lines.push(`\t-- TODO: Implement operation logic for: ${effect.description}`);
    lines.push(`end`);
    return lines.join('\n');
  }

  private inferOperations(effect: ParsedEffect): string {
    const keywords = effect.keywords.map(k => k.toLowerCase());
    const descriptionLower = effect.description.toLowerCase();

    // 检查是否包含破坏关键词
    if (keywords.some(k => k.includes('破坏') || k.includes('destroy'))) {
      return `if tc:IsRelateToEffect(e) then\n\t\tDuel.Destroy(tc,REASON_EFFECT)\n\tend`;
    }

    // 检查是否包含特殊召唤关键词
    if (keywords.some(k => k.includes('特殊召唤') || k.includes('special summon'))) {
      return `if tc and tc:IsRelateToEffect(e) then\n\t\tDuel.SpecialSummon(tc,0,tp,tp,false,false,POS_FACEUP)\n\tend`;
    }

    // 检查是否包含抽卡关键词
    if (keywords.some(k => k.includes('抽卡') || k.includes('draw'))) {
      return `Duel.Draw(tp,1,REASON_EFFECT)`;
    }

    // 检查是否包含加入手卡关键词
    if (keywords.some(k => k.includes('加入手卡') || k.includes('add to hand') || k.includes('返回手卡') || k.includes('return to hand'))) {
      // 正确的离场重定向：第二个参数使用 nil 而不是 tp
      return `if tc and tc:IsRelateToEffect(e) then\n\t\tDuel.SendtoHand(tc,nil,REASON_EFFECT)\n\tend`;
    }

    // 检查是否包含送去墓地关键词
    if (keywords.some(k => k.includes('送去墓地') || k.includes('send to grave') || k.includes('送墓'))) {
      return `if tc and tc:IsRelateToEffect(e) then\n\t\tDuel.SendtoGrave(tc,REASON_EFFECT)\n\tend`;
    }

    // 检查是否包含除外关键词
    if (keywords.some(k => k.includes('除外') || k.includes('banish') || k.includes('remove from play'))) {
      return `if tc and tc:IsRelateToEffect(e) then\n\t\tDuel.Remove(tc,POS_FACEUP,REASON_EFFECT)\n\tend`;
    }

    // 检查是否包含返回卡组关键词
    if (keywords.some(k => (k.includes('返回卡组') || k.includes('return to deck') || k.includes('洗回卡组') || k.includes('回到卡组')))) {
      // 返回卡组时不需要排序，只有在从墓地/除外返回且需要保持顺序时才排序
      return `if tc and tc:IsRelateToEffect(e) then\n\t\tDuel.SendtoDeck(tc,nil,SEQ_DECKBOTTOM,REASON_EFFECT)\n\tend`;
    }

    // 检查是否包含跳过战斗阶段关键词（从描述文本中检查）
    if ((descriptionLower.includes('跳过') || descriptionLower.includes('skip')) &&
        (descriptionLower.includes('战斗') || descriptionLower.includes('bp') || descriptionLower.includes('battle'))) {
      // 跳过战斗阶段必须添加 Reset 限制
      return `local e1=Effect.CreateEffect(e:GetHandler())\n\te1:SetType(EFFECT_TYPE_FIELD)\n\te1:SetCode(EFFECT_SKIP_BP)\n\te1:SetProperty(EFFECT_FLAG_PLAYER_TARGET)\n\te1:SetTargetRange(0,1)\n\te1:SetReset(RESET_PHASE+PHASE_END)\n\tDuel.RegisterEffect(e1,tp)`;
    }

    if (keywords.some(k => k.includes('确认') || k.includes('confirm'))) {
      // 确认卡片不应该是 ConfirmCards，应该根据上下文判断
      // 这里只是一个示例
      return `-- TODO: Confirm card logic needs proper context`;
    }

    return `-- Operation needs implementation`;
  }

  private getEffectComment(effect: ParsedEffect, index: number): string {
    const desc = effect.description.substring(0, 50);
    return `Effect ${index + 1}: ${desc}${desc.length >= 50 ? '...' : ''}`;
  }

  private formatCategories(categories: number[]): string {
    if (categories.length === 0) return '';
    
    return categories
      .map(cat => this.categoryToConstant(cat))
      .filter(Boolean)
      .join('+');
  }

  private categoryToConstant(cat: number): string {
    const categoryMap: Record<number, string> = {
      0x1: 'CATEGORY_DESTROY',
      0x2: 'CATEGORY_RELEASE',
      0x4: 'CATEGORY_TOHAND',
      0x8: 'CATEGORY_TODECK',
      0x10: 'CATEGORY_TOGRAVE',
      0x20: 'CATEGORY_REMOVE',
      0x40: 'CATEGORY_SPECIAL_SUMMON',
      0x80: 'CATEGORY_DRAW',
      0x100: 'CATEGORY_DAMAGE',
      0x200: 'CATEGORY_RECOVER',
      0x400: 'CATEGORY_DECKDES',
      0x800: 'CATEGORY_HANDDES',
      0x1000: 'CATEGORY_SUMMON',
      0x2000: 'CATEGORY_FLIP',
      0x4000: 'CATEGORY_POSITION',
      0x8000: 'CATEGORY_CONTROL',
      0x10000: 'CATEGORY_DISABLE',
      0x20000: 'CATEGORY_ATKCHANGE',
      0x40000: 'CATEGORY_DEFCHANGE',
      0x80000: 'CATEGORY_COUNTER',
      0x100000: 'CATEGORY_EQUIP',
    };
    
    return categoryMap[cat] || '';
  }

  private inferRange(effect: ParsedEffect, cardData?: FullCard, isSpellTrap: boolean = false): string {
    const keywords = effect.keywords.map(k => k.toLowerCase());

    if (keywords.some(k => k.includes('墓地'))) {
      return 'LOCATION_GRAVE';
    }
    if (keywords.some(k => k.includes('手卡'))) {
      return 'LOCATION_HAND';
    }
    if (keywords.some(k => k.includes('除外'))) {
      return 'LOCATION_REMOVED';
    }

    if (isSpellTrap) {
      return 'LOCATION_SZONE';
    }

    if (cardData) {
      if (cardData.type & Types.SPELL) return 'LOCATION_SZONE';
      if (cardData.type & Types.TRAP) return 'LOCATION_SZONE';
    }

    return 'LOCATION_MZONE';
  }

  private getBaseTemplate(isSpellTrap: boolean = false): string {
    const templatePath = path.join(this.templatesDir, 'base.ejs');
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }

    if (isSpellTrap) {
      return `-- <%= cardName %>
-- Card ID: <%= cardId %>
-- Generated by ygopro-script-generator

function c<%= cardId %>.initial_effect(c)
\t<%= effects %>
end
<%= helperFunctions %>`;
    }

    return `-- <%= cardName %>
-- Card ID: <%= cardId %>
-- Generated by ygopro-script-generator

function c<%= cardId %>.initial_effect(c)
\t<%= effects %>
end
<%= helperFunctions %>`;
  }

  private formatLua(code: string): string {
    return code
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t\n/g, '\n')
      .trim() + '\n';
  }
}

export function createGenerator(): ScriptGenerator {
  return new ScriptGenerator();
}
