import TrafficDonut from "./TrafficDonut";
import TrafficTable from "./TrafficTable";
import type { TrafficSource } from "@/types/dashboard";

interface Props {
  sources?: TrafficSource[];
}

export default function TrafficSourcesTab({ sources }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficDonut data={sources} />
        <TrafficTable data={sources} />
      </div>
    </div>
  );
}
