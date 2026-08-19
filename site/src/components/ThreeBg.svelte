<script>
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { accent, DEFAULT_ACCENT } from '../lib/theme.js';

  let canvas;

  let renderer, scene, camera, raf = null;
  let sprite;
  let layerA, layerB;      // 两层粒子
  let matA, matB;
  const target = new THREE.Color(DEFAULT_ACCENT);  // 目标色（主题色）
  const current = new THREE.Color(DEFAULT_ACCENT); // 当前色（逐帧向目标过渡）
  let mx = 0, my = 0;      // 鼠标归一化坐标
  let reduced = false;
  let unsub;
  let t = 0;

  function makeSprite() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  function makeLayer(count, size, opacity, spread, flattenY) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * flattenY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: sprite,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return { pts, mat };
  }

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  function onMove(e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }
  function onVis() {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else if (!raf) { animate(); }
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    t += 0.0025;
    // 粒子颜色平滑过渡到当前主题色
    current.lerp(target, 0.05);
    matA.color.copy(current);
    if (!reduced) {
      layerA.pts.rotation.y = t * 0.6;
      layerA.pts.rotation.x = Math.sin(t * 0.4) * 0.12;
      layerB.pts.rotation.y = -t * 0.45;
      // 鼠标视差（缓动跟随）
      camera.position.x += (mx * 0.9 - camera.position.x) * 0.045;
      camera.position.y += (-my * 0.6 - camera.position.y) * 0.045;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  }

  onMount(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    sprite = makeSprite();
    layerA = makeLayer(220, 0.13, 0.5, 16, 0.62); matA = layerA.mat;   // 主层：跟随主题色
    layerB = makeLayer(150, 0.055, 0.35, 20, 0.6); matB = layerB.mat;  // 次层：微白，制造层次
    matB.color.set('#cfd4ff');

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('visibilitychange', onVis);
    unsub = accent.subscribe((v) => target.set(v));
    animate();
  });

  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    if (unsub) unsub();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    if (renderer) renderer.dispose();
  });
</script>

<canvas bind:this={canvas} class="bg3d" aria-hidden="true"></canvas>

<style>
  .bg3d {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
</style>
