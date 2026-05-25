export interface UpdateProfileDto {
  username?: string;
  displayName?: string;
  bio?: string | null;
  birthday?: Date | string | null;
  location?: string | null;
  website?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null | '';
}

export interface UpdatePreferencesDto {
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    titleLanguage?: 'romaji' | 'english' | 'native';
    adultContent?: boolean;
  };
  notificationSettings?: {
    email?: boolean;
    push?: boolean;
    follows?: boolean;
    comments?: boolean;
    listUpdates?: boolean;
  };
}

export interface UpdatePrivacyDto {
  profileVisibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
}

export interface UpdateAvatarDto {
  file?: Express.Multer.File;
  alt?: string;
}

export interface UpdateBannerDto {
  file?: Express.Multer.File;
}
