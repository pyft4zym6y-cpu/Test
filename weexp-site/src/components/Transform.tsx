import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './transform.css';

/**
 * Transform — флагманский переход «до»→«після». WebGL: поле частиц-«втрат» на шейдере
 * пересобирается в упорядоченную System Map по прогрессу скролла; мир течёт ink→emerald;
 * копия морфится. Прогресс — из позиции секции (pinned), как единый язык сайта.
 */
const hex = (h: string) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
// Фон стадии считаем в plain sRGB (без color-management three, иначе зелёный «выцветает»).
const INK255 = [15, 26, 33], VERD255 = [31, 86, 72]; // #0F1A21, #1F5648
const mixRgb = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const VERT = /* glsl */`
  uniform float uProg; uniform float uTime; uniform float uSize;
  attribute vec3 aChaos; attribute vec3 aTarget; attribute float aRand;
  varying float vProg;
  void main(){
    vProg = uProg;
    vec3 pos = mix(aChaos, aTarget, uProg);
    float drift = (1.0 - uProg) * 22.0;
    pos.x += cos(uTime * (0.4 + aRand) + aRand * 6.28) * drift;
    pos.y += sin(uTime * (0.4 + aRand) + aRand * 6.28) * drift;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.6 + uProg * 2.0) * uSize;
  }`;
const FRAG = /* glsl */`
  precision mediump float;
  uniform vec3 uCoral; uniform vec3 uNode;
  varying float vProg;
  void main(){
    vec2 d = gl_PointCoord - vec2(0.5);
    if (dot(d, d) > 0.25) discard;
    gl_FragColor = vec4(mix(uCoral, uNode, vProg), 0.35 + vProg * 0.55);
  }`;

