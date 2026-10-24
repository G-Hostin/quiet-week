import QuietWeek from "@/components/QuietWeek";
import { RELEASE_DATA } from "@/lib/data";
import { EXAMPLE_ANALYSES } from "@/lib/examples";

export default function Page() {
  return <QuietWeek examples={EXAMPLE_ANALYSES} calendarUpdated={RELEASE_DATA.updated} steamEvents={RELEASE_DATA.steamEvents} />;
}
