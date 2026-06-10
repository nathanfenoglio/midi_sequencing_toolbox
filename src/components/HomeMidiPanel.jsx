import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WebMidi } from "webmidi";
import { SCALES } from "../lib/scales";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import {
  applyTrimAndRotate,
  formatWithGrouping,
  parseRhythmInput,
} from "../lib/wolframRow.js";
import {
  DEFAULT_NOTES_STRING,
  lcm,
  parseNotesInput,
} from "../lib/midiParse.js";

const SCHEDULER_LOOK_AHEAD_SEC = 0.1;
const SCHEDULER_TICK_MS = 25;

const NOTE_DIVISION_MAP = {
  "1/16": 4,
  "1/8": 2,
  "1/4": 1,
};

export function HomeMidiPanel() {
  const {
    mainNotes,
    setMainNotes,
    mainRhythm,
    setMainRhythm,
    isSending,
    setIsSending,
    registerMidiStop,
    unregisterMidiStop,
    groupingInput,
    setGroupingInput,
    removeFromLeftInput,
    setRemoveFromLeftInput,
    removeFromRightInput,
    setRemoveFromRightInput,
    startIndexInput,
    setStartIndexInput,
    scaleSelection,
    setScaleSelection,
    tempoInput,
    setTempoInput,
    noteDivision,
    setNoteDivision,
  } = useMainMidi();

  const grouping = parseInt(groupingInput, 10);
  const hasGrouping = !isNaN(grouping) && grouping >= 1;

  const [outputIndex, setOutputIndex] = useState(0);
  const [outputs, setOutputs] = useState([]);
  const [webMidiEnabled, setWebMidiEnabled] = useState(false);

  const displayRef = useRef(null);
  const audioContextRef = useRef(null);
  const schedulerTimeoutRef = useRef(null);
  const schedulerRef = useRef(null);

  const mainNotesRef = useRef(mainNotes);
  const outputIndexRef = useRef(outputIndex);
  mainNotesRef.current = mainNotes;
  outputIndexRef.current = outputIndex;

  function getAudioContext() {
    const ac = audioContextRef.current;
    if (!ac || ac.state === "closed") {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }

  function runScheduler() {
    const s = schedulerRef.current;
    if (!s || !s.isRunning) return;

    const ctx = getAudioContext();
    const nowSec = ctx.currentTime;
    const horizonSec = nowSec + SCHEDULER_LOOK_AHEAD_SEC;

    while (s.nextStepTime < horizonSec) {
      const stepTime = s.nextStepTime;
      const { row, notes, stepMs, output, rowStepIndex, noteIndex } = s;

      if (row[rowStepIndex] === 1) {
        const note = notes[noteIndex % notes.length];
        const delayMs = Math.max(0, (stepTime - nowSec) * 1000);
        try {
          output.playNote(note, {
            duration: stepMs,
            time: `+${Math.round(delayMs)}`,
          });
        } catch (e) {
          console.error("playNote failed:", e);
        }
        s.noteIndex = (noteIndex + 1) % notes.length;
      }

      s.rowStepIndex = (rowStepIndex + 1) % row.length;
      s.nextStepTime += stepMs / 1000;
    }

    if (s.isRunning) {
      schedulerTimeoutRef.current = setTimeout(runScheduler, SCHEDULER_TICK_MS);
    }
  }

  const { displayRow0s1s, rowLength, hitCount, rhythmValid } = useMemo(() => {
    const parsed = parseRhythmInput(mainRhythm);
    if (!parsed.ok) {
      return {
        displayRow0s1s: "—",
        rowLength: 0,
        hitCount: 0,
        rhythmValid: false,
      };
    }
    const row = applyTrimAndRotate(
      parsed.row,
      removeFromLeftInput,
      removeFromRightInput,
      startIndexInput
    );
    if (row.length === 0) {
      return {
        displayRow0s1s: "—",
        rowLength: 0,
        hitCount: 0,
        rhythmValid: false,
      };
    }
    return {
      displayRow0s1s: formatWithGrouping(row, hasGrouping ? grouping : 0),
      rowLength: row.length,
      hitCount: row.filter((c) => c === 1).length,
      rhythmValid: true,
    };
  }, [
    mainRhythm,
    hasGrouping,
    grouping,
    removeFromLeftInput,
    removeFromRightInput,
    startIndexInput,
  ]);

  const handleGroupingBlur = () => {
    if (groupingInput === "") return;
    const v = parseInt(groupingInput, 10);
    if (isNaN(v) || v < 1) setGroupingInput("");
  };

  const handleTempoBlur = () => {
    if (tempoInput === "") {
      setTempoInput("120");
      return;
    }
    const v = parseInt(tempoInput, 10);
    if (isNaN(v) || v < 1) setTempoInput("120");
    else if (v > 300) setTempoInput("300");
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

  /** Refs for notes/output keep this callback stable so registerMidiStop does not re-run on every keystroke (avoids closing AudioContext in effect cleanup). */
  const stopPlayback = useCallback(() => {
    if (schedulerRef.current) schedulerRef.current.isRunning = false;
    if (schedulerTimeoutRef.current) {
      clearTimeout(schedulerTimeoutRef.current);
      schedulerTimeoutRef.current = null;
    }
    try {
      const output = WebMidi.outputs[outputIndexRef.current];
      if (output) {
        for (const note of parseNotesInput(mainNotesRef.current)) {
          output.stopNote(note);
        }
      }
    } catch (err) {
      console.error("WebMidi note-off on stop:", err);
    }
    setIsSending(false);
  }, [setIsSending]);

  const handleSendStop = useCallback(async () => {
    if (isSending) {
      stopPlayback();
      return;
    }

    const parsed = parseRhythmInput(mainRhythm);
    if (!parsed.ok) return;
    let row = applyTrimAndRotate(
      parsed.row,
      removeFromLeftInput,
      removeFromRightInput,
      startIndexInput
    );
    if (row.length === 0) return;

    try {
      if (!webMidiEnabled) {
        await WebMidi.enable();
        setWebMidiEnabled(true);
        setOutputs([...WebMidi.outputs]);
      }

      const output = WebMidi.outputs[outputIndex];
      if (!output) {
        console.warn("No MIDI output selected");
        return;
      }

      const notes = parseNotesInput(mainNotes);
      const tempo = Math.max(1, Math.min(300, parseInt(tempoInput, 10) || 120));
      const division = NOTE_DIVISION_MAP[noteDivision] ?? 4;
      const stepMs = 60_000 / (tempo * division);

      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      schedulerRef.current = {
        isRunning: true,
        nextStepTime: ctx.currentTime,
        rowStepIndex: 0,
        noteIndex: 0,
        row,
        notes,
        stepMs,
        output,
      };

      setIsSending(true);
      runScheduler();
    } catch (err) {
      console.error("WebMidi error:", err);
      setIsSending(false);
    }
  }, [
    isSending,
    stopPlayback,
    webMidiEnabled,
    outputIndex,
    mainNotes,
    mainRhythm,
    tempoInput,
    noteDivision,
    removeFromLeftInput,
    removeFromRightInput,
    startIndexInput,
  ]);

  useEffect(() => {
    registerMidiStop(stopPlayback);
    return () => {
      unregisterMidiStop();
      stopPlayback();
    };
  }, [registerMidiStop, unregisterMidiStop, stopPlayback]);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) schedulerRef.current.isRunning = false;
      if (schedulerTimeoutRef.current) {
        clearTimeout(schedulerTimeoutRef.current);
        schedulerTimeoutRef.current = null;
      }
      const ac = audioContextRef.current;
      if (ac && ac.state !== "closed") {
        ac.close();
      }
      audioContextRef.current = null;
    };
  }, []);

  const handleNotesBlur = () => {
    const trimmed = mainNotes.trim();
    if (trimmed === "") {
      setMainNotes(DEFAULT_NOTES_STRING);
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
      setMainNotes(DEFAULT_NOTES_STRING);
    }
  };

  const handleScaleSelect = (e) => {
    const scaleName = e.target.value;
    setScaleSelection(scaleName);
    if (scaleName && SCALES[scaleName]) {
      setMainNotes(SCALES[scaleName].join(", "));
    }
  };

  const handleTransposeDown = () => {
    const notes = parseNotesInput(mainNotes);
    if (notes.length === 0) return;
    if (Math.min(...notes) === 0) return;
    setMainNotes(notes.map((n) => n - 1).join(", "));
  };

  const handleTransposeUp = () => {
    const notes = parseNotesInput(mainNotes);
    if (notes.length === 0) return;
    if (Math.max(...notes) === 127) return;
    setMainNotes(notes.map((n) => n + 1).join(", "));
  };

  const handleRandomizeNotes = () => {
    const notes = parseNotesInput(mainNotes);
    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    setMainNotes(notes.join(", "));
  };

  return (
    <div className="row-viewer home-midi-panel">
      <label htmlFor="main-rhythm-input">Rhythm (0/1, comma-separated)</label>
      <textarea
        id="main-rhythm-input"
        className="rhythm-textarea"
        rows={3}
        value={mainRhythm}
        onChange={(e) => setMainRhythm(e.target.value)}
        spellCheck={false}
        placeholder="e.g. 1, 0, 1, 1"
      />

      <div className="grouping-row">
        <label htmlFor="home-grouping-input">Group:</label>
        <input
          id="home-grouping-input"
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
          <label htmlFor="home-start-index-input">start index</label>
          <input
            id="home-start-index-input"
            type="number"
            value={startIndexInput}
            onChange={(e) => setStartIndexInput(e.target.value)}
            onBlur={handleStartIndexBlur}
          />
        </div>
      </div>

      <div className="row-length-controls">
        <label className="row-length-label"># row cells</label>
        <span className="row-length-value">
          {rhythmValid ? rowLength : "—"}
        </span>
        <div className="remove-from-left-right-controls">
          <label htmlFor="home-remove-left-input">remove from left</label>
          <input
            id="home-remove-left-input"
            type="number"
            min={0}
            value={removeFromLeftInput}
            onChange={(e) => setRemoveFromLeftInput(e.target.value)}
            onBlur={handleRemoveFromLeftBlur}
          />
          <label htmlFor="home-remove-right-input">remove from right</label>
          <input
            id="home-remove-right-input"
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
          <label htmlFor="home-scale-select">Scale:</label>
          <select
            id="home-scale-select"
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
          <label htmlFor="home-notes-input">MIDI notes:</label>
          <input
            id="home-notes-input"
            type="text"
            className="notes-input"
            placeholder={DEFAULT_NOTES_STRING}
            value={mainNotes}
            onChange={(e) => setMainNotes(e.target.value)}
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
          {/* tempo, note division */}
          <div className="tempo-controls">
            <label htmlFor="home-tempo-input">Tempo (BPM):</label>
            <input
              id="home-tempo-input"
              type="number"
              min={1}
              max={300}
              className="tempo-input"
              value={tempoInput}
              onChange={(e) => setTempoInput(e.target.value)}
              onBlur={handleTempoBlur}
            />
            <select
              className="tempo-division-select"
              aria-label="Note value per grid step"
              value={noteDivision}
              onChange={(e) => setNoteDivision(e.target.value)}
            >
              <option value="1/16">1/16</option>
              <option value="1/8">1/8</option>
              <option value="1/4">1/4</option>
            </select>
          </div>
        </div>
        <div className="randomize-and-cycle-data">
          {(() => {
            const notesCount = parseNotesInput(mainNotes).length;
            const lcmVal = lcm(hitCount, notesCount);
            const repeatsAfter =
              rhythmValid && hitCount > 0 ? lcmVal / hitCount : null;
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
                  {rhythmValid ? hitCount : "—"}
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
        <div className="midi-row-output-send">
          <label htmlFor="home-output-select">Output:</label>
          <select
            id="home-output-select"
            className="output-select"
            value={outputIndex}
            onChange={(e) => setOutputIndex(Number(e.target.value))}
            disabled={!webMidiEnabled || outputs.length === 0}
          >
            {outputs.length === 0 ? (
              <option value={0}>
                {webMidiEnabled ? "No outputs" : "Click SEND MIDI first"}
              </option>
            ) : (
              outputs.map((out, i) => (
                <option key={out.id} value={i}>
                  {out.name || out.id || `Output ${i}`}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            className="send-midi-button"
            onClick={handleSendStop}
            disabled={!rhythmValid}
          >
            {isSending ? "STOP" : "SEND MIDI"}
          </button>
        </div>
      </div>
    </div>
  );
}
