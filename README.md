# YGOPRO Script Generator

通过输入卡片效果文本生成 YGOPRO 可用的 Lua 脚本。

## 项目概述

这是一个用于自动化生成游戏王 YGOPRO 模拟器 Lua 脚本的工具。用户只需输入卡片的中文/英文/日文效果文本，工具即可解析效果并生成符合 YGOPRO 引擎规范的 Lua 脚本代码。

## 项目结构

```
healing-vision/
├── script-generator/      # 脚本生成器主程序
│   ├── src/              # TypeScript 源代码
│   ├── dist/             # 编译后的 JavaScript
│   └── test/             # 测试文件
├── ygopro-core/          # YGOPRO 引擎（C++源码）
├── ygopro-database/      # YGOPRO 卡片数据库
├── ygopro-scripts/       # 现有的 Lua 脚本参考
└── session-*.md          # 开发会话记录
```

## 快速开始

### 1. 安装依赖

```bash
cd script-generator
npm install
npm run build
```

### 2. 运行测试（无需数据库）

```bash
npm test
```

### 3. 使用 CLI 工具生成脚本

**注意**: 需要先设置 YGOPRO 卡片数据库，详见 [script-generator/README.md](script-generator/README.md)

```bash
# 解析效果文本
npm run dev parse "这张卡召唤成功时，可以破坏对方场上一张卡"

# 生成完整脚本（需要数据库）
npm run dev generate -i 10000000 -e "效果文本" -l zh-CN
```

## 功能特性

### 效果解析器

- 支持中文、英文、日文效果文本
- 自动识别效果类型（启动/诱发/永续/快速）
- 提取触发时机、代价、对象等关键信息
- 关键词映射到 YGOPRO API

### 脚本生成器

- 生成符合规范的 initial_effect 函数
- 自动创建 target 和 operation 回调
- 支持多效果卡片
- 包含注释说明

### LLM 辅助生成

- 对于复杂效果，可选使用 LLM 进行智能生成
- 支持自定义 API 配置

## 技术栈

- **TypeScript** - 主要开发语言
- **Node.js** - 运行时环境
- **better-sqlite3** - 数据库读取
- **commander** - CLI 框架

## 开发资源

### 相关仓库

- [ygopro-core](https://github.com/edo9300/ygopro-core) - YGOPRO 引源代码
- [ygopro-scripts](https://github.com/mercury233/ygopro-scripts) - 官方脚本库
- [ygopro-database](https://github.com/mercury233/ygopro-database) - 卡片数据库

### YGOPRO API 参考

- `Duel.CreateEffect()` - 创建效果对象
- `Effect.SetType()` - 设置效果类型
- `Effect.SetCode()` - 设置触发代码
- `Effect.SetTarget()` - 设置对象选择函数
- `Effect.SetOperation()` - 设置效果执行函数

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- YGOPRO 项目维护者
- 游戏王卡片效果编写社区
