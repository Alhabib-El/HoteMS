-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "address" TEXT,
ADD COLUMN     "annualLeaveDays" INTEGER NOT NULL DEFAULT 21,
ADD COLUMN     "baseSalary" DECIMAL(10,2),
ADD COLUMN     "dateHired" DATE,
ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "employeeNumber" TEXT,
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "StaffShift" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOutAt" TIMESTAMP(3),

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffShift_staffId_date_key" ON "StaffShift"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeNumber_key" ON "Staff"("employeeNumber");

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

