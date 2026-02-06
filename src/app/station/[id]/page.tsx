import { StationARScreen } from "@/screens/StationARScreen";
import { stations } from "@/stations/stations";

export function generateStaticParams() {
  return stations.map((s) => ({ id: s.id }));
}

export default function StationPage() {
  return <StationARScreen />;
}
