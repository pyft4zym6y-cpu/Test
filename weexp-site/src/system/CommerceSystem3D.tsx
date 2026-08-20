import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

/**
 * THE COMMERCE SYSTEM — світлий WebGL-об'єкт (напрям «museum object of the
 * future»). Гранований кристал-ядро + 7 систем-вузлів збираються навколо нього
 * у 3D; тонкі графітові зв'язки; сині data-імпульси течуть у ACTIVATION. Керує
 * скрол (progress 0..1): FORM → CONNECT → ACTIVATION + доллі камери. Матеріали —
 * кераміка/матовий алюміній під м'яким студійним світлом (env через PMREM).
 * Свідомо світле полотно (alpha), без темного/verdigris.
 */
/* Neo-brutalist: вузли чергуються папір/чорнило, акцент — бренд-червоний */
const NODE_TINT = [0xffffff, 0x141210, 0xffffff, 0x141210, 0xffffff, 0x141210, 0xffffff, 0x141210];

/**
 * progress — скрол-керований прогрес (для фільму головної). fixedProgress —
 * зафіксований стан (для калькулятора: об'єкт вже зібраний і «дихає»). alerts —
 * індекси систем, що світяться червоним (bottleneck / GAP-подія).
 */
export function CommerceSystem3D({ progress, fixedProgress, alerts, labels }: {
  progress?: MutableRefObject<number>; fixedProgress?: number; alerts?: MutableRefObject<number[]>;
  // labels — щокадру заповнюється спроєктованими 2D-позиціями 7 вузлів (для HTML-лейблів
  // систем у фільмі): {x,y} у % вьюпорта об'єкта, vis 0..1 (видимість/збірка).
  labels?: MutableRefObject<{ x: number; y: number; vis: number }[]>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const N = 8;

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 11);
    const group = new THREE.Group();
    scene.add(group);

    // — Студійне світло: тепле небо / мгла знизу + м'який ключ + контровий —
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e8ec, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe6ff, 0.5); rim.position.set(-6, 2, -4); scene.add(rim);

    // — Env через PMREM з простої «студії» (яскраві софтбокси) → преміум-відблиск —
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xf0f1f3);
    const soft = (x: number, y: number, z: number, s: number, c: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    };
    soft(6, 8, 5, 14, 0xffffff); soft(-7, 3, -6, 12, 0xeaf0ff); soft(0, -8, 4, 10, 0xf6f6f4);
    const envTex = pmrem.fromScene(envScene, 0.03).texture;
    scene.environment = envTex;

    // — Ядро: гранований кристал (frosted ceramic) —
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.98, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.15, flatShading: true, envMapIntensity: 1.1 }),
    );
    group.add(core);
    const coreWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.0, 0)),
      new THREE.LineBasicMaterial({ color: 0x3a3d42, transparent: true, opacity: 0.28 }),
    );
    group.add(coreWire);

    // — 7 систем-вузлів: цільові позиції на нахиленому кільці в 3D + стартовий розліт —
    const tilt = 0.42;
    const target: THREE.Vector3[] = [];
    const scatter: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.3, 40, 40);
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const R = 3.5;
      const t = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * tilt + Math.sin(a * 2) * 0.5, Math.sin(a) * R * 0.55);
      target.push(t);
      scatter.push(new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 14 - 4));
      const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshStandardMaterial({
        color: NODE_TINT[i], roughness: NODE_TINT[i] === 0xffffff ? 0.32 : 0.4,
        metalness: NODE_TINT[i] === 0xffffff ? 0.1 : 0.7, envMapIntensity: 1.2,
      }));
      group.add(mesh); nodeMeshes.push(mesh);
    }

    // — Зв'язки ядро↔вузол (тонкі графітові лінії) —
    const linkGeo = new THREE.BufferGeometry();
    const linkPos = new Float32Array(N * 2 * 3);
    linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
    const linkMat = new THREE.LineBasicMaterial({ color: 0x3a3d42, transparent: true, opacity: 0 });
    group.add(new THREE.LineSegments(linkGeo, linkMat));

    // — Data-імпульси (сині) — течуть ядро←вузол в ACTIVATION —
    const pulses: THREE.Mesh[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xf5301c });
    for (let i = 0; i < N; i++) { const p = new THREE.Mesh(pulseGeo, pulseMat); p.visible = false; group.add(p); pulses.push(p); }

    // pointer parallax
    let mx = 0, my = 0, cmx = 0, cmy = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    if (!reduce) addEventListener('pointermove', onMove, { passive: true });

    const resize = () => {
      const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setSize(w, h, false); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize(); addEventListener('resize', resize);

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const band = (p: number, s: number, e: number) => clamp((p - s) / (e - s), 0, 1);
    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    let raf = 0, t0 = 0, aCur = 0;
    const tmp = new THREE.Vector3();
    const tmpL = new THREE.Vector3();
    const ALERT = new THREE.Color(0xf5301c), BLUE = new THREE.Color(0xf5301c);
    const render = (t: number) => {
      if (!t0) t0 = t; const time = (t - t0) / 1000;
      const p = reduce ? 1 : (fixedProgress ?? progress?.current ?? 0);
      const al = alerts?.current ?? [];

      // FORM: вузли злітаються (0.10→0.45). CONNECT: лінії (0.34→0.62). ACTIVATION: імпульси (0.56→0.86).
      const aTarget = reduce ? 1 : easeInOut(band(p, 0.10, 0.45));
      aCur += (aTarget - aCur) * 0.09;
      const pulseAlert = 0.55 + Math.sin(time * 4) * 0.35;
      for (let i = 0; i < N; i++) {
        nodeMeshes[i].position.lerpVectors(scatter[i], target[i], aCur);
        const isAlert = al.includes(i);
        const s = (0.5 + aCur * 0.5) * (isAlert ? 1.12 : 1); nodeMeshes[i].scale.setScalar(s);
        const m = nodeMeshes[i].material as THREE.MeshStandardMaterial;
        m.emissive.copy(ALERT); m.emissiveIntensity = isAlert ? pulseAlert : 0;
        // лінк
        linkPos[i * 6] = 0; linkPos[i * 6 + 1] = 0; linkPos[i * 6 + 2] = 0;
        linkPos[i * 6 + 3] = nodeMeshes[i].position.x; linkPos[i * 6 + 4] = nodeMeshes[i].position.y; linkPos[i * 6 + 5] = nodeMeshes[i].position.z;
      }
      linkGeo.attributes.position.needsUpdate = true;
      linkMat.opacity = band(p, 0.34, 0.62) * 0.55;

      const flow = band(p, 0.56, 0.9);
      for (let i = 0; i < N; i++) {
        const pu = pulses[i];
        if (flow <= 0.01) { pu.visible = false; continue; }
        pu.visible = true;
        const f = (flow * 1.3 + i / N) % 1;               // вузол → ядро
        tmp.lerpVectors(nodeMeshes[i].position, group.position, f);
        pu.position.copy(tmp);
        (pu.material as THREE.MeshBasicMaterial).opacity = 1;
      }

      // Обертання + доллі камери (scroll = камера) + курсор-паралакс
      cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;
      core.rotation.y += reduce ? 0 : 0.004; core.rotation.x = Math.sin(time * 0.2) * 0.15;
      coreWire.rotation.copy(core.rotation);
      group.rotation.y = (reduce ? 0 : time * 0.05) + (p - 0.4) * 0.6 + cmx * 0.3;
      group.rotation.x = -0.1 + cmy * 0.2;
      const dolly = 11 - easeInOut(band(p, 0, 0.5)) * 3.2 - band(p, 0.5, 1) * 0.6;
      camera.position.z += (dolly - camera.position.z) * 0.06;
      camera.position.x += (cmx * 1.2 - camera.position.x) * 0.05;
      camera.position.y += (-cmy * 0.8 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Спроєктовані 2D-позиції вузлів → для HTML-лейблів систем у фільмі.
      if (labels?.current) {
        group.updateWorldMatrix(true, true);
        for (let i = 0; i < N; i++) {
          nodeMeshes[i].getWorldPosition(tmpL).project(camera);
          const onScreen = tmpL.z < 1;
          labels.current[i] = { x: (tmpL.x * 0.5 + 0.5) * 100, y: (-tmpL.y * 0.5 + 0.5) * 100, vis: onScreen ? aCur : 0 };
        }
      }

      renderer.render(scene, camera);
      raf = running() ? requestAnimationFrame(render) : 0;
    };
    // Пауза рендеру поза екраном / при схованій вкладці / reduced-motion — не палимо GPU дарма.
    let visible = true, active = !document.hidden;
    const running = () => visible && active && !reduce;
    const pump = () => { if (running() && !raf) raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render); // хоча б один кадр (у т.ч. для reduced-motion)
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; pump(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { active = !document.hidden; pump(); };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (e: Event) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; };
    const onRestored = () => pump();
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect(); document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      removeEventListener('resize', resize); removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose();
        const mat = (m as THREE.Mesh).material; if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
      });
      nodeGeo.dispose(); pulseGeo.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    };
  }, [progress, fixedProgress]);

  return <canvas ref={ref} className="sysx-object3d" aria-hidden="true" />;
}
