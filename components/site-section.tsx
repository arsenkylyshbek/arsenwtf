import type { Section } from "@/content/site";
import { EntryList } from "@/components/entry-list";
import { RichText } from "@/components/rich-text";
import { SpecBox } from "@/components/spec/spec-box";
import { Showcase } from "@/components/showcase";

/**
 * One former page, now a section of the single page.
 *
 * The divider is a hairline in --color-rule plus a lot of air. The air is
 * doing most of the separating; the rule just tells you it was on purpose.
 */
export function SiteSection({
  section,
  first,
  children,
}: {
  section: Section;
  first?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={section.id}
      data-section={section.id}
      className={
        first
          ? "scroll-mt-32"
          : "mt-20 scroll-mt-32 border-t border-rule pt-20"
      }
    >
      <SpecBox label={`h2 · body/16 · Inter 400`}>
        <h2 className="meta text-ink-faint">{section.title}</h2>
      </SpecBox>

      {/* Prose above the contents. Lives here rather than in any one child,
          so a list, an album and a card grid can all have one. */}
      {section.intro && section.intro.length > 0 && (
        <div className="mt-4 max-w-[56ch] space-y-3">
          {section.intro.map((paragraph, index) => (
            <p key={index} className="text-pretty text-ink-muted">
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      )}

      <div className={section.intro?.length ? "mt-8" : "mt-4"}>
        {children ?? <EntryList entries={section.entries} />}
      </div>

      {section.showcase && <Showcase entries={section.entries} />}
    </section>
  );
}
