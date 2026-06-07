import { useMemo } from "react";
import { RuleSelector } from "../components/RuleSelector.jsx";
import { GridDisplay } from "../components/GridDisplay.jsx";
import { RuleVisualization } from "../components/RuleVisualization.jsx";
import { Controls } from "../components/Controls.jsx";
import { WolframRowPanel } from "../components/WolframRowPanel.jsx";
import { TutorialLink } from "../components/TutorialLink.jsx";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useToolboxSessions } from "../context/ToolboxSessionsContext.jsx";
import {
  getReverseRule,
  getSwapBlackWhite,
  getReverseSwapBlackWhite,
} from "../lib/cellularAutomata.js";

export function WolframPage() {
  const { isSending } = useMainMidi();
  const { wolfram } = useToolboxSessions();
  const { rule, grid, handleRuleChange, handleStep, handleReset } = wolfram;

  const mirrorRule = useMemo(() => getReverseRule(rule), [rule]);
  const blackWhiteSwappedRule = useMemo(() => getSwapBlackWhite(rule), [rule]);
  const reverseSwapBlackWhiteRule = useMemo(
    () => getReverseSwapBlackWhite(rule),
    [rule]
  );

  return (
    <div className="app">
      <header className="header">
        <h1>1D Cellular Automata Midi Sequencer</h1>
        <RuleSelector value={rule} onChange={handleRuleChange} />
        <RuleVisualization rule={rule} />
        <TutorialLink section="wolfram" />
      </header>
      {/* rule visualization controls */}
      <div className="header2-visual">
        <div className="header2-container">
          <Controls
            onStep={handleStep}
            onReset={handleReset}
            isSending={isSending}
          />
        </div>
      </div>
      
      {/* WolframRowPanel component */}
      <div className="header2-visual">
        <div className="header2-container">
          <WolframRowPanel />
        </div>
      </div>

      {/* display mirror, black/white swapped, reverse black/white swapped rules */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="rule-container">
            <label>mirror rule:</label>
            <p>{mirrorRule}</p>
          </div>
          <div className="rule-container">
            <label>black/white swapped rule:</label>
            <p>{blackWhiteSwappedRule}</p>
          </div>
          <div className="rule-container">
            <label>reverse black/white swapped rule:</label>
            <p>{reverseSwapBlackWhiteRule}</p>
          </div>
        </div>
      </div>

      {/* rule visualization */}
      <main className="main">
        <div className="scroll-inner">
          <GridDisplay grid={grid} />
        </div>
      </main>
    </div>
  );
}
