-- CreateEnum
CREATE TYPE "RootRelationKind" AS ENUM ('cognate', 'similar_meaning', 'opposite', 'similar_form');

-- CreateEnum
CREATE TYPE "WordRelationKind" AS ENUM ('synonym', 'antonym', 'similar_form');

-- CreateTable
CREATE TABLE "root_relation" (
    "id" BIGSERIAL NOT NULL,
    "from_root_id" BIGINT NOT NULL,
    "to_root_id" BIGINT NOT NULL,
    "kind" "RootRelationKind" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "root_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_relation" (
    "id" BIGSERIAL NOT NULL,
    "from_word_id" BIGINT NOT NULL,
    "to_word_id" BIGINT NOT NULL,
    "kind" "WordRelationKind" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "word_relation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "root_relation_from_root_id_idx" ON "root_relation"("from_root_id");

-- CreateIndex
CREATE INDEX "root_relation_to_root_id_idx" ON "root_relation"("to_root_id");

-- CreateIndex
CREATE UNIQUE INDEX "root_relation_from_root_id_to_root_id_kind_key" ON "root_relation"("from_root_id", "to_root_id", "kind");

-- CreateIndex
CREATE INDEX "word_relation_from_word_id_idx" ON "word_relation"("from_word_id");

-- CreateIndex
CREATE INDEX "word_relation_to_word_id_idx" ON "word_relation"("to_word_id");

-- CreateIndex
CREATE UNIQUE INDEX "word_relation_from_word_id_to_word_id_kind_key" ON "word_relation"("from_word_id", "to_word_id", "kind");

-- AddForeignKey
ALTER TABLE "root_relation" ADD CONSTRAINT "root_relation_from_root_id_fkey" FOREIGN KEY ("from_root_id") REFERENCES "root"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_relation" ADD CONSTRAINT "root_relation_to_root_id_fkey" FOREIGN KEY ("to_root_id") REFERENCES "root"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_relation" ADD CONSTRAINT "word_relation_from_word_id_fkey" FOREIGN KEY ("from_word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_relation" ADD CONSTRAINT "word_relation_to_word_id_fkey" FOREIGN KEY ("to_word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
