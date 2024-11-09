/*
  Warnings:

  - You are about to drop the column `versionNumber` on the `Version` table. All the data in the column will be lost.
  - Added the required column `versionName` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Version" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Version_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Version" ("createdAt", "id", "organizationId", "updatedAt") SELECT "createdAt", "id", "organizationId", "updatedAt" FROM "Version";
DROP TABLE "Version";
ALTER TABLE "new_Version" RENAME TO "Version";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
