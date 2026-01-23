/**
 * Landing Page Validation Utilities
 * 
 * Shared logic for validating and determining user's default landing page
 * based on permissions and configuration.
 */

import { IEvaluationService } from '../services/evaluation.service';

// Safe fallback landing page
export const SAFE_FALLBACK_PAGE = '/rbac/profile';

// Valid landing pages (server-side validation whitelist)
export const VALID_LANDING_PAGES = [
    '/rbac/profile',
    '/rbac/users',
    '/rbac/roles',
    '/rbac/profiles',
    '/rbac/groups',
    '/rbac/sharing-rules',
    '/rbac/smtp-config',
    '/rbac/audit-logs'
];

// Path to permission requirements mapping
export const PATH_PERMISSION_REQUIREMENTS: { [key: string]: [string, string] } = {
    '/rbac/users': ['USERS', 'read'],
    '/rbac/roles': ['ROLES', 'read'],
    '/rbac/profiles': ['PROFILES', 'read'],
    '/rbac/groups': ['GROUPS', 'read'],
    '/rbac/sharing-rules': ['SHARING', 'read'],
    '/rbac/smtp-config': ['SMTP_CONFIG', 'read'],
    '/rbac/audit-logs': ['AUDIT', 'read']
};

/**
 * Validates and returns a safe landing page for the user
 * Checks:
 * 1. Page is in whitelist
 * 2. User has permission to access the page
 * Falls back to safe default if validation fails
 */
export async function validateLandingPage(
    requestedPage: string | null | undefined,
    organizationId: string,
    userId: string,
    evaluationService: IEvaluationService
): Promise<string> {
    // Use fallback if no page specified
    let landingPage = requestedPage || SAFE_FALLBACK_PAGE;

    // Check if landing page is in whitelist
    if (!VALID_LANDING_PAGES.includes(landingPage)) {
        return SAFE_FALLBACK_PAGE;
    }

    // Skip permission check for profile page (always allowed)
    if (landingPage === '/rbac/profile') {
        return landingPage;
    }

    // Find permission requirement for this path
    const requirement = Object.entries(PATH_PERMISSION_REQUIREMENTS).find(
        ([path]) => landingPage.startsWith(path)
    );

    if (requirement) {
        const [_, [moduleCode, action]] = requirement;
        try {
            const decision = await evaluationService.evaluate(
                organizationId,
                userId,
                moduleCode,
                action
            );

            // If user lacks permission, fall back to safe page
            if (!decision.granted) {
                return SAFE_FALLBACK_PAGE;
            }
        } catch (error) {
            // On evaluation error, fall back to safe page
            console.error('Error evaluating landing page permission:', error);
            return SAFE_FALLBACK_PAGE;
        }
    }

    return landingPage;
}
