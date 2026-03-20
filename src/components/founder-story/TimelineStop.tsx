"use client";

/**
 * TimelineStop — a reusable container for each stop in the horizontal
 * founder timeline. Fills one full viewport width. Content is centered
 * both horizontally and vertically with maximum breathing room.
 *
 * Typography: headlines in Cormorant Garamond Italic at 56px desktop /
 * 36px mobile, supporting text in Inter Regular at 20px.
 *
 * @param headline - Primary text rendered in Cormorant Garamond Italic
 * @param subtext - Supporting text rendered in Inter Regular
 * @param children - Optional visual element (waveform, UI mockup, CTA)
 */
interface TimelineStopProps {
  headline: string;
  subtext?: string;
  children?: React.ReactNode;
}

export default function TimelineStop({ headline, subtext, children }: TimelineStopProps) {
  return (
    <div className="w-screen h-full flex-shrink-0 flex items-center justify-center px-8 sm:px-16">
      <div className="max-w-2xl text-center">
        <h3
          className="font-cormorant italic text-es-text-primary mb-6 leading-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          {headline}
        </h3>
        {subtext && (
          <p className="font-inter text-es-text-secondary text-lg sm:text-xl leading-relaxed mb-8">
            {subtext}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
