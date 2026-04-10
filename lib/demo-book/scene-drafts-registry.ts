import { prosePart1 } from "./prose-part1";
import { prosePart2 } from "./prose-part2";
import { prosePart3 } from "./prose-part3";

/** All scene draft bodies keyed by scene id — merged for prisma seed */
export const SCENE_DRAFTS: Record<string, string> = {
  ...prosePart1,
  ...prosePart2,
  ...prosePart3,
};
