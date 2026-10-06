"use client";

import { useEffect, useRef } from "react";
import { mountShader, type ShaderInstance, type Uniforms } from "@/lib/shaders/core";
import type { ShaderDef } from "@/lib/shaders";

/**
 * A live shader that fills its parent. Drop it into any positioned box.
 *
 * The canvas is created imperatively rather than rendered: destroy() loses the
 * GL context on purpose (to free the slot immediately), and a lost context can
 * never be reused. A fresh element per mount means remounts — StrictMode's
 * double effect included — always get a working context.
 */
export function ShaderCanvas({
  shader,
  values,
  maxDpr = 1,
  fps = 30,
  instanceRef,
  className,
}: {
  shader: ShaderDef;
  /** Overrides on top of shader.defaults. */
  values?: Uniforms;
  maxDpr?: number;
  fps?: number;
  /** For readouts (stats) — the instance swaps on remount. */
  instanceRef?: React.RefObject<ShaderInstance | null>;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<ShaderInstance | null>(null);
  const valuesRef = useRef(values);

  useEffect(() => {
    valuesRef.current = values;
    instRef.current?.set({ ...values });
  }, [values]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.className = "shader-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    try {
      instRef.current = mountShader(canvas, {
        fragment: shader.fragment,
        uniforms: { ...shader.defaults, ...valuesRef.current },
        maxDpr,
        fps,
      });
    } catch (error) {
      // A compile error leaves the fallback showing rather than a black box.
      console.error(`[shader:${shader.slug}]`, error);
    }
    if (instanceRef) instanceRef.current = instRef.current;

    return () => {
      instRef.current?.destroy();
      instRef.current = null;
      if (instanceRef) instanceRef.current = null;
      canvas.remove();
    };
  }, [shader, maxDpr, fps, instanceRef]);

  return (
    <div
      ref={hostRef}
      className={`absolute inset-0 ${className ?? ""}`}
      style={{ background: shader.fallback }}
    />
  );
}
