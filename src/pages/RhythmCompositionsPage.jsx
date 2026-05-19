import { useCallback, useMemo } from "react";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useToolboxSessions } from "../context/ToolboxSessionsContext.jsx";
import {
  compositionToBinaryPattern,
  formatCompositionLine,
  getRhythmCompositions,
  MAX_RHYTHM_SPACE,
  parsePositiveIntInput,
  parseRhythmSpaceInput,
} from "../lib/rhythmCompositions.js";
import {
  appendRhythmForMain,
  serializeRhythmForMain,
} from "../lib/wolframRow.js";

export function RhythmCompositionsPage() {
  const { mainRhythm, setMainRhythm } = useMainMidi();
  const { rhythmCompositionsPage: rc } = useToolboxSessions();
  const {
    rhythmSpaceInput,
    setRhythmSpaceInput,
    rhythmNumNotesInput,
    setRhythmNumNotesInput,
    rhythmCompositions,
    setRhythmCompositions,
    rhythmSelectedIndex,
    setRhythmSelectedIndex,
    rhythmGenerateError,
    setRhythmGenerateError,
  } = rc;

  const selectedRhythmLine = useMemo(() => {
    if (
      rhythmSelectedIndex === null ||
      rhythmSelectedIndex < 0 ||
      rhythmSelectedIndex >= rhythmCompositions.length
    ) {
      return "";
    }
    return formatCompositionLine(rhythmCompositions[rhythmSelectedIndex]);
  }, [rhythmCompositions, rhythmSelectedIndex]);

  const getSelectedPattern = useCallback(() => {
    if (
      rhythmSelectedIndex === null ||
      rhythmSelectedIndex < 0 ||
      rhythmSelectedIndex >= rhythmCompositions.length
    ) {
      return null;
    }
    return compositionToBinaryPattern(
      rhythmCompositions[rhythmSelectedIndex]
    );
  }, [rhythmCompositions, rhythmSelectedIndex]);

  const noRhythmSelection =
    rhythmSelectedIndex === null || rhythmCompositions.length === 0;

  const handleGenerate = useCallback(() => {
    const space = parseRhythmSpaceInput(rhythmSpaceInput);
    const notes = parsePositiveIntInput(rhythmNumNotesInput);

    if (space === null) {
      setRhythmGenerateError(
        `Rhythm space must be a positive integer from 1 to ${MAX_RHYTHM_SPACE}.`
      );
      return;
    }
    if (notes === null) {
      setRhythmGenerateError("# of notes must be a positive integer.");
      return;
    }
    if (notes > space) {
      setRhythmGenerateError(
        "# of notes cannot be greater than rhythm space."
      );
      return;
    }

    setRhythmGenerateError("");
    const comps = getRhythmCompositions(space, notes);
    setRhythmCompositions(comps);
    setRhythmSelectedIndex(null);
    if (comps.length === 0) {
      setRhythmGenerateError("No compositions for these values.");
    }
  }, [
    rhythmSpaceInput,
    rhythmNumNotesInput,
    setRhythmCompositions,
    setRhythmGenerateError,
    setRhythmSelectedIndex,
  ]);

  const handleSelectRandom = useCallback(() => {
    if (rhythmCompositions.length === 0) return;
    setRhythmSelectedIndex(
      Math.floor(Math.random() * rhythmCompositions.length)
    );
  }, [rhythmCompositions.length, setRhythmSelectedIndex]);

  const handleReplaceRhythmInMain = useCallback(() => {
    const pattern = getSelectedPattern();
    if (!pattern) return;
    setRhythmGenerateError("");
    setMainRhythm(serializeRhythmForMain(pattern));
  }, [getSelectedPattern, setMainRhythm, setRhythmGenerateError]);

  const handleAddRhythmToMain = useCallback(() => {
    const pattern = getSelectedPattern();
    if (!pattern) return;
    const result = appendRhythmForMain(mainRhythm, pattern);
    if (!result.ok) {
      setRhythmGenerateError(
        "Home rhythm must be valid 0/1 comma-separated values before appending."
      );
      return;
    }
    setRhythmGenerateError("");
    setMainRhythm(result.value);
  }, [
    getSelectedPattern,
    mainRhythm,
    setMainRhythm,
    setRhythmGenerateError,
  ]);

  const selectComposition = useCallback(
    (index) => {
      setRhythmSelectedIndex(index);
    },
    [setRhythmSelectedIndex]
  );

  return (
    <div className="app rhythm-compositions-page">
      <header className="header">
        <h1>Rhythm Compositions</h1>
      </header>

      <div className="header2-visual">
        <div className="header2-container">
          <div className="field-row">
            <label className="field-label" htmlFor="rhythm-space-input">
              rhythm space
              <input
                id="rhythm-space-input"
                type="number"
                min={1}
                max={MAX_RHYTHM_SPACE}
                title={`Positive integer from 1 to ${MAX_RHYTHM_SPACE}`}
                className="graph-num-input"
                value={rhythmSpaceInput}
                onChange={(e) => setRhythmSpaceInput(e.target.value)}
              />
            </label>
            <label className="field-label" htmlFor="rhythm-num-notes-input">
              # of notes
              <input
                id="rhythm-num-notes-input"
                type="number"
                min={1}
                className="graph-num-input"
                value={rhythmNumNotesInput}
                onChange={(e) => setRhythmNumNotesInput(e.target.value)}
              />
            </label>
          </div>

          <div className="graph-action-buttons">
            <button
              type="button"
              className="controls primary-send"
              onClick={handleGenerate}
            >
              Generate Rhythms
            </button>
            <button
              type="button"
              className="controls"
              onClick={handleSelectRandom}
              disabled={rhythmCompositions.length === 0}
            >
              Select Random
            </button>
            <button
              type="button"
              className="controls"
              onClick={handleReplaceRhythmInMain}
              disabled={noRhythmSelection}
            >
              Replace rhythm in main
            </button>
            <button
              type="button"
              className="controls"
              onClick={handleAddRhythmToMain}
              disabled={noRhythmSelection}
            >
              Add to rhythm in main
            </button>
          </div>

          {rhythmGenerateError ? (
            <p className="warn-text" role="alert">
              {rhythmGenerateError}
            </p>
          ) : null}

          <div className="rhythm-displays-stack">
          <div className="rhythm-side-label-row">
            <div
              id="rhythm-selected-display"
              className="rhythm-selected-display"
              role="status"
              aria-live="polite"
              aria-label="Selected rhythm"
            >
              {selectedRhythmLine ? (
                <code className="path-lines-code">{selectedRhythmLine}</code>
              ) : null}
            </div>
            <label
              className="rhythm-side-label"
              htmlFor="rhythm-selected-display"
            >
              selected rhythm
            </label>
          </div>

          <div className="rhythm-side-label-row rhythm-compositions-row">
            <div
              id="rhythm-compositions-list"
              className="path-lines-scroll"
              aria-label="All rhythm compositions"
            >
              {rhythmCompositions.length === 0 ? (
                <p className="path-lines-empty">Generate to fill.</p>
              ) : (
                <ul
                  className="path-lines-list rhythm-comp-list"
                  aria-label="Rhythm compositions"
                >
                  {rhythmCompositions.map((composition, index) => (
                    <li
                      key={index}
                      className={`path-lines-item rhythm-comp-item${
                        rhythmSelectedIndex === index
                          ? " rhythm-comp-item-selected"
                          : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectComposition(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectComposition(index);
                        }
                      }}
                      aria-pressed={rhythmSelectedIndex === index}
                      aria-label={`Composition ${index + 1} of ${rhythmCompositions.length}`}
                    >
                      <code className="path-lines-code">
                        {formatCompositionLine(composition)}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="rhythm-side-label stat-text" id="rhythm-compositions-label">
              Compositions: {rhythmCompositions.length}
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
