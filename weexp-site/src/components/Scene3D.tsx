import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * «Жива система» — персистентний WebGL-світ за всім героєм. Скрол збирає порядок
 * із хаосу: розкидані вузли (теплий жар) стягуються в дихаючу мережу (холодний
 * метал), а камера залітає всередину системи. М'яке адитивне світіння + шар пилу
 * для глибини + туман. Пряме втілення «система замість героїзму».
 */
export function Scene3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = innerWidth < 760;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch { return; }
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070d12, 0.052);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const group = new THREE.Group();
    scene.add(group);

    // М'який круглий спрайт для «дорогого» світіння замість плоских крапок.
    const glow = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d')!;
      const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(0.25, 'rgba(255,255,255,0.75)');
      rg.addColorStop(0.6, 'rgba(255,255,255,0.15)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
    })();

    // --- вузли системи: хаос (куля-жар) → мета (fibonacci-сфера-мережа)
    const N = small ? 420 : 720;
    const R = 2.7;
    const target = new Float32Array(N * 3);
    const chaos = new Float32Array(N * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = phi * i;
      target[i * 3] = Math.cos(th) * rad * R;
      target[i * 3 + 1] = y * R;
      target[i * 3 + 2] = Math.sin(th) * rad * R;
      const u = Math.random(), v = Math.random(), w = Math.random();
      const cr = 4.2 + Math.random() * 3.4;
      const ct = Math.acos(2 * v - 1), cp = 2 * Math.PI * u;
      chaos[i * 3] = cr * Math.sin(ct) * Math.cos(cp) * (0.6 + w * 0.9);
      chaos[i * 3 + 1] = cr * Math.sin(ct) * Math.sin(cp) * (0.6 + w * 0.9);
      chaos[i * 3 + 2] = cr * Math.cos(ct) * (0.6 + w * 0.9);
    }

    // --- ребра: 2 найближчі сусіди (мережа проявляється при зборці)
    const edgeIdx: number[] = [];
    for (let i = 0; i < N; i++) {
      const d: { j: number; dist: number }[] = [];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = target[i * 3] - target[j * 3], dy = target[i * 3 + 1] - target[j * 3 + 1], dz = target[i * 3 + 2] - target[j * 3 + 2];
        d.push({ j, dist: dx * dx + dy * dy + dz * dz });
      }
      d.sort((a, b) => a.dist - b.dist);
      for (let k = 0; k < 2; k++) if (i < d[k].j) edgeIdx.push(i, d[k].j);
    }

    const pos = new Float32Array(N * 3);
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: small ? 0.16 : 0.19, map: glow, sizeAttenuation: true, transparent: true,
      opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    nodeMat.color = new THREE.Color(0xD6362B);
    const points = new THREE.Points(nodeGeo, nodeMat);
    group.add(points);

    const edgePos = new Float32Array(edgeIdx.length * 3);
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x8FB9AC, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const lines = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(lines);

    // --- шар пилу: далекі тьмяні частинки для глибини й «світу», а не «кулі»
    const M = small ? 260 : 480;
    const dust = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
      dust[i * 3] = (Math.random() - 0.5) * 26;
      dust[i * 3 + 1] = (Math.random() - 0.5) * 18;
      dust[i * 3 + 2] = (Math.random() - 0.5) * 22 - 6;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
    const dustMat = new THREE.PointsMaterial({ size: 0.09, map: glow, color: 0x5b6b76, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    const dustPts = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPts);

    const EMBER = new THREE.Color(0xE24A32), METAL = new THREE.Color(0x9FB8B0);

    // scroll: assemble 0..1 + fade пізніше, щоб світ жив під контентом
    let assemble = 0, targetAssemble = 0, fade = 1, scrollN = 0;
    const onScroll = () => {
      const h = innerHeight;
      scrollN = window.scrollY / h;
      targetAssemble = Math.min(1, Math.max(0, window.scrollY / (h * 1.15)));
      fade = Math.max(0.14, 1 - Math.max(0, window.scrollY - h * 2.2) / (h * 0.8));
      canvas.style.opacity = String(fade);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });

    let mx = 0, my = 0, cmx = 0, cmy = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    if (!reduce) addEventListener('pointermove', onMove, { passive: true });

    const resize = () => {
      const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize();
    addEventListener('resize', resize);

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    let raf = 0, t0 = 0;
    const render = (t: number) => {
      if (!t0) t0 = t; const time = (t - t0) / 1000;
      assemble += (targetAssemble - assemble) * 0.055;
      const a = easeInOut(assemble);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = chaos[i * 3] + (target[i * 3] - chaos[i * 3]) * a;
        pos[i * 3 + 1] = chaos[i * 3 + 1] + (target[i * 3 + 1] - chaos[i * 3 + 1]) * a;
        pos[i * 3 + 2] = chaos[i * 3 + 2] + (target[i * 3 + 2] - chaos[i * 3 + 2]) * a;
      }
      nodeGeo.attributes.position.needsUpdate = true;
      for (let e = 0; e < edgeIdx.length; e++) {
        const src = edgeIdx[e] * 3;
        edgePos[e * 3] = pos[src]; edgePos[e * 3 + 1] = pos[src + 1]; edgePos[e * 3 + 2] = pos[src + 2];
      }
      edgeGeo.attributes.position.needsUpdate = true;
      edgeMat.opacity = a * 0.42;
      nodeMat.color.copy(EMBER).lerp(METAL, a);

      cmx += (mx - cmx) * 0.045; cmy += (my - cmy) * 0.045;
      group.rotation.y += reduce ? 0 : 0.0013;
      group.rotation.x = cmy * 0.35 + Math.sin(time * 0.1) * 0.04;
      group.rotation.z = cmx * 0.12;
      dustPts.rotation.y = time * 0.006;
      // Камера залітає в систему в міру зборки + плавний дрейф і паралакс курсора.
      const dolly = 9 - a * 3.4;
      camera.position.x += (cmx * 1.3 - camera.position.x) * 0.05;
      camera.position.y += (-cmy * 0.9 - camera.position.y) * 0.05;
      camera.position.z += (dolly - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onMove);
      nodeGeo.dispose(); edgeGeo.dispose(); dustGeo.dispose();
      nodeMat.dispose(); edgeMat.dispose(); dustMat.dispose(); glow.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="scene3d" aria-hidden="true" />;
}
