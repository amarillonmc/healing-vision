/**
 * YGOPRO Lua Script Validator
 *
 * Phase 4: Lua 语法验证
 */

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  message: string;
  rule: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
}

export class LuaValidator {
  private readonly YGOPRO_FUNCTIONS = [
    'Duel.CreateEffect',
    'Duel.Destroy',
    'Duel.Draw',
    'Duel.SpecialSummon',
    'Duel.IsExistingTarget',
    'Duel.SelectTarget',
    'Duel.GetFirstTarget',
    'Duel.IsRelateToEffect',
    'Duel.SendtoGrave',
    'Duel.SendtoHand',
    'Duel.SendtoDeck',
    'Duel.Remove',
    'Duel.Release',
    'Duel.DiscardHand',
    'Duel.CheckReleaseGroup',
    'Duel.SelectReleaseGroup',
    'Duel.GetLocationCount',
    'Duel.GetOperatedGroup',
    'Duel.GetTargetsRelateToChain',
    'Duel.GetFieldGroup',
    'Duel.GetMatchingGroup',
    'Duel.IsExistingMatchingCard',
    'Duel.SelectMatchingCard',
    'Duel.GetChainInfo',
    'Duel.GetTurnPlayer',
    'Duel.GetCurrentPhase',
    'Duel.CheckLPCost',
    'Duel.PayLPCost',
    'Duel.Recover',
    'Duel.Damage',
    'Duel.NegateActivation',
    'Duel.NegateRelatedChain',
    'Duel.ChangePosition',
    'Duel.Equip',
    'Duel.GetControl',
    'Duel.ReturnToField',
    'aux.Stringid',
    'aux.SelectUnselectCard',
  ];

  private readonly REQUIRED_FUNCTIONS = ['initial_effect'];
  private readonly EFFECT_PROPERTIES = [
    'SetDescription',
    'SetCategory',
    'SetType',
    'SetCode',
    'SetRange',
    'SetCondition',
    'SetTarget',
    'SetOperation',
    'SetCost',
    'SetCountLimit',
    'SetProperty',
    'SetLabel',
    'SetValue',
    'SetReset',
    'SetTargetRange',
    'SetHintTiming',
  ];

  private readonly EFFECT_TYPES = [
    'EFFECT_TYPE_IGNITION',
    'EFFECT_TYPE_TRIGGER_O',
    'EFFECT_TYPE_TRIGGER_F',
    'EFFECT_TYPE_CONTINUOUS',
    'EFFECT_TYPE_QUICK_O',
    'EFFECT_TYPE_ACTIVATE',
    'EFFECT_TYPE_SINGLE',
    'EFFECT_TYPE_FIELD',
  ];

  private readonly CATEGORIES = [
    'CATEGORY_DESTROY',
    'CATEGORY_TOHAND',
    'CATEGORY_TODECK',
    'CATEGORY_TOGRAVE',
    'CATEGORY_REMOVE',
    'CATEGORY_DRAW',
    'CATEGORY_RECOVER',
    'CATEGORY_DAMAGE',
    'CATEGORY_SPECIAL_SUMMON',
    'CATEGORY_SEARCH',
    'CATEGORY_NEGATE',
    'CATEGORY_POSITION',
    'CATEGORY_CONTROL',
    'CATEGORY_DISABLE',
    'CATEGORY_ATKCHANGE',
    'CATEGORY_DEFCHANGE',
    'CATEGORY_RELEASE',
    'CATEGORY_HANDES',
    'CATEGORY_DECKDES',
    'CATEGORY_COIN',
    'CATEGORY_DICE',
    'CATEGORY_LEAVE_GRAVE',
  ];

  private readonly LOCATIONS = [
    'LOCATION_HAND',
    'LOCATION_MZONE',
    'LOCATION_SZONE',
    'LOCATION_GRAVE',
    'LOCATION_REMOVED',
    'LOCATION_EXTRA',
    'LOCATION_DECK',
    'LOCATION_ONFIELD',
    'LOCATION_ALL',
  ];

  private readonly REASONS = [
    'REASON_EFFECT',
    'REASON_COST',
    'REASON_DISCARD',
    'REASON_RELEASE',
    'REASON_DESTROY',
    'REASON_BATTLE',
    'REASON_RULE',
    'REASON_TEMPORARY',
    'REASON_MATERIAL',
    'REASON_SUMMON',
    'REASON_FUSION',
    'REASON_SYNCHRO',
    'REASON_XYZ',
    'REASON_LINK',
  ];

