/**
 * 扫描仓库中的图片与同名 sidecar .json，汇总生成 index.json。
 *
 * 数据流：每张图旁边放一份同名 .json（sidecar），本脚本把它们聚合成索引。
 * 输出三处：
 *   - metadata/index.json            规范索引（wallpaper-api 读这里）
 *   - site/public/assets/index.json  站点数据源（会被打进每次构建，astro dev 直接可用）
 *   - docs/assets/index.json         已构建站点的同源副本（改数据免重新构建）
 *
 * 运行（在 site/ 目录）：pnpm gen:index
 * 或直接：node --experimental-strip-types scripts/gen-index.ts
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..'); // site/scripts -> site -> 仓库根

const ASSET_ROOTS = ['wallpapers', 'generated', 'icons', 'covers'];
const IMAGE_EXTS = new Set(['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg']);
const OUTPUTS = [
  'metadata/index.json',
  'site/public/assets/index.json',
  'docs/assets/index.json',
].map((p) => path.join(ROOT, p));

interface Asset {
  file: string;
  path: string;
  tags: string[];
  usage: string[];
  ratio: string;
  source: string;
  source_url?: string;
  notes?: string;
  width?: number;
  height?: number;
  [k: string]: unknown;
}

type SizeFn = (p: string) => { width?: number; height?: number } | null;

// 可选依赖 image-size：装了就自动补真实尺寸/比例，没装就跳过（不手搓二进制解析）。
async function loadSizer(): Promise<SizeFn | null> {
  try {
    const mod: any = await import('image-size');
    const fn = mod.imageSize ?? mod.default ?? mod;
    return (p) => {
      try { return fn(p); } catch { return null; }
    };
  } catch {
    return null;
  }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const ratio = (w?: number, h?: number): string => (w && h ? `${w / gcd(w, h)}:${h / gcd(w, h)}` : '');
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/');

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const sizeOf = await loadSizer();
  const assets: Asset[] = [];

  for (const rootDir of ASSET_ROOTS) {
    const base = path.join(ROOT, rootDir);
    for await (const img of walk(base)) {
      const ext = path.extname(img).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;
      const sidecar = img.slice(0, -ext.length) + '.json';
      const relPath = rel(img);

      // 兜底：无 sidecar 时用路径段当标签
      let entry: Asset = {
        file: path.basename(img),
        path: relPath,
        tags: relPath.split('/').slice(1, -1),
        usage: [],
        ratio: '',
        source: '',
      };
      try {
        const data = JSON.parse(await fs.readFile(sidecar, 'utf8'));
        // path / file 始终以实际图片为准，避免 sidecar 里写过期
        entry = { ...entry, ...data, file: path.basename(img), path: relPath };
      } catch { /* 保持兜底值 */ }

      if (sizeOf) {
        const d = sizeOf(img);
        if (d?.width && d?.height) {
          entry.width = d.width;
          entry.height = d.height;
          if (!entry.ratio) entry.ratio = ratio(d.width, d.height);
        }
      }
      assets.push(entry);
    }
  }

  assets.sort((a, b) => a.path.localeCompare(b.path));

  const index = {
    generated_at: new Date().toISOString(),
    version: 1,
    count: assets.length,
    assets,
  };

  for (const out of OUTPUTS) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, JSON.stringify(index, null, 2), 'utf8');
  }

  console.log(`wrote ${assets.length} asset(s) ${sizeOf ? '(with dimensions)' : '(image-size 未安装：跳过尺寸)'}:`);
  for (const out of OUTPUTS) console.log('  ' + rel(out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
