-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "thumbnail" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetOtp" TEXT,
ADD COLUMN     "resetOtpExpires" TIMESTAMP(3),
ALTER COLUMN "name" DROP NOT NULL;
