
/**
 * Module Domain Model
 * 
 * Represents a system module (e.g., 'Leads', 'Invoices').
 * Corresponds to the 'modules' table.
 */

export interface Module {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    // Metadata
    name: string;
    code: string;
    description?: string | null;

    // Status & Order
    is_active: boolean;
    sort_order?: number | null;
}
