import dynamic from "next/dynamic";

const NavBar = dynamic(() => import("@/components/sections/NavBar"), { ssr: false });
const HeroSection = dynamic(() => import("@/components/hero/HeroSection"), { ssr: false });
const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection"), { ssr: false });
const ValuePropsSection = dynamic(() => import("@/components/sections/ValuePropsSection"), {
  ssr: false,
});
const HowItWorks = dynamic(() => import("@/components/how-it-works/HowItWorks"), { ssr: false });
const GigModeSection = dynamic(() => import("@/components/gig-mode/GigModeSection"), {
  ssr: false,
});
const DifferentiationSection = dynamic(
  () => import("@/components/sections/DifferentiationSection"),
  { ssr: false }
);
const FounderStory = dynamic(() => import("@/components/founder-story/FounderStory"), {
  ssr: false,
});
const WhoItsForSection = dynamic(() => import("@/components/sections/WhoItsForSection"), {
  ssr: false,
});
const PricingSection = dynamic(() => import("@/components/sections/PricingSection"), {
  ssr: false,
});
const FAQSection = dynamic(() => import("@/components/sections/FAQSection"), { ssr: false });
const FinalCTASection = dynamic(() => import("@/components/sections/FinalCTASection"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/sections/Footer"), { ssr: false });

export default function Home() {
  return (
    <main>
      <NavBar />
      <HeroSection />
      <ProblemSection />
      <ValuePropsSection />
      <HowItWorks />
      <GigModeSection />
      <DifferentiationSection />
      <FounderStory />
      <WhoItsForSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
