// One Word From Your Ex — writes the one word an ex would use to
// describe the entrant to /output/entry.txt (or ./output/entry.txt
// when run locally).
// Node 22, no dependencies, no network.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const WORD = "avoidant";

const MIN_CHARS = 1;
const MAX_CHARS = 24;
const OUTPUT_FILE = "entry.txt";

function fail(message: string): never {
  throw new Error(message);
}

function validate(word: string): void {
  if (word.length === 0) {
    fail("Refusing to write a blank word.");
  }
  if (word !== word.trim()) {
    fail("Word must not start or end with whitespace.");
  }
  if (word.length < MIN_CHARS || word.length > MAX_CHARS) {
    fail(
      `Word is ${word.length} characters, outside the ${MIN_CHARS}-${MAX_CHARS} range.`,
    );
  }
  if (/\s/.test(word)) {
    fail("Entry must be exactly one word: no spaces allowed.");
  }
  if (!/^[A-Za-z]+$/.test(word)) {
    fail(
      "Entry must be a single plain word: letters only, no hyphens or punctuation.",
    );
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(word)) {
    fail("Word must not contain control characters.");
  }
}

function writeWord(word: string, outDir: string): string {
  // Never write a dotfile into the output folder: the artifact must be
  // exactly entry.txt, nothing hidden alongside it.
  if (basename(OUTPUT_FILE).startsWith(".")) {
    fail("Output file name must not be a dotfile.");
  }
  const outPath = join(outDir, OUTPUT_FILE);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, word + "\n", "utf8");
  return outPath;
}

function main(): void {
  const word = WORD.trim();
  validate(word);

  const outDir = process.env.OUTPUT_DIR?.trim() || "/output";
  let outPath: string;
  try {
    outPath = writeWord(word, outDir);
  } catch {
    // Local run fallback: write next to the working directory.
    outPath = writeWord(word, join(process.cwd(), "output"));
  }

  // Verify the round trip: read back what was written and confirm it
  // matches the word exactly, so a partial or mangled write is caught.
  // Check the text and the UTF-8 byte length, so an encoding-mangled
  // write (for example a doubled letter) is caught too.
  const writtenBytes = readFileSync(outPath);
  const written = writtenBytes.toString("utf8").trimEnd();
  if (written !== word) {
    fail(`Verification failed: ${outPath} does not match the word.`);
  }
  if (writtenBytes.length !== Buffer.byteLength(word + "\n", "utf8")) {
    fail(`Verification failed: ${outPath} has an unexpected byte length.`);
  }
  console.log(`Wrote ${word.length}-character word to ${outPath}`);
}

main();
