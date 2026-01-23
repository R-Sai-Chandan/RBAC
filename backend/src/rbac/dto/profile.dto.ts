export interface ProfileResponseDto {
    id: string;
    name: string;
    description?: string | null;
    permissions: ProfilePermissionFlagDto[];
}

export interface ProfilePermissionFlagDto {
    id: string;
    code: string;        // e.g. PROFILES.read
    allowed: boolean;    // true / false for THIS profile
}
