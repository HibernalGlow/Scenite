<script>
  import { onMount } from 'svelte';
  import { FastAverageColor } from 'fast-average-color';
  import { accent, DEFAULT_ACCENT } from '../lib/theme.js';

  export let base = '/';
  export let data = '';
  export let cdn = '';
  export let raw = '';
  export let blob = '';

  let assets = [];
  let loading = true;
  let q = '';
  let cat = 'all';
  let usage = 'all';
  let featured = null;
  let lightbox = null;
  let toastMsg = '';
  let toastTimer;

  const groupOf = (p) => { const a = p.split('/'); return a[0] === 'wallpapers' ? a[1] : a[0]; };
  const subOf = (p) => { const a = p.split('/'); return a[0] === 'wallpapers' ? (a[2] || '') : (a[1] || ''); };
  const nice = (f) => f.replace(/\.[^.]+$/, '').split('-').join(' ');

  $: cats = (() => {
    const m = new Map();
    assets.forEach((a) => { const g = groupOf(a.path); m.set(g, (m.get(g) || 0) + 1); });
    return [...m.entries()].sort((x, y) => y[1] - x[1]);
  })();

  $: tagCount = (() => { const s = new Set(); assets.forEach((a) => (a.tags || []).forEach((t) => s.add(t))); return s.size; })();

  $: list = assets.filter((a) => {
    if (cat !== 'all' && groupOf(a.path) !== cat) return false;
    if (usage !== 'all' && !(a.usage || []).includes(usage)) return false;
    const query = q.trim().toLowerCase();
    if (query) {
      const hay = (a.file + ' ' + (a.tags || []).join(' ') + ' ' + (a.notes || '')).toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  onMount(async () => {
    try {
      const res = await fetch(data, { cache: 'no-store' });
      const d = await res.json();
      assets = d.assets || [];
      featured = assets.length ? assets[Math.floor(Math.random() * assets.length)] : null;
    } catch (e) {
      assets = [];
    }
    loading = false;
  });

  // —— 主题色提取（fast-average-color，成熟库，不手搓）——
  let fac;
  function getFac() { if (!fac) fac = new FastAverageColor(); return fac; }
  async function themeFromImage(img) {
    if (!img) return;
    try {
      const c = await getFac().getColorAsync(img, { algorithm: 'dominant' });
      setAccent(c.hex);
    } catch (e) { /* 跨域/读取失败时保持默认色 */ }
  }
  function setAccent(hex) {
    document.documentElement.style.setProperty('--accent', hex);
    accent.set(hex);
  }
  function resetAccent() {
    document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT);
    accent.set(DEFAULT_ACCENT);
  }

  function showToast(msg) {
    toastMsg = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg = ''), 1500);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    showToast('已复制链接');
  }
  function openLb(a) { lightbox = a; }
  function closeLb() { lightbox = null; resetAccent(); }
  function randomPick() {
    if (!list.length) { showToast('当前筛选为空'); return; }
    openLb(list[Math.floor(Math.random() * list.length)]);
  }
  function onKey(e) { if (e.key === 'Escape') closeLb(); }
</script>

<svelte:window on:keydown={onKey} />