export function Transform() {
  const actRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cv = cvRef.current!, act = actRef.current!, stage = stageRef.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    } catch { return; } // нет WebGL — сцена просто пустая, копия/фон работают
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    let W = cv.clientWidth, H = cv.clientHeight;
    const cam = new THREE.OrthographicCamera(0, W, 0, H, -100, 100);
    cam.position.z = 10;

    let cols = 0, rows = 0, N = 0;
    let points: THREE.Points, lines: THREE.LineSegments;
    let chaos: Float32Array, target: Float32Array, edgePos: Float32Array;
    const uniforms = {
      uProg: { value: reduce ? 1 : 0 }, uTime: { value: 0 }, uSize: { value: renderer.getPixelRatio() },
      uCoral: { value: new THREE.Color(...hex('#D6362B') as [number, number, number]) },
      uNode: { value: new THREE.Color(...hex('#6FAA9A') as [number, number, number]) },
    };

    function build() {
      W = cv.clientWidth; H = cv.clientHeight;
      renderer.setSize(W, H, false);
      cam.right = W; cam.bottom = H; cam.updateProjectionMatrix();
      if (points) { scene.remove(points); points.geometry.dispose(); }
      if (lines) { scene.remove(lines); lines.geometry.dispose(); }
      const aspect = W / H;
      cols = Math.max(6, Math.round(9 * Math.min(1.4, aspect)));
      rows = Math.max(5, Math.round((cols / aspect) * 0.78));
      N = cols * rows;
      const bw = Math.min(W * 0.78, 1180), bh = Math.min(H * 0.6, 600);
      const bx = (W - bw) / 2, by = (H - bh) / 2 + H * 0.03;
      chaos = new Float32Array(N * 3); target = new Float32Array(N * 3);
      const rand = new Float32Array(N);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        chaos[i * 3] = Math.random() * W; chaos[i * 3 + 1] = Math.random() * H;
        target[i * 3] = bx + (c / (cols - 1)) * bw; target[i * 3 + 1] = by + (r / (rows - 1)) * bh;
        rand[i] = Math.random();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      g.setAttribute('aChaos', new THREE.BufferAttribute(chaos, 3));
      g.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
      g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
      points = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false }));
      scene.add(points);
      // edges: right + bottom neighbours
      const segs: number[] = [];
      const idx = (c: number, r: number) => r * cols + c;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (c < cols - 1) segs.push(idx(c, r), idx(c + 1, r));
        if (r < rows - 1) segs.push(idx(c, r), idx(c, r + 1));
      }
      edgePos = new Float32Array(segs.length * 3);
      (points.geometry as THREE.BufferGeometry).userData.segs = segs;
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
      lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color(...hex('#6FAA9A') as [number, number, number]), transparent: true, opacity: 0 }));
      scene.add(lines);
      (lines.geometry as THREE.BufferGeometry).userData.segs = segs;
    }

    let progress = reduce ? 1 : 0, tPhase = 0, raf = 0;
    function render() {
      const e = easeInOut(progress);
      uniforms.uProg.value = e; uniforms.uTime.value = tPhase; tPhase += 0.016;
      stage.style.background = mixRgb(INK255, VERD255, e);

      // update edge positions on CPU from same morph (cheap)
      const segs: number[] = (lines.geometry as THREE.BufferGeometry).userData.segs;
      const drift = (1 - e) * 22;
      const posAt = (i: number, out: [number, number]) => {
        const x = chaos[i * 3] + (target[i * 3] - chaos[i * 3]) * e + Math.cos(tPhase * (0.4) ) * 0; // base
        const y = chaos[i * 3 + 1] + (target[i * 3 + 1] - chaos[i * 3 + 1]) * e;
        out[0] = x + Math.cos(tPhase * 0.6 + i) * drift; out[1] = y + Math.sin(tPhase * 0.6 + i) * drift;
      };
      const p2: [number, number] = [0, 0];
      for (let s = 0; s < segs.length; s++) { posAt(segs[s], p2); edgePos[s * 3] = p2[0]; edgePos[s * 3 + 1] = p2[1]; edgePos[s * 3 + 2] = 0; }
      (lines.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (lines.material as THREE.LineBasicMaterial).opacity = Math.max(0, (e - 0.42) / 0.5) * 0.34;

      renderer.render(scene, cam);
      // перекрывающийся кросс-фейд (без «пустого» кадра на середине)
      if (beforeRef.current) beforeRef.current.style.opacity = String(Math.min(1, Math.max(0, 1 - progress / 0.55)));
      if (afterRef.current) afterRef.current.style.opacity = String(Math.min(1, Math.max(0, (progress - 0.45) / 0.55)));
      raf = requestAnimationFrame(render);
    }

    function onScroll() {
      if (reduce) return;
      const r = act.getBoundingClientRect();
      const total = act.offsetHeight - stage.offsetHeight;
      progress = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    }
    const onResize = () => build();
    build(); onScroll();
    addEventListener('resize', onResize); addEventListener('scroll', onScroll, { passive: true });
    render();
    return () => {
      cancelAnimationFrame(raf); removeEventListener('resize', onResize); removeEventListener('scroll', onScroll);
      renderer.dispose(); points?.geometry.dispose(); lines?.geometry.dispose();
    };
  }, []);

  return (
    <section className="tf" ref={actRef} data-say="Хаос збирається в систему: кожна «втрата» стає вузлом, який працює без вас.">
      <div className="tf-stage" ref={stageRef}>
        <canvas className="tf-canvas" ref={cvRef} />
        <div className="wrap tf-copy">
          <div className="tf-state" ref={beforeRef}>
            <div className="eyebrow">01 · До</div>
            <h2>Бізнес тримається на героїзмі</h2>
            <p>Втрати сховані в операційці. Прибери людину — і все зупиниться.</p>
          </div>
          <div className="tf-state after" ref={afterRef}>
            <div className="eyebrow">01 · Після</div>
            <h2>Система працює без вас</h2>
            <p>Відділ, процеси, документи. Кожен вузол на місці — бізнес їде сам.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
