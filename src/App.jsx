import { useContext, useEffect } from "react";
import { AppProvider, AppContext } from "./context/AppContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ChapterBlock from "./components/ChapterBlock";
import StatBlock from "./components/StatBlock";
import ChartBlock from "./components/ChartBlock";
import Cards from "./components/Cards";
import InfoBox from "./components/InfoBox";
import RegTable from "./components/RegTable";
import TypeGrid from "./components/TypeGrid";
import UvCompare from "./components/UvCompare";
import SourceList from "./components/SourceList";
import IndiaReview from "./components/IndiaReview";
import AustraliaReport from "./components/AustraliaReport";
import TwoFutures from "./components/TwoFutures";
import ClimateSection from "./components/ClimateSection";
import Footer from "./components/Footer";
import ReadingProgress from "./components/ReadingProgress";

const FAILED_CLAIM_STAT = {
  bn: "তাদের দাবিকৃত SPF মান পূরণ করতে পারেনি",
  en: "failed to meet their labeled SPF claim",
};

function Main() {
  const { t, lang } = useContext(AppContext);

  return (
    <main>
      <Hero />
      <ChapterBlock section="s1">
        <StatBlock number="93.3%" label={FAILED_CLAIM_STAT[lang]} />
        <Cards section="s1" count={3} />
        <InfoBox section="s1.note" />
        <InfoBox section="s1.bd" />
      </ChapterBlock>
      <ChapterBlock section="s2">
        <RegTable section="s2" />
        <InfoBox section="s2.au" />
      </ChapterBlock>
      <ChapterBlock section="s3">
        <ChartBlock section="s3.c1" />
        <ChartBlock section="s3.c2" />
      </ChapterBlock>
      <ChapterBlock section="s4">
        <ChartBlock section="s4.uva" />
        <ChartBlock section="s4.uvb" />
        <p className="chapter-body">{t["s4.note"]}</p>
        <UvCompare section="s4.uv" />
      </ChapterBlock>
      <TwoFutures />
      <ChapterBlock section="s5">
        <Cards section="s5" count={3} />
      </ChapterBlock>
      <ClimateSection />
      <ChapterBlock section="s6">
        <TypeGrid section="s6" count={4} />
        <InfoBox section="s6.tint" />
        <IndiaReview section="s6.india" />
      </ChapterBlock>
      <ChapterBlock section="s7">
        <SourceList section="s7" />
      </ChapterBlock>
      <AustraliaReport section="s8" />
    </main>
  );
}

function ContentProtection() {
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "s", "u", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("selectstart", preventDefault);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("cut", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      document.removeEventListener("selectstart", preventDefault);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  return null;
}

function App() {
  return (
    <AppProvider>
      <ContentProtection />
      <ReadingProgress />
      <Header />
      <Main />
      <Footer />
    </AppProvider>
  );
}

export default App;
