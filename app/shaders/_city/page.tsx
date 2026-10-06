// Hidden: the `_` folder prefix keeps this route out of the build until the
// map tiles are on R2 (scripts/cities/README.md). To bring it back, rename the
// folder to `city` and restore the ImageTile on app/shaders/page.tsx.
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { CityStudio } from "@/components/city-map/city-studio";

export const metadata: Metadata = {
  title: "city lights · shaders",
  description: "real cities on paper by day and in sodium light by night, on each city's own clock.",
};

export default function CityPage() {
  return (
    <>
      <Link href="/shaders" className="pill mb-6 text-ink-muted hover:text-ink">
        ← shaders
      </Link>
      <PageHeading
        title="city lights"
        lead="real cities on paper by day and in sodium light by night, on each city's own clock."
      />
      <div className="mt-10">
        <CityStudio />
      </div>
    </>
  );
}
