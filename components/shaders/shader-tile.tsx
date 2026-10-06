import Link from "next/link";
import type { ShaderDef } from "@/lib/shaders";
import { SpecBox } from "@/components/spec/spec-box";
import { ShaderCanvas } from "./shader-canvas";

/** Index card: a small live window, name and one line underneath. */
export function ShaderTile({ shader }: { shader: ShaderDef }) {
  return (
    <Link href={`/shaders/${shader.slug}`} className="shader-tile group block">
      <SpecBox label="canvas · 4:3 · radius/md">
        <div className="shader-window aspect-[4/3]">
          <ShaderCanvas shader={shader} />
        </div>
      </SpecBox>
      <p className="mt-3 text-ink">{shader.name}</p>
      <p className="text-pretty text-ink-faint">{shader.blurb}</p>
    </Link>
  );
}

/**
 * Index card for a tool too heavy to run live in a grid (the city map loads
 * MapLibre and tiles). A still of the real thing stands in for it.
 */
export function ImageTile({
  href,
  name,
  blurb,
  image,
}: {
  href: string;
  name: string;
  blurb: string;
  image: string;
}) {
  return (
    <Link href={href} className="shader-tile group block">
      <SpecBox label="image · 4:3 · radius/md">
        <div className="shader-window aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </SpecBox>
      <p className="mt-3 text-ink">{name}</p>
      <p className="text-pretty text-ink-faint">{blurb}</p>
    </Link>
  );
}
