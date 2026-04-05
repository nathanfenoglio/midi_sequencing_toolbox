import { HomeMidiPanel } from "../components/HomeMidiPanel.jsx";

export function HomePage() {
  return (
    <div className="app">
      <header className="header">
        <h1>Home — MIDI send</h1>
      </header>
      <div className="header2-visual">
        <div className="header2-container">
          <HomeMidiPanel />
        </div>
      </div>
    </div>
  );
}
