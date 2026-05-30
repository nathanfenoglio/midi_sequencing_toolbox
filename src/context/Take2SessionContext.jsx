import { createContext, useContext, useMemo, useState } from "react";

// Persists the Take 2 page's input/output/hold fields across navigation,
// following the same pattern as GraphSessionContext / MorseSessionContext.
const Take2SessionContext = createContext(null);

export function Take2SessionProvider({ children }) {
  // sequence boxes
  const [seq1, setSeq1] = useState("");
  const [seq2, setSeq2] = useState("");

  // sequence 1 params
  const [seq1ModBy, setSeq1ModBy] = useState("");
  const [seq1AddBy, setSeq1AddBy] = useState("");
  const [seq1SumInv, setSeq1SumInv] = useState("");
  const [seq1Discs, setSeq1Discs] = useState("");

  // sequence 2 params
  const [seq2ModBy, setSeq2ModBy] = useState("");
  const [seq2AddBy, setSeq2AddBy] = useState("");
  const [seq2SumInv, setSeq2SumInv] = useState("");
  const [seq2Discs, setSeq2Discs] = useState("");

  // replacement fields
  const [replaceThis, setReplaceThis] = useState("");
  const [replaceWith, setReplaceWith] = useState("");

  // both-sequence op fields
  const [seq1Scalar, setSeq1Scalar] = useState("");
  const [seq2Scalar, setSeq2Scalar] = useState("");
  const [bothModBy, setBothModBy] = useState("");

  // output + holds
  const [output, setOutput] = useState("");
  const [hold1, setHold1] = useState("");
  const [hold2, setHold2] = useState("");

  const value = useMemo(
    () => ({
      seq1,
      setSeq1,
      seq2,
      setSeq2,
      seq1ModBy,
      setSeq1ModBy,
      seq1AddBy,
      setSeq1AddBy,
      seq1SumInv,
      setSeq1SumInv,
      seq1Discs,
      setSeq1Discs,
      seq2ModBy,
      setSeq2ModBy,
      seq2AddBy,
      setSeq2AddBy,
      seq2SumInv,
      setSeq2SumInv,
      seq2Discs,
      setSeq2Discs,
      replaceThis,
      setReplaceThis,
      replaceWith,
      setReplaceWith,
      seq1Scalar,
      setSeq1Scalar,
      seq2Scalar,
      setSeq2Scalar,
      bothModBy,
      setBothModBy,
      output,
      setOutput,
      hold1,
      setHold1,
      hold2,
      setHold2,
    }),
    [
      seq1,
      seq2,
      seq1ModBy,
      seq1AddBy,
      seq1SumInv,
      seq1Discs,
      seq2ModBy,
      seq2AddBy,
      seq2SumInv,
      seq2Discs,
      replaceThis,
      replaceWith,
      seq1Scalar,
      seq2Scalar,
      bothModBy,
      output,
      hold1,
      hold2,
    ]
  );

  return (
    <Take2SessionContext.Provider value={value}>
      {children}
    </Take2SessionContext.Provider>
  );
}

export function useTake2Session() {
  const ctx = useContext(Take2SessionContext);
  if (!ctx) {
    throw new Error("useTake2Session must be used within Take2SessionProvider");
  }
  return ctx;
}
