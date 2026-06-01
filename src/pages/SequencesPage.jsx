import { useCallback, useState } from "react";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useTake2Session } from "../context/Take2SessionContext.jsx";
import {
  commaSepStrToIntVector,
  whatevToString,
  modAndAdd,
  addTwoVectorsWithScalars,
  sumInversion,
  interleave,
  subsequenceReplace,
  replaceWithString,
  towerOfHanoiSequence,
  rotateLeft,
  rotateRight,
  reverse,
  MAX_HANOI_DISCS,
} from "../lib/sequenceOps.js";

/** Port of C++ std::atoi: leading integer or 0 when none/blank. */
function atoi(str) {
  const m = String(str).trim().match(/^[+-]?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** Small button placed to the right of every output-capable box. */
function SendToMainButton({ onClick }) {
  return (
    <button type="button" className="controls-btn send-to-main-button" onClick={onClick}>
      Send notes to main
    </button>
  );
}

export function SequencesPage() {
  const { setMainNotes } = useMainMidi();

  const {
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
  } = useTake2Session();

  const [error, setError] = useState("");

  // run an operation, catching parse/logic errors the way the C++ try/catch did
  const run = useCallback((fn) => {
    try {
      setError("");
      fn();
    } catch {
      setError("Exception: check that your sequence/params are valid integers.");
    }
  }, []);

  const sendToMain = useCallback(
    (value) => setMainNotes(String(value).trim()),
    [setMainNotes]
  );

  // ---- sequence 1 operations ----
  const seq1ModByAddBy = () =>
    // run is defined as a convenient way to useCallback and catch errors throughout the page
    run(() => {
      const v = commaSepStrToIntVector(seq1);
      const m = atoi(seq1ModBy);
      if (m === 0) {
        setError("Sequence 1: 'mod by' cannot be 0.");
        return;
      }
      setSeq1(whatevToString(modAndAdd(v, m, atoi(seq1AddBy), false), true));
    });

  const seq1AddByModBy = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq1);
      const m = atoi(seq1ModBy);
      if (m === 0) {
        setError("Sequence 1: 'mod by' cannot be 0.");
        return;
      }
      setSeq1(whatevToString(modAndAdd(v, m, atoi(seq1AddBy), true), true));
    });

  const seq1RotateLeft = () =>
    run(() => setSeq1(whatevToString(rotateLeft(commaSepStrToIntVector(seq1)), true)));
  const seq1RotateRight = () =>
    run(() => setSeq1(whatevToString(rotateRight(commaSepStrToIntVector(seq1)), true)));
  const seq1Reverse = () =>
    run(() => setSeq1(whatevToString(reverse(commaSepStrToIntVector(seq1)), true)));
  const seq1SumInversion = () =>
    run(() =>
      setOutput(
        whatevToString(sumInversion(commaSepStrToIntVector(seq1), atoi(seq1SumInv)), true)
      )
    );
  const seq1TowerOfHanoi = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq1);
      const n = atoi(seq1Discs);
      if (n < 1) {
        setError("Sequence 1: '# discs t_o_h' must be at least 1.");
        return;
      }
      if (n > MAX_HANOI_DISCS) {
        setError(`Sequence 1: '# discs t_o_h' capped at ${MAX_HANOI_DISCS}.`);
        return;
      }
      setOutput(whatevToString(towerOfHanoiSequence(v, n), true));
    });

  // ---- sequence 2 operations ----
  const seq2ModByAddBy = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq2);
      const m = atoi(seq2ModBy);
      if (m === 0) {
        setError("Sequence 2: 'mod by' cannot be 0.");
        return;
      }
      setSeq2(whatevToString(modAndAdd(v, m, atoi(seq2AddBy), false), true));
    });

  const seq2AddByModBy = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq2);
      const m = atoi(seq2ModBy);
      if (m === 0) {
        setError("Sequence 2: 'mod by' cannot be 0.");
        return;
      }
      setSeq2(whatevToString(modAndAdd(v, m, atoi(seq2AddBy), true), true));
    });

  const seq2RotateLeft = () =>
    run(() => setSeq2(whatevToString(rotateLeft(commaSepStrToIntVector(seq2)), true)));
  const seq2RotateRight = () =>
    run(() => setSeq2(whatevToString(rotateRight(commaSepStrToIntVector(seq2)), true)));
  const seq2Reverse = () =>
    run(() => setSeq2(whatevToString(reverse(commaSepStrToIntVector(seq2)), true)));
  const seq2SumInversion = () =>
    run(() =>
      setOutput(
        whatevToString(sumInversion(commaSepStrToIntVector(seq2), atoi(seq2SumInv)), true)
      )
    );
  const seq2TowerOfHanoi = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq2);
      const n = atoi(seq2Discs);
      if (n < 1) {
        setError("Sequence 2: '# discs t_o_h' must be at least 1.");
        return;
      }
      if (n > MAX_HANOI_DISCS) {
        setError(`Sequence 2: '# discs t_o_h' capped at ${MAX_HANOI_DISCS}.`);
        return;
      }
      setOutput(whatevToString(towerOfHanoiSequence(v, n), true));
    });

  // ---- replacement operations ----
  const applyReplSeq1 = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq1);
      const findVec = commaSepStrToIntVector(replaceThis);
      const replVec = commaSepStrToIntVector(replaceWith);
      setSeq1(whatevToString(subsequenceReplace(v, findVec, replVec), true));
    });
  const applyReplSeq2 = () =>
    run(() => {
      const v = commaSepStrToIntVector(seq2);
      const findVec = commaSepStrToIntVector(replaceThis);
      const replVec = commaSepStrToIntVector(replaceWith);
      setSeq2(whatevToString(subsequenceReplace(v, findVec, replVec), true));
    });
  const replWithStringSeq1 = () =>
    run(() => setOutput(replaceWithString(seq1, replaceThis, replaceWith)));
  const replWithStringSeq2 = () =>
    run(() => setOutput(replaceWithString(seq2, replaceThis, replaceWith)));

  // ---- both-sequence operations ----
  const splice = () =>
    run(() => {
      const v1 = commaSepStrToIntVector(seq1);
      const v2 = commaSepStrToIntVector(seq2);
      setOutput(whatevToString(interleave([v1, v2]), true));
    });
  const multScalarsAddMod = () =>
    run(() => {
      const v1 = commaSepStrToIntVector(seq1);
      const v2 = commaSepStrToIntVector(seq2);
      setOutput(
        whatevToString(
          addTwoVectorsWithScalars(
            v1,
            atoi(seq1Scalar),
            v2,
            atoi(seq2Scalar),
            atoi(bothModBy)
          ),
          true
        )
      );
    });

  return (
    <div className="app take2-page">
      <header className="header">
        <h1>Take 2 Sequences And Do A Bunch Of Stuff</h1>
      </header>

      {error ? (
        <p className="apply-error" role="alert">
          {error}
        </p>
      ) : null}

      {/* ---------------- Sequence 1 ---------------- */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="seq-row">
            <label className="seq-label" htmlFor="seq1-box">
              sequence 1:
            </label>
            <input
              id="seq1-box"
              className="text-input seq-input"
              type="text"
              value={seq1}
              onChange={(e) => setSeq1(e.target.value)}
              spellCheck={false}
            />
            <SendToMainButton onClick={() => sendToMain(seq1)} />
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={() => setHold1(seq1)}>
              move to hold 1
            </button>
            <button type="button" className="controls-btn" onClick={() => setHold2(seq1)}>
              move to hold 2
            </button>
          </div>

          <div className="param-row">
            <label className="param-label">
              mod by:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq1ModBy}
                onChange={(e) => setSeq1ModBy(e.target.value)}
              />
            </label>
            <label className="param-label">
              add by:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq1AddBy}
                onChange={(e) => setSeq1AddBy(e.target.value)}
              />
            </label>
            <label className="param-label">
              sum inversion #:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq1SumInv}
                onChange={(e) => setSeq1SumInv(e.target.value)}
              />
            </label>
            <label className="param-label">
              # discs t_o_h:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq1Discs}
                onChange={(e) => setSeq1Discs(e.target.value)}
              />
            </label>
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={seq1ModByAddBy}>
              Mod By Add By
            </button>
            <button type="button" className="controls-btn" onClick={seq1AddByModBy}>
              Add By Mod By
            </button>
            <button type="button" className="controls-btn" onClick={seq1RotateLeft}>
              Rotate Left
            </button>
            <button type="button" className="controls-btn" onClick={seq1RotateRight}>
              Rotate Right
            </button>
            <button type="button" className="controls-btn" onClick={seq1Reverse}>
              Reverse
            </button>
            <button type="button" className="controls-btn" onClick={seq1SumInversion}>
              Sum Inversion
            </button>
            <button type="button" className="controls-btn" onClick={seq1TowerOfHanoi}>
              Tower of Hanoi It
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Sequence 2 ---------------- */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="seq-row">
            <label className="seq-label" htmlFor="seq2-box">
              sequence 2:
            </label>
            <input
              id="seq2-box"
              className="text-input seq-input"
              type="text"
              value={seq2}
              onChange={(e) => setSeq2(e.target.value)}
              spellCheck={false}
            />
            <SendToMainButton onClick={() => sendToMain(seq2)} />
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={() => setHold1(seq2)}>
              move to hold 1
            </button>
            <button type="button" className="controls-btn" onClick={() => setHold2(seq2)}>
              move to hold 2
            </button>
          </div>

          <div className="param-row">
            <label className="param-label">
              mod by:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq2ModBy}
                onChange={(e) => setSeq2ModBy(e.target.value)}
              />
            </label>
            <label className="param-label">
              add by:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq2AddBy}
                onChange={(e) => setSeq2AddBy(e.target.value)}
              />
            </label>
            <label className="param-label">
              sum inversion #:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq2SumInv}
                onChange={(e) => setSeq2SumInv(e.target.value)}
              />
            </label>
            <label className="param-label">
              # discs t_o_h:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq2Discs}
                onChange={(e) => setSeq2Discs(e.target.value)}
              />
            </label>
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={seq2ModByAddBy}>
              Mod By Add By
            </button>
            <button type="button" className="controls-btn" onClick={seq2AddByModBy}>
              Add By Mod By
            </button>
            <button type="button" className="controls-btn" onClick={seq2RotateLeft}>
              Rotate Left
            </button>
            <button type="button" className="controls-btn" onClick={seq2RotateRight}>
              Rotate Right
            </button>
            <button type="button" className="controls-btn" onClick={seq2Reverse}>
              Reverse
            </button>
            <button type="button" className="controls-btn" onClick={seq2SumInversion}>
              Sum Inversion
            </button>
            <button type="button" className="controls-btn" onClick={seq2TowerOfHanoi}>
              Tower of Hanoi It
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Replacement ---------------- */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="seq-row">
            <label className="param-label">
              replace this:
              <input
                className="text-input replace-input"
                type="text"
                value={replaceThis}
                onChange={(e) => setReplaceThis(e.target.value)}
                spellCheck={false}
              />
            </label>
            <label className="param-label">
              replace with:
              <input
                className="text-input replace-input"
                type="text"
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                spellCheck={false}
              />
            </label>
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={applyReplSeq1}>
              apply replacement to sequence 1
            </button>
            <button type="button" className="controls-btn" onClick={applyReplSeq2}>
              apply replacement to sequence 2
            </button>
            <button type="button" className="controls-btn" onClick={replWithStringSeq1}>
              replace with string sequence 1
            </button>
            <button type="button" className="controls-btn" onClick={replWithStringSeq2}>
              replace with string sequence 2
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Both-sequence ops ---------------- */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="param-row center">
            <label className="param-label">
              sequence 1 scalar:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq1Scalar}
                onChange={(e) => setSeq1Scalar(e.target.value)}
              />
            </label>
            <label className="param-label">
              sequence 2 scalar:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={seq2Scalar}
                onChange={(e) => setSeq2Scalar(e.target.value)}
              />
            </label>
            <label className="param-label">
              mod by:
              <input
                className="text-input param-input"
                type="text"
                inputMode="numeric"
                value={bothModBy}
                onChange={(e) => setBothModBy(e.target.value)}
              />
            </label>
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={splice}>
              splice sequences
            </button>
            <button type="button" className="controls-btn" onClick={multScalarsAddMod}>
              multiply sequences by scalars add together mod by
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Output ---------------- */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="seq-row">
            <label className="seq-label" htmlFor="output-box">
              output:
            </label>
            <input
              id="output-box"
              className="text-input seq-input"
              type="text"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              spellCheck={false}
            />
            <SendToMainButton onClick={() => sendToMain(output)} />
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={() => setSeq1(output)}>
              move to seq 1
            </button>
            <button type="button" className="controls-btn" onClick={() => setSeq2(output)}>
              move to seq 2
            </button>
            <button type="button" className="controls-btn" onClick={() => setHold1(output)}>
              move to hold 1
            </button>
            <button type="button" className="controls-btn" onClick={() => setHold2(output)}>
              move to hold 2
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Holds ---------------- */}
      <div className="header2-visual">
        <div className="header2-container">
          <div className="seq-row">
            <label className="seq-label" htmlFor="hold1-box">
              hold this for a sec 1:
            </label>
            <input
              id="hold1-box"
              className="text-input seq-input"
              type="text"
              value={hold1}
              onChange={(e) => setHold1(e.target.value)}
              spellCheck={false}
            />
            <SendToMainButton onClick={() => sendToMain(hold1)} />
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={() => setSeq1(hold1)}>
              move to seq 1
            </button>
            <button type="button" className="controls-btn" onClick={() => setSeq2(hold1)}>
              move to seq 2
            </button>
          </div>

          <div className="seq-row">
            <label className="seq-label" htmlFor="hold2-box">
              hold this for a sec 2:
            </label>
            <input
              id="hold2-box"
              className="text-input seq-input"
              type="text"
              value={hold2}
              onChange={(e) => setHold2(e.target.value)}
              spellCheck={false}
            />
            <SendToMainButton onClick={() => sendToMain(hold2)} />
          </div>

          <div className="btn-row center">
            <button type="button" className="controls-btn" onClick={() => setSeq1(hold2)}>
              move to seq 1
            </button>
            <button type="button" className="controls-btn" onClick={() => setSeq2(hold2)}>
              move to seq 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
