# Scenite Wallpaper API

把多个「随机返回图片」的外部接口 + 你自己的 Scenite 图库，统一成一个本地路由服务。
零依赖，用 Node 内置模块即可运行。

## 运行

```bash
# 在 Scenite 仓库根目录
PORT=8787 node tools/wallpaper-api/server.mjs
```

（不改端口直接 `node tools/wallpaper-api/server.mjs` 也行，默认 8787）

## 接口

| 用途 | 路径 | 说明 |
| --- | --- | --- |
| 随机挑一个源 | `/random` 或 `/` | 外部源 + 本地库混合随机 |
| 指定外部源 | `/s/<key>` | 如 `/s/anime` `/s/bing` `/s/fengjing` |
| 本地库随机 | `/local` | 读 `metadata/index.json`，走 jsDelivr |
| 本地库指定 | `/local/<filename>` | 如 `/local/anime-arknights-endfield-rossi-003.avif` |
| 按标签随机 | `/cat/<tag>` | 如 `/cat/anime` `/cat/nature`；支持命名空间标签 `/cat/copyright:arknights` `/cat/character:rossi` |
| 多标签 AND | `/cat/<a>+<b>` | 如 `/cat/copyright:arknights+character:rossi`（URL 中即字面 `+`） |
| 类别浏览 | `/cat/<category>` | `copyright` / `character` / `artist` / `meta`，如 `/cat/copyright` 浏览该类别全部标签 |
| 标签分组 | `/tags` | 列出全部标签并按 Danbooru 类别（general/copyright/character/artist/meta）分组 |
| 流式代理 | 前面加 `/p` | 如 `/p/random`：服务器拉图后以图片字节返回（带重试），兼容性最好 |
| 列表 | `/json` | 列出全部源与可用 key |

`/s/<key>` 的 key 当前有：`bing` `unsplash` `fengjing` `anime`，以及所有 `local:<filename>`。

## 怎么接

- **桌面壁纸自动切换**：把切换工具/脚本的 URL 设成 `http://localhost:8787/random`（随机）或 `http://localhost:8787/s/anime`（指定动漫）。
- **思源笔记背景**：背景图 URL 填 `http://localhost:8787/cat/anime` 之类。若你的思源跑在别的设备，把 `localhost` 换成运行此服务的机器内网 IP。
- **只想用图片字节（避免 302 跳转被某些工具拒）**：用 `/p/...` 代理模式，例如 `http://localhost:8787/p/random`。

## 加新源

编辑 `server.mjs` 里的 `SOURCES` 对象，加一项 `{ name, url, tags }` 即可。`tags` 用于 `/cat/<tag>` 分组。
