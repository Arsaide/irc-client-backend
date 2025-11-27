/*
  Warnings:

  - A unique constraint covering the columns `[irc_nickname]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "irc_nickname" TEXT;

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "irc_channel_name" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_members" (
    "id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chats_irc_channel_name_key" ON "chats"("irc_channel_name");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_user_id_chat_id_key" ON "chat_members"("user_id", "chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_irc_nickname_key" ON "users"("irc_nickname");

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
