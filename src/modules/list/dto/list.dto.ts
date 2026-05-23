/**
 * List Module DTOs
 *
 * Data Transfer Objects for the List Feature
 */

// ==================== CREATE & UPDATE ====================

export interface CreateListDto {
  name: string;
  description?: string;
  privacy?: 'PUBLIC' | 'PRIVATE' | 'SHARED';
  bannerImage?: string;
}

export interface UpdateListDto {
  name?: string;
  description?: string;
  privacy?: 'PUBLIC' | 'PRIVATE' | 'SHARED';
  bannerImage?: string;
}

// ==================== MEMBER MANAGEMENT ====================

export interface AddMemberDto {
  username: string;
  permission: 'EDITOR' | 'VIEWER';
  can_edit?: boolean;
  permission_level?: 'owner' | 'edit' | 'view' | 'viewer';
}

export interface UpdateMemberPermissionDto {
  username: string;
  permission: 'EDITOR' | 'VIEWER';
  can_edit?: boolean;
  permission_level?: 'owner' | 'edit' | 'view' | 'viewer';
}

// ==================== INVITATIONS & REQUESTS ====================

export interface InviteMemberDto {
  username: string;
  permission: 'EDITOR' | 'VIEWER';
  message?: string;
}

export interface RequestJoinDto {
  message?: string;
}

export interface RequestEditDto {
  message?: string;
}

export interface RespondToRequestDto {
  action: 'ACCEPT' | 'REJECT' | 'approve' | 'reject';
  message?: string;
}

// ==================== THEME & LIKE ====================

export interface UpdateThemeDto {
  themeKey: string;
  themeColor?: string;
}

export interface LikeToggleDto {
  // No payload needed, toggle via POST
}

// ==================== LIKE DISCOVERY ====================

export interface LikesDiscoveryOptionsDto {
  page?: number;
  limit?: number;
  sortBy?: 'RECENT' | 'POPULAR';
}

export interface LikedListDto {
  id: number;
  name: string;
  slug: string;
  ownerUsername: string;
  likeCount: number;
  itemCount: number;
  bannerImage?: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SHARED';
}

export interface LikesDiscoveryResultDto {
  data: LikedListDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== ANIME ITEMS ====================

export interface AddAnimeToListDto {
  anilistId: number;
  note?: string;
}

export interface UpdateAnimeInListDto {
  note?: string;
  position?: number;
}

// ==================== SEARCH & FILTER ====================

export interface SearchListDto {
  query: string;
  sortBy?: 'RECENT' | 'MOST_LIKED' | 'NAME';
  page?: number;
  limit?: number;
  isPublicOnly?: boolean;
}

// ==================== RESPONSE DTOs ====================

export interface ListDetailDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SHARED';
  isOwner: boolean;
  ownerId: number;
  ownerUsername: string;
  bannerImage?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
  animeItems: AnimeItemInListDto[];
}

export interface AnimeItemInListDto {
  id: number;
  mediaId: number;
  title: string;
  poster?: string;
  note?: string;
  position?: number;
  addedAt: string;
}

export interface ListMemberDto {
  userId: number;
  username: string;
  displayName: string;
  avatar?: string;
  permissionLevel: 'EDITOR' | 'VIEWER';
  isOwner: boolean;
  joinedAt: string;
  can_edit?: boolean;
  permission_level?: 'owner' | 'edit' | 'view' | 'viewer';
  avatar_url?: string;
  is_owner?: boolean;
}

export interface ListRequestDto {
  id: number;
  request_id?: number;
  userId: number;
  username: string;
  requestType: 'JOIN' | 'EDIT';
  request_type?: 'join' | 'edit_permission';
  status: 'pending' | 'approved' | 'rejected';
  status_code?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string;
  requestedAt: string;
  requested_at?: string;
  permissionLevel?: 'EDITOR' | 'VIEWER';
  permission_level?: 'edit' | 'view';
  can_edit?: boolean;
}

export interface ListSummaryDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  ownerUsername: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SHARED';
  bannerImage?: string;
  likeCount: number;
  itemCount: number;
}
