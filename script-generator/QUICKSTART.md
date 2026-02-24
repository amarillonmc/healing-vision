# YGOPRO Script Generator - 快速入门指南

## 5 分钟快速开始

### 步骤 1: 安装项目（1 分钟）

```bash
cd script-generator
npm install
npm run build
```

### 步骤 2: 安装 CLI 工具（1 分钟）

选择以下任一工具：

```bash
# 选项 A: Claude Code（推荐）
npm install -g @anthropic-ai/claude-code

# 选项 B: OpenCode
npm install -g opencode-cli
```

### 步骤 3: 运行测试（1 分钟）

```bash
# 基础测试
npm test

# CLI LLM 测试（可选，测试 CLI LLM 功能）
npm run test:cli-llm
```

### 步骤 4: 生成第一个脚本（2 分钟）

```bash
# 使用 CLI 内置 LLM 生成脚本
npm run dev generate -i 99999999 -e "这张卡召唤成功时，可以破坏对方场上一张卡" --use-cli-llm --dry-run
```

## 常用命令

### 基础命令

```bash
# 解析效果文本
npm run dev parse "效果文本"

# 生成脚本（基础生成器）
npm run dev generate -i 卡片ID -e "效果文本"

# 生成脚本（使用 CLI LLM）
npm run dev generate -i 卡片ID -e "效果文本" --use-cli-llm
```

### 高级选项

```bash
# 指定语言
npm run dev generate -i 卡片ID -e "效果文本" -l en-US

# 指定输出目录
npm run dev generate -i 卡片ID -e "效果文本" -o ./output

# 只打印不写入文件
npm run dev generate -i 卡片ID -e "效果文本" --dry-run

# 指定 CLI LLM 提供商
npm run dev generate -i 卡片ID -e "效果文本" --use-cli-llm --llm-provider claude-code
```

### 其他命令

```bash
# 搜索卡片（需要数据库）
npm run dev search "黑魔术士"

# 查看卡片信息（需要数据库）
npm run dev info 10000000
```

## 效果示例

### 简单效果（基础生成器）

```bash
npm run dev generate -i 10000000 -e "这张卡的攻击力上升500"
```

### 中等效果（CLI LLM）

```bash
npm run dev generate -i 10000000 -e "这张卡召唤成功时，可以破坏对方场上一张卡" --use-cli-llm
```

### 复杂效果（CLI LLM）

```bash
npm run dev generate -i 10000000 -e "这张卡的特殊召唤成功的场合，以自己墓地1只怪兽为对象才能发动。那只怪兽特殊召唤。这个效果特殊召唤的怪兽在这个效果的发动后，不能作为这张卡的效果的对象。一回合一次，这张卡被战斗或者对方的卡的效果破坏的场合，可以作为代替把自己墓地1只怪兽除外。" --use-cli-llm
```

## 故障排除

### 问题: CLI 工具检测失败

**解决方案**:
1. 确认已安装 CLI 工具：`claude --version` 或 `opencode --version`
2. 重新安装 CLI 工具
3. 检查 PATH 环境变量

### 问题: 数据库未找到

**解决方案**:
1. 基础功能不需要数据库
2. 如需完整功能，请参考 README.md 设置数据库

### 问题: 生成的脚本质量不高

**解决方案**:
1. 对于简单效果，基础生成器已足够
2. 对于复杂效果，使用 `--use-cli-llm`
3. 可以手动调整生成的脚本

## 下一步

- 阅读 [README.md](README.md) 了解详细功能
- 阅读 [EXAMPLES.md](EXAMPLES.md) 查看更多示例
- 阅读 [CLI_LLM_INTEGRATION.md](CLI_LLM_INTEGRATION.md) 了解 CLI LLM 集成

## 获取帮助

```bash
# 查看帮助信息
npm run dev -- --help
npm run dev generate -- --help
```
