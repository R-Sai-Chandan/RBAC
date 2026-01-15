
/**
 * Organization Domain Model
 * 
 * Represents the root entity for multi-tenancy.
 * Corresponds to the 'organizations' table.
 */

export interface Organization {
    readonly id: string; // BigInt

    // Core Info
    company_name: string;
    company_logo?: string | null;

    // Address
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;

    // Contact
    phone?: string | null;
    fax?: string | null;
    website?: string | null;

    // Socials
    facebook?: string | null;
    twitter?: string | null;
    linkedin?: string | null;

    // Financial Configuration
    financial_year_start_month?: number | null; // checkBetween 1-12

    // Legal
    gstin: string;

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt (User)
    readonly updated_at?: Date | null;
}
