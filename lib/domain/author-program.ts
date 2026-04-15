import type { BookProductionState, BookProgram } from "@/lib/domain/book-program";

export const AUTHOR_PROGRAM_CONTRACT_VERSION = "1" as const;

export type AuthorBookWorkflow = {
  bookId: string;
  bookProgram: BookProgram;
  productionState: BookProductionState;
  pipelineId: string;
};

export type AuthorProgram = {
  contractVersion: typeof AUTHOR_PROGRAM_CONTRACT_VERSION;
  authorId: string;
  books: AuthorBookWorkflow[];
};
