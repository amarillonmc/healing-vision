import { Categories, Locations, Phases, Types, Attributes, Races, EffectTypes, Events, Reasons } from '../constants/api.js';

export interface KeywordMapping {
  keywords: string[];
  category?: number;
  location?: number;
  phase?: number;
  type?: number;
  attribute?: number;
  race?: number;
  eventType?: number;
  reason?: number;
  effectType?: number;
  luaFunction?: string;
  template?: string;
}

export const KEYWORD_MAPPINGS: KeywordMapping[] = [
  // Categories
  { keywords: ['破坏', 'destroy'], category: Categories.DESTROY, luaFunction: 'Duel.Destroy' },
  { keywords: ['特殊召唤', 'special summon'], category: Categories.SPECIAL_SUMMON, luaFunction: 'Duel.SpecialSummon' },
  { keywords: ['抽卡', 'draw'], category: Categories.DRAW, luaFunction: 'Duel.Draw' },
  { keywords: ['伤害', 'damage'], category: Categories.DAMAGE, luaFunction: 'Duel.Damage' },
  { keywords: ['回复', 'recover', '回复生命'], category: Categories.RECOVER, luaFunction: 'Duel.Recover' },
  { keywords: ['加入手卡', 'add to hand', '加入手牌'], category: Categories.TOHAND, luaFunction: 'Duel.SendtoHand' },
  { keywords: ['返回手卡', 'return to hand', '回到手卡'], category: Categories.TOHAND, luaFunction: 'Duel.SendtoHand' },
  { keywords: ['送去墓地', 'send to grave', '送墓'], category: Categories.TOGRAVE, luaFunction: 'Duel.SendtoGrave' },
  { keywords: ['回到卡组', 'return to deck', '返回卡组', '洗回卡组'], category: Categories.TODECK, luaFunction: 'Duel.SendtoDeck' },
  { keywords: ['除外', 'banish', 'remove from play'], category: Categories.REMOVE, luaFunction: 'Duel.Remove' },
  { keywords: ['解放', 'release', '祭品', 'tribut'], category: Categories.RELEASE, luaFunction: 'Duel.Release' },
  { keywords: ['丢弃', 'discard'], category: Categories.HANDDES, luaFunction: 'Duel.DiscardHand' },
  { keywords: ['卡组破坏', 'deck destruction'], category: Categories.DECKDES, luaFunction: 'Duel.DiscardDeck' },
  { keywords: ['控制权', 'control'], category: Categories.CONTROL, luaFunction: 'Duel.GetControl' },
  { keywords: ['攻击力变化', 'atk change', 'atkchange'], category: Categories.ATKCHANGE },
  { keywords: ['守备力变化', 'def change', 'defchange'], category: Categories.DEFCHANGE },
  { keywords: ['放置指示物', 'counter'], category: Categories.COUNTER },
  { keywords: ['装备', 'equip'], category: Categories.EQUIP },
  { keywords: ['反转', 'flip'], category: Categories.FLIP },
  { keywords: ['表示形式', 'position'], category: Categories.POSITION, luaFunction: 'Duel.ChangePosition' },
  { keywords: ['无效', 'negate', 'disable'], category: Categories.DISABLE },
  { keywords: ['洗切', 'shuffle'], luaFunction: 'Duel.ShuffleDeck' },
  
  // Locations
  { keywords: ['卡组'], location: Locations.DECK },
  { keywords: ['手卡', '手牌'], location: Locations.HAND },
  { keywords: ['场上', 'field'], location: Locations.ONFIELD },
  { keywords: ['怪兽区'], location: Locations.MZONE },
  { keywords: ['魔法陷阱区', '魔陷区'], location: Locations.SZONE },
  { keywords: ['墓地', 'graveyard'], location: Locations.GRAVE },
  { keywords: ['除外区', 'removed'], location: Locations.REMOVED },
  { keywords: ['额外卡组', 'extra deck'], location: Locations.EXTRA },
  
  // Phases
  { keywords: ['抽卡阶段'], phase: Phases.DRAW },
  { keywords: ['准备阶段'], phase: Phases.STANDBY },
  { keywords: ['主要阶段', 'main phase'], phase: Phases.MAIN1 },
  { keywords: ['战斗阶段', 'battle phase'], phase: Phases.BATTLE },
  { keywords: ['结束阶段', 'end phase'], phase: Phases.END },
  
  // Types
  { keywords: ['怪兽'], type: Types.MONSTER },
  { keywords: ['魔法'], type: Types.SPELL },
  { keywords: ['陷阱'], type: Types.TRAP },
  { keywords: ['通常'], type: Types.NORMAL },
  { keywords: ['效果'], type: Types.EFFECT },
  { keywords: ['融合'], type: Types.FUSION },
  { keywords: ['仪式'], type: Types.RITUAL },
  { keywords: ['同调', 'synchro'], type: Types.SYNCHRO },
  { keywords: ['超量', 'xyz'], type: Types.XYZ },
  { keywords: ['灵摆', 'pendulum'], type: Types.PENDULUM },
  { keywords: ['连接', 'link'], type: Types.LINK },
  { keywords: ['调整', 'tuner'], type: Types.TUNER },
  { keywords: ['二重', 'dual', 'gemini'], type: Types.DUAL },
  { keywords: ['同盟', 'union'], type: Types.UNION },
  { keywords: ['灵魂', 'spirit'], type: Types.SPIRIT },
  { keywords: ['反转'], type: Types.FLIP },
  { keywords: ['卡通', 'toon'], type: Types.TOON },
  { keywords: ['衍生物', 'token'], type: Types.TOKEN },
  { keywords: ['永续'], type: Types.CONTINUOUS },
  { keywords: ['装备'], type: Types.EQUIP },
  { keywords: ['场地'], type: Types.FIELD },
  { keywords: ['速攻', 'quick-play'], type: Types.QUICKPLAY },
  { keywords: ['反击', 'counter'], type: Types.COUNTER },
  
  // Attributes
  { keywords: ['地属性', 'earth'], attribute: Attributes.EARTH },
  { keywords: ['水属性', 'water'], attribute: Attributes.WATER },
  { keywords: ['炎属性', 'fire'], attribute: Attributes.FIRE },
  { keywords: ['风属性', 'wind'], attribute: Attributes.WIND },
  { keywords: ['光属性', 'light'], attribute: Attributes.LIGHT },
  { keywords: ['暗属性', 'dark'], attribute: Attributes.DARK },
  { keywords: ['神属性', 'divine'], attribute: Attributes.DEVINE },
  
  // Races
  { keywords: ['战士族', 'warrior'], race: Races.WARRIOR },
  { keywords: ['魔法师族', 'spellcaster'], race: Races.SPELLCASTER },
  { keywords: ['天使族', 'fairy'], race: Races.FAIRY },
  { keywords: ['恶魔族', 'fiend'], race: Races.FIEND },
  { keywords: ['不死族', 'zombie'], race: Races.ZOMBIE },
  { keywords: ['机械族', 'machine'], race: Races.MACHINE },
  { keywords: ['水族', 'aqua'], race: Races.AQUA },
  { keywords: ['炎族', 'pyro'], race: Races.PYRO },
  { keywords: ['岩石族', 'rock'], race: Races.ROCK },
  { keywords: ['鸟兽族', 'winged beast'], race: Races.WINDBEAST },
  { keywords: ['植物族', 'plant'], race: Races.PLANT },
  { keywords: ['昆虫族', 'insect'], race: Races.INSECT },
  { keywords: ['雷族', 'thunder'], race: Races.THUNDER },
  { keywords: ['龙族', 'dragon'], race: Races.DRAGON },
  { keywords: ['兽族', 'beast'], race: Races.BEAST },
  { keywords: ['兽战士族', 'beast-warrior'], race: Races.BEASTWARRIOR },
  { keywords: ['恐龙族', 'dinosaur'], race: Races.DINOSAUR },
  { keywords: ['鱼族', 'fish'], race: Races.FISH },
  { keywords: ['海龙族', 'sea serpent'], race: Races.SEASERPENT },
  { keywords: ['爬虫类族', 'reptile'], race: Races.REPTILE },
  { keywords: ['念动力族', 'psychic'], race: Races.PSYCHO },
  { keywords: ['幻龙族', 'wyrm'], race: Races.WYRM },
  { keywords: ['电子界族', 'cyberse'], race: Races.CYBERSE },
  { keywords: ['幻想魔族', 'illusion'], race: Races.ILLUSION },
  
  // Effect Types
  { keywords: ['诱发效果', 'trigger'], effectType: EffectTypes.TRIGGER_O },
  { keywords: ['诱发即时效果', 'quick effect'], effectType: EffectTypes.QUICK_O },
  { keywords: ['起动效果', 'ignition'], effectType: EffectTypes.IGNITION },
  { keywords: ['永续效果', 'continuous'], effectType: EffectTypes.CONTINUOUS },
  { keywords: ['诱发必发', 'trigger forced'], effectType: EffectTypes.TRIGGER_F },
  
  // Events
  { keywords: ['召唤成功'], eventType: Events.SUMMON_SUCCESS },
  { keywords: ['特殊召唤成功'], eventType: Events.SPSUMMON_SUCCESS },
  { keywords: ['反转召唤成功'], eventType: Events.FLIP_SUMMON_SUCCESS },
  { keywords: ['被破坏'], eventType: Events.DESTROY },
  { keywords: ['被送去墓地', '被送墓'], eventType: Events.TO_GRAVE },
  { keywords: ['被除外'], eventType: Events.REMOVE },
  { keywords: ['进入墓地'], eventType: Events.TO_GRAVE },
  { keywords: ['战斗破坏'], eventType: Events.BATTLE_DESTROYING },
  { keywords: ['被战斗破坏'], eventType: Events.BATTLE_DESTROYED },
  { keywords: ['造成战斗伤害'], eventType: Events.BATTLE_DAMAGE },
  { keywords: ['受到伤害'], eventType: Events.DAMAGE },
  { keywords: ['支付基本分'], eventType: Events.PAY_LPCOST },
  { keywords: ['攻击宣言'], eventType: Events.PRE_ATTACK },
  { keywords: ['结束阶段'], eventType: Events.END_PHASE },
  { keywords: ['准备阶段'], eventType: Events.STANDBY },
  
  // Reasons
  { keywords: ['战斗'], reason: Reasons.BATTLE },
  { keywords: ['效果'], reason: Reasons.EFFECT },
  { keywords: ['代价', 'cost'], reason: Reasons.COST },
  { keywords: ['解放'], reason: Reasons.RELEASE },
  { keywords: ['丢弃'], reason: Reasons.DISCARD },
  { keywords: ['作为素材'], reason: Reasons.MATERIAL },
];

