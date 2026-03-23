import SummaryCards from "./SummaryCards";
import DailyViewsChart from "./DailyViewsChart";
import WatchTimeChart from "./WatchTimeChart";
import SubscribersChart from "./SubscribersChart";
import AvgDurationChart from "./AvgDurationChart";
import type { SummaryMetrics, DailyPoint } from "@/types/dashboard";

interface Props {
  summary?: SummaryMetrics;
  daily?: DailyPoint[];
}

export default function OverviewTab({ summary, daily }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <SummaryCards data={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyViewsChart data={daily} />
        <WatchTimeChart data={daily} />
        <SubscribersChart data={daily} />
        <AvgDurationChart data={daily} />
      </div>
    </div>
  );
}
