import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function TutorialPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="app tutorial-page">
      <header className="header">
        <h1>Tutorial</h1>
      </header>

      <div className="header2-visual">
        <div className="header2-container">
          <nav className="tutorial-toc" aria-label="Tutorial contents">
            <ul>
              <li>
                <a href="#intro">Overview</a>
              </li>
              <li>
                <a href="#home">Home — MIDI send</a>
              </li>
              <li>
                <a href="#wolfram">Wolfram CA</a>
              </li>
              <li>
                <a href="#updown">Up Down</a>
              </li>
              <li>
                <a href="#graph">Graph Traversal</a>
              </li>
              <li>
                <a href="#take2">Take 2</a>
              </li>
              <li>
                <a href="#rhythm-compositions">Rhythm Compositions</a>
              </li>
              <li>
                <a href="#morse">Morse</a>
              </li>
            </ul>
          </nav>

          <section id="intro" className="tutorial-section">
            <h2>Overview</h2>
            <p>
              Midi Sequencing Toolbox is a collection of tools developed over
              years for generating musical ideas. They used to live in separate
              apps; this brings them together so information passes easily
              between them and everything is accessible in one place while
              brainstorming a composition.
            </p>
            <p>
              These tools generate complex patterns that still feel highly
              organized; the difference from random sequence generators is
              noticeable right away. Several tools generate melodies, others
              generate rhythms. Use any tool on its own, or chain them together
              to explore the space of possible melodic and rhythmic sequences.
            </p>
            <p>
              Most tools have "Send ... to main" buttons that push their result
              to the Home page, where you audition and send it out as live MIDI.
              Some also offer "Send notes to Take 2" to push a note sequence into
              the Take 2 page for further manipulation. Explore, and I hope it
              sparks ideas for your compositions!
            </p>
          </section>

          <section id="home" className="tutorial-section">
            <h2>Home — MIDI send</h2>
            <p>
              Home is where you assemble a rhythm plus a note sequence and send
              it out as live MIDI with the SEND MIDI button. Other tools fill
              these fields for you, or you can type them directly.
            </p>
            <ul>
              <li>
                <strong>Rhythm (0/1, comma-separated):</strong> the rhythm row,
                where 1 is a hit and 0 is a rest (e.g. <code>1, 0, 1, 1</code>).
              </li>
              <li>
                <strong>Group:</strong> optional grouping number that visually
                chunks the 0/1 display; it does not change the rhythm.
              </li>
              <li>
                <strong>start index:</strong> cyclically rotates the row so it
                begins on the chosen index.
              </li>
              <li>
                <strong>remove from left / remove from right:</strong> trim that
                many cells off the start or end of the row.
              </li>
              <li>
                <strong># row cells:</strong> the resulting row length after
                trimming.
              </li>
              <li>
                <strong>Scale / MIDI notes:</strong> choose a scale preset or
                type comma-separated MIDI note numbers (middle C = 60). These
                notes are cycled in order, one per hit (1) in the rhythm.
              </li>
              <li>
                <strong>transpose down / up:</strong> shift every note by one
                semitone. <strong>randomize notes order:</strong> shuffle the
                note sequence.
              </li>
              <li>
                <strong>Tempo (BPM) and note division (1/16, 1/8, 1/4):</strong>{" "}
                playback speed and how each rhythm cell maps to note length.
              </li>
              <li>
                <strong># hits, # notes in seq, repeats after:</strong> reference
                values. "# hits" is the number of 1s, "# notes in seq" is the
                number of MIDI notes, and "repeats after" is how many times the
                rhythm must cycle before the first note again lands on the first
                hit.
              </li>
              <li>
                <strong>Output and SEND MIDI:</strong> pick your MIDI output
                device (it appears after the first SEND MIDI enables Web MIDI)
                and start playback; the button becomes STOP while playing. Keep
                the app at least partially in focus so MIDI timing stays
                accurate.
              </li>
            </ul>
            <h3>Sending MIDI out (setup)</h3>
            <p>
              You need something on your device receiving MIDI. The author uses
              Ableton Live (
              <a
                href="https://www.ableton.com/en/trial/"
                target="_blank"
                rel="noreferrer"
              >
                ableton.com
              </a>
              ) with VST plugins, and LoopBe30 (
              <a
                href="https://www.nerds.de/en/loopbe30.html"
                target="_blank"
                rel="noreferrer"
              >
                nerds.de
              </a>
              ) to create the virtual MIDI ports. If you have no DAW, FluidSynth
              is a free cross-platform MIDI synth (
              <a
                href="https://www.fluidsynth.org/wiki/Download/#distributions"
                target="_blank"
                rel="noreferrer"
              >
                fluidsynth.org
              </a>
              ):
            </p>
            <ul>
              <li>
                <strong>Windows:</strong> run <code>choco install fluidsynth</code>
                , then run <code>fluidsynth</code> to start the synth.
              </li>
              <li>
                <strong>macOS:</strong> install with{" "}
                <code>brew install fluidsynth</code> or{" "}
                <code>sudo port install fluidsynth</code>.
              </li>
            </ul>
            <p>
              Once you have internal MIDI ports available (e.g. via LoopBe30),
              the port will be selectable in the Output dropdown after you click
              SEND MIDI.
            </p>
          </section>

          <section id="wolfram" className="tutorial-section">
            <h2>1D Cellular Automata Midi Sequencer (Wolfram CA)</h2>
            <p>
              Create rhythms from a horizontal cross-section (a row) of any of
              Stephen Wolfram's 256 elementary 1D cellular automata.
            </p>
            <ul>
              <li>
                <strong>Rule (0-255):</strong> selects the automaton. The rule
                visualization shows, for each of the 8 possible three-cell
                neighborhoods, what the cell below becomes on the next iteration
                (e.g. for rule 30, black/white/white becomes white). The Step,
                Reset, and Auto-run controls only drive this visualization.
              </li>
              <li>
                <strong>Row:</strong> picks which horizontal row of the automaton
                to read as the rhythm; black cells become 1 (hit) and white cells
                become 0 (rest).
              </li>
              <li>
                <strong>
                  Group, start index, remove from left/right, # row cells:
                </strong>{" "}
                shape the rhythm exactly like on Home (chunk the display, rotate
                the start point, trim either end, and view the length) so a row
                can be made to fit a desired bar count.
              </li>
              <li>
                <strong>
                  MIDI notes, Scale, transpose, randomize, Tempo, # hits / #
                  notes in seq / repeats after:
                </strong>{" "}
                behave the same as on Home.
              </li>
              <li>
                <strong>
                  mirror rule / black-white swapped / reverse black-white
                  swapped:
                </strong>{" "}
                the equivalent rules that produce related patterns, shown for
                reference.
              </li>
              <li>
                <strong>Send rhythm to main</strong> and{" "}
                <strong>Send notes to main</strong> push the current rhythm and
                notes to the Home page; go to Home and press SEND MIDI to hear
                them.
              </li>
            </ul>
            <p>
              For more examples, click the below link
              <br />
              <a
                href="https://www.nathan-fenoglio.com/projects/midiCellularAutomata"
                target="_blank"
                rel="noreferrer"
              >
                https://www.nathan-fenoglio.com/projects/midiCellularAutomata
              </a>
            </p>
          </section>

          <section id="updown" className="tutorial-section">
            <h2>Up Down Midi Sequencer</h2>
            <p>
              Many melodies are built by marching through a scale playing every
              other note, every third note, and so on, up or down. This tool
              gives you high-level control over that idea. The output updates
              automatically whenever scale, start note, repeats, and the row
              fields are all valid; fully blank rows are skipped. Each row's
              "current note" chains from the start note and the previous row's
              calculated ending note.
            </p>
            <ul>
              <li>
                <strong>scale preset / scale:</strong> choose a preset or enter
                comma-separated scale degrees. The start note transposes the
                whole scale to begin on that note.
              </li>
              <li>
                <strong>start note:</strong> the first note of the sequence.
              </li>
              <li>
                <strong># repeats:</strong> how many times to repeat all row
                operations; the last row's "jump size to next operation"
                determines the starting note of the next pass.
              </li>
            </ul>
            <p>Each row is one operation:</p>
            <ul>
              <li>
                <strong># notes in operation:</strong> how many notes this
                operation produces.
              </li>
              <li>
                <strong>step size:</strong> the jump (positive or negative) used
                to move through the scale. Example: a major scale{" "}
                <code>48, 50, 52, 53, 55, 57, 59</code> with step size 3 yields
                every third note <code>48, 53, 59, 64, 69, ...</code>.
              </li>
              <li>
                <strong>jump size to next operation:</strong> how far to move
                before the next operation's first note. Example: if the last note
                was 69 and the jump is -2, the next operation starts two scale
                degrees lower at 65.
              </li>
            </ul>
            <p>
              Add or delete as many rows as you like.{" "}
              <strong>Send notes to main</strong> sends the sequence to the Home
              page; <strong>Send notes to Take 2</strong> sends it into the Take
              2 page's sequence 1 field for further manipulation.
            </p>
          </section>

          <section id="graph" className="tutorial-section">
            <h2>Graph Traversal Sequencer</h2>
            <p>
              Draw a graph where nodes are MIDI notes and edges are allowed
              connections between notes, then generate note sequences from every
              path through the graph starting at a chosen node.
            </p>
            <ul>
              <li>
                <strong>Mode:</strong> NO DRAW (do nothing), ADD NODE (click
                empty canvas to place a node), ADD EDGE (click the originating
                node, then the destination node), REMOVE NODE (click a node to
                delete it and its edges), REMOVE EDGE (click originating then
                destination node).
              </li>
              <li>
                <strong>Graph:</strong> Directed adds the edge one way;
                Undirected adds it in both directions.
              </li>
              <li>
                <strong>Start node index:</strong> the node the traversal begins
                from.
              </li>
              <li>
                <strong>MIDI note per node:</strong> set a MIDI note for each
                node (defaults to its index; middle C = 60). Pick a scale preset
                to assign notes, or randomize notes order.
              </li>
              <li>
                <strong>Generate sequence:</strong> finds all paths from the
                start node, each running until a dead end or until it revisits a
                node (cycle closure). Each path is listed separately and
                concatenated into the flattened output. Drag rows to reorder; the
                flattened output follows your ordering. # notes shows the total in
                the flattened result.
              </li>
              <li>
                <strong>Adjacency matrix:</strong> a reference grid where each
                row's marked columns are the nodes reachable from that row's
                node.
              </li>
              <li>
                <strong>Send notes to main / Send notes to Take 2</strong> push
                the flattened sequence to Home or to the Take 2 page.
              </li>
            </ul>
          </section>

          <section id="take2" className="tutorial-section">
            <h2>Take 2 Sequences And Do A Bunch Of Stuff</h2>
            <p>
              Hold two note sequences and apply operations to generate new ones.
              Enter integers (typically MIDI note numbers) comma-separated into
              sequence 1 and sequence 2.
            </p>
            <ul>
              <li>
                <strong>Per-sequence operations:</strong> Mod By Add By and Add
                By Mod By (apply "mod by" and "add by" in either order), Rotate
                Left, Rotate Right, Reverse, Sum Inversion (uses the "sum
                inversion #"), and Tower of Hanoi It (uses "# discs t_o_h").
              </li>
              <li>
                <strong>Replacement:</strong> set "replace this" and "replace
                with", then apply the replacement to sequence 1 or 2, or use
                "replace with string" to write the result to the output.
              </li>
              <li>
                <strong>Both-sequence operations:</strong> splice sequences
                (interleave them), and multiply by scalars, add together, then
                mod by (using the two scalars and the shared "mod by").
              </li>
              <li>
                <strong>Output and holds:</strong> results land in the output
                box; use the move buttons to push a value into sequence 1,
                sequence 2, or the two "hold this for a sec" slots. Every box has
                a Send notes to main button to push that value to the Home page.
              </li>
            </ul>
          </section>

          <section id="rhythm-compositions" className="tutorial-section">
            <h2>Rhythm Compositions</h2>
            <p>
              Generate every ordered partition (composition) of a rhythmic space
              for a given number of hits. For example, a 5-cell space with 3 hits
              has these 6 compositions:
            </p>
            <ul className="tutorial-mono-list">
              <li>
                <code>[3, 1, 1]</code> -&gt; <code>[1, 0, 0, 1, 1]</code>
              </li>
              <li>
                <code>[2, 2, 1]</code> -&gt; <code>[1, 0, 1, 0, 1]</code>
              </li>
              <li>
                <code>[2, 1, 2]</code> -&gt; <code>[1, 0, 1, 1, 0]</code>
              </li>
              <li>
                <code>[1, 3, 1]</code> -&gt; <code>[1, 1, 0, 0, 1]</code>
              </li>
              <li>
                <code>[1, 2, 2]</code> -&gt; <code>[1, 1, 0, 1, 0]</code>
              </li>
              <li>
                <code>[1, 1, 3]</code> -&gt; <code>[1, 1, 1, 0, 0]</code>
              </li>
            </ul>
            <ul>
              <li>
                <strong>rhythm space (1-16):</strong> the total number of cells
                (16th or 8th notes) the rhythm spans.
              </li>
              <li>
                <strong># of notes:</strong> the number of hits (1s); the rest
                are rests (0s). It cannot exceed the rhythm space.
              </li>
              <li>
                <strong>Generate Rhythms:</strong> lists every composition for
                those values. Click any one to select it, or use Select Random.
              </li>
              <li>
                <strong>Replace rhythm in main:</strong> overwrites the Home page
                rhythm with the selected one. <strong>Add to rhythm in main:</strong>{" "}
                appends the selected rhythm to the existing Home rhythm (the Home
                rhythm must already be valid 0/1 values).
              </li>
            </ul>
          </section>

          <section id="morse" className="tutorial-section">
            <h2>Morse Code Rhythm Generator</h2>
            <p>
              Turn text into rhythm by encoding it as Morse code and translating
              dots, dashes, and gaps into hits and rests. The idea comes from
              Rush's "YYZ", which encodes the letters Y, Y, Z in Morse and plays
              it as rhythm using 1 unit for a dot and 2 units for a dash, with no
              extra rest gaps; that is the default with the YYZ checkbox.
            </p>
            <ul>
              <li>
                <strong>YYZ morse code:</strong> dot = 1, dash = 2, and none of
                the standard rest gaps.
              </li>
              <li>
                <strong>Standard morse code:</strong> dot = 1, dash = 3, inter
                dot/dash gap = 1, inter letter gap = 3, inter word gap = 7
                (standard Morse inserts these rests).
              </li>
              <li>
                <strong>All parameters are adjustable:</strong> Dot duration,
                Dash duration, and the toggleable Inter dot/dash gap, Inter
                letter gap, and Inter word gap (with their own durations), so you
                can experiment with non-standard configurations.
              </li>
              <li>
                <strong>Text to encode:</strong> type any text. Unknown
                characters are skipped.
              </li>
              <li>
                <strong>Generate rhythm:</strong> encodes the text and shows the
                Morse translation, the resulting 0/1 rhythm, and # hits /
                duration. Group chunks the rhythm display visually.
              </li>
              <li>
                <strong>Send rhythm to main:</strong> replaces the Home page
                rhythm with this one.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