// Trigger timing patterns
export const TRIGGER_PATTERNS = [
  { pattern: /召唤.*成功/, code: 'EVENT_SUMMON_SUCCESS' },
  { pattern: /特殊召唤.*成功/, code: 'EVENT_SPSUMMON_SUCCESS' },
  { pattern: /反转召唤.*成功/, code: 'EVENT_FLIP_SUMMON_SUCCESS' },
  { pattern: /被.*破坏/, code: 'EVENT_DESTROY' },
  { pattern: /被.*战斗破坏/, code: 'EVENT_BATTLE_DESTROYED' },
  { pattern: /送去墓地/, code: 'EVENT_TO_GRAVE' },
  { pattern: /除外/, code: 'EVENT_REMOVE' },
  { pattern: /攻击宣言/, code: 'EVENT_ATTACK_ANNOUNCE' },
  { pattern: /造成战斗伤害/, code: 'EVENT_BATTLE_DAMAGE' },
];

// Effect structure patterns
export const EFFECT_STRUCTURE = {
  COST: ['支付', '丢弃', '解放', '除外', '去除超量素材', 'pay', 'discard', 'release', 'remove', 'detach'],
  TARGET: ['以', '选择', '对象', 'select', 'target'],
  CONDITION: ['的场合', '只有', '仅限', 'if', 'when', 'while'],
  TIMING: ['时', '场合', '阶段'],
  RESTRICTION: ['不能', '无法', '无法', 'cannot'],
};
