import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  applyRule,
  createInitialGrid,
} from "../lib/cellularAutomata.js";
import { DEFAULT_NOTES_STRING } from "../lib/midiParse.js";

const DEFAULT_SCALE = "0, 1, 3, 4, 6, 7, 8, 9, 11";

// row id generator for updown page (UpdownPage) 
export function newRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ToolboxSessionsContext = createContext(null);

export function ToolboxSessionsProvider({ children }) {
  // wolfram page state
  const [rule, setRule] = useState(30);
  const [grid, setGrid] = useState(() => createInitialGrid());

  // useCallback handlers for wolfram page (WolframPage)
  const handleRuleChange = useCallback((newRule) => {
    setRule(newRule);
    setGrid(createInitialGrid());
  }, []);

  const handleStep = useCallback(() => {
    setGrid((prev) => applyRule(prev, rule));
  }, [rule]);

  const handleReset = useCallback(() => {
    setGrid(createInitialGrid());
  }, []);

  // wolfram page state (WolframRowPanel)
  const [rowIndexInput, setRowIndexInput] = useState("16");
  const [groupingInput, setGroupingInput] = useState("");
  const [removeFromLeftInput, setRemoveFromLeftInput] = useState("0");
  const [removeFromRightInput, setRemoveFromRightInput] = useState("1");
  const [startIndexInput, setStartIndexInput] = useState("0");
  const [notesInput, setNotesInput] = useState(DEFAULT_NOTES_STRING);
  const [scaleSelection, setScaleSelection] = useState("");

  // updown page state
  const [scaleInput, setScaleInput] = useState(DEFAULT_SCALE);
  const [scalePresetKey, setScalePresetKey] = useState("");
  const [startNoteInput, setStartNoteInput] = useState("48");
  const [repeatsInput, setRepeatsInput] = useState("4");
  const [rows, setRows] = useState(() => [
    { id: newRowId(), countStr: "", stepStr: "", jumpStr: "" },
  ]);
  const [output, setOutput] = useState("");
  const [applyError, setApplyError] = useState("");

  // rhythm compositions page state
  const [rhythmSpaceInput, setRhythmSpaceInput] = useState("16");
  const [rhythmNumNotesInput, setRhythmNumNotesInput] = useState("4");
  const [rhythmCompositions, setRhythmCompositions] = useState([]);
  const [rhythmSelectedIndex, setRhythmSelectedIndex] = useState(null);
  const [rhythmGenerateError, setRhythmGenerateError] = useState("");

  const value = useMemo(
    () => ({
      // wolfram page (WolframPage)
      wolfram: {
        rule,
        grid,
        handleRuleChange,
        handleStep,
        handleReset,
      },
      // wolfram row panel (WolframRowPanel)
      wolframRow: {
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
      },
      // updown page (UpdownPage)
      updown: {
        scaleInput,
        setScaleInput,
        scalePresetKey,
        setScalePresetKey,
        startNoteInput,
        setStartNoteInput,
        repeatsInput,
        setRepeatsInput,
        rows,
        setRows,
        output,
        setOutput,
        applyError,
        setApplyError,
      },
      rhythmCompositionsPage: {
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
      },
    }),
    // dependencies for useMemo (only include state and handlers that are part of the value)
    [
      rule,
      grid,
      handleRuleChange,
      handleStep,
      handleReset,
      rowIndexInput,
      groupingInput,
      removeFromLeftInput,
      removeFromRightInput,
      startIndexInput,
      notesInput,
      scaleSelection,
      scaleInput,
      scalePresetKey,
      startNoteInput,
      repeatsInput,
      rows,
      output,
      applyError,
      rhythmSpaceInput,
      rhythmNumNotesInput,
      rhythmCompositions,
      rhythmSelectedIndex,
      rhythmGenerateError,
    ]
  );

  return (
    <ToolboxSessionsContext.Provider value={value}>
      {children}
    </ToolboxSessionsContext.Provider>
  );
}

export function useToolboxSessions() {
  const ctx = useContext(ToolboxSessionsContext);
  if (!ctx) {
    throw new Error("useToolboxSessions must be used within ToolboxSessionsProvider");
  }
  return ctx;
}
