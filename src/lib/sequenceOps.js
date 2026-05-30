// Pure ports of the logic from the C++ wxWidgets app (cMain.cpp).
// Each function mirrors its C++ counterpart so output matches the original program.

/**
 * Max number of Tower of Hanoi discs allowed. Hanoi records 2^n - 1 states,
 * each a full copy of the pole configuration, so large values would freeze the
 * browser. The original C++ app had no cap.
 */
export const MAX_HANOI_DISCS = 12;

/**
 * Port of comma_sep_str_to_int_vector. Splits on commas and parses ints.
 * The C++ version uses stoi, which throws on non-numeric tokens; that throw is
 * caught by the calling handler (treated as a no-op). We surface that by
 * throwing here so callers can replicate the catch.
 * @param {string} str
 * @returns {number[]}
 */
export function commaSepStrToIntVector(str) {
  const out = [];
  const parts = String(str).split(",");
  for (const part of parts) {
    // stoi parses leading integer portion and ignores trailing chars,
    // but throws if there is no leading number at all.
    const trimmed = part.trim();
    const match = trimmed.match(/^[+-]?\d+/);
    if (!match) {
      throw new Error(`invalid integer token: "${part}"`);
    }
    out.push(parseInt(match[0], 10));
  }
  return out;
}

/**
 * Port of whatev_to_string. keepCommas=true joins with ", "; otherwise
 * concatenates with no separator (matching the C++ else-branch behavior).
 * @param {number[]} vec
 * @param {boolean} keepCommas
 * @returns {string}
 */
export function whatevToString(vec, keepCommas) {
  if (keepCommas) {
    return vec.join(", ");
  }
  // C++ else-branch: concatenate with no delimiter, trailing newline on last.
  let s = "";
  for (let a = 0; a < vec.length; a++) {
    if (a === vec.length - 1) {
      s += `${vec[a]}\n`;
    } else {
      s += `${vec[a]}`;
    }
  }
  return s;
}

/**
 * Port of mod_all_vector_by_certain_amount_and_add_by_certain_amount.
 * addFirst=true  -> (x + addTo) % modBy
 * addFirst=false -> (x % modBy) + addTo
 * JS % uses truncated division like C++ %, so negative results match.
 * @param {number[]} vec
 * @param {number} modBy
 * @param {number} addTo
 * @param {boolean} addFirst
 * @returns {number[]}
 */
export function modAndAdd(vec, modBy, addTo, addFirst) {
  const ret = [];
  if (addFirst) {
    for (let i = 0; i < vec.length; i++) {
      ret.push((vec[i] + addTo) % modBy);
    }
  } else {
    for (let i = 0; i < vec.length; i++) {
      ret.push((vec[i] % modBy) + addTo);
    }
  }
  return ret;
}

/**
 * Port of add_two_vectors_ability_to_mult_by_scalars_too. Truncates to the
 * shorter vector. Mods each result only when modBy is non-zero.
 * @param {number[]} a
 * @param {number} scalarA
 * @param {number[]} b
 * @param {number} scalarB
 * @param {number} modBy
 * @returns {number[]}
 */
export function addTwoVectorsWithScalars(a, scalarA, b, scalarB, modBy) {
  const ret = [];
  const smallest = Math.min(a.length, b.length);
  if (modBy) {
    for (let i = 0; i < smallest; i++) {
      let one = a[i] * scalarA + b[i] * scalarB;
      one = one % modBy;
      ret.push(one);
    }
  } else {
    for (let i = 0; i < smallest; i++) {
      ret.push(a[i] * scalarA + b[i] * scalarB);
    }
  }
  return ret;
}

/**
 * Port of sum_inversion. Reduces each note into a single octave (0-11),
 * inverts around sumWhatev, then restores the octave offset.
 * @param {number[]} origSeq
 * @param {number} sumWhatev
 * @returns {number[]}
 */
export function sumInversion(origSeq, sumWhatev) {
  const changed = [];
  const octave = 12;
  for (let i = 0; i < origSeq.length; i++) {
    let curNum = origSeq[i];
    let numOctaves = 0;
    while (curNum >= 0) {
      curNum = curNum - octave;
      numOctaves++;
    }
    curNum = curNum + octave;
    numOctaves--;
    let invertedNum = (sumWhatev + octave - curNum) % octave;
    invertedNum = invertedNum + numOctaves * octave;
    changed.push(invertedNum);
  }
  return changed;
}

/**
 * Port of cMain::multiple_vectors_to_one_vector_one_element_by_one_element.
 * Round-robin pull from the front of each vector until all are empty.
 * Used by the splice operation.
 * @param {number[][]} allVectors
 * @returns {number[]}
 */
export function interleave(allVectors) {
  // copy so we don't mutate caller input
  const vectors = allVectors.map((v) => v.slice());
  const shuffled = [];
  const numVectors = vectors.length;
  const counts = vectors.map((v) => v.length);

  while (true) {
    let noElements = true;
    for (let i = 0; i < numVectors; i++) {
      if (counts[i] > 0) noElements = false;
    }
    if (noElements) break;
    for (let i = 0; i < numVectors; i++) {
      if (counts[i] > 0) {
        shuffled.push(vectors[i][0]);
        vectors[i].shift();
        counts[i]--;
      }
    }
  }
  return shuffled;
}

/**
 * Port of the multi-element find/replace loop in OnReplSeqXButtonClicked.
 * Scans seq for occurrences of the full findVec subsequence and substitutes
 * replVec in their place.
 * @param {number[]} seq
 * @param {number[]} findVec
 * @param {number[]} replVec
 * @returns {number[]}
 */
