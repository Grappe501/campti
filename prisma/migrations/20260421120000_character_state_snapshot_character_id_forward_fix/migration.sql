-- Forward-fix: canonicalize CharacterStateSnapshot to use `characterId`.
-- This reconciles environments that still have `personId` and removes reliance on manual DB patching.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CharacterStateSnapshot'
      AND column_name = 'personId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CharacterStateSnapshot'
      AND column_name = 'characterId'
  ) THEN
    ALTER TABLE "CharacterStateSnapshot" RENAME COLUMN "personId" TO "characterId";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CharacterStateSnapshot'
      AND column_name = 'personId'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CharacterStateSnapshot'
      AND column_name = 'characterId'
  ) THEN
    UPDATE "CharacterStateSnapshot"
    SET "characterId" = "personId"
    WHERE "characterId" IS NULL;
  END IF;
END
$$;

DO $$
DECLARE
  fk_name text;
BEGIN
  FOR fk_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a
      ON a.attrelid = t.oid
     AND a.attnum = ANY (c.conkey)
    WHERE t.relname = 'CharacterStateSnapshot'
      AND c.contype = 'f'
      AND a.attname = 'personId'
  LOOP
    EXECUTE format('ALTER TABLE "CharacterStateSnapshot" DROP CONSTRAINT IF EXISTS %I', fk_name);
  END LOOP;
END
$$;

ALTER TABLE "CharacterStateSnapshot"
ALTER COLUMN "characterId" SET NOT NULL;

ALTER TABLE "CharacterStateSnapshot"
DROP COLUMN IF EXISTS "personId";

DROP INDEX IF EXISTS "CharacterStateSnapshot_personId_idx";
DROP INDEX IF EXISTS "CharacterCognitionSnapshot_personId_idx";

CREATE INDEX IF NOT EXISTS "CharacterStateSnapshot_characterId_idx"
ON "CharacterStateSnapshot" ("characterId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'CharacterStateSnapshot'
      AND c.conname = 'CharacterStateSnapshot_characterId_fkey'
  ) THEN
    ALTER TABLE "CharacterStateSnapshot"
      ADD CONSTRAINT "CharacterStateSnapshot_characterId_fkey"
      FOREIGN KEY ("characterId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
