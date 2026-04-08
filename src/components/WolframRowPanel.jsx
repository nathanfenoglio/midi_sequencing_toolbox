import { useEffect, useMemo, useRef, useCallback } from "react";
import { getRowAt } from "../lib/cellularAutomata";
import { SCALES } from "../lib/scales";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useToolboxSessions } from "../context/ToolboxSessionsContext.jsx";
import {
  buildEffectiveRowFromCA,
  formatWithGrouping,
  rotateRowByStartIndex,
  serializeRhythmForMain,
} from "../lib/wolframRow.js";
import {
  DEFAULT_NOTES_STRING,
  lcm,
  parseNotesInput,
} from "../lib/midiParse.js";

export function WolframRowPanel() {
  const { setMainRhythm, setMainNotes } = useMainMidi();
  const { wolfram, wolframRow } = useToolboxSessions();
  const { rule, grid } = wolfram;
  const {
    rowIndexInput,
    setRowIndexInput,
    groupingInput,
    setGroupingInput,
    removeFromLeftInput,
    setRemoveFromLeftInput,
    removeFromRightInput,
    setRemoveFromRightInput,
    startIndexInput,
    setStartIndexInput,
    notesInput,
    setNotesInput,
    scaleSelection,
    setScaleSelection,
  } = wolframRow;

  const rowIndex = parseInt(rowIndexInput, 10);
  const isValidRow = !isNaN(rowIndex) && rowIndex >= 0;
  const grouping = parseInt(groupingInput, 10);
  const hasGrouping = !isNaN(grouping) && grouping >= 1;

  const displayRef = useRef(null);

  const { displayRow0s1s, rowLength, hitCount } = useMemo(() => {
    if (!isValidRow) {
      return { displayRow0s1s: "—", rowLength: 0, hitCount: 0 };
    }
    let row =
      rowIndex < grid.length ? grid[rowIndex] : getRowAt(rule, rowIndex);

    const trimLeft = Math.max(0, parseInt(removeFromLeftInput, 10) || 0);
    const trimRight = Math.max(0, parseInt(removeFromRightInput, 10) || 0);
    row = row.slice(trimLeft, trimRight > 0 ? -trimRight : undefined);

    const startIndex = parseInt(startIndexInput, 10) || 0;
    row = rotateRowByStartIndex(row, startIndex);

    return {
      displayRow0s1s: formatWithGrouping(row, hasGrouping ? grouping : 0),
      rowLength: row.length,
      hitCount: row.filter((c) => c === 1).length,
    };
  }, [
    rule,
    grid,
    rowIndex,
    isValidRow,
    hasGrouping,
    grouping,
    removeFromLeftInput,
    removeFromRightInput,
    startIndexInput,
  ]);

  const handleRowBlur = () => {
    if (rowIndexInput === "") {
      setRowIndexInput("0");
      return;
    }
    const v = parseInt(rowIndexInput, 10);
    if (isNaN(v) || v < 0) setRowIndexInput("0");
  };

  const handleGroupingBlur = () => {
    if (groupingInput === "") return;
    const v = parseInt(groupingInput, 10);
    if (isNaN(v) || v < 1) setGroupingInput("");
  };

  const handleRemoveFromLeftBlur = () => {
    if (removeFromLeftInput === "") {
      setRemoveFromLeftInput("0");
      return;
    }
    const v = parseInt(removeFromLeftInput, 10);
    if (isNaN(v) || v < 0) setRemoveFromLeftInput("0");
  };

  const handleRemoveFromRightBlur = () => {
    if (removeFromRightInput === "") {
      setRemoveFromRightInput("0");
      return;
    }
    const v = parseInt(removeFromRightInput, 10);
    if (isNaN(v) || v < 0) setRemoveFromRightInput("0");
  };

  const handleStartIndexBlur = () => {
    if (startIndexInput === "") {
      setStartIndexInput("0");
      return;
    }
    const v = parseInt(startIndexInput, 10);
    if (isNaN(v)) setStartIndexInput("0");
  };

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      e.stopPropagation();
      const sel = window.getSelection();
      const range = document.createRange();
      if (displayRef.current) {
        range.selectNodeContents(displayRef.current);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []);

  useEffect(() => {
    setStartIndexInput("0");
  }, [rule, rowIndexInput, setStartIndexInput]);

  const handleScaleSelect = (e) => {
    const scaleName = e.target.value;
    setScaleSelection(scaleName);
    if (scaleName && SCALES[scaleName]) {
      setNotesInput(SCALES[scaleName].join(", "));
    }
  };

  const handleTransposeDown = () => {
    const notes = parseNotesInput(notesInput);
    if (notes.length === 0) return;
    if (Math.min(...notes) === 0) return;
    setNotesInput(notes.map((n) => n - 1).join(", "));
  };

  const handleTransposeUp = () => {
    const notes = parseNotesInput(notesInput);
    if (notes.length === 0) return;
    if (Math.max(...notes) === 127) return;
    setNotesInput(notes.map((n) => n + 1).join(", "));
  };

  const handleNotesBlur = () => {
    const trimmed = notesInput.trim();
    if (trimmed === "") {
      setNotesInput(DEFAULT_NOTES_STRING);
      setScaleSelection("");
      return;
    }
    const valid = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 127);
    if (valid.length === 0) {
      setNotesInput(DEFAULT_NOTES_STRING);
    }
  };

  const handleRandomizeNotes = () => {
    const notes = parseNotesInput(notesInput);
    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    setNotesInput(notes.join(", "));
  };

  const sendRhythmToMain = () => {
    if (!isValidRow) return;
    const row = buildEffectiveRowFromCA({
      rule,
      grid,
      rowIndex,
      removeLeftInput: removeFromLeftInput,
      removeRightInput: removeFromRightInput,
      startIndexInput,
    });
    if (row.length === 0) return;
    setMainRhythm(serializeRhythmForMain(row));
  };

  const sendNotesToMain = () => {
    setMainNotes(notesInput.trim() || DEFAULT_NOTES_STRING);
  };

  return (
    <div className="row-viewer">
      <label htmlFor="wf-row-input">Row:</label>
      <input
        id="wf-row-input"
        type="number"
        min={0}
        value={rowIndexInput}
        onChange={(e) => setRowIndexInput(e.target.value)}
        onBlur={handleRowBlur}
      />
      <label htmlFor="wf-grouping-input">Group:</label>
      <input
        id="wf-grouping-input"
        type="number"
        min={1}
        placeholder="—"
        value={groupingInput}
        onChange={(e) => setGroupingInput(e.target.value)}
        onBlur={handleGroupingBlur}
      />
      <div
        ref={displayRef}
        className="row-display"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {displayRow0s1s}
      </div>

      <div className="start-index-controls">
        <label htmlFor="wf-start-index-input">start index</label>
        <input
          id="wf-start-index-input"
          type="number"
          value={startIndexInput}
          onChange={(e) => setStartIndexInput(e.target.value)}
          onBlur={handleStartIndexBlur}
        />
      </div>

      <div className="row-length-controls">
        <label className="row-length-label"># row cells</label>
        <span className="row-length-value">
          {isValidRow ? rowLength : "—"}
        </span>
        <div className="remove-from-left-right-controls">
          <label htmlFor="wf-remove-left-input">remove from left</label>
          <input
            id="wf-remove-left-input"
            type="number"
            min={0}
            value={removeFromLeftInput}
            onChange={(e) => setRemoveFromLeftInput(e.target.value)}
            onBlur={handleRemoveFromLeftBlur}
          />
          <label htmlFor="wf-remove-right-input">remove from right</label>
          <input
            id="wf-remove-right-input"
            type="number"
            min={0}
            value={removeFromRightInput}
            onChange={(e) => setRemoveFromRightInput(e.target.value)}
            onBlur={handleRemoveFromRightBlur}
          />
        </div>
      </div>

      <div className="midi-controls">
        <div className="midi-row-scale-select">
          <label htmlFor="wf-scale-select">Scale:</label>
          <select
            id="wf-scale-select"
            className="scale-select"
            value={scaleSelection}
            onChange={handleScaleSelect}
          >
            <option value="">Select a scale...</option>
            {Object.keys(SCALES)
              .sort()
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>
        <div className="midi-row-notes-tempo">
          <label htmlFor="wf-notes-input">MIDI notes:</label>
          <input
            id="wf-notes-input"
            type="text"
            className="notes-input"
            placeholder={DEFAULT_NOTES_STRING}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            onBlur={handleNotesBlur}
          />
          <div className="midi-transpose-controls">
            <label>transpose:</label>
            <button
              type="button"
              className="transpose-btn transpose-down-btn"
              onClick={handleTransposeDown}
              aria-label="Transpose down"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 11L3 6h10l-5 5z" />
              </svg>
            </button>
            <button
              type="button"
              className="transpose-btn transpose-up-btn"
              onClick={handleTransposeUp}
              aria-label="Transpose up"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5l5 5H3l5-5z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="randomize-and-cycle-data">
          {(() => {
            const notesCount = parseNotesInput(notesInput).length;
            const lcmVal = lcm(hitCount, notesCount);
            const repeatsAfter =
              isValidRow && hitCount > 0 ? lcmVal / hitCount : null;
            return (
              <>
                <button
                  type="button"
                  className="randomize-notes-button"
                  onClick={handleRandomizeNotes}
                >
                  randomize notes order
                </button>
                <label className="row-meta-label"># hits</label>
                <span className="row-meta-value">
                  {isValidRow ? hitCount : "—"}
                </span>
                <label className="row-meta-label"># notes in seq</label>
                <span className="row-meta-value">{notesCount}</span>
                <label className="row-meta-label">repeats after</label>
                <span className="row-meta-value">
                  {repeatsAfter != null ? repeatsAfter : "—"}
                </span>
              </>
            );
          })()}
        </div>
        <div className="send-to-main-row">
          <button
            type="button"
            className="send-to-main-button"
            onClick={sendRhythmToMain}
            disabled={!isValidRow}
          >
            Send rhythm to main
          </button>
          <button
            type="button"
            className="send-to-main-button"
            onClick={sendNotesToMain}
          >
            Send notes to main
          </button>
        </div>
      </div>
    </div>
  );
}
