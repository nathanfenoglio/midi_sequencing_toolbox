import { useCallback, useMemo } from "react";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useMorseSession } from "../context/MorseSessionContext.jsx";
import { detectPresetMode } from "../lib/morsePresets.js";
import { parseTimingFromForm, textToRhythm } from "../lib/morseToRhythm.js";
import {
  formatWithGrouping,
  rhythmStats,
  serializeRhythmForMain,
} from "../lib/wolframRow.js";

export function MorseRhythmPage() {
  const { setMainRhythm } = useMainMidi();
  const session = useMorseSession();

  const syncPresetModeFromForm = useCallback(
    (overrides = {}) => {
      const form = {
        dotDurationInput: session.dotDurationInput,
        dashDurationInput: session.dashDurationInput,
        gapBetweenSymbols: session.gapBetweenSymbols,
        gapBetweenSymbolsDurationInput:
          session.gapBetweenSymbolsDurationInput,
        gapBetweenLetters: session.gapBetweenLetters,
        gapBetweenLettersDurationInput:
          session.gapBetweenLettersDurationInput,
        gapBetweenWords: session.gapBetweenWords,
        gapBetweenWordsDurationInput: session.gapBetweenWordsDurationInput,
        ...overrides,
      };
      const parsed = parseTimingFromForm(form);
      if (parsed.ok) {
        session.setPresetMode(detectPresetMode(parsed.timing));
      } else {
        session.setPresetMode("custom");
      }
    },
    [session]
  );

  const handleYyzPresetChange = useCallback(
    (e) => {
      if (e.target.checked) session.applyYyzPreset();
    },
    [session]
  );

  const handleStandardPresetChange = useCallback(
    (e) => {
      if (e.target.checked) session.applyStandardPreset();
    },
    [session]
  );

  const handleDotDurationChange = useCallback(
    (e) => {
      session.setDotDurationInput(e.target.value);
      syncPresetModeFromForm({ dotDurationInput: e.target.value });
    },
    [session, syncPresetModeFromForm]
  );

  const handleDashDurationChange = useCallback(
    (e) => {
      session.setDashDurationInput(e.target.value);
      syncPresetModeFromForm({ dashDurationInput: e.target.value });
    },
    [session, syncPresetModeFromForm]
  );

  const handleSymbolGapToggle = useCallback(
    (e) => {
      const on = e.target.checked;
      session.setGapBetweenSymbols(on);
      syncPresetModeFromForm({ gapBetweenSymbols: on });
    },
    [session, syncPresetModeFromForm]
  );

  const handleSymbolGapDurationChange = useCallback(
    (e) => {
      session.setGapBetweenSymbolsDurationInput(e.target.value);
      syncPresetModeFromForm({
        gapBetweenSymbolsDurationInput: e.target.value,
      });
    },
    [session, syncPresetModeFromForm]
  );

  const handleLetterGapToggle = useCallback(
    (e) => {
      const on = e.target.checked;
      session.setGapBetweenLetters(on);
      syncPresetModeFromForm({ gapBetweenLetters: on });
    },
    [session, syncPresetModeFromForm]
  );

  const handleLetterGapDurationChange = useCallback(
    (e) => {
      session.setGapBetweenLettersDurationInput(e.target.value);
      syncPresetModeFromForm({
        gapBetweenLettersDurationInput: e.target.value,
      });
    },
    [session, syncPresetModeFromForm]
  );

  const handleWordGapToggle = useCallback(
    (e) => {
      const on = e.target.checked;
      session.setGapBetweenWords(on);
      syncPresetModeFromForm({ gapBetweenWords: on });
    },
    [session, syncPresetModeFromForm]
  );

  const handleWordGapDurationChange = useCallback(
    (e) => {
      session.setGapBetweenWordsDurationInput(e.target.value);
      syncPresetModeFromForm({
        gapBetweenWordsDurationInput: e.target.value,
      });
    },
    [session, syncPresetModeFromForm]
  );

  const grouping = parseInt(session.groupingInput, 10);
  const hasGrouping = !isNaN(grouping) && grouping >= 1;

  const displayRhythm = useMemo(() => {
    if (!session.hasGeneratedRhythm || session.rhythmRow.length === 0) {
      return "";
    }
    return formatWithGrouping(
      session.rhythmRow,
      hasGrouping ? grouping : 0
    );
  }, [session.hasGeneratedRhythm, session.rhythmRow, hasGrouping, grouping]);

  const { hitCount, duration } = useMemo(() => {
    if (!session.hasGeneratedRhythm || session.rhythmRow.length === 0) {
      return { hitCount: null, duration: null };
    }
    return rhythmStats(session.rhythmRow);
  }, [session.hasGeneratedRhythm, session.rhythmRow]);

  const handleGroupingBlur = useCallback(() => {
    if (session.groupingInput === "") return;
    const v = parseInt(session.groupingInput, 10);
    if (isNaN(v) || v < 1) session.setGroupingInput("");
  }, [session]);

  const handleGenerate = useCallback(() => {
    const form = {
      dotDurationInput: session.dotDurationInput,
      dashDurationInput: session.dashDurationInput,
      gapBetweenSymbols: session.gapBetweenSymbols,
      gapBetweenSymbolsDurationInput: session.gapBetweenSymbolsDurationInput,
      gapBetweenLetters: session.gapBetweenLetters,
      gapBetweenLettersDurationInput: session.gapBetweenLettersDurationInput,
      gapBetweenWords: session.gapBetweenWords,
      gapBetweenWordsDurationInput: session.gapBetweenWordsDurationInput,
    };

    const parsed = parseTimingFromForm(form);
    if (!parsed.ok) {
      session.setGenerateError(parsed.error);
      return;
    }

    const trimmed = session.textInput.trim();
    if (!trimmed) {
      session.setGenerateError("Enter text to encode.");
      session.setMorsePreview("");
      session.setRhythmRow([]);
      session.setRhythmString("");
      session.setHasGeneratedRhythm(false);
      return;
    }

    const result = textToRhythm(trimmed, parsed.timing);
    if (!result.hasContent) {
      session.setGenerateError(
        "No encodable characters (unknown characters are skipped)."
      );
      session.setMorsePreview("");
      session.setRhythmRow([]);
      session.setRhythmString("");
      session.setHasGeneratedRhythm(false);
      return;
    }

    session.setGenerateError("");
    session.setMorsePreview(result.morsePreview);
    session.setRhythmRow(result.rhythm);
    session.setRhythmString(serializeRhythmForMain(result.rhythm));
    session.setHasGeneratedRhythm(true);
    session.setPresetMode(detectPresetMode(parsed.timing));
  }, [session]);

  const handleSendRhythmToMain = useCallback(() => {
    if (!session.hasGeneratedRhythm || !session.rhythmString) return;
    setMainRhythm(session.rhythmString);
  }, [session.hasGeneratedRhythm, session.rhythmString, setMainRhythm]);

  return (
    <div className="app morse-rhythm-page">
      <header className="header">
        <h1>Morse Code Rhythm Generator</h1>
      </header>

      <div className="header2-visual">
        <div className="header2-container">
          <div className="morse-preset-row field-row">
            <label className="morse-preset-label">
              <input
                type="checkbox"
                checked={session.presetMode === "yyz"}
                onChange={handleYyzPresetChange}
              />
              YYZ morse code
            </label>
            <label className="morse-preset-label">
              <input
                type="checkbox"
                checked={session.presetMode === "standard"}
                onChange={handleStandardPresetChange}
              />
              Standard morse code
            </label>
          </div>

          <div className="field-row">
            <label className="field-label" htmlFor="dot-duration">
              Dot duration
              <input
                id="dot-duration"
                type="number"
                min={1}
                className="graph-num-input"
                value={session.dotDurationInput}
                onChange={handleDotDurationChange}
              />
            </label>
            <label className="field-label" htmlFor="dash-duration">
              Dash duration
              <input
                id="dash-duration"
                type="number"
                min={1}
                className="graph-num-input"
                value={session.dashDurationInput}
                onChange={handleDashDurationChange}
              />
            </label>
          </div>

          <div className="morse-gap-row">
            <label className="morse-gap-label">
              <input
                type="checkbox"
                checked={session.gapBetweenSymbols}
                onChange={handleSymbolGapToggle}
              />
              Inter dot/dash gap
            </label>
            <input
              type="number"
              min={0}
              className="graph-num-input morse-gap-duration"
              disabled={!session.gapBetweenSymbols}
              value={session.gapBetweenSymbolsDurationInput}
              onChange={handleSymbolGapDurationChange}
              aria-label="Inter dot/dash gap duration"
            />
          </div>

          <div className="morse-gap-row">
            <label className="morse-gap-label">
              <input
                type="checkbox"
                checked={session.gapBetweenLetters}
                onChange={handleLetterGapToggle}
              />
              Inter letter gap
            </label>
            <input
              type="number"
              min={0}
              className="graph-num-input morse-gap-duration"
              disabled={!session.gapBetweenLetters}
              value={session.gapBetweenLettersDurationInput}
              onChange={handleLetterGapDurationChange}
              aria-label="Inter letter gap duration"
            />
          </div>

          <div className="morse-gap-row">
            <label className="morse-gap-label">
              <input
                type="checkbox"
                checked={session.gapBetweenWords}
                onChange={handleWordGapToggle}
              />
              Inter word gap
            </label>
            <input
              type="number"
              min={0}
              className="graph-num-input morse-gap-duration"
              disabled={!session.gapBetweenWords}
              value={session.gapBetweenWordsDurationInput}
              onChange={handleWordGapDurationChange}
              aria-label="Inter word gap duration"
            />
          </div>

          <label className="field-label block" htmlFor="morse-text-input">
            Text to encode
            <textarea
              id="morse-text-input"
              className="output-textarea mono morse-text-input"
              rows={3}
              value={session.textInput}
              onChange={(e) => session.setTextInput(e.target.value)}
              spellCheck={false}
            />
          </label>

          <div className="graph-action-buttons">
            <button
              type="button"
              className="controls primary-send"
              onClick={handleGenerate}
            >
              Generate rhythm
            </button>
            <button
              type="button"
              className="controls"
              onClick={handleSendRhythmToMain}
              disabled={!session.hasGeneratedRhythm}
            >
              Send rhythm to main
            </button>
          </div>

          {session.generateError ? (
            <p className="warn-text" role="alert">
              {session.generateError}
            </p>
          ) : null}

          <label className="output-label" htmlFor="morse-preview">
            Morse translation
          </label>
          <div id="morse-preview" className="morse-readout">
            {session.morsePreview ? (
              <code className="path-lines-code">{session.morsePreview}</code>
            ) : null}
          </div>

          <div className="morse-rhythm-output-row">
            <label className="output-label" htmlFor="morse-rhythm-out">
              Rhythm (0/1)
            </label>
            <div className="morse-group-control">
              <label htmlFor="morse-grouping-input">Group:</label>
              <input
                id="morse-grouping-input"
                type="number"
                min={1}
                placeholder="—"
                className="graph-num-input"
                value={session.groupingInput}
                onChange={(e) => session.setGroupingInput(e.target.value)}
                onBlur={handleGroupingBlur}
              />
            </div>
            <div className="morse-rhythm-stats" aria-live="polite">
              <label className="row-meta-label"># hits</label>
              <span className="row-meta-value">
                {hitCount !== null ? hitCount : "—"}
              </span>
              <label className="row-meta-label">duration</label>
              <span className="row-meta-value">
                {duration !== null ? duration : "—"}
              </span>
            </div>
          </div>
          <div id="morse-rhythm-out" className="morse-readout morse-rhythm-display">
            {displayRhythm ? (
              <code className="path-lines-code">{displayRhythm}</code>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
