import Map from "@/components/Map";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background data-dark:bg-background-dark text-text data-dark:text-text-dark p-4">
      <ThemeToggle />
      <h1 className="text-4xl font-bold mb-4">Pinpoint</h1>
      <Map />
    </div>
  );
}
