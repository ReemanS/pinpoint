import Map from "@/components/Map";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark">
      <ThemeToggle />
      <Map />
    </div>
  );
}
