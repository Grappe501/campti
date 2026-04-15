import {
  AUTHOR_PROGRAM_CONTRACT_VERSION,
  type AuthorBookWorkflow,
  type AuthorProgram,
} from "@/lib/domain/author-program";
import type { BookProductionState } from "@/lib/domain/book-program";

function normalizeBooks(books: AuthorBookWorkflow[]): AuthorBookWorkflow[] {
  const seenBookIds = new Set<string>();
  return books.flatMap((book) => {
    const bookId = book.bookId.trim();
    if (!bookId || seenBookIds.has(bookId)) {
      return [];
    }
    seenBookIds.add(bookId);
    return [{ ...book, bookId, pipelineId: book.pipelineId.trim() }];
  });
}

export function createAuthorProgram(input: {
  authorId: string;
  books: AuthorBookWorkflow[];
}): AuthorProgram {
  const authorId = input.authorId.trim();
  if (!authorId) {
    throw new Error("[author-program] authorId is required.");
  }

  const books = normalizeBooks(input.books);
  if (books.length === 0) {
    throw new Error("[author-program] at least one book workflow is required.");
  }

  return {
    contractVersion: AUTHOR_PROGRAM_CONTRACT_VERSION,
    authorId,
    books,
  };
}

export function updateAuthorBookProductionState(input: {
  program: AuthorProgram;
  bookId: string;
  productionState: BookProductionState;
}): AuthorProgram {
  const bookId = input.bookId.trim();
  const existing = input.program.books.find((book) => book.bookId === bookId);
  if (!existing) {
    throw new Error(`[author-program] book ${bookId} is not managed by author ${input.program.authorId}.`);
  }

  return {
    ...input.program,
    books: input.program.books.map((book) =>
      book.bookId === bookId
        ? {
            ...book,
            productionState: input.productionState,
          }
        : book
    ),
  };
}
