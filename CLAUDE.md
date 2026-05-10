# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供该仓库的开发指引。

## 项目概述

Photo Border 是一个基于 React 19 + TypeScript + Vite 的 PWA 应用，用于为上传的照片生成带有相机信息参数的边框。应用支持读取 JPEG EXIF 信息、手动编辑元数据、选择品牌 Logo、Canvas 实时预览并导出成片。

## 常用命令

项目使用 `pnpm` 管理依赖和运行脚本。

- `pnpm dev` — 启动 Vite 开发服务器。
- `pnpm build` — 运行 TypeScript 项目检查（`tsc -b`）并构建生产版本到 `dist/`。
- `pnpm lint` — 运行 ESLint 检查。
- `pnpm preview` — 本地预览生产构建。

本项目目前未配置自动化测试。修改后请通过 `pnpm build`、`pnpm lint` 和浏览器手动测试验证。

## 高层架构

### Canvas 渲染（预览与导出共用同一路径）

为了保证所见即所得，预览和导出使用同一个模板渲染函数。

- `src/components/CanvasPreview.tsx` 调用 `template.drawExport(context, image, renderProps)` 在固定宽度 **1600px** 的 Canvas 上绘制预览图。
- `src/App.tsx` 的导出流程创建离屏 Canvas，宽度为照片的原始宽度，计算 `outputScale = image.naturalWidth / 1600`，然后调用同一个 `drawExport` 并传入该缩放比例。
- 如果模板改变了导出画布的宽度（例如添加边距），需要实现 `getCanvasWidth`；否则画布宽度默认为 `image.naturalWidth`。

**请勿为照片输出重新引入 DOM/CSS 覆盖层**，除非同步修改导出流程以使用相同的渲染来源。

### 模板系统

模板位于 `src/templates/`，每个模板导出一个 `TemplateDefinition`：

- `id`、`name`、`description` — 用于模板选择列表。
- `controls` — 声明当前模板需要在 UI 中显示哪些设置项（`metaFields`、`logoStyle`、`borderWidth` 和模板专属的 `adjustments`）。
- `drawExport(context, image, props)` — 负责所有 Canvas 绘制逻辑，预览和导出都会调用。
- `getCanvasWidth(image, props)` — 可选。仅在模板改变画布宽度时实现。

新增模板后需要在 `src/templates/index.ts` 中注册。

修改模板时，请测试上传、模板切换、边框宽度调整、Logo 切换、模板专属参数调整以及图片导出。

### 品牌 Logo 匹配与绘制

- `src/brand/brandIcons.ts` 提供 `findBrandIcon(meta)`，根据 `maker`/`logo` 文本在 `cameraLogoCatalog` 中匹配品牌。
- `src/brand/drawBrandLogo.ts` 提供 `drawCanvasBrandLogo` 和 `measureCanvasBrandLogo`。如果没有匹配到 Logo 图片，会回退为在 Canvas 上直接绘制文本标签。
- Logo SVG 静态资源位于 `public/camera-logos/`。目录中的品牌映射关系（名称、别名、可用变体如彩色/黑/白等）在 `cameraLogoCatalog` 中定义。
- Logo 样式选择和缩放值按品牌维度存储（`Record<brandId, value>`），不是全局单一的。

### EXIF 处理

- `src/lib/exif.ts` 包含自定义的 JPEG EXIF 解析器（`parseExif`），从 IFD0 和 EXIF 子 IFD 中读取厂商、设备、焦距、光圈、曝光时间、ISO 和拍摄日期。
- `src/lib/exifWriter.ts`（`addExifToJpeg`）负责将 EXIF 元数据重新写入导出的 JPEG 文件。

### 应用状态

`src/App.tsx` 管理所有顶层状态：已上传照片队列、当前选中照片、模板选择、边框宽度、各品牌的 Logo 选择/缩放、各模板的调节参数。每张照片的元数据独立存储，可分别编辑。

## 部署

GitHub Actions 工作流（`.github/workflows/deploy-pages.yml`）会在每次推送到 `main` 分支时自动构建并部署到 GitHub Pages。

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->