import { useState, useCallback, useEffect } from "react";
import { RuleSelector } from "../components/RuleSelector.jsx";
import { GridDisplay } from "../components/GridDisplay.jsx";
import { RuleVisualization } from "../components/RuleVisualization.jsx";
import { Controls } from "../components/Controls.jsx";
import { WolframRowPanel } from "../components/WolframRowPanel.jsx";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import {
  applyRule,
  createInitialGrid,
  getReverseRule,
  getSwapBlackWhite,
  getReverseSwapBlackWhite,
} from "../lib/cellularAutomata.js";

export function WolframPage() {
  const { isSending } = useMainMidi();
  const initialRule = 30;
  const [rule, setRule] = useState(initialRule);
  const [grid, setGrid] = useState(() => createInitialGrid());
  const [mirrorRule, setMirrorRule] = useState();
  const [blackWhiteSwappedRule, setBlackWhiteSwappedRule] = useState();
  const [reverseSwapBlackWhiteRule, setReverseSwapBlackWhiteRule] = useState();

  const handleRuleChange = useCallback((newRule) => {
    setRule(newRule);
    setGrid(createInitialGrid());
    setMirrorRule(getReverseRule(newRule));
    setBlackWhiteSwappedRule(getSwapBlackWhite(newRule));
    setReverseSwapBlackWhiteRule(getReverseSwapBlackWhite(newRule));
  }, []);

  const handleStep = useCallback(() => {
    setGrid((prev) => applyRule(prev, rule));
  }, [rule]);

  const handleReset = useCallback(() => {
    setGrid(createInitialGrid());
  }, []);

  useEffect(() => {
    handleRuleChange(initialRule);
  }, [handleRuleChange]);

  return (
    <div className="app">
      <header className="header">
        <h1>1D Cellular Automata Midi Sequencer</h1>
        <RuleSelector value={rule} onChange={handleRuleChange} />
        <RuleVisualization rule={rule} />
      </header>
      <div className="header2-visual">
        <div className="header2-container">
          <Controls
            onStep={handleStep}
            onReset={handleReset}
            isSending={isSending}
          />
        </div>
      </div>

      <div className="header2-visual">
        <div className="header2-container">
          <WolframRowPanel rule={rule} grid={grid} />
        </div>
      </div>

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

      <main className="main">
        <div className="scroll-inner">
          <GridDisplay grid={grid} />
        </div>
      </main>
    </div>
  );
}
