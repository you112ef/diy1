export interface Change {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface DiffOptions {
  ignoreWhitespace?: boolean;
  newlineIsToken?: boolean;
}

function splitIntoLinesPreserveNewline(input: string): string[] {
  if (input.length === 0) return [];
  const lines: string[] = [];
  let start = 0;
  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === '\n') {
      lines.push(input.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < input.length) {
    lines.push(input.slice(start));
  }
  return lines;
}

function areLinesEqual(a: string, b: string, ignoreWhitespace: boolean | undefined): boolean {
  if (ignoreWhitespace) {
    // Compare after trimming and collapsing internal whitespace sequences
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    return normalize(a) === normalize(b);
  }
  return a === b;
}

export function diffLines(oldStr: string, newStr: string, options?: DiffOptions): Change[] {
  const ignoreWhitespace = options?.ignoreWhitespace === true;

  const a = splitIntoLinesPreserveNewline(oldStr.replace(/\r\n/g, '\n'));
  const b = splitIntoLinesPreserveNewline(newStr.replace(/\r\n/g, '\n'));

  const aLen = a.length;
  const bLen = b.length;

  // LCS matrix
  const lcs: number[][] = new Array(aLen + 1);
  for (let i = 0; i <= aLen; i += 1) {
    lcs[i] = new Array(bLen + 1).fill(0);
  }

  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      if (areLinesEqual(a[i - 1], b[j - 1], ignoreWhitespace)) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to build changes
  const changesReversed: Change[] = [];
  let i = aLen;
  let j = bLen;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && areLinesEqual(a[i - 1], b[j - 1], ignoreWhitespace)) {
      // equal line
      changesReversed.push({ value: a[i - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // added in b
      changesReversed.push({ value: b[j - 1], added: true });
      j -= 1;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      // removed from a
      changesReversed.push({ value: a[i - 1], removed: true });
      i -= 1;
    }
  }

  // Reverse and coalesce consecutive segments of the same type
  const changes: Change[] = [];
  for (let k = changesReversed.length - 1; k >= 0; k -= 1) {
    const current = changesReversed[k];
    const last = changes[changes.length - 1];
    if (
      last &&
      ((last.added && current.added) || (last.removed && current.removed) || (!last.added && !last.removed && !current.added && !current.removed))
    ) {
      last.value += current.value;
    } else {
      changes.push({ ...current });
    }
  }

  return changes;
}

export function createTwoFilesPatch(
  _oldFileName: string,
  _newFileName: string,
  oldFileContent: string,
  newFileContent: string,
): string {
  const changes = diffLines(oldFileContent, newFileContent);

  // If there are no changes, return empty string
  if (changes.length === 1 && !changes[0].added && !changes[0].removed) {
    return '';
  }

  const lines: string[] = [];
  for (const change of changes) {
    if (change.added) {
      // Emit only added lines with '+' prefix
      const parts = splitIntoLinesPreserveNewline(change.value);
      for (const part of parts) {
        if (part.length === 0) continue;
        lines.push(`+ ${part.endsWith('\n') ? part.slice(0, -1) : part}`);
      }
    } else if (change.removed) {
      // Emit only removed lines with '-' prefix
      const parts = splitIntoLinesPreserveNewline(change.value);
      for (const part of parts) {
        if (part.length === 0) continue;
        lines.push(`- ${part.endsWith('\n') ? part.slice(0, -1) : part}`);
      }
    } else {
      // Skip unchanged lines to keep the diff compact
      continue;
    }
  }

  return lines.join('\n');
}

