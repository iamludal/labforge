import matter from "gray-matter";
import { z } from "zod";

const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : typeof v === "string" ? [v] : v));

export const labMetaSchema = z.object({
  // Used as an output folder name, so keep it path-safe.
  id: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      "must contain only lowercase letters, digits and dashes",
    ),
  title: z.string().min(1),
  summary: z.string().optional(),
  authors: stringList,
  categories: stringList,
  tags: stringList,
  status: z.enum(["draft", "published"]).default("published"),
  feedback: z
    .string()
    .regex(/^https?:\/\/\S+$/, "must be an http(s) URL")
    .optional(),
  // Chapter files, relative to the lab file, in reading order.
  chapters: z
    .array(
      z
        .string()
        .regex(/\.md$/i, "must be a Markdown file path")
        .refine((p) => !/^([a-z][a-z0-9+.-]*:|\/)/i.test(p), {
          message: "must be a relative path",
        }),
    )
    .min(1)
    .optional(),
});

export const chapterMetaSchema = z.object({
  title: z.string().min(1).optional(),
});

export type LabMeta = z.infer<typeof labMetaSchema>;
export type ChapterMeta = z.infer<typeof chapterMetaSchema>;

export function readFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const { data, content } = matter(source);
  return { data, body: content };
}

function validate<T>(
  schema: z.ZodType<T>,
  data: Record<string, unknown>,
  filePath: string,
  hint = "",
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid frontmatter in ${filePath}:\n${details}${hint}`);
}

export function parseLabMeta(
  data: Record<string, unknown>,
  filePath: string,
): LabMeta {
  const hint =
    data.id === undefined
      ? '\n  (if this file is a chapter, list it in the "chapters" field of its lab)'
      : "";
  return validate(labMetaSchema, data, filePath, hint);
}

export function parseChapterMeta(
  data: Record<string, unknown>,
  filePath: string,
): ChapterMeta {
  return validate(chapterMetaSchema, data, filePath);
}
