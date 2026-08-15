import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type SysScore } from './charts';

/**
 * COMPANY WORLD — інтерактивна 3D-візуалізація компанії клієнта як живої
 * екосистеми-району. Кожна з 8 систем — вежа, чия ВИСОТА = бал зрілості цієї
 * системи; у центрі — ядро бізнесу. Що більше даних заповнено (completeness),
 * то «живіший» район: проявляються світлові дороги ядро↔вежа, сітка-ґрунт,
 * вікна веж і data-частинки. Мало даних — блідий пустир; багато — освітлене
 * місто. Світле cinematic-полотно (як решта сайту). Не інтерактивна (декор).
 */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// Колір статусу вежі за балом: bad→amber→ok (стриманий, преміальний).
const health = (s: number) => (s >= 65 ? new THREE.Color(0x3a7d5c) : s >= 40 ? new THREE.Color(0xc08a2e) : new THREE.Color(0xd6362b));

export function CompanyWorld({ systems, completeness }: { systems: SysScore[]; completeness: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Тримаємо цілі у ref-ах, щоб оновлювати сцену без перебудови при зміні даних.
  const goal = useRef({ scores: systems.map((s) => s.score), detail: completeness });
  goal.current = { scores: systems.map((s) => s.score), detail: completeness };

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const N = 8;

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 5.2, 10.5);
    const group = new THREE.Group();
    scene.add(group);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e8ec, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(5, 9, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe6ff, 0.55); rim.position.set(-6, 3, -5); scene.add(rim);

    // Env (студія) → преміум-відблиск на кераміці.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0xf0f1f3);
    const soft = (x: number, y: number, z: number, s: number, c: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    };
    soft(6, 9, 5, 16, 0xffffff); soft(-7, 3, -6, 12, 0xeaf0ff); soft(0, -8, 4, 10, 0xf6f6f4);
    const envTex = pmrem.fromScene(envScene, 0.03).texture; scene.environment = envTex;

    const R = 3.7;                             // радіус району
    const disposables: { dispose(): void }[] = [];

    // — Ґрунт-платформа району (диск) + сітка, що проявляється з даними —
    const groundGeo = new THREE.CircleGeometry(R + 1.5, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.9, metalness: 0.0, transparent: true, opacity: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; group.add(ground);
    disposables.push(groundGeo, groundMat);
    const gridHelper = new THREE.PolarGridHelper(R + 1.2, 8, 5, 64, 0xc9ced4, 0xdfe3e8) as THREE.PolarGridHelper;
    (gridHelper.material as THREE.Material).transparent = true; (gridHelper.material as THREE.Material).opacity = 0; group.add(gridHelper);

    // — Ядро бізнесу: гранований кристал у центрі —
    const coreGeo = new THREE.IcosahedronGeometry(0.72, 0);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.18, flatShading: true, envMapIntensity: 1.15 });
    const core = new THREE.Mesh(coreGeo, coreMat); core.position.y = 0.9; group.add(core); disposables.push(coreGeo, coreMat);
    const coreWire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.74, 0)),
      new THREE.LineBasicMaterial({ color: 0x3a3d42, transparent: true, opacity: 0.3 }));
    coreWire.position.y = 0.9; group.add(coreWire);

    // — 8 веж (систем): висота = бал; матеріал кераміка + статус-смуга біля основи —
    const boxGeo = new THREE.BoxGeometry(0.9, 1, 0.9);
    const bandGeo = new THREE.BoxGeometry(0.94, 0.14, 0.94);
    const towers: { mesh: THREE.Mesh; band: THREE.Mesh; win: THREE.Points; base: THREE.Vector3; h: number }[] = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const base = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.34, metalness: 0.1, envMapIntensity: 1.1, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(boxGeo, mat); mesh.position.copy(base); group.add(mesh);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, emissive: 0x000000, emissiveIntensity: 0.9 });
      const band = new THREE.Mesh(bandGeo, bandMat); band.position.copy(base); group.add(band);
      // вікна — точки на гранях вежі (проявляються з даними)
      const wc = 26; const wp = new Float32Array(wc * 3);
      for (let k = 0; k < wc; k++) { wp[k * 3] = base.x + (Math.random() - 0.5) * 0.86; wp[k * 3 + 1] = Math.random(); wp[k * 3 + 2] = base.z + 0.47; }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3));
      const win = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0x7e9dff, size: 0.07, transparent: true, opacity: 0 }));
      group.add(win); disposables.push(wg);
      towers.push({ mesh, band, win, base, h: 0.4 });
    }
    disposables.push(boxGeo, bandGeo);

    // — Світлові дороги ядро↔вежа (проявляються з completeness) —
    const roadGeo = new THREE.BufferGeometry();
    const roadPos = new Float32Array(N * 2 * 3);
    roadGeo.setAttribute('position', new THREE.BufferAttribute(roadPos, 3));
    const roadMat = new THREE.LineBasicMaterial({ color: 0x7e9dff, transparent: true, opacity: 0 });
    group.add(new THREE.LineSegments(roadGeo, roadMat)); disposables.push(roadGeo);

    // — Data-частинки, що кружляють над районом (щільність з даними) —
    const PC = 90; const pp = new Float32Array(PC * 3); const pph = new Float32Array(PC);
    for (let i = 0; i < PC; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * (R + 1); pp[i * 3] = Math.cos(a) * r; pp[i * 3 + 1] = 0.4 + Math.random() * 3.2; pp[i * 3 + 2] = Math.sin(a) * r; pph[i] = Math.random() * Math.PI * 2; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x9db4ff, size: 0.055, transparent: true, opacity: 0 }));
    group.add(particles); disposables.push(pg);

    const resize = () => {
      const w = canvas.clientWidth || 480, h = canvas.clientHeight || 360;
      renderer.setSize(w, h, false); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize(); addEventListener('resize', resize);

    // Плавні поточні значення (анімація «зростання» району).
    let curDetail = 0; const curScore = systems.map(() => 0);
    let t0 = 0, mount = 0, raf = 0;

    const render = (t: number) => {
      if (!t0) t0 = t; const time = (t - t0) / 1000;
      mount = clamp(mount + 0.012, 0, 1); const grow = easeOut(mount);

      const gScores = goal.current.scores; const gDetail = goal.current.detail;
      curDetail += (gDetail - curDetail) * 0.06;
      const detail01 = clamp(curDetail / 100, 0, 1);

      for (let i = 0; i < N; i++) {
        curScore[i] += ((gScores[i] ?? 40) - curScore[i]) * 0.06;
        const s01 = clamp(curScore[i] / 100, 0.04, 1);
        const T = towers[i];
        const h = (0.4 + s01 * 3.4) * grow; T.h = h;
        T.mesh.scale.y = h; T.mesh.position.y = h / 2;
        const solid = clamp(0.35 + detail01 * 0.65, 0.35, 1);
        (T.mesh.material as THREE.MeshStandardMaterial).opacity = solid;
        // статус-смуга біля основи — колір за здоров'ям системи
        T.band.position.y = 0.07 * grow; T.band.scale.y = grow;
        (T.band.material as THREE.MeshStandardMaterial).emissive.copy(health(curScore[i]));
        (T.band.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55 + Math.sin(time * 2 + i) * 0.12;
        // вікна проявляються з даними
        (T.win.material as THREE.PointsMaterial).opacity = clamp((detail01 - 0.15) * 1.2, 0, 0.9) * (0.6 + s01 * 0.4);
        T.win.scale.y = h; T.win.position.y = 0;
        // дорога ядро→вежа
        roadPos[i * 6] = 0; roadPos[i * 6 + 1] = 0.9; roadPos[i * 6 + 2] = 0;
        roadPos[i * 6 + 3] = T.base.x; roadPos[i * 6 + 4] = 0.14; roadPos[i * 6 + 5] = T.base.z;
      }
      roadGeo.attributes.position.needsUpdate = true;
      roadMat.opacity = clamp((detail01 - 0.1) * 0.9, 0, 0.6);
      (gridHelper.material as THREE.Material).opacity = clamp(detail01 * 0.5, 0, 0.5) * grow;

      // частинки кружляють, щільність з даними
      const pa = pg.attributes.position.array as Float32Array;
      for (let i = 0; i < PC; i++) { pph[i] += 0.005; const y0 = pa[i * 3 + 1]; pa[i * 3 + 1] = y0; }
      pg.attributes.position.needsUpdate = true;
      (particles.material as THREE.PointsMaterial).opacity = clamp((detail01 - 0.2) * 0.9, 0, 0.5);
      particles.rotation.y = time * 0.06;

      core.rotation.y += reduce ? 0 : 0.006; core.rotation.x = Math.sin(time * 0.3) * 0.12; coreWire.rotation.copy(core.rotation);
      core.scale.setScalar((0.7 + detail01 * 0.5) * grow); coreWire.scale.copy(core.scale);
      coreMat.emissive.setHex(0x7e9dff); coreMat.emissiveIntensity = detail01 * 0.12;

      group.rotation.y = reduce ? -0.5 : time * 0.12;
      camera.lookAt(0, 0.9, 0);

      renderer.render(scene, camera);
      raf = running() ? requestAnimationFrame(render) : 0;
    };

    let visible = true, active = !document.hidden;
    const running = () => visible && active && !reduce;
    const pump = () => { if (running() && !raf) raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render);
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; pump(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => { active = !document.hidden; pump(); };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (e: Event) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; };
    const onRestored = () => pump();
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      removeEventListener('resize', resize);
      towers.forEach((t) => { (t.mesh.material as THREE.Material).dispose(); (t.band.material as THREE.Material).dispose(); (t.win.material as THREE.Material).dispose(); });
      roadMat.dispose(); coreWire.geometry.dispose(); (coreWire.material as THREE.Material).dispose();
      (particles.material as THREE.Material).dispose(); (gridHelper.material as THREE.Material).dispose(); gridHelper.geometry.dispose();
      disposables.forEach((d) => d.dispose());
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    };
  }, []); // сцена будується раз; дані оновлюємо через goal.current

  return <canvas ref={ref} className="cw-canvas" aria-hidden="true" />;
}
