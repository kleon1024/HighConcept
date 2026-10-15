// The narration's timeline (written by music/aiweek_vo.py): every cue in the picture is a line's start.
import J from "./aiweek.json";
export const AJ = J;
type Line = { text: string; sub: string; t: number; end: number };
type Seg = { id: string; t: number; out: number; lines: Line[] };
const SEGS = J.segments as Seg[];
export const seg = (id: string): Seg => SEGS.find((s) => s.id === id)!;
export const line = (id: string, i: number): Line => seg(id).lines[i];
export const allLines = (): Line[] => SEGS.flatMap((s) => s.lines);
