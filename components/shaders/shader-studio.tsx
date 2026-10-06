"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ShaderInstance, Uniforms, UniformValue } from "@/lib/shaders/core";
import type { Control, ShaderDef } from "@/lib/shaders";
import { SpecBox } from "@/components/spec/spec-box";
import { ShaderCanvas } from "./shader-canvas";

const RESOLUTIONS = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
];
const FRAME_RATES = [
  { label: "still", value: 0 },
  { label: "30", value: 30 },
  { label: "60", value: 60 },
];

const INSTALL = "npm i arsen-shaders";
const LANGS = ["react", "js", "html"] as const;
type Lang = (typeof LANGS)[number];

const camel = (slug: string) => slug.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Code for the npm package, carrying only what differs from the defaults. */
function buildSnippet(shader: ShaderDef, changed: Uniforms, lang: Lang): string {
  const controls = shader.groups.flatMap((g) => g.controls);
  const params = Object.entries(changed)
    .map(([key, value]) => [controls.find((c) => c.key === key)?.prop, value] as const)
    .filter((entry): entry is readonly [string, UniformValue] => Boolean(entry[0]));

  if (lang === "react") {
    const props = params.map(([p, v]) => `  ${p}=${typeof v === "string" ? `"${v}"` : `{${v}}`}`);
    return [
      `import { ${shader.component} } from "arsen-shaders/react";`,
      "",
      `<${shader.component}`,
      ...props,
      `  style={{ height: 480 }}`,
      "/>",
    ].join("\n");
  }

  if (lang === "js") {
    const name = camel(shader.slug);
    const body = params.map(([p, v]) => `  ${p}: ${typeof v === "string" ? `"${v}"` : v},`);
    return [
      `import { mountShader, ${name} } from "arsen-shaders";`,
      "",
      body.length
        ? `mountShader(document.querySelector("#hero"), ${name}, {\n${body.join("\n")}\n});`
        : `mountShader(document.querySelector("#hero"), ${name});`,
    ].join("\n");
  }

  const attrs = params.map(([p, v]) => `\n     data-${kebab(p)}="${v}"`).join("");
  return [
    `<div data-arsen-shader="${shader.slug}"${attrs}`,
    `     style="height: 480px"></div>`,
    "",
    `<script src="https://cdn.jsdelivr.net/npm/arsen-shaders"></script>`,
  ].join("\n");
}

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

/** Only what differs from the defaults — that's what the URL and snippet carry. */
function diff(shader: ShaderDef, values: Uniforms): Uniforms {
  const out: Uniforms = {};
  for (const key in values) {
    if (values[key] !== shader.defaults[key]) out[key] = values[key];
  }
  return out;
}

