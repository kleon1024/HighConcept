// The narration's timeline (written by music/aiweek_vo.py): every cue in the picture is a line's start, or the moment
// a word in it is spoken.
import J from "./aiweek.json";
export const AJ = J;
type Line = { text: string; sub: string; t: number; end: number; ct: number[] };
type Seg = { id: string; t: number; out: number; lines: Line[] };
const SEGS = J.segments as Seg[];
export const seg = (id: string): Seg => SEGS.find((s) => s.id === id)!;
export const line = (id: string, i: number): Line => seg(id).lines[i];
export const allLines = (): Line[] => SEGS.flatMap((s) => s.lines);
// when the narrator says `word` (as written in the script) in line i of segment id, in seconds of the film
export const at = (id: string, i: number, word: string): number => {
  const l = line(id, i), k = l.text.indexOf(word);
  if (k < 0) throw new Error(`"${word}" is not in ${id}[${i}]: ${l.text}`);
  return l.t + l.ct[k];
};
