import RetentionCurves from "./RetentionCurves";
import RelativeRetention from "./RelativeRetention";

interface Props {
  retentionData?: Record<string, string | number | null>[];
  relativeData?: Record<string, string | number | null>[];
  videoMeta?: { title: string; color: string }[];
}

export default function RetentionTab({ retentionData, relativeData, videoMeta }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <RetentionCurves data={retentionData} videoMeta={videoMeta} />
      <RelativeRetention data={relativeData} videoMeta={videoMeta} />
    </div>
  );
}
