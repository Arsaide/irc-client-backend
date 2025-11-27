-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "chat_members" ADD COLUMN     "role" "ChatRole" NOT NULL DEFAULT 'MEMBER';
