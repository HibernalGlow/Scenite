// Scenite Wallpaper API
// 零依赖本地路由：把多个「随机返回图片」的源统一成
//   - 随机挑一个源  /random
//   - 指定某个源    /s/<key>
//   - 本地库随机    /local        (走 jsDelivr，读 metadata/index.json)
//   - 本地库指定    /local/<filename>
//   - 按标签随机    /cat/<tag>
//   - 流式代理      /p/...        前面的路径加 /p 即代理图片字节(带重试)，兼容性最好
//
// 用法:  node server.mjs   然后浏览器/壁纸工具指向 http://localhost:8787/random
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..'); // Scenite 仓库根
const PORT = process.env.PORT || 8787;
const JSD = 'https://cdn.jsdelivr.net/gh/HibernalGlow/Scenite@main';

// 外部随机图源（返回图片字节或 302 跳转到图片）
const SOURCES = {
  bing: { name: '必应每日壁纸', url: 'https://api.dujin.org/bing/1920.php', tags: ['landscape', 'nature', 'daily', 'bing'] },
  unsplash: { name: 'Unsplash 随机(legacy)', url: 'https://unsplash.it/1600/900?random', tags: ['photo', 'random'] },
  fengjing: { name: 'imgapi 风景', url: 'https://imgapi.cn/api.php?fl=fengjing&gs=images', tags: ['landscape', 'nature', 'fengjing'] },
  anime: { name: '岁月小筑 动漫', url: 'https://img.xjh.me/random_img.php?return=302&type=bg', tags: ['anime', '二次元', 'cartoon'] },
};

function loadLocal() {
  try {
    const idx = JSON.parse(readFileSync(join(ROOT, 'metadata', 'index.json'), 'utf8'));
    return (idx.assets || []).map(a => ({
      key: 'local:' + a.file,
      name: a.file,
      url: JSD + '/' + (a.path || a.file),
      tags: a.tags || [],
      usage: a.usage || [],
    }));
  } catch {
    return [];
  }
}

function allCandidates() {
  const ext = Object.entries(SOURCES).map(([k, v]) => ({ key: k, name: v.name, url: v.url, tags: v.tags }));
  return [...ext, ...loadLocal()];
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const byKey = k => allCandidates().find(c => c.key === k);

// Danbooru 风格标签分类（命名空间前缀）
const CATEGORIES = ['copyright', 'character', 'artist', 'meta'];

// 从单个标签字符串推断类别（无前缀 -> general）
function catOf(tag) {
  const i = tag.indexOf(':');
  if (i > 0 && CATEGORIES.includes(tag.slice(0, i))) return tag.slice(0, i);
  return 'general';
}

// 解析 /cat/<seg>：
//   copyright:arknights      单标签精确匹配
//   copyright:arknights+character:rossi   多标签 AND（+ 分隔，URL 中即字面 +）
//   copyright                类别浏览（该命名空间下所有标签）
function matchCat(raw) {
  if (raw.includes('+')) {
    const need = raw.split('+').map(s => decodeURIComponent(s).trim()).filter(Boolean);
    return allCandidates().filter(c => need.every(n => (c.tags || []).includes(n)));
  }
  const decoded = decodeURIComponent(raw);
  if (CATEGORIES.includes(decoded)) {
    return allCandidates().filter(c => (c.tags || []).some(t => t.startsWith(decoded + ':')));
  }
  return allCandidates().filter(c => (c.tags || []).includes(decoded));
}

function redirect(res, url) {
  res.writeHead(302, { location: url, 'cache-control': 'no-store' });
  res.end();
}
function notFound(res, msg = 'not found') {
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(msg);
}

// 代理模式：流式返回图片字节，对随机抽取的候选逐个尝试，第一个可用的就返回（带重试）
async function proxyRandom(res, candidates) {
  const pool = [...candidates];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const c of pool) {
    try {
      const r = await fetch(c.url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
      const ct = r.headers.get('content-type') || '';
      if (r.ok && ct.startsWith('image')) {
        const buf = Buffer.from(await r.arrayBuffer());
        res.writeHead(200, { 'content-type': ct, 'cache-control': 'no-store' });
        res.end(buf);
        return;
      }
    } catch {
      /* 试下一个 */
    }
  }
  notFound(res, 'no available image source');
}

function jsonList(res) {
  const c = allCandidates();
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    count: c.length,
    endpoints: {
      random: '/random  (或 /)',
      specific: '/s/<key>',
      localRandom: '/local',
      localSpecific: '/local/<filename>',
      byTag: '/cat/<tag>',
      byTagAnd: '/cat/<tagA>+<tagB>  (多标签 AND)',
      byCategory: '/cat/<category>  (copyright/character/artist/meta 浏览该类别)',
      tagList: '/tags  (全部标签按类别分组)',
      proxyRandom: '/p  (前缀 /p 即流式代理，带重试)',
      list: '/json',
    },
    sources: c,
  }, null, 2));
}

