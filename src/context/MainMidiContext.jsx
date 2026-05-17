import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useScreenWakeLock } from "../hooks/useScreenWakeLock.js";
import { DEFAULT_NOTES_STRING } from "../lib/midiParse.js";

const MainMidiContext = createContext(null);

export function MainMidiProvider({ children }) {
  const [mainNotes, setMainNotes] = useState(DEFAULT_NOTES_STRING);
  const [mainRhythm, setMainRhythm] = useState("1");
  const [isSending, setIsSending] = useState(false);
  useScreenWakeLock(isSending);

  /** Set by HomeMidiPanel while mounted; tears down scheduler + note-off. */
  const midiStopRef = useRef(null);

  // HomeMidiPanel calls registerMidiStop on mount (the stopPlayback function is passed into it), unregisterMidiStop on unmount
  const registerMidiStop = useCallback((fn) => {
    midiStopRef.current = fn;
  }, []);

  const unregisterMidiStop = useCallback(() => {
    midiStopRef.current = null;
  }, []);

  /** Stop playback if Home registered a stopper; always clears isSending. */
  const stopAllMidi = useCallback(() => {
    try {
      midiStopRef.current?.();
    } catch (e) {
      console.error("stopAllMidi:", e);
    }
    setIsSending(false);
  }, []);

  useEffect(() => {
    const onPageHide = () => stopAllMidi();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [stopAllMidi]);

  const value = useMemo(
    () => ({
      mainNotes,
      setMainNotes,
      mainRhythm,
      setMainRhythm,
      isSending,
      setIsSending,
      registerMidiStop,
      unregisterMidiStop,
      stopAllMidi,
    }),
    [
      mainNotes,
      mainRhythm,
      isSending,
      registerMidiStop,
      unregisterMidiStop,
      stopAllMidi,
    ]
  );

  return (
    <MainMidiContext.Provider value={value}>{children}</MainMidiContext.Provider>
  );
}

export function useMainMidi() {
  const ctx = useContext(MainMidiContext);
  if (!ctx) {
    throw new Error("useMainMidi must be used within MainMidiProvider");
  }
  return ctx;
}
