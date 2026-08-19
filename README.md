# Scenite

> 个人视觉资产库 · Personal Visual Asset Library

由「思源背景 / 桌面美化 / Xiranite UI 素材 / AI 生成美术资产」的实际用途驱动而建立的统一图库。这里不只是壁纸仓库，而是你的一套**可检索、可索引、可被脚本随机调用**的视觉资产系统。

## 设计原则

- **按审美主题分类，不按来源 / 时间 / 年份分类。** 年份目录（`2024/`、`2025/`…）几年后会很难找，只适合摄影归档或项目版本，不适合壁纸。
- **内容与用途分离。** `wallpapers/` 是收藏，`generated/` 是自行生成，`icons/`、`covers/` 是其它用途资产。
- **一切皆可索引。** 每张图配套一份 `metadata/<name>.json`，可被 `tools/gen_index.py` 汇总成 `metadata/index.json`。
- **命名即检索。** 文件名本身就是最强索引，无需打开文件就能知道内容。

## 目录结构

```
Scenite/
├── README.md
├── .gitignore
├── wallpapers/        # 收藏壁纸，按审美主题
│   ├── anime/         # 二次元
│   ├── architecture/  # 建筑
│   ├── nature/        # 自然
│   ├── oriental/      # 东方 / 国风
│   ├── sci-fi/        # 科幻 / 赛博
│   └── minimal/       # 极简 / 单色
├── generated/         # 自己用 AI 生成的资产
│   ├── comfyui/       # ComfyUI 工作流出图
│   └── selected/      # 精选 / 二筛
├── icons/             # 图标素材
├── covers/            # 封面 / 缩略 / 卡片底图
├── metadata/          # 元数据（每张图一份 <name>.json + 汇总 index.json）
└── tools/             # 索引生成 / 随机切换等脚本
```

> 说明：你最终推荐的结构命名为 `MyVisualAssets/`，这里直接用仓库名 `Scenite` 作为库根，省掉一层无意义的嵌套。

## 文件命名规范

❌ **不要：**

```
IMG_39282.png
微信图片2025.png
Screenshot_2026.png
```

✅ **推荐：** `分类-主题-主体-修饰-序号.扩展名`，全小写 kebab-case。

```
arknights-wuling-city-night.webp
anime-arknights-wuling-night-001.webp
cyberpunk-city-rain-004.webp
oriental-mountain-mist-012.webp
```

- 用 `-` 连接，不用空格、中文或下划线。
- 扩展名优先 `webp`（体积小、支持无损、支持透明）。
- 同类多张用三位序号 `-001` 收尾，方便脚本批量处理与随机切换。

## 元数据规范

每张图在 `metadata/` 下配一份同名 JSON（`metadata/arknights-wuling-city-night.json`）：

```json
{
  "file": "arknights-wuling-city-night.webp",
  "path": "wallpapers/anime/arknights-wuling-city-night.webp",
  "tags": ["arknights", "city", "night", "blue"],
  "usage": ["siyuan", "desktop"],
  "ratio": "16:9",
  "source": "original",
  "notes": ""
}
```

字段说明：

| 字段     | 含义                                                         |
| -------- | ------------------------------------------------------------ |
| `file`   | 文件名                                                       |
| `path`   | 相对仓库根的路径                                             |
| `tags`   | 检索标签（题材 / 色调 / 主体）                               |
| `usage`  | 用途：`siyuan` / `desktop` / `mobile` / `xiranite` / `cover` |
| `ratio`  | 比例：`16:9` / `9:16` / `4:3` / `1:1`                        |
| `source` | 来源：`original` / `ai` / `collected`                       |
| `notes`  | 备注                                                         |

## 生成索引

```bash
python tools/gen_index.py
```

脚本会扫描 `metadata/*.json`（跳过 `index.json`），汇总生成 `metadata/index.json`，包含 `count` 与 `assets` 数组。若环境装有 Pillow，会自动补全每张图的真实宽高与比例。

思源插件未来即可基于 `index.json` 实现：

> 随机选一张「夜晚 + 东方 + 二次元」背景

## 动态网络壁纸 API

`tools/wallpaper-api/server.mjs` 把多个「随机返回图片」的外部接口（必应 / Unsplash / imgapi / 岁月小筑…）与你自己的 Scenite 图库统一成一个本地路由：既能随机挑源，也能指定源，还能按标签随机。零依赖，Node 内置即可跑。

```bash
PORT=8787 node tools/wallpaper-api/server.mjs
```

常用路径：`/random`（随机）、`/s/anime`（指定源）、`/local`（本地库随机，走 jsDelivr）、`/cat/anime`（按标签随机）、`/p/random`（流式代理，带重试，兼容性最好）、`/json`（列源）。详情见 `tools/wallpaper-api/README.md`。

直接把壁纸切换工具 / 思源背景的 URL 指向 `http://localhost:8787/random` 或 `http://localhost:8787/s/anime` 即可。

## 随机切换（思路）

可在 `tools/` 下再加 `random_pick.py`：按 `tags` / `usage` / `ratio` 过滤后随机返回一条 `path`，交给壁纸切换脚本调用。索引就绪后这一步很简单。

## 贡献流程（给自己）

1. 放进正确的主题目录，按命名规范改名。
2. 在 `metadata/` 写一份同名 JSON。
3. 跑 `python tools/gen_index.py` 更新索引。
4. 提交。