  validate(script: string, cardId?: number): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 基础结构检查
    this.validateBasicStructure(script, issues);

    // 函数定义检查
    this.validateFunctions(script, issues);

    // YGOPRO API 使用检查
    this.validateYGOPROUsage(script, issues);

    // 常见错误检查
    this.validateCommonMistakes(script, issues);

    // 最佳实践检查
    this.validateBestPractices(script, issues);

    const score = this.calculateScore(issues);
    const valid = !issues.some(i => i.type === 'error');

    return { valid, issues, score };
  }

  private validateBasicStructure(script: string, issues: ValidationIssue[]): void {
    // 检查 initial_effect 函数
    if (!script.includes('initial_effect')) {
      issues.push({
        type: 'error',
        line: 0,
        column: 0,
        message: 'Missing required function: initial_effect',
        rule: 'required-function',
        suggestion: 'Add: function c<ID>.initial_effect(c)',
      });
    }

    // 检查效果创建
    if (!script.includes('Duel.CreateEffect')) {
      issues.push({
        type: 'error',
        line: 0,
        column: 0,
        message: 'No effect creation found',
        rule: 'effect-creation',
        suggestion: 'Add: local e1=Duel.CreateEffect(c)',
      });
    }

    // 检查效果注册
    if (!script.includes('RegisterEffect')) {
      issues.push({
        type: 'error',
        line: 0,
        column: 0,
        message: 'No effect registration found',
        rule: 'effect-registration',
        suggestion: 'Add: c:RegisterEffect(e1)',
      });
    }
  }

  private validateFunctions(script: string, issues: ValidationIssue[]): void {
    const lines = script.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查函数定义格式
      if (line.includes('function c') && !line.match(/^function c\d+\.\w+\(.*\)$/)) {
        issues.push({
          type: 'error',
          line: i + 1,
          column: line.indexOf('function'),
          message: 'Invalid function definition format',
          rule: 'function-format',
          suggestion: 'Use format: function c<ID>.function_name(params)',
        });
      }

      // 检查 target/operation 函数签名
      if (line.includes('.target(') || line.includes('.operation(')) {
        if (!line.includes('e,tp,eg,ep,ev,re,r,rp')) {
          issues.push({
            type: 'warning',
            line: i + 1,
            column: line.indexOf('('),
            message: 'Target/Operation function missing standard parameters',
            rule: 'function-params',
            suggestion: 'Use: function target(e,tp,eg,ep,ev,re,r,rp,chk,chkc)',
          });
        }
      }
    }
  }

  private validateYGOPROUsage(script: string, issues: ValidationIssue[]): void {
    const lines = script.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查未知的 YGOPRO 函数
      const matches = line.match(/Duel\.\w+/g);
      if (matches) {
        for (const match of matches) {
          if (!this.YGOPRO_FUNCTIONS.includes(match)) {
            // 可能是自定义函数或变体，只提示
            issues.push({
              type: 'info',
              line: i + 1,
              column: line.indexOf(match),
              message: `Potential custom YGOPRO function: ${match}`,
              rule: 'ygopro-function',
              suggestion: `Verify ${match} is a valid YGOPRO function`,
            });
          }
        }
      }

      // 检查 Effect 设置方法
      const effectSets = line.match(/e\d+:(\w+)\(/g);
      if (effectSets) {
        for (const setCall of effectSets) {
          const methodName = setCall.match(/:Set(\w+)\(/)?.[1];
          if (methodName && !this.EFFECT_PROPERTIES.includes(`Set${methodName}`)) {
            issues.push({
              type: 'warning',
              line: i + 1,
              column: line.indexOf(setCall),
              message: `Unusual effect property setter: ${methodName}`,
              rule: 'effect-property',
            });
          }
        }
      }

      // 检查缺失的 IsRelateToEffect 检查
      if (line.includes('Duel.GetFirstTarget()') && !line.includes('IsRelateToEffect')) {
        // 查找后续行
        let foundCheck = false;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].includes('IsRelateToEffect')) {
            foundCheck = true;
            break;
          }
        }
        if (!foundCheck) {
          issues.push({
            type: 'warning',
            line: i + 1,
            column: line.indexOf('GetFirstTarget'),
            message: 'Missing IsRelateToEffect check after GetFirstTarget',
            rule: 'target-relate-check',
            suggestion: 'Add: if tc:IsRelateToEffect(e) then',
          });
        }
      }
    }
  }

  private validateCommonMistakes(script: string, issues: ValidationIssue[]): void {
    const lines = script.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查常见的 Lua 语法错误
      if (line.match(/if.*then$/) && !line.includes('==')) {
        // 检查是否有对应的 end
        let foundEnd = false;
        let indent = 0;
        for (let j = i + 1; j < lines.length; j++) {
          const checkLine = lines[j];
          if (checkLine.match(/if.*then/)) indent++;
          if (checkLine.trim() === 'end') {
            if (indent === 0) {
              foundEnd = true;
              break;
            }
            indent--;
          }
        }
        if (!foundEnd) {
          issues.push({
            type: 'error',
            line: i + 1,
            column: line.indexOf('if'),
            message: 'Missing "end" for if statement',
            rule: 'missing-end',
            suggestion: 'Add "end" to close the if block',
          });
        }
      }

      // 检查字符串引号匹配
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        issues.push({
          type: 'error',
          line: i + 1,
          column: 0,
          message: 'Mismatched quotes',
          rule: 'quote-mismatch',
          suggestion: 'Check quote pairs on this line',
        });
      }

      // 检查常见错误用法
      if (line.includes('e:GetHandler():IsLocation(')) {
        issues.push({
          type: 'warning',
          line: i + 1,
          column: line.indexOf('IsLocation'),
          message: 'IsLocation may not work as expected for effects',
          rule: 'islocation-usage',
          suggestion: 'Consider using e:GetHandler():GetOriginalLocation()',
        });
      }

      // 检查缺失的 REASON_EFFECT
      if (line.match(/Duel\.(Destroy|Remove|SendtoGrave)\([^)]+\)/)) {
        if (!line.includes('REASON_EFFECT')) {
          issues.push({
            type: 'warning',
            line: i + 1,
            column: 0,
            message: 'Duel action missing REASON_EFFECT',
            rule: 'missing-reason',
            suggestion: 'Add REASON_EFFECT as the second parameter',
          });
        }
      }
    }
  }

  private validateBestPractices(script: string, issues: ValidationIssue[]): void {
    // 检查是否有注释
    if (!script.includes('--')) {
      issues.push({
        type: 'info',
        line: 0,
        column: 0,
        message: 'Script lacks comments',
        rule: 'documentation',
        suggestion: 'Add comments to explain effect logic',
      });
    }

    // 检查是否有 aux.Stringid
    if (!script.includes('aux.Stringid')) {
      issues.push({
        type: 'info',
        line: 0,
        column: 0,
        message: 'Script uses hardcoded strings instead of aux.Stringid',
        rule: 'stringid-usage',
        suggestion: 'Use aux.Stringid(ID, index) for effect descriptions',
      });
    }

    // 检查 CountLimit 使用
    if (script.includes('SetCountLimit')) {
      const hasHint = script.includes('EFFECT_FLAG_CLIENT_HINT');
      if (!hasHint) {
        issues.push({
          type: 'info',
          line: 0,
          column: 0,
          message: 'Consider adding EFFECT_FLAG_CLIENT_HINT for CountLimit',
          rule: 'client-hint',
          suggestion: 'Add: e:SetProperty(EFFECT_FLAG_CLIENT_HINT)',
        });
      }
    }
  }

  private calculateScore(issues: ValidationIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.type) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  formatReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('=== YGOPRO Lua Script Validation Report ===\n');

    if (result.valid) {
      lines.push('✓ Script structure is valid\n');
    } else {
      lines.push('✗ Script has errors that must be fixed\n');
    }

    lines.push(`Quality Score: ${result.score}/100\n`);

    if (result.issues.length === 0) {
      lines.push('No issues found!');
    } else {
      const errors = result.issues.filter(i => i.type === 'error');
      const warnings = result.issues.filter(i => i.type === 'warning');
      const infos = result.issues.filter(i => i.type === 'info');

      lines.push(`Found: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info\n`);

      const grouped = {
        error: errors,
        warning: warnings,
        info: infos,
      };

      for (const [type, items] of Object.entries(grouped)) {
        if (items.length > 0) {
          lines.push(`\n${type.toUpperCase()}S:`);
          for (const issue of items) {
            lines.push(`  Line ${issue.line}: ${issue.message}`);
            if (issue.suggestion) {
              lines.push(`    → ${issue.suggestion}`);
            }
          }
        }
      }
    }

    return lines.join('\n');
  }
}

export function createValidator(): LuaValidator {
  return new LuaValidator();
}
