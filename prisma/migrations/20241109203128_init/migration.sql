-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OTP" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OTP" ("code", "createdAt", "email", "expiresAt", "id", "isUsed", "userId") SELECT "code", "createdAt", "email", "expiresAt", "id", "isUsed", "userId" FROM "OTP";
DROP TABLE "OTP";
ALTER TABLE "new_OTP" RENAME TO "OTP";
CREATE INDEX "OTP_email_isUsed_expiresAt_idx" ON "OTP"("email", "isUsed", "expiresAt");
CREATE INDEX "OTP_code_isUsed_idx" ON "OTP"("code", "isUsed");
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "progress" REAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "createdById", "description", "endDate", "id", "name", "organizationId", "progress", "startDate", "type", "updatedAt") SELECT "createdAt", "createdById", "description", "endDate", "id", "name", "organizationId", "progress", "startDate", "type", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_TaskRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "client_satisfaction" INTEGER DEFAULT 0,
    "client_weight" INTEGER DEFAULT 0,
    "effort" INTEGER DEFAULT 0,
    CONSTRAINT "TaskRating_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskRating" ("client_satisfaction", "client_weight", "effort", "id", "taskId", "userId") SELECT "client_satisfaction", "client_weight", "effort", "id", "taskId", "userId" FROM "TaskRating";
DROP TABLE "TaskRating";
ALTER TABLE "new_TaskRating" RENAME TO "TaskRating";
CREATE UNIQUE INDEX "TaskRating_taskId_userId_key" ON "TaskRating"("taskId", "userId");
CREATE TABLE "new_UserOrganization" (
    "userId" INTEGER NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "organizationId"),
    CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserOrganization" ("organizationId", "userId", "weight") SELECT "organizationId", "userId", "weight" FROM "UserOrganization";
DROP TABLE "UserOrganization";
ALTER TABLE "new_UserOrganization" RENAME TO "UserOrganization";
CREATE TABLE "new_Version" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Version_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Version" ("createdAt", "id", "organizationId", "updatedAt", "versionName") SELECT "createdAt", "id", "organizationId", "updatedAt", "versionName" FROM "Version";
DROP TABLE "Version";
ALTER TABLE "new_Version" RENAME TO "Version";
CREATE TABLE "new_VersionTask" (
    "versionId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,

    PRIMARY KEY ("versionId", "taskId"),
    CONSTRAINT "VersionTask_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VersionTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VersionTask" ("taskId", "versionId") SELECT "taskId", "versionId" FROM "VersionTask";
DROP TABLE "VersionTask";
ALTER TABLE "new_VersionTask" RENAME TO "VersionTask";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
