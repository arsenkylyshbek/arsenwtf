/**
 * Tiny WebGL2 fullscreen-shader runner. Zero deps.
 *
 * Perf rules baked in, so no page can forget them:
 * - renders at a capped DPR and pixel count; CSS upscales the canvas
 * - only animates while on-screen and while the tab is visible
 * - frame-rate cap (ambient motion rarely needs more than 30fps)
 * - prefers-reduced-motion → one still frame
 * - one fullscreen triangle, no depth / stencil / AA buffers
 */

export type UniformValue = number | string; // number, or '#rrggbb'
export type Uniforms = Record<string, UniformValue>;

export type ShaderStats = { width: number; height: number; fps: number };

export type ShaderInstance = {
  stats: ShaderStats;
  set(uniforms: Uniforms): void;
  destroy(): void;
};

export type MountOptions = {
  /** GLSL ES 3.00 fragment body, without the #version line. */
  fragment: string;
  uniforms?: Uniforms;
  defines?: Record<string, string | number>;
  /** Render-scale cap. 1 = one buffer pixel per CSS pixel. */
  maxDpr?: number;
  /** Hard cap on drawing-buffer pixels, whatever the element size. */
  maxPixels?: number;
  /** 0 = static: draws only on resize and set(). */
  fps?: number;
  speed?: number;
};

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Returns null when WebGL2 is unavailable — the caller keeps its CSS fallback. */
export function mountShader(
  canvas: HTMLCanvasElement,
  opts: MountOptions,
): ShaderInstance | null {
  const {
    fragment,
    defines = {},
    maxDpr = 1,
    maxPixels = 1.5e6,
    fps = 30,
    speed = 1,
  } = opts;
  const values: Uniforms = { ...opts.uniforms };

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  let program: WebGLProgram | null = null;
  let uniformInfo: Record<string, { loc: WebGLUniformLocation | null; type: number }> = {};
  let raf = 0;
  let last = 0;
  let time = 0;
  let visible = true;
  let destroyed = false;
  let frames = 0;
  let fpsWindow = performance.now();
  const stats: ShaderStats = { width: 0, height: 0, fps: 0 };

  function compile(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(s);
      gl!.deleteShader(s);
      throw new Error(log ?? "shader compile failed");
    }
    return s;
  }

  function init() {
    const defs = Object.entries(defines)
      .map(([k, v]) => `#define ${k} ${v}`)
      .join("\n");
    const vs = compile(gl!.VERTEX_SHADER, VERT);
    const fs = compile(
      gl!.FRAGMENT_SHADER,
      `#version 300 es\nprecision highp float;\n${defs}\n${fragment}`,
    );
    program = gl!.createProgram()!;
    gl!.attachShader(program, vs);
    gl!.attachShader(program, fs);
    gl!.bindAttribLocation(program, 0, "a_pos");
    gl!.linkProgram(program);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
      throw new Error(gl!.getProgramInfoLog(program) ?? "shader link failed");
    }
    gl!.useProgram(program);

    // One oversized triangle covers the screen: 3 verts, no diagonal seam.
    const buf = gl!.createBuffer();
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);

    uniformInfo = {};
    const count = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl!.getActiveUniform(program, i)!;
      uniformInfo[info.name.replace(/\[0\]$/, "")] = {
        loc: gl!.getUniformLocation(program, info.name),
        type: info.type,
      };
    }
    for (const k in values) upload(k, values[k]);
  }

  function upload(name: string, raw: UniformValue | number[]) {
    const u = uniformInfo[name];
    if (!u) return;
    const v = typeof raw === "string" ? hexToRgb(raw) : raw;
    switch (u.type) {
      case gl!.FLOAT: gl!.uniform1f(u.loc, v as number); break;
      case gl!.INT: gl!.uniform1i(u.loc, v as number); break;
      case gl!.FLOAT_VEC2: gl!.uniform2fv(u.loc, v as number[]); break;
      case gl!.FLOAT_VEC3: gl!.uniform3fv(u.loc, v as number[]); break;
      case gl!.FLOAT_VEC4: gl!.uniform4fv(u.loc, v as number[]); break;
    }
  }

  function draw() {
    if (!program || gl!.isContextLost()) return;
    upload("u_res", [canvas.width, canvas.height]);
    upload("u_time", time);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (!canvas.dataset.ready) canvas.dataset.ready = "1";
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr);
    let w = canvas.clientWidth * dpr;
    let h = canvas.clientHeight * dpr;
    if (w * h > maxPixels) {
      const s = Math.sqrt(maxPixels / (w * h));
      w *= s;
      h *= s;
    }
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl!.viewport(0, 0, w, h);
    }
    stats.width = w;
    stats.height = h;
    draw();
  }

  const animated = () => fps > 0 && !prefersReducedMotion();

  function loop(now: number) {
    raf = 0;
    if (destroyed || !visible || document.hidden || !animated()) return;
    raf = requestAnimationFrame(loop);
    const dt = now - last;
    if (dt < 1000 / fps - 2) return; // frame-rate cap
    time += (Math.min(dt, 100) / 1000) * speed; // no jump after a pause
    last = now;
    draw();
    frames++;
    if (now - fpsWindow > 1000) {
      stats.fps = Math.round((frames * 1000) / (now - fpsWindow));
      frames = 0;
      fpsWindow = now;
    }
  }

  function start() {
    if (raf || destroyed) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    stats.fps = 0;
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  const ro = new ResizeObserver(resize);
  const onVisibility = () => (document.hidden ? stop() : start());
  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
  };
  const onRestored = () => {
    init();
    resize();
    start();
  };

  init();
  io.observe(canvas);
  ro.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  resize();
  start();

  return {
    stats,
    set(u) {
      Object.assign(values, u);
      for (const k in u) upload(k, u[k]);
      if (!raf) draw(); // static or paused: redraw on change
    },
    destroy() {
      destroyed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gl!.deleteProgram(program);
      // Free the context slot now rather than at GC — browsers cap live
      // contexts at ~16 and evict the oldest.
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