export function subsequenceReplace(seq, findVec, replVec) {
  const changed = [];
  for (let i = 0; i < seq.length; i++) {
    let allMatch = true;
    if (seq.length - i < findVec.length) {
      allMatch = false;
    } else {
      for (let j = 0; j < findVec.length; j++) {
        if (seq[i + j] !== findVec[j]) {
          allMatch = false;
          break;
        }
      }
    }

    if (allMatch && findVec.length > 0) {
      for (let j = 0; j < replVec.length; j++) {
        changed.push(replVec[j]);
      }
      i = i + findVec.length - 1;
    } else {
      changed.push(seq[i]);
    }
  }
  return changed;
}

/**
 * Port of OnSeqXReplaceAnIntWithAStrButtonClicked. Treats the "replace this"
 * field as a regex pattern (C++ used std::regex with ECMAScript grammar) and
 * replaces all matches in the raw sequence text with the replacement string.
 * @param {string} seqText
 * @param {string} pattern
 * @param {string} replacement
 * @returns {string}
 */
export function replaceWithString(seqText, pattern, replacement) {
  const reg = new RegExp(pattern, "g");
  return seqText.replace(reg, replacement);
}

/**
 * Port of the Tower_Of_Hanoi class from cMain.h / cMain.cpp.
 * Records every intermediate pole configuration, then (per OnSeqXTowerOfHanoi)
 * interleaves each recorded state's poles one disc at a time, translating disc
 * numbers onto the provided scale.
 */
export class TowerOfHanoi {
  constructor(numDiscs) {
    this.numDiscs = numDiscs;
    /** @type {number[][]} current discs on each of the 3 poles */
    this.discsOnPoles = [];
    /** @type {number[][][]} snapshot of discsOnPoles after every move */
    this.discsOnPolesInTime = [];
  }

  move(f, t) {
    const grabbed = this.discsOnPoles[f].pop();
    this.discsOnPoles[t].push(grabbed);
    // deep copy snapshot of all poles (C++ copies the vector on push_back)
    this.discsOnPolesInTime.push(this.discsOnPoles.map((pole) => pole.slice()));
  }

  hanoi(n, f, h, t) {
    if (n === 0) return;
    this.hanoi(n - 1, f, t, h);
    this.move(f, t);
    this.hanoi(n - 1, h, f, t);
  }
}

/**
 * Port of Tower_Of_Hanoi::multiple_vectors_to_one_vector_one_element_by_one_element.
 * For a single point in time, round-robin pulls the bottom disc (front) from
 * each pole, translating disc number d -> scale[(d-1) % scale.length].
 * @param {number[][]} polesOneTime
 * @param {number[]} scale
 * @returns {number[]}
 */
export function interleavePolesToScale(polesOneTime, scale) {
  const poles = polesOneTime.map((p) => p.slice());
  const shuffled = [];
  const numVectors = poles.length;
  const counts = poles.map((p) => p.length);

  while (true) {
    let noElements = true;
    for (let i = 0; i < numVectors; i++) {
      if (counts[i] > 0) noElements = false;
    }
    if (noElements) break;
    for (let i = 0; i < numVectors; i++) {
      if (counts[i] > 0) {
        const popped = poles[i].shift(); // pop front (bottom disc)
        shuffled.push(scale[(popped - 1) % scale.length]);
        counts[i]--;
      }
    }
  }
  return shuffled;
}

/**
 * Full Tower of Hanoi pipeline matching OnSeqXTowerOfHanoiButtonClicked:
 * set up all discs on the left pole, solve, then concatenate the
 * scale-translated interleave of every recorded state.
 * @param {number[]} seqVector scale to translate disc numbers onto
 * @param {number} numDiscs
 * @returns {number[]}
 */
export function towerOfHanoiSequence(seqVector, numDiscs) {
  const toh = new TowerOfHanoi(numDiscs);
  const startPole = [];
  for (let i = 0; i < numDiscs; i++) {
    startPole.push(i + 1);
  }
  toh.discsOnPoles.push(startPole);
  toh.discsOnPoles.push([]);
  toh.discsOnPoles.push([]);
  // record initial state
  toh.discsOnPolesInTime.push(toh.discsOnPoles.map((pole) => pole.slice()));

  toh.hanoi(numDiscs, 0, 1, 2);

  const all = [];
  for (let i = 0; i < toh.discsOnPolesInTime.length; i++) {
    const onePoint = interleavePolesToScale(toh.discsOnPolesInTime[i], seqVector);
    for (let j = 0; j < onePoint.length; j++) {
      all.push(onePoint[j]);
    }
  }
  return all;
}

/**
 * Cyclic rotate-left by one (port of OnSeqXRotateLeftButtonClicked).
 * @param {number[]} vec
 * @returns {number[]}
 */
export function rotateLeft(vec) {
  const copy = vec.slice();
  const out = vec.slice();
  for (let i = 0; i < vec.length; i++) {
    out[i] = copy[(i + 1) % vec.length];
  }
  return out;
}

/**
 * Cyclic rotate-right by one (port of OnSeqXRotateRightButtonClicked).
 * @param {number[]} vec
 * @returns {number[]}
 */
export function rotateRight(vec) {
  const copy = vec.slice();
  const out = vec.slice();
  for (let i = 0; i < vec.length; i++) {
    out[(i + 1) % vec.length] = copy[i];
  }
  return out;
}

/**
 * Reverse (port of OnSeqXReverseButtonClicked).
 * @param {number[]} vec
 * @returns {number[]}
 */
export function reverse(vec) {
  const copy = vec.slice();
  const out = vec.slice();
  for (let i = 0; i < vec.length; i++) {
    out[i] = copy[vec.length - 1 - i];
  }
  return out;
}
