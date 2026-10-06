import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { ShaderStudio } from "@/components/shaders/shader-studio";
import { getShader, SHADERS } from "@/lib/shaders";

export function generateStaticParams() {
  return SHADERS.map((shader) => ({ slug: shader.slug }));
}

export async function generateMetadata(props: PageProps<"/shaders/[slug]">): Promise<Metadata> {
  const shader = getShader((await props.params).slug);
  return shader ? { title: `${shader.name} · shaders`, description: shader.blurb } : {};
}

export default async function ShaderPage(props: PageProps<"/shaders/[slug]">) {
  const shader = getShader((await props.params).slug);
  if (!shader) notFound();

  return (
    <>
      <Link href="/shaders" className="pill mb-6 text-ink-muted hover:text-ink">
        ← shaders
      </Link>
      <PageHeading title={shader.name} lead={shader.blurb} />
      <div className="mt-10">
        <ShaderStudio shader={shader} />
      </div>
    </>
  );
}
