import AudienceDonut from "./AudienceDonut";
import SubscriberVsNonChart from "./SubscriberVsNonChart";
import { audienceData as mockAudience } from "@/data/mock";
import type { AudienceData } from "@/types/dashboard";

export default function AudienceTab({ data }: { data?: AudienceData }) {
  const audience = data ?? mockAudience;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AudienceDonut title="Country" data={audience.countries} />
        <AudienceDonut title="Device Type" data={audience.devices} />
        <AudienceDonut title="Operating System" data={audience.operatingSystems} />
      </div>
      <SubscriberVsNonChart data={audience} />
    </div>
  );
}
