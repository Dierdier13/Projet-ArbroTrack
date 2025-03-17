/*
  Warnings:

  - You are about to drop the column `codePostale` on the `property` table. All the data in the column will be lost.
  - Added the required column `codePostal` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `property` DROP COLUMN `codePostale`,
    ADD COLUMN `codePostal` INTEGER NOT NULL,
    ADD COLUMN `latitude` DOUBLE NOT NULL,
    ADD COLUMN `longitude` DOUBLE NOT NULL,
    ADD COLUMN `polygon` VARCHAR(191) NULL;
