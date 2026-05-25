CREATE TYPE "MorphemeKind" AS ENUM ('root', 'prefix', 'suffix', 'combining_form');

CREATE TYPE "MorphemeLevel" AS ENUM ('core', 'advanced', 'specialist');

CREATE TABLE "morpheme" (
    "id" BIGSERIAL NOT NULL,
    "form" VARCHAR(64) NOT NULL,
    "normalized_form" VARCHAR(64) NOT NULL,
    "kind" "MorphemeKind" NOT NULL,
    "origin" "RootOrigin" NOT NULL,
    "origin_label" VARCHAR(128) NOT NULL,
    "meaning" VARCHAR(255) NOT NULL,
    "extended_meaning" TEXT,
    "etymology" TEXT,
    "aliases" JSONB,
    "examples" JSONB,
    "tags" JSONB,
    "level" "MorphemeLevel" NOT NULL DEFAULT 'core',
    "frequency_rank" INTEGER,
    "productivity" INTEGER NOT NULL DEFAULT 0,
    "derivative_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "morpheme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "morpheme_kind_normalized_form_key" ON "morpheme"("kind", "normalized_form");
CREATE INDEX "morpheme_kind_origin_idx" ON "morpheme"("kind", "origin");
CREATE INDEX "morpheme_level_kind_idx" ON "morpheme"("level", "kind");
CREATE INDEX "morpheme_frequency_rank_idx" ON "morpheme"("frequency_rank");
