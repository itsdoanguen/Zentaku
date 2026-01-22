-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `statusMessage` VARCHAR(191) NULL,
    `settings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_relationships` (
    `followerId` BIGINT NOT NULL,
    `followingId` BIGINT NOT NULL,
    `type` ENUM('FOLLOW', 'FRIEND', 'BLOCK') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`followerId`, `followingId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `idAnilist` INTEGER NULL,
    `idMal` INTEGER NULL,
    `idMangadex` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `titleRomaji` VARCHAR(191) NOT NULL,
    `titleEnglish` VARCHAR(191) NULL,
    `titleNative` VARCHAR(191) NULL,
    `type` ENUM('ANIME', 'MANGA', 'NOVEL') NOT NULL,
    `status` ENUM('RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED') NOT NULL,
    `coverImage` VARCHAR(191) NULL,
    `bannerImage` VARCHAR(191) NULL,
    `isAdult` BOOLEAN NOT NULL DEFAULT false,
    `averageScore` DOUBLE NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `media_items_idAnilist_key`(`idAnilist`),
    UNIQUE INDEX `media_items_idMal_key`(`idMal`),
    UNIQUE INDEX `media_items_idMangadex_key`(`idMangadex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anime_metadata` (
    `mediaId` BIGINT NOT NULL,
    `episodeCount` INTEGER NULL,
    `durationMin` INTEGER NULL,
    `season` VARCHAR(191) NULL,
    `seasonYear` INTEGER NULL,
    `studio` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `trailerUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`mediaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_metadata` (
    `mediaId` BIGINT NOT NULL,
    `chapters` INTEGER NULL,
    `volumes` INTEGER NULL,
    `author` JSON NULL,
    `serialization` VARCHAR(191) NULL,

    PRIMARY KEY (`mediaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `library_entries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `mediaId` BIGINT NOT NULL,
    `status` ENUM('WATCHING', 'READING', 'COMPLETED', 'PLANNING', 'DROPPED', 'PAUSED') NOT NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `progressVolumes` INTEGER NULL,
    `score` DOUBLE NULL,
    `notes` TEXT NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `rewatchCount` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATE NULL,
    `finishDate` DATE NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `library_entries_userId_mediaId_key`(`userId`, `mediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entryId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    `progressNumber` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_lists` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ownerId` BIGINT NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `privacy` ENUM('PUBLIC', 'PRIVATE', 'SHARED') NOT NULL DEFAULT 'PUBLIC',
    `bannerImage` VARCHAR(191) NULL,
    `settings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `custom_lists_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `list_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `listId` BIGINT NOT NULL,
    `mediaId` BIGINT NOT NULL,
    `addedById` BIGINT NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `list_invitations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `listId` BIGINT NOT NULL,
    `inviterId` BIGINT NOT NULL,
    `inviteeId` BIGINT NOT NULL,
    `permission` ENUM('EDITOR', 'VIEWER') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communities` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ownerId` BIGINT NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `inviteCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `communities_inviteCode_key`(`inviteCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_members` (
    `communityId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    `role` ENUM('ADMIN', 'MODERATOR', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `nickname` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`communityId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channels` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `communityId` BIGINT NULL,
    `name` VARCHAR(191) NULL,
    `type` ENUM('TEXT', 'VOICE', 'WATCH_PARTY') NOT NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel_participants` (
    `channelId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    `lastReadAt` DATETIME(3) NULL,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`channelId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `channelId` BIGINT NOT NULL,
    `senderId` BIGINT NOT NULL,
    `replyToId` BIGINT NULL,
    `content` TEXT NULL,
    `attachments` JSON NULL,
    `isSystemMessage` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `watch_room_configs` (
    `channelId` BIGINT NOT NULL,
    `mediaId` BIGINT NULL,
    `hostId` BIGINT NULL,
    `isPlaying` BOOLEAN NOT NULL DEFAULT false,
    `currentTimestamp` DOUBLE NOT NULL DEFAULT 0.0,
    `currentSourceUrl` VARCHAR(191) NULL,
    `playlistQueue` JSON NULL,
    `settings` JSON NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`channelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metaData` JSON NULL,
    `mediaId` BIGINT NULL,
    `listId` BIGINT NULL,
    `communityId` BIGINT NULL,

    INDEX `activities_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `content` TEXT NOT NULL,
    `isSpoiler` BOOLEAN NOT NULL DEFAULT false,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `mediaId` BIGINT NULL,
    `listId` BIGINT NULL,
    `activityId` BIGINT NULL,
    `targetType` VARCHAR(191) NULL,
    `targetId` BIGINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_relationships` ADD CONSTRAINT `user_relationships_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_relationships` ADD CONSTRAINT `user_relationships_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anime_metadata` ADD CONSTRAINT `anime_metadata_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_metadata` ADD CONSTRAINT `book_metadata_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_entries` ADD CONSTRAINT `library_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_entries` ADD CONSTRAINT `library_entries_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_logs` ADD CONSTRAINT `progress_logs_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `library_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_logs` ADD CONSTRAINT `progress_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_lists` ADD CONSTRAINT `custom_lists_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_items` ADD CONSTRAINT `list_items_listId_fkey` FOREIGN KEY (`listId`) REFERENCES `custom_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_items` ADD CONSTRAINT `list_items_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_items` ADD CONSTRAINT `list_items_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_invitations` ADD CONSTRAINT `list_invitations_listId_fkey` FOREIGN KEY (`listId`) REFERENCES `custom_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_invitations` ADD CONSTRAINT `list_invitations_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `list_invitations` ADD CONSTRAINT `list_invitations_inviteeId_fkey` FOREIGN KEY (`inviteeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communities` ADD CONSTRAINT `communities_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_members` ADD CONSTRAINT `community_members_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_members` ADD CONSTRAINT `community_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channels` ADD CONSTRAINT `channels_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_participants` ADD CONSTRAINT `channel_participants_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_participants` ADD CONSTRAINT `channel_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watch_room_configs` ADD CONSTRAINT `watch_room_configs_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watch_room_configs` ADD CONSTRAINT `watch_room_configs_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `watch_room_configs` ADD CONSTRAINT `watch_room_configs_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_listId_fkey` FOREIGN KEY (`listId`) REFERENCES `custom_lists`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
