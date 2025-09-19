-- CreateTable
CREATE TABLE "public"."KnowledgeBase" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "basePrompt" TEXT,
    "rawInstructions" TEXT,
    "knowledgeText" TEXT,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);
