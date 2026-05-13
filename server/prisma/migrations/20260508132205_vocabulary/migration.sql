-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('weapp', 'tt');

-- CreateEnum
CREATE TYPE "RootOrigin" AS ENUM ('latin', 'greek', 'old_english', 'french', 'other');

-- CreateEnum
CREATE TYPE "WordRootPosition" AS ENUM ('prefix', 'root', 'suffix');

-- CreateEnum
CREATE TYPE "ExampleLevel" AS ENUM ('basic', 'exam', 'classic', 'advanced', 'root_transfer');

-- CreateEnum
CREATE TYPE "ExampleSource" AS ENUM ('cet4', 'cet6', 'kaoyan', 'ielts', 'toefl', 'movie', 'ted', 'book', 'ugc', 'ai', 'other');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'pending', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "ReviewResult" AS ENUM ('unknown', 'vague', 'known', 'mastered');

-- CreateTable
CREATE TABLE "user" (
    "id" BIGSERIAL NOT NULL,
    "platform" "Platform" NOT NULL,
    "open_id" VARCHAR(64) NOT NULL,
    "supabase_user_id" UUID,
    "union_id" VARCHAR(64),
    "nickname" VARCHAR(64),
    "avatar_url" VARCHAR(512),
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word" (
    "id" BIGSERIAL NOT NULL,
    "spelling" VARCHAR(64) NOT NULL,
    "phonetic_uk" VARCHAR(64),
    "phonetic_us" VARCHAR(64),
    "audio_uk_url" VARCHAR(512),
    "audio_us_url" VARCHAR(512),
    "audio_slow_url" VARCHAR(512),
    "frequency" INTEGER,
    "difficulty" INTEGER,
    "level" JSONB,
    "pos" JSONB,
    "scenes" JSONB,
    "split_pattern" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "root" (
    "id" BIGSERIAL NOT NULL,
    "form" VARCHAR(32) NOT NULL,
    "origin" "RootOrigin" NOT NULL,
    "meaning" VARCHAR(255) NOT NULL,
    "extended_meaning" TEXT,
    "story" TEXT,
    "story_image_url" VARCHAR(512),
    "derivative_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "root_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_root" (
    "id" BIGSERIAL NOT NULL,
    "word_id" BIGINT NOT NULL,
    "root_id" BIGINT NOT NULL,
    "position" "WordRootPosition" NOT NULL,
    "order" INTEGER NOT NULL,
    "display_form" VARCHAR(32),

    CONSTRAINT "word_root_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "example" (
    "id" BIGSERIAL NOT NULL,
    "word_id" BIGINT NOT NULL,
    "target_root_id" BIGINT,
    "sentence" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "level" "ExampleLevel" NOT NULL,
    "source" "ExampleSource" NOT NULL,
    "source_meta" JSONB,
    "audio_uk_url" VARCHAR(512),
    "audio_us_url" VARCHAR(512),
    "audio_slow_url" VARCHAR(512),
    "highlight_spans" JSONB,
    "grammar_tags" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_by" VARCHAR(64) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" BIGSERIAL NOT NULL,
    "word_id" BIGINT NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "thumb_url" VARCHAR(512),
    "duration_ms" INTEGER,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_word_progress" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "word_id" BIGINT NOT NULL,
    "ease_factor" DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMP(3) NOT NULL,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "mastery" INTEGER NOT NULL DEFAULT 1,
    "last_reviewed_at" TIMESTAMP(3),
    "last_response_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_word_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plan" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "exam_type" VARCHAR(32) NOT NULL,
    "exam_date" DATE,
    "daily_new" INTEGER NOT NULL,
    "daily_review" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learn_session" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "new_count" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DECIMAL(4,3),
    "platform" "Platform" NOT NULL,

    CONSTRAINT "learn_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_supabase_user_id_key" ON "user"("supabase_user_id");

-- CreateIndex
CREATE INDEX "user_union_id_idx" ON "user"("union_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_platform_open_id_key" ON "user"("platform", "open_id");

-- CreateIndex
CREATE UNIQUE INDEX "word_spelling_key" ON "word"("spelling");

-- CreateIndex
CREATE INDEX "word_frequency_idx" ON "word"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "root_form_key" ON "root"("form");

-- CreateIndex
CREATE INDEX "word_root_root_id_idx" ON "word_root"("root_id");

-- CreateIndex
CREATE UNIQUE INDEX "word_root_word_id_order_key" ON "word_root"("word_id", "order");

-- CreateIndex
CREATE INDEX "example_word_id_level_status_idx" ON "example"("word_id", "level", "status");

-- CreateIndex
CREATE INDEX "example_target_root_id_status_idx" ON "example"("target_root_id", "status");

-- CreateIndex
CREATE INDEX "media_word_id_idx" ON "media"("word_id");

-- CreateIndex
CREATE INDEX "user_word_progress_due_at_idx" ON "user_word_progress"("due_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_word_progress_user_id_word_id_key" ON "user_word_progress"("user_id", "word_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_plan_user_id_key" ON "user_plan"("user_id");

-- CreateIndex
CREATE INDEX "learn_session_user_id_idx" ON "learn_session"("user_id");

-- AddForeignKey
ALTER TABLE "word_root" ADD CONSTRAINT "word_root_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_root" ADD CONSTRAINT "word_root_root_id_fkey" FOREIGN KEY ("root_id") REFERENCES "root"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "example" ADD CONSTRAINT "example_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "example" ADD CONSTRAINT "example_target_root_id_fkey" FOREIGN KEY ("target_root_id") REFERENCES "root"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan" ADD CONSTRAINT "user_plan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learn_session" ADD CONSTRAINT "learn_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
