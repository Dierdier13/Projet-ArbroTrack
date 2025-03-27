/*
  Warnings:

  - You are about to drop the column `name` on the `property` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `sector` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - Added the required column `propertyName` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectorName` to the `Sector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastname` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `property` DROP COLUMN `name`,
    ADD COLUMN `propertyName` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `sector` DROP COLUMN `name`,
    ADD COLUMN `sectorName` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tree` ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `name`,
    ADD COLUMN `lastname` VARCHAR(191) NOT NULL;
