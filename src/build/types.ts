import type { LabMeta } from "./parse.js";

export type Step = {
  // Stable id used in URLs and saved progress.
  key: string;
  // 1-based position within its chapter.
  index: number;
  title: string;
  durationSec: number;
  html: string;
};

export type Chapter = {
  title: string;
  steps: Step[];
  durationSec: number;
};

export type Lab = Omit<LabMeta, "chapters"> & {
  sourceDir: string;
  images: string[];
  chapters: Chapter[];
  steps: Step[];
  totalDurationSec: number;
};
