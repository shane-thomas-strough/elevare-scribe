import dynamic from "next/dynamic";

const HeroSection = dynamic(
  () => import("@/components/hero/HeroSection"),
  { ssr: false }
);

const HowItWorks = dynamic(
  () => import("@/components/how-it-works/HowItWorks"),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
    </main>
  );
}