function readQuery(shader: ShaderDef): Uniforms {
  const out: Uniforms = {};
  for (const [key, raw] of new URLSearchParams(window.location.search)) {
    if (!(key in shader.defaults)) continue;
    const isColor = typeof shader.defaults[key] === "string";
    if (isColor && /^#[0-9a-f]{6}$/i.test(raw)) out[key] = raw;
    else if (!isColor && Number.isFinite(+raw)) out[key] = +raw;
  }
  return out;
}

export function ShaderStudio({ shader }: { shader: ShaderDef }) {
  const [values, setValues] = useState<Uniforms>(shader.defaults);
  const [maxDpr, setMaxDpr] = useState(1);
  const [fps, setFps] = useState(30);
  const [stats, setStats] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("react");
  const instanceRef = useRef<ShaderInstance | null>(null);

  // The URL carries the look, so a tuned shader is a link you can send.
  // Read once after hydration (the server render can't see the query).
  useEffect(() => {
    const fromUrl = readQuery(shader);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL
    if (Object.keys(fromUrl).length) setValues({ ...shader.defaults, ...fromUrl });
  }, [shader]);

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(diff(shader, values))) params.set(k, String(v));
      const query = params.toString();
      window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    }, 250);
    return () => clearTimeout(id);
  }, [shader, values]);

  useEffect(() => {
    const id = setInterval(() => {
      const s = instanceRef.current?.stats;
      if (!s) return setStats("no webgl2 — showing fallback");
      const mp = ((s.width * s.height) / 1e6).toFixed(2);
      setStats(`${s.width}×${s.height} · ${mp} mp · ${fps === 0 ? "still" : `${s.fps} fps`}`);
    }, 500);
    return () => clearInterval(id);
  }, [fps]);

  const set = (key: string, value: UniformValue) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const activePreset = shader.presets.find((preset) => {
    const target = { ...shader.defaults, ...preset.values };
    return Object.keys(target).every((k) => target[k] === values[k]);
  });

  const snippet = useMemo(() => buildSnippet(shader, diff(shader, values), lang), [shader, values, lang]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      // Clipboard blocked; the snippet is on screen to select by hand.
    }
  };

  return (
    <div>
      <SpecBox label="nav · body/16 · Inter 400">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="meta text-ink-faint">presets</span>
          {shader.presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setValues({ ...shader.defaults, ...preset.values })}
              className={`pill ${
                preset === activePreset ? "pill-accent" : "text-ink-muted hover:text-ink"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </SpecBox>

      <SpecBox label="canvas · 16:10 · radius/md" className="mt-6">
        <div className="shader-window aspect-[16/10]">
          <ShaderCanvas
            shader={shader}
            values={values}
            maxDpr={maxDpr}
            fps={fps}
            instanceRef={instanceRef}
          />
        </div>
      </SpecBox>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="meta text-ink-faint">{stats || " "}</p>
        <div className="flex items-center gap-x-6">
          <Segmented label="res" options={RESOLUTIONS} value={maxDpr} onChange={setMaxDpr} />
          <Segmented label="fps" options={FRAME_RATES} value={fps} onChange={setFps} />
        </div>
      </div>

      <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {shader.groups.map((group) => (
          <SpecBox key={group.title} label="fieldset · body/16 · Inter 400">
            <fieldset>
              <legend className="meta mb-2 text-ink-faint">{group.title}</legend>
              {group.controls.map((control) => (
                <ControlRow
                  key={control.key}
                  control={control}
                  value={values[control.key]}
                  fallback={shader.defaults[control.key]}
                  onChange={(v) => set(control.key, v)}
                />
              ))}
            </fieldset>
          </SpecBox>
        ))}
      </div>

      <div className="mt-14 border-t border-rule pt-10">
        <h2 className="meta text-ink-faint">use it</h2>
        <p className="mt-2 text-pretty text-ink-muted">
          free and open source, with the look you tuned above baked in.
        </p>

        {lang !== "html" && (
          <div className="shader-code mt-5 flex items-center justify-between gap-4">
            <code>{INSTALL}</code>
            <button
              type="button"
              onClick={() => copy(INSTALL, "install")}
              className={`pill meta shrink-0 ${copied === "install" ? "pill-accent" : "text-ink-faint hover:text-ink"}`}
            >
              {copied === "install" ? "copied" : "copy"}
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div role="tablist" aria-label="language" className="flex items-center gap-x-5">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={l === lang}
                onClick={() => setLang(l)}
                className={`pill meta ${l === lang ? "pill-accent" : "text-ink-muted hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => copy(snippet, "code")}
            className={`pill ${copied === "code" ? "pill-accent" : "text-ink-muted hover:text-ink"}`}
          >
            {copied === "code" ? "copied" : "copy"}
          </button>
        </div>
        <pre className="shader-code mt-3">
          <code>{snippet}</code>
        </pre>
        <p className="meta mt-3 text-ink-faint">
          <a
            href="https://www.npmjs.com/package/arsen-shaders"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-ink/25 underline-offset-4 hover:text-ink"
          >
            all parameters on npm
          </a>
        </p>
      </div>
    </div>
  );
}

function Segmented<T extends number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-x-4">
      <span className="meta text-ink-faint">{label}</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`pill meta ${
            option.value === value ? "pill-accent" : "text-ink-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ControlRow({
  control,
  value,
  fallback,
  onChange,
}: {
  control: Control;
  value: UniformValue;
  fallback: UniformValue;
  onChange: (value: UniformValue) => void;
}) {
  const changed = value !== fallback;
  const id = `ctl-${control.key}`;

  // The label doubles as a reset: once a value moves, it darkens and
  // clicking it puts the default back.
  const label = (
    <label
      htmlFor={id}
      title={changed ? "click to reset" : undefined}
      onClick={(e) => {
        if (!changed) return;
        e.preventDefault();
        onChange(fallback);
      }}
      className={`truncate ${changed ? "cursor-pointer text-ink" : "text-ink-muted"}`}
    >
      {control.label}
    </label>
  );

  if (control.kind === "color") {
    return (
      <div className="grid h-9 grid-cols-[104px_1fr] items-center gap-3">
        {label}
        <div className="flex items-center gap-3">
          <span className="shader-swatch" style={{ background: String(value) }}>
            <input
              id={id}
              type="color"
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
            />
          </span>
          <span className="meta text-ink-faint">{String(value).slice(1).toLowerCase()}</span>
        </div>
      </div>
    );
  }

  const n = Number(value);
  const fill = ((n - control.min) / (control.max - control.min)) * 100;
  return (
    <div className="grid h-9 grid-cols-[104px_1fr_52px] items-center gap-3">
      {label}
      <input
        id={id}
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={n}
        onChange={(e) => onChange(+e.target.value)}
        className="shader-range"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
      <span className="meta text-right text-ink-faint">{n.toFixed(decimals(control.step))}</span>
    </div>
  );
}
