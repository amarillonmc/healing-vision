# CLI LLM 集成完成总结

## 完成的工作

### 1. 创建 CLI LLM 生成器

**新文件**: `src/generator/cli-llm-generator.ts`

- 实现了 `CLILLMGenerator` 类，支持使用 Claude Code 或 OpenCode CLI�置的 LLM
- 自动检测可用的 CLI 工具
- 支持通过 `execSync` 调用 CLI 工具的 ask 命令
- 实现智能提示词构建，包含卡片数据、相似脚本等信息

### 2. 更新 CLI 工具

**修改文件**: `src/cli.ts`

- 添加 `--use-cli-llm` 选项，使用 CLI 内置 LLM
- 添加 `--llm-provider` 选项，指定使用的 LLM 提供商
- 实现自动回退机制：CLI LLM 失败时自动使用基础生成器
- 升级版本号到 0.2.0

### 3. 更新项目导出

**修改文件**: `src/index.ts`

- 导出 `CLILLMGenerator` 和相关类型
- 导出 `createCLILLMGenerator` 工厂函数

### 4. 创建测试文件

**新文件**: `test/test-cli-llm.ts`

- 测试 CLI 工具检测
- 测试复杂效果解析
- 测试 LLM 生成功能
- 包含完整的错误处理和用户指引

### 5. 更新文档

**修改文件**:
- `README.md` - 主 README，添加 CLI LLM 功能说明
- `script-generator/README.md` - 详细的功能说明和使用指南
- `package.json` - 更新版本和添加测试脚本

## 使用方法

### 安装 CLI 工具

```bash
# 选项 A: Claude Code
npm install -g @anthropic-ai/claude-code

# 选项 B: OpenCode
npm install -g opencode-cli
```

### 基本使用

```bash
# 使用 CLI 内置 LLM 生成脚本
npm run dev generate -i 10000000 -e "复杂效果文本" --use-cli-llm

# 指定 LLM 提供商
npm run dev generate -i 10000000 -e "效果文本" --use-cli-llm --llm-provider claude-code
```

### 作为库使用

```typescript
import { createCLILLMGenerator, createParser } from './dist/index.js';

const parser = createParser();
const parsed = parser.parse("效果文本...", cardId, 'zh-CN');

const cliLlmGenerator = createCLILLMGenerator();
const script = await cliLlmGenerator.generate({
  cardId,
  cardName,
  effectText,
  parsedEffects: parsed,
  language,
});

cliLlmGenerator.cleanup();
```

## 技术实现

### CLI 工具检测

```typescript
private detectProvider(): 'claude-code' | 'open-code' {
  try {
    execSync('claude --version', { stdio: 'ignore' });
    return 'claude-code';
  } catch {
    try {
      execSync('opencode --version', { stdio: 'ignore' });
      return 'open-code';
    } catch {
      throw new Error('No supported CLI tool found');
    }
  }
}
```

### 调用 CLI LLM

```typescript
private async callClaudeCode(prompt: string): Promise<string> {
  const result = execSync(
    `claude ask "${this.escapePrompt(prompt)}"`,
    {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
    }
  );
  return this.extractLuaCode(result.trim());
}
```

### 智能提示词构建

提示词包含：
- 卡片基本信息（ID、名称、语言）
- 效果文本
- 卡片数据（类型、属性、种族、数值）
- 相似脚本参考（如果有）
- 详细的生成要求

## 优势

1. **无需 API 密钥**: 使用已安装的 CLI 工具，无需额外配置
2. **自动检测**: 自动检测可用的 CLI 工具
3. **智能回退**: CLI LLM 失败时自动使用基础生成器
4. **本地化**: 更好的本地语言支持
5. **无网络依赖**: 不需要额外的网络请求（CLI 工具自行处理）

## 测试

运行测试：

```bash
# 基础测试
npm test

# CLI LLM 测试（需要已安装 CLI 工具）
npm run test:cli-llm
```

## 未来改进方向

1. 支持更多 CLI 工具（如其他 AI CLI）
2. 实现更好的提示词模板
3. 添加缓存机制，避免重复调用
4. 支持批量处理多个卡片
5. 添加更多的测试用例

## 相关文件

- `src/generator/cli-llm-generator.ts` - CLI LLM 生成器实现
- `src/cli.ts` - CLI 工具入口
- `test/test-cli-llm.ts` - CLI LLM 测试
- `README.md` - 主文档
- `script-generator/README.md` - 详细文档

## 版本信息

- 当前版本: 0.2.0
- 发布日期: 2026-02-23
- 主要更新: CLI 内置 LLM 支持