<!-- ============ HERO ============ -->
<section class="hero">
  <div class="hero-text">
    <p class="kick">PERSONAL VISUAL LIBRARY</p>
    <h1>把喜欢的画面，<br /><em>收进一座</em>可以检索的库。</h1>
    <p class="lede">壁纸 / 生成 / 图标 / 封面，按审美主题与 IP 细分。每张图都能通过 jsDelivr CDN 或 GitHub 链接引用，也能随机或指定调用。</p>
    <div class="cta">
      <button class="btn primary" on:click={randomPick}>✦ 随机一张</button>
      <a class="btn ghost" href="#gallery">浏览图库</a>
      <a class="btn ghost" href="#api">接口</a>
    </div>
    <div class="stats">
      <div><b>{assets.length}</b><span>资产</span></div>
      <div><b>{cats.length}</b><span>分类</span></div>
      <div><b>{tagCount}</b><span>标签</span></div>
    </div>
  </div>

  <figure class="hero-fig" on:click={() => featured && openLb(featured)}>
    {#if featured}
      <img src={cdn + featured.path} alt={featured.file} crossorigin="anonymous" on:load={(e) => themeFromImage(e.currentTarget)} />
      <figcaption>
        <span class="fcat">{groupOf(featured.path)}{subOf(featured.path) ? ' · ' + subOf(featured.path) : ''}</span>
        <span class="fname">{nice(featured.file)}</span>
      </figcaption>
    {:else}
      <div class="ph">{loading ? '载入中…' : '暂无资产'}</div>
    {/if}
  </figure>
</section>

<!-- ============ CONTROLS ============ -->
<section class="controls" id="gallery">
  <div class="tabs">
    <button class:on={cat === 'all'} on:click={() => (cat = 'all')}>全部 <i>{assets.length}</i></button>
    {#each cats as [c, n]}
      <button class:on={cat === c} on:click={() => (cat = c)}>{c} <i>{n}</i></button>
    {/each}
  </div>
  <div class="tools">
    <input type="search" placeholder="搜索名称 / 标签…" bind:value={q} />
    <select bind:value={usage}>
      <option value="all">全部用途</option>
      <option value="desktop">desktop</option>
      <option value="siyuan">siyuan</option>
      <option value="mobile">mobile</option>
      <option value="xiranite">xiranite</option>
      <option value="cover">cover</option>
    </select>
  </div>
</section>

<!-- ============ GRID ============ -->
<section class="grid">
  {#if loading}
    <div class="empty">载入中…</div>
  {:else if list.length === 0}
    <div class="empty">没有匹配的资产 · 换个关键词或分类试试</div>
  {:else}
    {#each list as a (a.path)}
      <figure class="card" on:click={() => openLb(a)}>
        <img src={cdn + a.path} alt={a.file} loading="lazy" decoding="async" />
        <figcaption class="cap">
          <div class="cap-text">
            <span class="ccat">{groupOf(a.path)}{subOf(a.path) ? ' · ' + subOf(a.path) : ''}</span>
            <h3>{nice(a.file)}</h3>
          </div>
          <div class="actions">
            <button on:click|stopPropagation={() => copy(cdn + a.path)}>CDN</button>
            <button on:click|stopPropagation={() => copy(raw + a.path)}>GitHub</button>
          </div>
        </figcaption>
      </figure>
    {/each}
  {/if}
</section>

<!-- ============ LIGHTBOX ============ -->
{#if lightbox}
  <div class="lb" on:click={closeLb}>
    <div class="panel" on:click|stopPropagation>
      <button class="x" on:click={closeLb}>✕</button>
      <div class="imgwrap"><img src={cdn + lightbox.path} alt={lightbox.file} crossorigin="anonymous" on:load={(e) => themeFromImage(e.currentTarget)} /></div>
      <div class="meta">
        <p class="mcat">{groupOf(lightbox.path)}{subOf(lightbox.path) ? ' · ' + subOf(lightbox.path) : ''}</p>
        <h2>{nice(lightbox.file)}</h2>
        {#if lightbox.tags && lightbox.tags.length}
          <div class="row"><span class="k">标签</span><div>{#each lightbox.tags as t}<span class="pill">#{t}</span>{/each}</div></div>
        {/if}
        {#if lightbox.usage && lightbox.usage.length}
          <div class="row"><span class="k">用途</span><div>{#each lightbox.usage as u}<span class="pill">{u}</span>{/each}</div></div>
        {/if}
        {#if lightbox.ratio}
          <div class="row"><span class="k">比例</span><div><span class="pill">{lightbox.ratio}</span></div></div>
        {/if}
        {#if lightbox.notes}
          <div class="row"><span class="k">备注</span><p class="notes">{lightbox.notes}</p></div>
        {/if}
        <div class="links">
          <button class="linkbtn" on:click={() => copy(cdn + lightbox.path)}><span>jsDelivr CDN</span><code>{cdn + lightbox.path}</code></button>
          <button class="linkbtn" on:click={() => copy(raw + lightbox.path)}><span>GitHub Raw</span><code>{raw + lightbox.path}</code></button>
          <button class="linkbtn" on:click={() => copy(blob + lightbox.path)}><span>GitHub 页面</span><code>{blob + lightbox.path}</code></button>
        </div>
      </div>
    </div>
  </div>
{/if}

<button class="fab" title="随机一张" on:click={randomPick}>✦</button>
<div class="toast" class:show={!!toastMsg}>{toastMsg}</div>

<style>
/* ============ HERO ============ */
.hero {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 44px;
  align-items: center;
  padding: 66px 0 30px;
}
.kick { color: var(--accent); letter-spacing: 3px; font-size: 0.72rem; font-weight: 600; margin: 0 0 18px; }
.hero h1 {
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(2.3rem, 4.6vw, 3.7rem);
  line-height: 1.12;
  letter-spacing: -0.5px;
  margin: 0 0 18px;
}
.hero h1 em { font-style: italic; color: var(--accent); }
.lede { color: var(--muted); max-width: 46ch; font-size: 1rem; margin: 0 0 26px; }
.cta { display: flex; gap: 12px; flex-wrap: wrap; }
.btn {
  padding: 12px 22px; border-radius: 999px; font-size: 0.9rem; font-weight: 600;
  border: 1px solid var(--line2); transition: 0.2s; display: inline-flex; align-items: center; gap: 8px;
}
.btn.primary { background: var(--accent); border-color: transparent; color: #17130a; box-shadow: 0 10px 28px -10px rgba(230, 180, 88, 0.6); }
.btn.primary:hover { transform: translateY(-2px); box-shadow: 0 16px 34px -10px rgba(230, 180, 88, 0.7); }
.btn.ghost { background: transparent; color: var(--text); }
.btn.ghost:hover { border-color: var(--accent); color: var(--accent); }
.stats { display: flex; gap: 30px; margin-top: 34px; }
.stats b { font-family: var(--serif); font-size: 1.7rem; font-weight: 600; color: var(--text); }
.stats span { color: var(--faint); font-size: 0.8rem; margin-left: 8px; }

.hero-fig {
  margin: 0; position: relative; border-radius: 20px; overflow: hidden;
  border: 1px solid var(--line); box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.8);
  cursor: zoom-in; aspect-ratio: 16 / 10; background: var(--bg2);
}
.hero-fig img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
.hero-fig:hover img { transform: scale(1.04); }
.hero-fig figcaption {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 18px;
  background: linear-gradient(to top, rgba(5, 6, 10, 0.9), transparent);
  display: flex; flex-direction: column; gap: 2px;
}
.fcat { color: var(--accent); font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; }
.fname { font-family: var(--serif); font-style: italic; font-size: 1.05rem; }
.hero-fig .ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--faint); }

/* ============ CONTROLS ============ */
.controls { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 26px 0 8px; border-top: 1px solid var(--line); margin-top: 20px; }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.tabs button {
  background: transparent; border: 0; color: var(--muted); font-size: 0.9rem; font-weight: 500;
  padding: 8px 12px; border-radius: 9px; position: relative; transition: 0.16s;
}
.tabs button i { font-style: normal; color: var(--faint); font-size: 0.74rem; margin-left: 4px; }
.tabs button:hover { color: var(--text); }
.tabs button.on { color: var(--text); }
.tabs button.on::after {
  content: ''; position: absolute; left: 12px; right: 12px; bottom: 2px; height: 2px; border-radius: 2px; background: var(--accent);
}
.tools { margin-left: auto; display: flex; gap: 10px; }
.tools input, .tools select {
  background: var(--card); border: 1px solid var(--line); border-radius: 10px; color: var(--text);
  padding: 9px 14px; font-size: 0.85rem; outline: none; font-family: inherit; transition: border-color 0.16s;
}
.tools input { min-width: 200px; }
.tools input:focus, .tools select:focus { border-color: var(--accent); }
.tools input::placeholder { color: var(--faint); }

/* ============ GRID ============ */
.grid { column-count: 4; column-gap: 20px; padding: 20px 0 10px; }
@media (max-width: 1080px) { .grid { column-count: 3; } }
@media (max-width: 760px) { .grid { column-count: 2; } }
@media (max-width: 520px) { .grid { column-count: 1; } }
.card {
  position: relative; break-inside: avoid; margin: 0 0 20px; border-radius: var(--r);
  overflow: hidden; border: 1px solid var(--line); background: var(--bg2); cursor: zoom-in;
  transition: transform 0.25s, border-color 0.25s;
}
.card:hover { transform: translateY(-3px); border-color: var(--line2); }
.card img { display: block; width: 100%; height: auto; transition: transform 0.5s ease; }
.card:hover img { transform: scale(1.05); }
.cap {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 14px;
  background: linear-gradient(to top, rgba(5, 6, 10, 0.92), rgba(5, 6, 10, 0.25) 60%, transparent);
  display: flex; align-items: flex-end; justify-content: space-between; gap: 10px;
  opacity: 0; transform: translateY(6px); transition: 0.25s;
}
.card:hover .cap { opacity: 1; transform: none; }
.ccat { color: var(--accent); font-size: 0.66rem; letter-spacing: 1.5px; text-transform: uppercase; }
.cap h3 { margin: 3px 0 0; font-size: 0.92rem; font-weight: 600; font-family: var(--serif); font-style: italic; }
.actions { display: flex; gap: 6px; flex-shrink: 0; }
.actions button {
  padding: 5px 10px; border-radius: 8px; border: 1px solid var(--line2); background: rgba(10, 11, 16, 0.6);
  color: var(--text); font-size: 0.7rem; font-weight: 600; backdrop-filter: blur(6px); transition: 0.15s;
}
.actions button:hover { border-color: var(--accent); color: var(--accent); }
.empty { grid-column: 1 / -1; text-align: center; color: var(--faint); padding: 70px 0; }

/* ============ LIGHTBOX ============ */
.lb {
  position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; padding: 26px;
  background:
    radial-gradient(60% 60% at 50% 46%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 72%),
    rgba(4, 5, 9, 0.86);
  backdrop-filter: blur(10px);
  transition: background 0.6s ease;
}
.panel {
  position: relative; width: 100%; max-width: 1040px; max-height: 88vh;
  display: grid; grid-template-columns: 1.55fr 1fr; background: var(--bg2);
  border: 1px solid var(--line2); border-radius: 18px; overflow: hidden; box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.9);
}
.x {
  position: absolute; top: 12px; right: 12px; z-index: 2; width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid var(--line2); background: rgba(8, 9, 14, 0.6); color: var(--text); font-size: 0.9rem;
}
.x:hover { border-color: var(--accent); color: var(--accent); }
.imgwrap { background: #000; display: flex; align-items: center; justify-content: center; max-height: 88vh; }
.imgwrap img { width: 100%; height: 100%; object-fit: contain; max-height: 88vh; }
.meta { padding: 24px; overflow: auto; max-height: 88vh; }
.mcat { color: var(--accent); font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px; }
.meta h2 { font-family: var(--serif); font-style: italic; font-weight: 500; font-size: 1.35rem; margin: 0 0 16px; }
.row { margin: 12px 0; }
.row .k { display: block; color: var(--faint); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 7px; }
.pill { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); font-size: 0.72rem; margin: 0 6px 6px 0; color: var(--muted); }
.notes { color: var(--muted); font-size: 0.84rem; margin: 0; }
.links { display: flex; flex-direction: column; gap: 9px; margin-top: 18px; }
.linkbtn {
  display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 11px 13px;
  border-radius: 11px; border: 1px solid var(--line); background: var(--card); color: var(--text);
  font-size: 0.8rem; text-align: left; transition: 0.16s;
}
.linkbtn span { font-weight: 600; flex-shrink: 0; }
.linkbtn code { color: var(--faint); font-size: 0.68rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.linkbtn:hover { border-color: var(--accent); }
.linkbtn:hover span { color: var(--accent); }
@media (max-width: 760px) { .panel { grid-template-columns: 1fr; } .imgwrap { max-height: 44vh; } .meta { max-height: none; } }

/* ============ FAB & TOAST ============ */
.fab {
  position: fixed; right: 24px; bottom: 24px; z-index: 60; width: 56px; height: 56px; border-radius: 50%;
  border: 0; background: var(--accent); color: #17130a; font-size: 1.35rem;
  box-shadow: 0 14px 34px -8px rgba(230, 180, 88, 0.7); transition: 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.fab:hover { transform: scale(1.08) rotate(-10deg); }
.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(16px); z-index: 90;
  background: rgba(12, 13, 19, 0.95); border: 1px solid var(--line2); color: var(--text);
  padding: 10px 18px; border-radius: 999px; font-size: 0.82rem; opacity: 0; pointer-events: none; transition: 0.25s;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 30px; padding: 46px 0 20px; }
  .tools { margin-left: 0; width: 100%; }
  .tools input { flex: 1; }
}
</style>
