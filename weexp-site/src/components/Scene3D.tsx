import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Scroll-залежний 3D-центр: хмара вузлів «хаос» (коралова, розкидана) збирається
 * в упорядковану систему-сферу (смарагдову) з ребрами в міру скролу. Постійне
 * обертання + паралакс від курсора. Прив'язано до наративу Хаос → Система /
 * Independence Score. Ідея старого WebGL-переходу, доведена до головного об'єкта.
 */
export function Scene3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch { return; }
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    const group = new THREE.Group();
    scene.add(group);

    // --- вузли: цільова система (fibonacci sphere) + хаос (випадкові в кулі)
    const N = window.innerWidth < 640 ? 340 : 560;
    const R = 2.5;
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
      // хаос — випадкова точка у більшій кулі
      const u = Math.random(), v = Math.random(), w = Math.random();
      const cr = 3.6 + Math.random() * 2.2;
      const ct = Math.acos(2 * v - 1), cp = 2 * Math.PI * u;
      chaos[i * 3] = cr * Math.sin(ct) * Math.cos(cp) * (0.6 + w * 0.8);
      chaos[i * 3 + 1] = cr * Math.sin(ct) * Math.sin(cp) * (0.6 + w * 0.8);
      chaos[i * 3 + 2] = cr * Math.cos(ct) * (0.6 + w * 0.8);
    }

    // --- ребра: кожен вузол → 2 найближчі сусіди на сфері (мережа системи)
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
    const nodeMat = new THREE.PointsMaterial({ size: 0.055, sizeAttenuation: true, transparent: true, opacity: 0.95 });
    nodeMat.color = new THREE.Color(0xD6362B);
    const points = new THREE.Points(nodeGeo, nodeMat);
    group.add(points);

    const edgePos = new Float32Array(edgeIdx.length * 3);
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3A8873, transparent: true, opacity: 0 });
    const lines = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(lines);

    const CORAL = new THREE.Color(0xD6362B), VERD = new THREE.Color(0x6FAA9A);

    // scroll progress 0..1 за перші ~1.4 висоти екрана
    let assemble = 0, targetAssemble = 0, fade = 1;
    const onScroll = () => {
      const h = window.innerHeight;
      targetAssemble = Math.min(1, Math.max(0, window.scrollY / (h * 1.3)));
      fade = Math.max(0, 1 - Math.max(0, window.scrollY - h * 1.5) / (h * 0.6));
      canvas.style.opacity = String(fade);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });

    let mx = 0, my = 0, cmx = 0, cmy = 0;
    const onMove = (e: PointerEvent) => { mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5); };
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
    let raf = 0;
    const render = () => {
      assemble += (targetAssemble - assemble) * 0.06;
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
      edgeMat.opacity = a * 0.5;
      nodeMat.color.copy(CORAL).lerp(VERD, a);

      cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;
      group.rotation.y += reduce ? 0 : 0.0016;
      group.rotation.x = cmy * 0.4;
      group.rotation.z = cmx * 0.15;
      camera.position.x = cmx * 1.2;
      camera.position.y = -cmy * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onMove);
      nodeGeo.dispose(); edgeGeo.dispose(); nodeMat.dispose(); edgeMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="scene3d" aria-hidden="true" />;
}
