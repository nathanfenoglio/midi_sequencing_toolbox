import { HomeMidiPanel } from "../components/HomeMidiPanel.jsx";
import { TutorialLink } from "../components/TutorialLink.jsx";

export function HomePage() {
  return (
    <div className="app">
      <header className="header">
        <h1>Home — MIDI send</h1>
        <TutorialLink section="home" />
      </header>
      <div className="header2-visual">
        <div className="header2-container">
          <HomeMidiPanel />
        </div>
      </div>
    </div>
  );
}
