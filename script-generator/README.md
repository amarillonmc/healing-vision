# YGOPRO Lua Script Generator

通过输入卡片效果文本生成 YGOPRO 可用的 Lua 脚本。

**v0.2.0 新功能**: 现在支持使用 Claude Code 或 OpenCode CLI 的内置 LLM，无需额外配置 API 密钥！

## 功能特性

- 从效果文本解析卡片效果
- 支持多语言卡片数据库（中文、英文、日文等）
- 自动生成符合 YGOPRO 规范的 Lua 脚本
- 支持自定义 setcode
- **使用 CLI 内置 LLM 处理复杂效果**（推荐，无需 API 密钥）
- 可选使用 API 方式调用 LLM（需要配置 API 密钥）
- 卡片搜索和信息查询功能

## 前置要求

### 基础要求
1. Node.js >= 18.0.0
2. YGOPRO 卡片数据库文件 (cards.cdb) - 可选，用于完整功能

### CLI LLM 要求（推荐）

选择以下任一 CLI 工具：

1. **Claude Code** - Anthropic 官方 CLI 工具
   ```bash
   # 安装 Claude Code
   npm install -g @anthropic-ai/claude-code
   ```

2. **OpenCode** - OpenAI 兼容的 CLI 工具
   ```bash
   # 安装 OpenCode
   npm install -g opencode-cli
   ```

### 数据库设置（可选）

此工具需要 YGOPRO 卡片数据库以获取完整卡片信息。请按照以下步骤设置：

1. 获取 YGOPRO 数据库：
   - 克隆 [ygopro-database](https://github.com/mercury233/ygopro-database) 仓库
   - 或者从官方 YGOPRO 客户端复制 `locales` 目录

2. 将数据库文件放到正确的位置：
   ```
   healing-vision/
   ├── ygopro-database/
   │   └── locales/
   │       ├── zh-CN/
   │       │   └── cards.cdb
   │       ├── en-US/
   │       │   └── cards.cdb
   │       └── ...
   ├── script-generator/
   ```

## 安装

```bash
cd script-generator
npm install
npm run build
```

## 使用方法

### 命令行工具

#### 基础生成（不使用 LLM）

```bash
# 生成简单效果的脚本
npm run dev generate -i 10000000 -e "这张卡的攻击力上升1000点" -l zh-CN
```

#### 使用 CLI 内置 LLM（推荐）

```bash
# 使用 Claude Code 或 OpenCode 的内置 LLM 生成复杂效果
npm run dev generate -i 10000000 -e "复杂效果文本..." --use-cli-llm

# 指定使用的 LLM 提供商
npm run dev generate -i 10000000 -e "效果文本..." --use-cli-llm --llm-provider claude-code
npm run dev generate -i 10000000 -e "效果文本..." --use-cli-llm --llm-provider open-code
```

**CLI LLM 的优势**：
- 无需配置 API 密钥
- 使用已安装的 CLI 工具的 LLM 能力
- 自动检测可用的 CLI 工具
- 更好的本地化支持

#### 使用 API 方式调用 LLM（需要配置）

```bash
# 需要先配置 .env 文件中的 API 密钥
npm run dev generate -i 10000000 -e "效果文本..." --use-llm
```

#### 其他命令

```bash
# 搜索卡片
npm run dev search "黑魔术士" -l zh-CN

# 查看卡片信息
npm run dev info 10000000 -l zh-CN

# 解析效果文本
npm run dev parse "这张卡召唤成功时，可以破坏对方场上一张卡"
```

### 作为库使用

#### 使用 CLI LLM 生成器

```typescript
import { createParser, createCLILLMGenerator } from './dist/index.js';

// 解析效果文本
const parser = createParser();
const parsed = parser.parse("效果文本...", 10000000, 'zh-CN');

// 使用 CLI 内置 LLM 生成脚本
const cliLlmGenerator = createCLILLMGenerator();
const script = await cliLlmGenerator.generate({
  cardId: 10000000,
  cardName: '示例卡片',
  effectText: "效果文本...",
  parsedEffects: parsed,
  language: 'zh-CN',
});

cliLlmGenerator.cleanup();
console.log(script);
```

#### 使用基础生成器

```typescript
import { createReader, createParser, createGenerator } from './dist/index.js';

// 读取卡片数据
const reader = createReader('zh-CN');
reader.open();
const card = reader.getFullCard(10000000);
reader.close();

// 解析效果文本
const parser = createParser();
const parsed = parser.parse("效果文本...", 10000000, 'zh-CN');

// 生成 Lua 脚本
const generator = createGenerator();
const script = generator.generate({
  cardId: 10000000,
  cardName: '示例卡片',
  effects: parsed,
  language: 'zh-CN',
});
```

## 项目结构

```
script-generator/
├── src/
│   ├── cli.ts              # 命令行入口
│   ├── constants/
│   │   └── api.ts          # YGOPRO API 常量
│   ├── data/
│   │   ├── cdb-reader.ts   # 数据库读取器
│   │   └── extract-api.ts  # API 提取工具
│   ├── parser/
│   │   ├── effect-parser.ts    # 效果解析器
│   │   └── keyword-map.ts      # 关键词映射
│   └── generator/
│       ├── script-generator.ts # 基础脚本生成器
│       ├── cli-llm-generator.ts # CLI 内置 LLM 生成器
│       └── llm-generator.ts     # API LLM 生成器
└── dist/                    # 编译输出
```

## 支持的效果类型

- 启动效果（ ignition effects）
- 诱发效果（ trigger effects）
- 永续效果（ continuous effects）
- 快速效果（ quick effects）
- 特殊召唤/效果破坏/效果伤害等常见效果类型

## CLI 工具对比

| 功能 | 基础生成器 | CLI LLM | API LLM |
|------|-----------|---------|---------|
| 需要配置 | 无 | CLI 工具 | API 密钥 |
| 效果质量 | 简单效果 | 复杂效果 | 复杂效果 |
| 响应速度 | 快 | 中等 | 慢 |
| 网络要求 | 无 | 无 | 是 |
| 推荐场景 | 简单效果 | 日常使用 | 云端部署 |

## 注意事项

1. **CLI LLM 优先**: 推荐使用 `--use-cli-llm` 选项，无需额外配置
2. **数据库文件**: 完整功能需要数据库文件，但可以不使用数据库进行基础生成
3. **脚本验证**: 复杂效果可能需要手动调整生成的脚本
4. **CLI 工具安装**: 确保已安装 Claude Code 或 OpenCode

## 开发

```bash
# 开发模式（支持热重载）
npm run dev -- [命令]

# 编译
npm run build

# 运行测试
npm test

# 提取 YGOPRO API 常量（需要 ygopro-core）
npm run extract-api
```

## 常见问题

### Q: 如何选择 LLM 模式？

A:
- **日常使用**: 使用 `--use-cli-llm`，无需配置，开箱即用
- **云端部署**: 使用 `--use-llm`，需要配置 API 密钥
- **简单效果**: 不使用 LLM，直接生成即可

### Q: CLI LLM 检测失败怎么办？

A: 确保已安装 Claude Code 或 OpenCode，并且可以在终端中运行：
```bash
claude --version  # 或
opencode --version
```

### Q: 生成的脚本质量如何？

A:
- 简单效果：基础生成器即可满足需求
- 复杂效果：CLI LLM 会生成更准确的代码
- 特殊效果：可能需要手动调整

## 许可证

MIT License

