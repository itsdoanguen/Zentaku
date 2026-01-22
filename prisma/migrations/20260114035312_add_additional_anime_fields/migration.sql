-- AlterTable
ALTER TABLE `anime_metadata` ADD COLUMN `nextAiringEpisode` JSON NULL;

-- AlterTable
ALTER TABLE `media_items` ADD COLUMN `favorites` INTEGER NULL,
    ADD COLUMN `genres` JSON NULL,
    ADD COLUMN `meanScore` DOUBLE NULL,
    ADD COLUMN `popularity` INTEGER NULL,
    ADD COLUMN `synonyms` JSON NULL,
    ADD COLUMN `tags` JSON NULL;
