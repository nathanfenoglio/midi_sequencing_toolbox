import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildGiantArray,
  formatNoteArray,
  translateToScale,
} from "../lib/updownEngine";
import { SCALES } from "../lib/scales";
import { useMainMidi } from "../context/MainMidiContext.jsx";

const DEFAULT_SCALE = "0, 1, 3, 4, 6, 7, 8, 9, 11";

const SCALE_PRESET_KEYS = Object.keys(SCALES).sort((a, b) =>
  a.localeCompare(b)
);

// generate new row id with date etc each time user creates new row
function newRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// return int if valid else null
function parseOptionalInt(str) {
  const t = String(str).trim();
  if (t === "" || t === "+" || t === "-") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

// parse scale input return int array or error message
// skips empty input and just tries to parse the next int
function parseScaleString(s) {
  const parts = String(s).split(",");
  const out = [];
  for (const p of parts) {
    const t = p.trim();
    if (t === "") continue;
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      return {
        error:
          'Each scale value must be a non-negative integer (0 allowed). Use commas between values, e.g. "0, 2, 4, 5, 7, 9, 11".',
      };
    }
    out.push(n);
  }
  if (out.length === 0) {
    return { error: "Enter at least one scale degree." };
  }
  return { scale: out };
}

/** Move v into [low, high] by adding/subtracting 12 until it fits (12-semitone span). */
function foldNoteIntoOctaveSpan(v, low, high) {
  let x = v;
  while (x > high) x -= 12;
  while (x < low) x += 12;
  return x;
}

/**
 * Fold each note into [min, min+11] where min is the minimum of the original list;
 * drop duplicates after folding (first occurrence wins); sort ascending.
 */
function normalizeScaleDegrees(scale) {
  if (scale.length === 0) return [];
  const minNote = Math.min(...scale);
  const low = minNote;
  const high = minNote + 11;
  const seen = new Set();
  const out = [];
  for (const v of scale) {
    const folded = foldNoteIntoOctaveSpan(v, low, high);
    if (!seen.has(folded)) {
      seen.add(folded);
      out.push(folded);
    }
  }
  out.sort((a, b) => a - b);
  return out;
}

/** Canonical comma-separated scale string, or null if parse fails (do not overwrite invalid input). */
function formatSortedScaleString(s) {
  const r = parseScaleString(s);
  if (r.error || !r.scale) return null;
  const normalized = normalizeScaleDegrees(r.scale);
  if (normalized.length === 0) return null;
  return normalized.join(", ");
}

// validate start note input
function parseStartNote(str) {
  const n = parseOptionalInt(str);
  if (n === null) return { error: "Start note must be an integer from 0 to 255." };
  if (n < 0 || n > 255) return { error: "Start note must be between 0 and 255." };
  return { startNote: n };
}

// validate # repeats input
function parseRepeats(str) {
  const n = parseOptionalInt(str);
  if (n === null) return { error: "# repeats must be a positive integer." };
  if (n < 1) return { error: "# repeats must be at least 1." };
  return { repeats: n };
}

function presetKeyMatchingScaleInput(s) {
  const r = parseScaleString(s);
  if (r.error || !r.scale) return "";
  for (const k of SCALE_PRESET_KEYS) {
    const arr = SCALES[k];
    if (arr.length !== r.scale.length) continue;
    if (arr.every((n, i) => n === r.scale[i])) return k;
  }
  return "";
}

/** Parse comma-separated integers from the output textarea content (may include newlines). */
function parseOutputNoteNumbers(text) {
  const parts = String(text).split(",");
  const out = [];
  for (const p of parts) {
    const t = p.trim();
    if (t === "") continue;
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n)) continue;
    out.push(n);
  }
  return out;
}

/**
 * Same validation and translation pipeline as the former Apply handler.
 * @returns {{ ok: true, text: string } | { ok: false, error: string }}
 */
