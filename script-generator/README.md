# YGOPRO Lua Script Generator

通过输入卡片效果文本生成 YGOPRO 可用的 Lua 脚本。

## 功能特性

- 从效果文本解析卡片效果
- 支持多语言卡片数据库（中文、英文、日文等）
- 自动生成符合 YGOPRO 规范的 Lua 脚本
- 支持自定义 setcode
- 可选使用 LLM 处理复杂效果
- 卡片搜索和信息查询功能

## 前置要求

1. Node.js >= 18.0.0
2. YGOPRO 卡片数据库文件 (cards.cdb)

### 数据库设置

此工具需要 YGOPRO 卡片数据库。请按照以下步骤设置：

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

```bash
# 生成脚本
npm run dev generate -i 10000000 -e "这张卡的攻击力上升1000点" -l zh-CN

# 使用 LLM 生成复杂效果
npm run dev generate -i 10000000 -e "效果文本..." --use-llm

# 搜索卡片
npm run dev search "黑魔术士" -l zh-CN

# 查看卡片信息
npm run dev info 10000000 -l zh-CN

# 解析效果文本
npm run dev parse "这张卡召唤成功时，可以破坏对方场上一张卡"
```

### 作为库使用

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
│       ├── script-generator.ts # 脚本生成器
│       └── llm-generator.ts     # LLM 辅助生成
└── dist/                    # 编译输出
```

## 支持的效果类型

- 启动效果（ ignition effects）
- 诱发效果（ trigger effects）
- 永续效果（ continuous effects）
- 快速效果（ quick effects）
- 特殊召唤/效果破坏/效果伤害等常见效果类型

## 注意事项

1. 确保数据库文件路径正确
2. 复杂效果可能需要手动调整生成的脚本
3. 建议在使用前测试生成的脚本
4. LLM 功能需要配置 API 密钥

## 开发

```bash
# 开发模式（支持热重载）
npm run dev -- [命令]

# 编译
npm run build

# 提取 YGOPRO API 常量（需要 ygopro-core）
npm run extract-api
```

## 许可证

MIT License
