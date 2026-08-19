# Scenite

> 个人视觉资产库 · Personal Visual Asset Library

由「思源背景 / 桌面美化 / Xiranite UI 素材 / AI 生成美术资产」的实际用途驱动而建立的统一图库。这里不只是壁纸仓库，而是你的一套**可检索、可索引、可被脚本随机调用**的视觉资产系统。

## 设计原则

- **按审美主题分类，不按来源 / 时间 / 年份分类。** 年份目录（`2024/`、`2025/`…）几年后会很难找，只适合摄影归档或项目版本，不适合壁纸。
- **内容与用途分离。** `wallpapers/` 是收藏，`generated/` 是自行生成，`icons/`、`covers/` 是其它用途资产。
- **一切皆可索引。** 每张图的元数据是其**同目录**下的同名 `.json` sidecar，可被 `tools/gen_index.py` 扫描全树汇总成 `metadata/index.json`。
- **命名即检索。** 文件名本身就是最强索引，无需打开文件就能知道内容。

## 目录结构

```
Scenite/
├── README.md
├── .gitignore
├── wallpapers/            # 收藏壁纸，一级按审美主题
│   ├── anime/             # 二次元（动画/漫画 IP），二级按作品
│   │   ├── original/      # 原创 / 同人风，不绑定具体番
│   │   ├── fate/
│   │   └── evangelion/
│   ├── game/              # 游戏美术 / CG / 宣传图，二级按游戏
│   │   ├── arknights-endfield/
│   │   ├── genshin/
│   │   ├── honkai-starrail/
│   │   └── original/
│   ├── architecture/      # 建筑
│   ├── nature/            # 自然
│   ├── oriental/          # 东方 / 国风
│   ├── sci-fi/            # 科幻 / 赛博
│   └── minimal/           # 极简 / 单色
├── generated/             # 自己用 AI 生成的资产
│   ├── comfyui/           # ComfyUI 工作流出图
│   └── selected/          # 精选 / 二筛
├── icons/                 # 图标素材
├── covers/                # 封面 / 缩略 / 卡片底图
├── metadata/              # 仅存放脚本生成的汇总 index.json（每张图的元数据是其同目录下的同名 .json sidecar）
└── tools/                 # 索引生成 / 随机切换等脚本
```

> 每个一级主题目录都可继续按 IP / 系列开二级子文件夹（如 `wallpapers/game/genshin/`）；二级目录按需创建，不必预先铺满。**`anime` 与 `game` 严格分离**：动画/漫画 IP 进 `anime/`，游戏美术/CG/宣传图进 `game/`。

> 说明：你最终推荐的结构命名为 `MyVisualAssets/`，这里直接用仓库名 `Scenite` 作为库根，省掉一层无意义的嵌套。

## 文件命名规范

❌ **不要：**

```
IMG_39282.png
微信图片2025.png
Screenshot_2026.png
```

✅ **推荐：** `<ip>-<主体>-<yymmdd>.<扩展名>`，全小写 kebab-case；日期用入库日期 `yymmdd`（粗一点可用 `yymm`）。

```
game-arknights-endfield-rossi-260819.avif
anime-fate-saber-260815.webp
game-genshin-hutao-night-2608.webp
oriental-mountain-mist-260812.webp
```

- **anime 与 game 严格分开：** 动画/漫画 IP 进 `anime/`，游戏美术/CG/宣传图进 `game/`。
- **二级按 IP / 系列细分：** 文件落在 `wallpapers/game/arknights-endfield/`、`wallpapers/anime/fate/` 这类目录，文件夹即二级分类。
- 用 `-` 连接，不用空格、中文或下划线。
- 扩展名优先 `webp`（体积小、支持无损、支持透明）；本例 rossi 为 .avif 原格式亦可保留。
- **日期放在末尾**（如 `-260819`），便于按时间排序与检索；同名多张用日期或三位序号区分。

## 元数据规范

每张图在**图片同目录**下放一份同名 JSON sidecar（`wallpapers/game/arknights-endfield/arknights-endfield-rossi-260819.json`，与 `.avif` 并列）：

```json
{
  "file": "arknights-endfield-rossi-260819.avif",
  "path": "wallpapers/game/arknights-endfield/arknights-endfield-rossi-260819.avif",
  "tags": [
    "game",
    "cg",
    "blue",
    "meta:collected",
    "copyright:arknights",
    "copyright:arknights_endfield",
    "character:rossi",
    "artist:yukuso",
    "meta:official_art",
    "blonde_hair",
    "long_hair",
    "wolf_ears",
    "yellow_eyes",
    "white_dress",
    "hooded_cape",
    "looking_at_viewer",
    "solo"
  ],
  "usage": ["siyuan", "desktop"],
  "ratio": "",
  "source": "collected",
  "source_url": "https://danbooru.donmai.us/posts/11049666",
  "notes": "洛茜角色潜能CG图，来自《明日方舟：终末地》(Arknights: Endfield)。归入 game 而非 anime。"
}
```

> 示例为节选；完整 Danbooru 标签（含 `animal_ears` / `blue_apple` / `red_cape` 等 40+ 项）见图片同目录下的 `arknights-endfield-rossi-260819.json` 本体。

### Tag 体系（Danbooru 风格）

标签采用 booru 站通用的「命名空间 + 分类」模型：用 `前缀:` 区分标签类别，无前缀即 general。分类对齐 Danbooru 的 5 类标签：