function computeSequenceOutput({ scaleInput, startNoteInput, repeatsInput, rows }) {
  const scaleR = parseScaleString(scaleInput);
  if (scaleR.error) {
    return { ok: false, error: scaleR.error };
  }
  const startR = parseStartNote(startNoteInput);
  if (startR.error) {
    return { ok: false, error: startR.error };
  }
  const repR = parseRepeats(repeatsInput);
  if (repR.error) {
    return { ok: false, error: repR.error };
  }

  const engineRows = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const count = parseOptionalInt(r.countStr);
    const step = parseOptionalInt(r.stepStr);
    const jump = parseOptionalInt(r.jumpStr);
    if (count === null && step === null && jump === null) {
      continue;
    }
    if (count === null || count < 0) {
      return {
        ok: false,
        error: `Row ${i + 1}: "# notes in operation" must be a non-negative integer.`,
      };
    }
    if (step === null) {
      return { ok: false, error: `Row ${i + 1}: "step size" must be an integer.` };
    }
    if (jump === null) {
      return {
        ok: false,
        error: `Row ${i + 1}: "jump size to next operation" must be an integer.`,
      };
    }
    engineRows.push({ numNotes: count, step, jump });
  }

  try {
    const giant = buildGiantArray(engineRows, startR.startNote, repR.repeats);
    const sortedScale = normalizeScaleDegrees(scaleR.scale);
    const root = sortedScale[0];
    const engineScale = sortedScale.map((v) => v - root);
    const translated = translateToScale(giant, startR.startNote, engineScale);
    return { ok: true, text: formatNoteArray(translated) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function UpdownPage() {
  const { setMainNotes } = useMainMidi();
  const [scaleInput, setScaleInput] = useState(DEFAULT_SCALE);
  const [scalePresetKey, setScalePresetKey] = useState("");
  // note that sequence will start on
  const [startNoteInput, setStartNoteInput] = useState("48");
  // # of times to go through all of user's operations before stopping
  const [repeatsInput, setRepeatsInput] = useState("8");
  // however many row operations the user wants to specify
  // initialize with 1 row and blank values
  const [rows, setRows] = useState(() => [
    { id: newRowId(), countStr: "", stepStr: "", jumpStr: "" },
  ]);
  const [output, setOutput] = useState("");
  const [applyError, setApplyError] = useState("");

  const lastRowCountInputRef = useRef(null);
  const prevRowsLengthRef = useRef(null);

  const startParsed = useMemo(() => parseStartNote(startNoteInput), [startNoteInput]);

  useEffect(() => {
    const prev = prevRowsLengthRef.current;
    if (prev !== null && rows.length > prev) {
      lastRowCountInputRef.current?.focus();
    }
    prevRowsLengthRef.current = rows.length;
  }, [rows.length]);

  useEffect(() => {
    setScalePresetKey(presetKeyMatchingScaleInput(scaleInput));
  }, [scaleInput]);

  const handleScalePresetChange = useCallback((e) => {
    const key = e.target.value;
    if (!key) {
      setScalePresetKey("");
      return;
    }
    const raw = SCALES[key].join(", ");
    setScaleInput(formatSortedScaleString(raw) ?? raw);
    setScalePresetKey(key);
  }, []);

  const handleScaleInputBlur = useCallback(() => {
    setScaleInput((current) => {
      const next = formatSortedScaleString(current);
      if (next !== null && next !== current) return next;
      return current;
    });
  }, []);

  // calculate all current notes and ending notes when rows changes or start note changes
  const { currents, endings } = useMemo(() => {
    const currents = [];
    const endings = [];

    const startOk = startParsed.startNote !== undefined ? startParsed.startNote : null;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const count = parseOptionalInt(r.countStr);
      const step = parseOptionalInt(r.stepStr);
      const jump = parseOptionalInt(r.jumpStr);
      const tripleOk =
        count !== null && count >= 0 && step !== null && jump !== null;

      let current = null;
      if (i === 0) {
        current = startOk;
      } 
      else if (endings[i - 1] !== null && endings[i - 1] !== undefined) {
        current = endings[i - 1];
      }
      currents.push(current);

      let ending = null;
      if (current !== null && tripleOk) {
        // the current note + as many times this operation is applied times the step + the jump at the end
        // just jumping ahead and calculating the last step of this row operation to display
        ending = current + (count - 1) * step + jump;
      }
      endings.push(ending);
    }

    return { currents, endings };
  }, [rows, startParsed]);

  // initialize new row for user input
  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: newRowId(), countStr: "", stepStr: "", jumpStr: "" }]);
  }, []);

  // onChange called whenever any of the values in a row are changed by the user 
  const updateRow = useCallback((id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  // remove row when user clicks trash can if more than 1 row
  const removeRow = useCallback((id) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  useEffect(() => {
    const result = computeSequenceOutput({
      scaleInput,
      startNoteInput,
      repeatsInput,
      rows,
    });
    if (result.ok) {
      setApplyError("");
      setOutput(result.text);
    } else {
      setApplyError(result.error);
      setOutput("");
    }
  }, [scaleInput, startNoteInput, repeatsInput, rows]);

  // display - if number is not valid
  const displayNum = (n) => (n === null || n === undefined ? "—" : String(n));

  const { outputMin, outputMax } = useMemo(() => {
    const notes = parseOutputNoteNumbers(output);
    if (notes.length === 0) {
      return { outputMin: null, outputMax: null };
    }
    return {
      outputMin: Math.min(...notes),
      outputMax: Math.max(...notes),
    };
  }, [output]);

  return (
    <div className="app">
      <header className="header">
        <h1>Up Down Midi Sequencer</h1>
      </header>

      {/* scale, start note, # repeats labels and inputs */}
      <div className="header2-visual">
        <div className="header2-container updown-global-fields">
          <div className="scale-preset-row field-row">
            <label htmlFor="scale-preset">scale preset</label>
            <select
              id="scale-preset"
              className="scale-select"
              value={scalePresetKey}
              onChange={handleScalePresetChange}
            >
              <option value="">Select a scale preset…</option>
              {SCALE_PRESET_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          {/* scale */}
          <div className="field-row">
            <label htmlFor="scale-input">scale</label>
            <input
              id="scale-input"
              className="text-input scale-input-wide"
              type="text"
              value={scaleInput}
              onChange={(e) => setScaleInput(e.target.value)}
              onBlur={handleScaleInputBlur}
              title="On blur: each note is moved into a single octave from the list minimum (min through min+11); duplicates after folding are removed; then sorted low to high. Translation uses the smallest remaining value as the scale root."
              placeholder="non-negative integers, comma-separated (0 allowed for first degree)"
              spellCheck={false}
            />
          </div>
          {/* start note */}
          <div className="field-row">
            <label htmlFor="start-note">start note</label>
            <input
              id="start-note"
              className="text-input narrow-num"
              type="number"
              min={0}
              max={255}
              value={startNoteInput}
              onChange={(e) => setStartNoteInput(e.target.value)}
            />
          </div>
          {/* # repeats */}
          <div className="field-row">
            <label htmlFor="repeats"># repeats</label>
            <input
              id="repeats"
              className="text-input narrow-num"
              type="number"
              min={1}
              value={repeatsInput}
              onChange={(e) => setRepeatsInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="header2-visual">
        <div className="header2-container updown-ops-section">
          {/* some instructions */}
          <p className="section-hint">
            Row &quot;current note&quot; chains from start note and each row&apos;s calculated ending
            note. The output sequence updates automatically when scale, start note, repeats, and row
            fields are all valid (fully blank rows are skipped).
          </p>
          <div className="operation-table-wrap">
            <table className="operation-table">
              <thead>
                <tr>
                  <th>current note</th>
                  <th># notes in operation</th>
                  <th>step size</th>
                  <th>jump size to next operation</th>
                  <th>ending note</th>
                  <th className="col-remove">
                    <span className="sr-only">Remove row</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* map all rows */}
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <span className="readonly-cell">{displayNum(currents[i])}</span>
                    </td>
                    <td>
                      <input
                        ref={i === rows.length - 1 ? lastRowCountInputRef : undefined}
                        className="text-input table-input"
                        type="text"
                        inputMode="numeric"
                        value={r.countStr}
                        onChange={(e) => updateRow(r.id, "countStr", e.target.value)}
                        aria-label={`Row ${i + 1} number of notes in operation`}
                      />
                    </td>
                    <td>
                      <input
                        className="text-input table-input"
                        type="text"
                        inputMode="numeric"
                        value={r.stepStr}
                        onChange={(e) => updateRow(r.id, "stepStr", e.target.value)}
                        aria-label={`Row ${i + 1} step size`}
                      />
                    </td>
                    <td>
                      <input
                        className="text-input table-input"
                        type="text"
                        inputMode="numeric"
                        value={r.jumpStr}
                        onChange={(e) => updateRow(r.id, "jumpStr", e.target.value)}
                        aria-label={`Row ${i + 1} jump size`}
                      />
                    </td>
                    <td>
                      <span className="readonly-cell">{displayNum(endings[i])}</span>
                    </td>
                    {/* trash can icon remove row button */}
                    <td className="col-remove">
                      <button
                        type="button"
                        className="row-remove-btn"
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(r.id)}
                        aria-label={`Remove row ${i + 1}`}
                        title="Remove row"
                      >
                        <svg
                          className="row-remove-icon"
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            fill="currentColor"
                            d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm3-9h2v7H9V10zm4 0h2v7h-2V10zm6-6h-1V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1H4v2h16V4z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="controls row-actions">
            <button type="button" onClick={addRow}>
              Add row
            </button>
          </div>
        </div>
      </div>

      {/* display output of all operations as midi note #s */}
      <div className="header2-visual">
        <div className="header2-container updown-output-section">
          {applyError ? <p className="apply-error">{applyError}</p> : null}
          <div className="output-header-row">
            <label className="output-label" htmlFor="output-box">
              output
            </label>
            <div className="output-range-group" aria-live="polite">
              <div className="output-stat">
                <span className="output-stat-label" id="output-lowest-label">
                  lowest note
                </span>
                <span
                  className="output-stat-value"
                  role="status"
                  aria-labelledby="output-lowest-label"
                >
                  {displayNum(outputMin)}
                </span>
              </div>
              <div className="output-stat">
                <span className="output-stat-label" id="output-highest-label">
                  highest note
                </span>
                <span
                  className="output-stat-value"
                  role="status"
                  aria-labelledby="output-highest-label"
                >
                  {displayNum(outputMax)}
                </span>
              </div>
              <button
                type="button"
                className="send-to-main-button send-notes-to-main-updown"
                onClick={() => setMainNotes(output.trim() || "")}
              >
                Send notes to main
              </button>
            </div>
          </div>
          <textarea
            id="output-box"
            className="output-textarea"
            readOnly
            rows={12}
            value={output}
            placeholder="Translated MIDI note sequence appears here when inputs are valid."
          />
        </div>
      </div>
    </div>
  );
}
