/**
 * Живой WebGL-фон: domain-warped fbm-шум, тёмная база с acid-прожилками,
 * медленно течёт по времени и смещается за курсором. Без внешних библиотек —
 * сырой WebGL, инлайнится в бандл/артефакт. Грациозный фолбэк (CSS-градиент),
 * если WebGL недоступен; замирает при prefers-reduced-motion.
 */
import { useRef, useEffect } from 'react';

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

// hash + value noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.045;
  vec2 m = (u_mouse - 0.5) * 0.35;

  // domain warp
  vec2 q = vec2(fbm(p*1.6 + t + m), fbm(p*1.6 - t*0.8 - m + 5.2));
  vec2 r = vec2(fbm(p*1.6 + 1.8*q + t*0.6), fbm(p*1.6 + 1.8*q - t*0.5));
  float f = fbm(p*1.7 + 2.2*r);

  // палитра: void → coal → graphite, тонкие acid-прожилки
  vec3 c0 = vec3(0.039,0.043,0.051);   // #0A0B0D void
  vec3 c1 = vec3(0.086,0.098,0.117);   // #16191E graphite
  vec3 acid = vec3(0.780,0.976,0.294); // #C7F94B

  vec3 col = mix(c0, c1, smoothstep(0.15, 0.9, f));
  // прожилки: узкий диапазон значений warp-поля светится acid
  float vein = smoothstep(0.62, 0.72, r.x) * (1.0 - smoothstep(0.72, 0.82, r.x));
  col += acid * vein * 0.5;
  // мягкое свечение у курсора
  float glow = 0.08 / (length((uv - u_mouse) * vec2(u_res.x/u_res.y, 1.0)) + 0.12);
  col += acid * glow * 0.05;

  // виньетка
  col *= 1.0 - 0.35 * length(uv - 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;

export default function ShaderBackground({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) {
      canvas.style.background = 'radial-gradient(120% 100% at 70% 0%, #16191E 0%, #0A0B0D 60%)';
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.style.background = 'radial-gradient(120% 100% at 70% 0%, #16191E 0%, #0A0B0D 60%)';
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const t0 = performance.now();
    const render = (now: number) => {
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 6.0 : (now - t0) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(render);
    };
    if (reduce) render(t0);
    else raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
