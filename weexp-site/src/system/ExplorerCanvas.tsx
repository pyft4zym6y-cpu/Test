import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { SYSTEMS } from '@/data/xray';

/**
 * Інтерактивний Commerce System: 7 систем-вузлів як клікабельні категорії 1-го
 * рівня. Наведення підсвічує; клік «наближає» вузол (він більшає й виходить
 * уперед), а від нього віялом розходяться підкатегорії-процеси (domains) з
 * лініями — інші вузли тьмяніють, обертання завмирає. Повторний клік по тлу —
 * назад до огляду. Позиції підвузлів щокадру проєктуються у 2D для HTML-лейблів.
 */
const N = 7;
const NODE_TINT = [0xffffff, 0xd9dde1, 0xffffff, 0xd9dde1, 0xffffff, 0xd9dde1, 0xffffff];
const MAX_SUB = 5;

export function ExplorerCanvas({ focusedRef, onPick, hoverRef, subLabels }: {
  focusedRef: MutableRefObject<number | null>;
  onPick: (i: number | null) => void;
  hoverRef: MutableRefObject<number | null>;
  subLabels: MutableRefObject<{ x: number; y: number; vis: number }[]>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e8ec, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe6ff, 0.5); rim.position.set(-6, 2, -4); scene.add(rim);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const soft = (x: number, y: number, z: number, s: number, c: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    };
    soft(6, 8, 5, 14, 0xffffff); soft(-7, 3, -6, 12, 0xeaf0ff); soft(0, -8, 4, 10, 0xf6f6f4);
    const envTex = pmrem.fromScene(envScene, 0.03).texture;
    scene.environment = envTex;

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

    // 7 вузлів на нахиленому кільці
    const tilt = 0.42, R = 3.5;
    const base: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.3, 40, 40);
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      base.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * tilt + Math.sin(a * 2) * 0.5, Math.sin(a) * R * 0.55));
      const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshStandardMaterial({
        color: NODE_TINT[i], roughness: NODE_TINT[i] === 0xffffff ? 0.32 : 0.4,
        metalness: NODE_TINT[i] === 0xffffff ? 0.1 : 0.7, envMapIntensity: 1.2, transparent: true, opacity: 1,
      }));
      mesh.position.copy(base[i]); group.add(mesh); nodeMeshes.push(mesh);
    }

    // зв'язки ядро↔вузол
    const linkGeo = new THREE.BufferGeometry();
    const linkPos = new Float32Array(N * 2 * 3);
    linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
    const linkMat = new THREE.LineBasicMaterial({ color: 0x3a3d42, transparent: true, opacity: 0.4 });
    group.add(new THREE.LineSegments(linkGeo, linkMat));

    // підвузли-процеси (пул MAX_SUB) — діти сцени, позиціонуються у world
    const subGeo = new THREE.SphereGeometry(0.12, 24, 24);
    const subMat = new THREE.MeshStandardMaterial({ color: 0x7e9dff, roughness: 0.35, metalness: 0.1, emissive: 0x2a3f8f, emissiveIntensity: 0.4, transparent: true, opacity: 0 });
    const subMeshes: THREE.Mesh[] = [];
    const subLineGeo = new THREE.BufferGeometry();
    const subLinePos = new Float32Array(MAX_SUB * 2 * 3);
    subLineGeo.setAttribute('position', new THREE.BufferAttribute(subLinePos, 3));
    const subLineMat = new THREE.LineBasicMaterial({ color: 0x7e9dff, transparent: true, opacity: 0 });
    scene.add(new THREE.LineSegments(subLineGeo, subLineMat));
    for (let i = 0; i < MAX_SUB; i++) { const m = new THREE.Mesh(subGeo, subMat.clone()); m.visible = false; scene.add(m); subMeshes.push(m); }

    // Raycasting
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let px = 0, py = 0, hasPtr = false;
    const setPtr = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = -((e.clientY - r.top) / r.height) * 2 + 1;
      hasPtr = true;
    };
    const onMove = (e: PointerEvent) => setPtr(e);
    // Клік — лише тап (малий зсув), щоб на мобільному вертикальний свайп-скрол
    // не фокусував вузол. Тач-скрол дозволено через touch-action: pan-y на канвасі.
    let downX = 0, downY = 0;
    const onDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return; // свайп, а не тап
      setPtr(e);
      ndc.set(px, py); ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(nodeMeshes, false)[0];
      onPick(hit ? nodeMeshes.indexOf(hit.object as THREE.Mesh) : null);
    };
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown, { passive: true });
    canvas.addEventListener('pointerup', onUp);

    const resize = () => {
      const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setSize(w, h, false); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize(); addEventListener('resize', resize);

    let raf = 0, t0 = 0;
    const foc = new Float32Array(N);        // 0..1 фокус кожного вузла (згладжено)
    let rot = 0, rotV = 0.12;               // обертання групи + його швидкість
    const camZ = { v: 11 };
    const tmp = new THREE.Vector3(), tmpR = new THREE.Vector3(), tmpU = new THREE.Vector3(), tmpF = new THREE.Vector3();
    const worldFocus = new THREE.Vector3();
    const BLUE = new THREE.Color(0x7e9dff);

    const render = (t: number) => {
      if (!t0) t0 = t; const time = (t - t0) / 1000;
      const focused = reduce ? null : focusedRef.current;
      const hovered = hoverRef.current;

      // Raycast hover (лише в огляді)
      let hv: number | null = null;
      if (hasPtr && focused === null) {
        ndc.set(px, py); ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(nodeMeshes, false)[0];
        hv = hit ? nodeMeshes.indexOf(hit.object as THREE.Mesh) : null;
      }
      hoverRef.current = focused === null ? hv : hovered;
      canvas.style.cursor = (focused === null && hv !== null) ? 'pointer' : (focused !== null ? 'zoom-out' : 'default');

      // Обертання: завмирає у фокусі
      rotV += ((focused === null ? 0.12 : 0) - rotV) * 0.06;
      rot += rotV * 0.016;
      group.rotation.y = rot; group.rotation.x = -0.1;
      core.rotation.y += 0.004; core.rotation.x = Math.sin(time * 0.2) * 0.12; coreWire.rotation.copy(core.rotation);
      group.updateWorldMatrix(true, true);

      // Камера-базис (для віяла підвузлів у площині екрана)
      camera.matrixWorld.extractBasis(tmpR, tmpU, tmpF);

      // Вузли: фокус/ховер → масштаб, підйом уперед, тьмяність сусідів
      for (let i = 0; i < N; i++) {
        const isFoc = focused === i;
        foc[i] += ((isFoc ? 1 : 0) - foc[i]) * 0.12;
        const hovAmt = (focused === null && hoverRef.current === i) ? 1 : 0;
        const s = 1 + foc[i] * 1.15 + hovAmt * 0.18;
        nodeMeshes[i].scale.setScalar(s);
        nodeMeshes[i].position.copy(base[i]);
        const m = nodeMeshes[i].material as THREE.MeshStandardMaterial;
        const dim = focused !== null && !isFoc ? 0.28 : 1;
        m.opacity += (dim - m.opacity) * 0.12;
        m.emissive.copy(BLUE); m.emissiveIntensity = hovAmt * 0.25 + foc[i] * 0.15;
        // лінк
        linkPos[i * 6] = 0; linkPos[i * 6 + 1] = 0; linkPos[i * 6 + 2] = 0;
        linkPos[i * 6 + 3] = base[i].x; linkPos[i * 6 + 4] = base[i].y; linkPos[i * 6 + 5] = base[i].z;
      }
      linkGeo.attributes.position.needsUpdate = true;
      linkMat.opacity += ((focused !== null ? 0.15 : 0.4) - linkMat.opacity) * 0.1;

      // Камера: дистанція, за якої кільце вміщується за будь-якого aspect
      // (портрет-мобайл: вужчий горизонтальний FOV → відсуваємось далі).
      const halfV = (camera.fov * Math.PI) / 360;
      const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
      const fitZ = Math.max(11, 4.3 / Math.tan(Math.min(halfV, halfH)));
      const targetZ = focused !== null ? fitZ * 0.78 : fitZ;
      camZ.v += (targetZ - camZ.v) * 0.06;
      camera.position.z = camZ.v;
      if (focused !== null) {
        nodeMeshes[focused].getWorldPosition(worldFocus);
        tmp.copy(worldFocus).multiplyScalar(0.35);
        camera.position.x += (tmp.x - camera.position.x) * 0.06;
        camera.position.y += (tmp.y - camera.position.y) * 0.06;
        camera.lookAt(worldFocus.clone().multiplyScalar(0.5));
      } else {
        camera.position.x += (0 - camera.position.x) * 0.06;
        camera.position.y += (0 - camera.position.y) * 0.06;
        camera.lookAt(0, 0, 0);
      }

      // Підвузли-процеси навколо сфокусованого вузла (віяло у площині екрана)
      const labelsOut = subLabels.current;
      if (focused !== null) {
        const dl = SYSTEMS[focused].domains.slice(0, MAX_SUB);
        nodeMeshes[focused].getWorldPosition(worldFocus);
        for (let k = 0; k < MAX_SUB; k++) {
          const sm = subMeshes[k];
          if (k < dl.length) {
            const ang = (-(dl.length - 1) / 2 + k) * 0.72; // радіани навколо вузла (ширший розкид)
            const rad = 2.5;
            tmp.copy(worldFocus)
              .add(tmpR.clone().multiplyScalar(Math.sin(ang) * rad * 1.15))
              .add(tmpU.clone().multiplyScalar((Math.cos(ang) - 0.35) * rad * 0.75))
              .add(tmpF.clone().multiplyScalar(0.2));
            sm.visible = true;
            sm.position.lerp(tmp, 0.18);
            sm.scale.setScalar(0.6 + foc[focused] * 0.6);
            const sMat = sm.material as THREE.MeshStandardMaterial;
            sMat.opacity += (foc[focused] - sMat.opacity) * 0.12;
            // лінія вузол→підвузол
            subLinePos[k * 6] = worldFocus.x; subLinePos[k * 6 + 1] = worldFocus.y; subLinePos[k * 6 + 2] = worldFocus.z;
            subLinePos[k * 6 + 3] = sm.position.x; subLinePos[k * 6 + 4] = sm.position.y; subLinePos[k * 6 + 5] = sm.position.z;
            // проєкція у 2D
            tmp.copy(sm.position).project(camera);
            labelsOut[k] = { x: (tmp.x * 0.5 + 0.5) * 100, y: (-tmp.y * 0.5 + 0.5) * 100, vis: tmp.z < 1 ? foc[focused] : 0 };
          } else {
            sm.visible = false; labelsOut[k] = { x: 50, y: 50, vis: 0 };
            subLinePos[k * 6] = subLinePos[k * 6 + 3] = 0; subLinePos[k * 6 + 1] = subLinePos[k * 6 + 4] = 0; subLinePos[k * 6 + 2] = subLinePos[k * 6 + 5] = 0;
          }
        }
        subLineMat.opacity += (foc[focused] * 0.6 - subLineMat.opacity) * 0.12;
      } else {
        for (let k = 0; k < MAX_SUB; k++) {
          const sMat = subMeshes[k].material as THREE.MeshStandardMaterial;
          sMat.opacity += (0 - sMat.opacity) * 0.15;
          if (sMat.opacity < 0.02) subMeshes[k].visible = false;
          labelsOut[k] = { x: 50, y: 50, vis: 0 };
        }
        subLineMat.opacity += (0 - subLineMat.opacity) * 0.15;
      }
      subLineGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp);
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
      nodeGeo.dispose(); subGeo.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    };
  }, [focusedRef, hoverRef, onPick, subLabels]);

  return <canvas ref={ref} className="sysx-object3d" aria-hidden="true" />;
}
