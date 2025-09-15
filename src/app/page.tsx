import MapContainer from "@/components/MapContainer";
import ThemeToggle from "@/components/ThemeToggle";
import { getGeoResponseAction } from "./actions";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark">
      <ThemeToggle />
      <MapContainer getGeoResponseAction={getGeoResponseAction} />
    </div>
  );
}
