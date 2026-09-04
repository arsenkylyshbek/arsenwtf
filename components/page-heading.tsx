import { SpecBox } from "@/components/spec/spec-box";
import { SpecStack } from "@/components/spec/spec-stack";

/**
 * The opening of any page: display heading, optional lead underneath.
 * Same two elements as the home page, so every route shares one rhythm.
 */
export function PageHeading({
  title,
  lead,
}: {
  title: string;
  lead?: string;
}) {
  return (
    <SpecStack>
      <SpecBox label="h1 · display/44 · Geist 400">
        <h1 className="font-display text-display font-normal text-balance text-ink">
          {title}
        </h1>
      </SpecBox>

      {lead && (
        <SpecBox label="p · lead/20 · Inter 400" className="mt-6">
          <p className="text-lead max-w-[44ch] text-pretty text-ink-muted">
            {lead}
          </p>
        </SpecBox>
      )}
    </SpecStack>
  );
}
