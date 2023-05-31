/*
  Warnings:

  - The primary key for the `Application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `approvedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `isAccepted` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `isRejected` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `Application` table. All the data in the column will be lost.
  - The primary key for the `Comment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `commendId` on the `Comment` table. All the data in the column will be lost.
  - The required column `id` was added to the `Application` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `commentId` was added to the `Comment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ACCEPTED', 'REJECTED', 'CANCELED', 'PENDING');

-- DropIndex
DROP INDEX "Club_createdAt_id_idx";

-- AlterTable
ALTER TABLE "Application" DROP CONSTRAINT "Application_pkey",
DROP COLUMN "approvedAt",
DROP COLUMN "deletedAt",
DROP COLUMN "isAccepted",
DROP COLUMN "isDeleted",
DROP COLUMN "isRejected",
DROP COLUMN "rejectedAt",
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "Application_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_pkey",
DROP COLUMN "commendId",
ADD COLUMN     "commentId" TEXT NOT NULL,
ADD CONSTRAINT "Comment_pkey" PRIMARY KEY ("commentId");

-- AlterTable
ALTER TABLE "KakaoUser" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MySchedule" (
    "userId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MySchedule_pkey" PRIMARY KEY ("userId","scheduleId")
);

-- AddForeignKey
ALTER TABLE "MySchedule" ADD CONSTRAINT "MySchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MySchedule" ADD CONSTRAINT "MySchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
