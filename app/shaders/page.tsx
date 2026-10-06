import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { ShaderTile } from "@/components/shaders/shader-tile";
import { SHADERS } from "@/lib/shaders";

export const metadata: Metadata = {
  title: "shaders",
  description: "small, fast webgl backgrounds.",
};

export default function ShadersPage() {
  return (
    <>
      <PageHeading
        title="shaders"
        lead="small, fast webgl backgrounds. one pass each, rendered at or below screen resolution, and asleep whenever they're off screen."
      />

      <div className="mt-14 grid gap-x-5 gap-y-10 sm:grid-cols-2">
        {SHADERS.map((shader) => (
          <ShaderTile key={shader.slug} shader={shader} />
        ))}
      </div>
    </>
  );
}
