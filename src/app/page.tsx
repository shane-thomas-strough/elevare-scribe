import dynamic from "next/dynamic";

const HeroSection = dynamic(() => import("@/components/hero/HeroSection"), { ssr: false });

const HowItWorks = dynamic(() => import("@/components/how-it-works/HowItWorks"), { ssr: false });

const GigModeSection = dynamic(() => import("@/components/gig-mode/GigModeSection"), {
  ssr: false,
});

const FounderStory = dynamic(() => import("@/components/founder-story/FounderStory"), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <GigModeSection />
      <FounderStory />
    </main>
  );
}
