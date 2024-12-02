/*
  Warnings:

  - You are about to drop the column `effort` on the `TaskRating` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "deselected" BOOLEAN NOT NULL DEFAULT false,
    "effort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "createdById", "description", "deselected", "endDate", "id", "name", "organizationId", "progress", "startDate", "type", "updatedAt") SELECT "createdAt", "createdById", "description", "deselected", "endDate", "id", "name", "organizationId", "progress", "startDate", "type", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_TaskRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "client_satisfaction" INTEGER DEFAULT 0,
    "client_weight" INTEGER DEFAULT 0,
    CONSTRAINT "TaskRating_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskRating" ("client_satisfaction", "client_weight", "id", "taskId", "userId") SELECT "client_satisfaction", "client_weight", "id", "taskId", "userId" FROM "TaskRating";
DROP TABLE "TaskRating";
ALTER TABLE "new_TaskRating" RENAME TO "TaskRating";
CREATE UNIQUE INDEX "TaskRating_taskId_userId_key" ON "TaskRating"("taskId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
