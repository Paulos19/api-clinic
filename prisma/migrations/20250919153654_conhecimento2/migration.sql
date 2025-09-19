/*
  Warnings:

  - You are about to drop the column `basePrompt` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `rawInstructions` on the `KnowledgeBase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."KnowledgeBase" DROP COLUMN "basePrompt",
DROP COLUMN "rawInstructions";

-- CreateTable
CREATE TABLE "public"."KnowledgeField" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "knowledgeBaseId" INTEGER NOT NULL,

    CONSTRAINT "KnowledgeField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."KnowledgeField" ADD CONSTRAINT "KnowledgeField_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "public"."KnowledgeBase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
