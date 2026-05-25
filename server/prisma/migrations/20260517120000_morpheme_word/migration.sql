-- CreateTable
CREATE TABLE "morpheme_word" (
    "id" BIGSERIAL NOT NULL,
    "word_id" BIGINT NOT NULL,
    "morpheme_id" BIGINT NOT NULL,
    "position" "WordRootPosition" NOT NULL,
    "order" INTEGER NOT NULL,
    "display_form" VARCHAR(32),

    CONSTRAINT "morpheme_word_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "morpheme_word_morpheme_id_idx" ON "morpheme_word"("morpheme_id");

-- CreateIndex
CREATE UNIQUE INDEX "morpheme_word_word_id_order_key" ON "morpheme_word"("word_id", "order");

-- AddForeignKey
ALTER TABLE "morpheme_word" ADD CONSTRAINT "morpheme_word_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morpheme_word" ADD CONSTRAINT "morpheme_word_morpheme_id_fkey" FOREIGN KEY ("morpheme_id") REFERENCES "morpheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
