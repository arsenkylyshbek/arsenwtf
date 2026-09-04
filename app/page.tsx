import { INTRO, SECTIONS } from "@/content/site";
import { SiteSection } from "@/components/site-section";
import { PlacesAtlas } from "@/components/places-atlas";
import { PlayerCard } from "@/components/holo/player-card";
import { PhotoAlbum } from "@/components/photo-album";
import { RichText } from "@/components/rich-text";
import { SpecBox } from "@/components/spec/spec-box";
import { SpecStack } from "@/components/spec/spec-stack";

export default function Home() {
  return (
    <>
      {/* The intro is a section like any other, so the rail can scroll to it
          and highlight it. No visible label — the h1 already says who this is,
          and a "me" heading above your own name reads as filing. */}
      <section id="me" data-section="me" className="scroll-mt-32">
        <SpecStack>
          <SpecBox label="h1 · display/44 · Geist 400">
            <div className="flex items-center gap-4">
              {/* Sized off the display line-height rather than a fixed px, so
                  it stays locked to the name if the type scale ever moves. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={INTRO.avatar}
                alt=""
                className="size-[var(--text-display--line-height)] shrink-0 rounded-full border border-ink/10 object-cover"
              />
              <h1 className="font-display text-display font-normal text-balance text-ink">
                {INTRO.name}
              </h1>
            </div>
          </SpecBox>

          {/* One size for the whole intro. `lead` stays a separate field
              because it doubles as the page's meta description, but it reads
              as the first paragraph, not as a larger one. */}
          <SpecBox label="p · body/16 · Inter 400" className="mt-6">
            <div className="max-w-[52ch] space-y-3">
              {[INTRO.lead, ...INTRO.body].map((paragraph, index) => (
                <p key={index} className="text-pretty text-ink-muted">
                  <RichText text={paragraph} />
                </p>
              ))}
            </div>
          </SpecBox>

          {/* Mobile only — on desktop these live at the foot of the rail. */}
          <SpecBox label="nav · body/16 · Inter 400" className="mt-5 md:hidden">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {INTRO.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="pill text-ink-muted underline underline-offset-4 hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </SpecBox>
        </SpecStack>
      </section>

      <div className="mt-20">
        {SECTIONS.map((section, index) => (
          <SiteSection key={section.id} section={section} first={index === 0}>
            {section.kind === "album" ? (
              <PhotoAlbum entries={section.entries} />
            ) : section.kind === "map" ? (
              <PlacesAtlas entries={section.entries} />
            ) : section.kind === "cards" ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {section.entries.map((entry) => (
                  <PlayerCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : undefined}
          </SiteSection>
        ))}
      </div>
    </>
  );
}
