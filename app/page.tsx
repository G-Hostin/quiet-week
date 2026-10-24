import type { Viewport } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import HeroFigure from "@/components/HeroFigure";
import ExampleCards from "@/components/ExampleCards";
import { ArrowRight } from "@/components/Icons";
import { RELEASE_DATA } from "@/lib/data";
import { EXAMPLE_ANALYSES } from "@/lib/examples";

// The landing page opens on the dark band, so the mobile browser bar matches it.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#10142a" };

export default function Home() {
  const western = EXAMPLE_ANALYSES.find((e) => e.id === "action-western") ?? EXAMPLE_ANALYSES[0];
  const farm = EXAMPLE_ANALYSES.find((e) => e.id === "cozy-farm") ?? EXAMPLE_ANALYSES[1];
  const games = RELEASE_DATA.releases.filter((r) => r.kind === "game").length;
  const films = RELEASE_DATA.releases.length - games;
  return (
    <>
      <SiteHeader page="home" />
      <main id="main">
        <section className="hero band-dark">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1>Find a quiet week to launch your indie game.</h1>
              <p className="hero-lede">
                GTA VI lands on November 19, 2026, and studios are moving their launches away from it. But a big
                release only hurts you if it shares your players. Quiet Week measures that overlap for every big game
                and film from November to March, with Qloo&apos;s audience data.
              </p>
              <p className="hero-for">For indie studios and small publishers choosing a launch week. Free, no account.</p>
              <div className="hero-actions">
                <Link className="btn" href="/check">
                  Check my launch window <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-quiet" href="/check?example=action-western">
                  See an example
                </Link>
              </div>
            </div>
            <HeroFigure first={western} second={farm} />
          </div>
        </section>

        <section className="home-sec band band-work" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="how-title">How it works</h2>
              <p>Three steps, under a minute. Nothing to install, nothing to sign up for.</p>
            </div>
            <ol className="how">
              <li className="how-step">
                <span className="how-n" aria-hidden="true">1</span>
                <h3>Describe your players</h3>
                <p>
                  Name 1 to 3 well-known games your players love, and your launch window. Qloo has little data on
                  small games, so bigger ones stand for your audience.
                </p>
              </li>
              <li className="how-step">
                <span className="how-n" aria-hidden="true">2</span>
                <h3>Confirm the games</h3>
                <p>
                  An AI agent finds them in Qloo, fixes typos and checks Qloo has audience data. You confirm each
                  match before anything is measured.
                </p>
              </li>
              <li className="how-step">
                <span className="how-n" aria-hidden="true">3</span>
                <h3>Get your weeks</h3>
                <p>
                  Qloo scores {games} upcoming games and {films} films against your players. You get the best weeks,
                  the weeks to avoid, and a calendar where every number and date has a source.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="home-sec band band-work" id="examples" aria-labelledby="examples-title">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="examples-title">Try a ready-made example</h2>
              <p>Three precomputed checks that open instantly, with the real Qloo numbers and the agent&apos;s steps.</p>
            </div>
            <ExampleCards examples={EXAMPLE_ANALYSES} />
          </div>
        </section>

        <section className="home-sec band band-dark" aria-labelledby="end-title">
          <div className="wrap home-end">
            <div>
              <h2 id="end-title">Ready to check your own game?</h2>
              <p className="home-end-p">You only need the names of a few games your players love.</p>
            </div>
            <Link className="btn btn-lg" href="/check">
              Check my launch window <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
