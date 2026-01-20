
export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    first_name?: string;
    last_name?: string;
    organization_id?: string;
    roles?: Role[];
    status?: 'active' | 'inactive';
}

export interface Organization {
    id: string;
    name: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    is_system?: boolean;
    parent_role_id?: string | null;
}

export interface Permission {
    id: string;
    module_id: string;
    action: string;
    description?: string;
}

export interface Module {
    code: string;
    name: string;
    actions: string[];
}
