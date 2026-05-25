import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  applyPreset,
  timingToFormStrings,
  YYZ_PRESET,
} from "../lib/morsePresets.js";

const MorseSessionContext = createContext(null);

function initialFormFromPreset() {
  return timingToFormStrings(YYZ_PRESET);
}

export function MorseSessionProvider({ children }) {
  const initial = initialFormFromPreset();

  const [textInput, setTextInput] = useState("");
  const [dotDurationInput, setDotDurationInput] = useState(
    initial.dotDurationInput
  );
  const [dashDurationInput, setDashDurationInput] = useState(
    initial.dashDurationInput
  );
  const [gapBetweenSymbols, setGapBetweenSymbols] = useState(
    initial.gapBetweenSymbols
  );
  const [gapBetweenSymbolsDurationInput, setGapBetweenSymbolsDurationInput] =
    useState(initial.gapBetweenSymbolsDurationInput);
  const [gapBetweenLetters, setGapBetweenLetters] = useState(
    initial.gapBetweenLetters
  );
  const [gapBetweenLettersDurationInput, setGapBetweenLettersDurationInput] =
    useState(initial.gapBetweenLettersDurationInput);
  const [gapBetweenWords, setGapBetweenWords] = useState(
    initial.gapBetweenWords
  );
  const [gapBetweenWordsDurationInput, setGapBetweenWordsDurationInput] =
    useState(initial.gapBetweenWordsDurationInput);
  const [presetMode, setPresetMode] = useState(initial.presetMode);

  const [morsePreview, setMorsePreview] = useState("");
  const [rhythmRow, setRhythmRow] = useState([]);
  const [rhythmString, setRhythmString] = useState("");
  const [groupingInput, setGroupingInput] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [hasGeneratedRhythm, setHasGeneratedRhythm] = useState(false);

  const applyTimingToForm = useCallback((timing) => {
    const form = timingToFormStrings(timing);
    setDotDurationInput(form.dotDurationInput);
    setDashDurationInput(form.dashDurationInput);
    setGapBetweenSymbols(form.gapBetweenSymbols);
    setGapBetweenSymbolsDurationInput(form.gapBetweenSymbolsDurationInput);
    setGapBetweenLetters(form.gapBetweenLetters);
    setGapBetweenLettersDurationInput(form.gapBetweenLettersDurationInput);
    setGapBetweenWords(form.gapBetweenWords);
    setGapBetweenWordsDurationInput(form.gapBetweenWordsDurationInput);
    setPresetMode(form.presetMode);
  }, []);

  const applyYyzPreset = useCallback(() => {
    applyTimingToForm(applyPreset("yyz"));
  }, [applyTimingToForm]);

  const applyStandardPreset = useCallback(() => {
    applyTimingToForm(applyPreset("standard"));
  }, [applyTimingToForm]);

  const value = useMemo(
    () => ({
      textInput,
      setTextInput,
      dotDurationInput,
      setDotDurationInput,
      dashDurationInput,
      setDashDurationInput,
      gapBetweenSymbols,
      setGapBetweenSymbols,
      gapBetweenSymbolsDurationInput,
      setGapBetweenSymbolsDurationInput,
      gapBetweenLetters,
      setGapBetweenLetters,
      gapBetweenLettersDurationInput,
      setGapBetweenLettersDurationInput,
      gapBetweenWords,
      setGapBetweenWords,
      gapBetweenWordsDurationInput,
      setGapBetweenWordsDurationInput,
      presetMode,
      setPresetMode,
      morsePreview,
      setMorsePreview,
      rhythmRow,
      setRhythmRow,
      rhythmString,
      setRhythmString,
      groupingInput,
      setGroupingInput,
      generateError,
      setGenerateError,
      hasGeneratedRhythm,
      setHasGeneratedRhythm,
      applyTimingToForm,
      applyYyzPreset,
      applyStandardPreset,
    }),
    [
      textInput,
      dotDurationInput,
      dashDurationInput,
      gapBetweenSymbols,
      gapBetweenSymbolsDurationInput,
      gapBetweenLetters,
      gapBetweenLettersDurationInput,
      gapBetweenWords,
      gapBetweenWordsDurationInput,
      presetMode,
      morsePreview,
      rhythmRow,
      rhythmString,
      groupingInput,
      generateError,
      hasGeneratedRhythm,
      applyTimingToForm,
      applyYyzPreset,
      applyStandardPreset,
    ]
  );

  return (
    <MorseSessionContext.Provider value={value}>
      {children}
    </MorseSessionContext.Provider>
  );
}

export function useMorseSession() {
  const ctx = useContext(MorseSessionContext);
  if (!ctx) {
    throw new Error("useMorseSession must be used within MorseSessionProvider");
  }
  return ctx;
}
