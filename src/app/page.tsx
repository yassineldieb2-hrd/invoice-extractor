import Workbench from "@/components/Workbench";
import { ExtractorProvider } from "@/components/ExtractorContext";
import { BuiltBy, Footer, Header, Hero } from "@/components/Sections";

export default function Home() {
  return (
    <ExtractorProvider>
      <Header />
      <main id="top" className="w-full pt-16 bg-surface min-h-screen">
        <div className="flex flex-col w-full text-on-surface">
          <Hero />
          <Workbench />
          <BuiltBy />
        </div>
      </main>
      <Footer />
    </ExtractorProvider>
  );
}
