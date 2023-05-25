-- DropIndex
DROP INDEX "Post_createdAt_idx";

-- CreateIndex
CREATE INDEX "Post_createdAt_id_idx" ON "Post"("createdAt", "id");