// /tags：列出全部标签并按 Danbooru 类别分组
function tagList(res) {
  const grouped = { general: [], copyright: [], character: [], artist: [], meta: [] };
  for (const c of allCandidates()) {
    for (const t of (c.tags || [])) {
      const cat = catOf(t);
      if (!grouped[cat].includes(t)) grouped[cat].push(t);
    }
  }
  for (const k of Object.keys(grouped)) grouped[k].sort();
  const flat = [...grouped.general, ...grouped.copyright, ...grouped.character, ...grouped.artist, ...grouped.meta];
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ count: flat.length, categories: grouped }, null, 2));
}

function route(res, path, isProxy) {
  if (path === '/' || path === '/random') {
    const c = allCandidates();
    return isProxy ? proxyRandom(res, c) : redirect(res, pick(c).url);
  }
  if (path === '/local' || path === '/local/random') {
    const loc = loadLocal();
    if (!loc.length) return notFound(res, 'no local assets');
    return isProxy ? proxyRandom(res, loc) : redirect(res, pick(loc).url);
  }
  let m;
  if ((m = path.match(/^\/s\/([^/]+)$/))) {
    const c = byKey(m[1]);
    return c ? (isProxy ? proxyRandom(res, [c]) : redirect(res, c.url)) : notFound(res, 'unknown source: ' + m[1]);
  }
  if ((m = path.match(/^\/local\/([^/]+)$/))) {
    const c = byKey('local:' + m[1]);
    return c ? (isProxy ? proxyRandom(res, [c]) : redirect(res, c.url)) : notFound(res, 'unknown local: ' + m[1]);
  }
  if ((m = path.match(/^\/cat\/([^/]+)$/))) {
    const c = matchCat(m[1]);
    if (!c.length) return notFound(res, 'no source with tag: ' + m[1]);
    return isProxy ? proxyRandom(res, c) : redirect(res, pick(c).url);
  }
  if (path === '/tags') return tagList(res);
  if (path === '/json') return jsonList(res);

  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end([
    'Scenite Wallpaper API',
    '随机:        /random   (或 /)',
    '指定源:      /s/<key>          例: /s/anime',
    '本地随机:    /local',
    '本地指定:    /local/<filename>',
    '按标签随机:  /cat/<tag>        例: /cat/anime  /cat/copyright:arknights',
    '多标签 AND:  /cat/<a>+<b>      例: /cat/copyright:arknights+character:rossi',
    '类别浏览:    /cat/<category>   例: /cat/copyright  (copyright/character/artist/meta)',
    '标签分组:    /tags',
    '流式代理:    上述路径前加 /p    例: /p/random',
    '列表:        /json',
    '当前源 key:  ' + allCandidates().map(c => c.key).join(', '),
  ].join('\n'));
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let path = u.pathname;
  let isProxy = false;
  if (path.startsWith('/p')) {
    isProxy = true;
    path = path === '/p' ? '/' : path.slice(2);
  }
  route(res, path, isProxy);
});

server.listen(PORT, () => {
  console.log(`Scenite Wallpaper API on http://localhost:${PORT}`);
});