| 命名空间    | Danbooru 类别   | 含义                                  | 例子                                                                       |
| ----------- | --------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| _(无前缀)_  | general (0)     | 题材 / 主体 / 色调 / 介质 / 氛围 + 顶层分类 | `game` `anime` `nature` `oriental` `sci-fi` `minimal` `architecture` `blue` `night` `cg` `landscape` |
| `copyright:`| copyright (3)   | 系列 / IP / 作品 / 版权方             | `copyright:arknights` `copyright:fate` `copyright:genshin` `copyright:evangelion` |
| `character:`| character (4)   | 角色                                  | `character:rossi` `character:saber` `character:hutao`                      |
| `artist:`   | artist (1)      | 原画师 / 创作者（AI 生成填 `artist:ai`） | `artist:someone` `artist:ai`                                            |
| `meta:`     | meta (5)        | 分级 / 来源 / 检索辅助                | `meta:safe` `meta:nsfw` `meta:collected` `meta:ai` `meta:original`        |

约定：

- **多词标签用下划线**：`blue_eyes`、`night_sky`、`long_hair`。
- **顶层分类标签**（`game` / `anime` / `nature` / `oriental` / `sci-fi` / `minimal` / `architecture`）作为 general 保留，`tools/wallpaper-api` 的 `/cat/game`、`/cat/anime` 仍能按类筛图。
- **`usage` / `ratio` / `source` 仍是独立结构化字段**（被代码读取），不要塞进 `tags`；想在标签里检索来源可用 `meta:collected` 镜像。
- **务必带上顶层分类标签**，否则按类筛图会漏。

> `/cat/<tag>` 支持命名空间精确匹配：`/cat/copyright:arknights`、`/cat/character:rossi`；多个标签用 `+` 做 AND，如 `/cat/copyright:arknights+character:rossi`；只写类别名（`/cat/copyright`）可浏览该类别全部标签。`/tags` 列出全部标签并按类别分组。

字段说明：

| 字段        | 含义                                                         |
| ----------- | ------------------------------------------------------------ |
| `file`      | 文件名                                                       |
| `path`      | 相对仓库根的路径                                             |
| `tags`      | 检索标签（Danbooru 风格：命名空间 + general）                |
| `usage`     | 用途：`siyuan` / `desktop` / `mobile` / `xiranite` / `cover` |
| `ratio`     | 比例：`16:9` / `9:16` / `4:3` / `1:1`                        |
| `source`    | 来源：`original` / `ai` / `collected`                       |
| `source_url`| 原图出处链接（如 Danbooru / Pixiv post），便于溯源           |
| `notes`     | 备注                                                         |

> **溯源**：若原图来自 Danbooru / Pixiv 等，把 post 链接填进 `source_url`，并把站点的原始标签按上述命名空间映射后并入 `tags`（Artist→`artist:`、Copyrights→`copyright:`、Character→`character:`、Meta→`meta:`、General→无前缀）。多词标签统一转下划线。

## 生成索引

```bash
python tools/gen_index.py
```

脚本会扫描全仓库的图片，查找每张图**同目录**下的同名 `.json` sidecar（自动跳过 `index.json` / `docs` / `site` / `node_modules` / `tools` / `metadata` 等目录），汇总生成 `metadata/index.json`，包含 `count` 与 `assets` 数组。若环境装有 Pillow，会自动补全每张图的真实宽高与比例。

思源插件未来即可基于 `index.json` 实现：

> 随机选一张「夜晚 + 东方 + 二次元」背景

## 动态网络壁纸 API

`tools/wallpaper-api/server.mjs` 把多个「随机返回图片」的外部接口（必应 / Unsplash / imgapi / 岁月小筑…）与你自己的 Scenite 图库统一成一个本地路由：既能随机挑源，也能指定源，还能按标签随机。零依赖，Node 内置即可跑。

```bash
PORT=8787 node tools/wallpaper-api/server.mjs
```

常用路径：`/random`（随机）、`/s/anime`（指定源）、`/local`（本地库随机，走 jsDelivr）、`/cat/anime`（按标签随机）、`/cat/copyright:arknights`（命名空间标签）、`/cat/copyright:arknights+character:rossi`（多标签 AND）、`/cat/copyright`（浏览某类别全部标签）、`/tags`（标签按类别分组列出）、`/p/random`（流式代理，带重试，兼容性最好）、`/json`（列源）。详情见 `tools/wallpaper-api/README.md`。

直接把壁纸切换工具 / 思源背景的 URL 指向 `http://localhost:8787/random` 或 `http://localhost:8787/s/anime` 即可。

## 随机切换（思路）

可在 `tools/` 下再加 `random_pick.py`：按 `tags` / `usage` / `ratio` 过滤后随机返回一条 `path`，交给壁纸切换脚本调用。索引就绪后这一步很简单。

## 贡献流程（给自己）

1. 放进正确的主题目录，按命名规范改名。
2. 在图片**同目录**写一份同名 `<name>.json`（sidecar）。
3. 跑 `python tools/gen_index.py` 更新索引。
4. 提交。

> **改名 / 移动提醒**：移动整个文件夹时 sidecar 跟着走，无需改动；但**改名图片**必须同步改同目录 `.json` 的文件名及其内部 `file` / `path` 字段，建议用脚本原子处理（如 `tools/rename_asset.py`）。
