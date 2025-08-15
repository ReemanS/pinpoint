import Map from "./components/Map";
function App() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark font-manrope p-4">
      <h1 className="text-4xl font-bold mb-4">Pinpoint</h1>
      <Map />
    </div>
  );
}

export default App;
