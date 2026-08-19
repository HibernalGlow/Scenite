# Scenite 项目记忆

## 标签体系（Danbooru 风格）
- 每张图在 `metadata/<name>.json` 配一份 JSON，`tags` 为数组。
- 采用 booru 命名空间分类：无前缀 = general（题材/色调/介质/顶层分类）；`copyright:`（IP/系列）；`character:`（角色）；`artist:`（画师，AI 生成填 `artist:ai`）；`meta:`（分级/来源，如 `meta:collected`/`meta:safe`）。
- 多词标签用下划线（`blue_eyes`）。顶层分类标签（`game`/`anime`/`nature`/`oriental`/`sci-fi`/`minimal`/`architecture`）作为 general 保留，供 `/cat/<tag>` 按类筛。
- `usage`/`ratio`/`source` 仍是独立结构化字段，不并入 tags。
- 完整规范见仓库 README.md「Tag 体系（Danbooru 风格）」一节。
- wallpaper-api 新增：`/cat/<a>+<b>` 多标签 AND、`/cat/<category>` 类别浏览、`/tags` 分组列出。
