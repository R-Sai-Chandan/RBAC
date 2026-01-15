
/**
 * User Domain Model
 * 
 * Represents a user within an organization.
 * Corresponds to the 'users' table.
 */

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DELETED = 'deleted'
}

export enum SymbolPlacement {
    BEFORE = 'before',
    AFTER = 'after'
}

export enum TrailingZeroHandling {
    SHOW = 'show',
    HIDE = 'hide'
}

export interface User {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    // Auth
    username: string;
    password_hash: string;
    status: UserStatus;

    // Profile
    first_name?: string | null;
    last_name: string;
    title?: string | null;
    department?: string | null;

    // Hierarchy & Group
    reports_to_user_id?: string | null; // BigInt (Self-ref)
    primary_group_id?: string | null; // BigInt

    // Contact
    primary_email: string;
    secondary_email?: string | null;
    other_email?: string | null;

    office_phone: string;
    mobile_phone?: string | null;
    home_phone?: string | null;
    secondary_phone?: string | null;
    fax?: string | null;

    // Address
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;

    // Preferences
    timezone?: string | null;
    business_hours?: Record<string, any> | null; // JSON

    // UI Settings
    default_landing_page?: string | null;
    default_record_view?: string | null;
    name_format?: string | null;
    phone_country_code?: string | null;
    full_screen_preview?: boolean | null;

    // Locale / Currency
    preferred_currency?: string | null;
    digit_grouping_pattern?: string | null;
    decimal_separator?: string | null;
    decimal_precision?: number | null;
    symbol_placement?: SymbolPlacement | null;
    trailing_zero_handling?: TrailingZeroHandling | null;
    aggregation_format?: string | null;

    signature?: string | null;

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt
    readonly updated_at?: Date | null;
    readonly updated_by?: string | null; // BigInt
    is_active?: boolean;
    last_login_at?: Date | null;
    password_changed_at?: Date | null;
}
