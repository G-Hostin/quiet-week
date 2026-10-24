import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import CheckApp from "@/components/check/CheckApp";
import { RELEASE_DATA } from "@/lib/data";
import { EXAMPLE_ANALYSES } from "@/lib/examples";
import { viewFrom } from "@/lib/present";

export const metadata: Metadata = {
  title: "Check your launch window · Quiet Week",
};

export default async function CheckPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : null;
  };
  const initial = viewFrom({ get }, EXAMPLE_ANALYSES.map((e) => e.id));
  return (
    <>
      <SiteHeader page="check" />
      <CheckApp initial={initial} steamEvents={RELEASE_DATA.steamEvents} calendarUpdated={RELEASE_DATA.updated} />
      <Footer />
    </>
  );
}
