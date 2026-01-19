import { useNavigationContext } from '../context/NavigationContext';

export function usePermissions(moduleCode: string) {
    const { getModule, isLoaded } = useNavigationContext();

    // Fail closed if navigation is not ready
    if (!isLoaded) {
        return {
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            canExport: false,
            actions: []
        };
    }

    const moduleItem = getModule(moduleCode);

    // Fail closed if module does not exist or user lacks READ
    if (!moduleItem || !moduleItem.actions.includes('read')) {
        return {
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            canExport: false,
            actions: []
        };
    }

    const actions = moduleItem.actions;

    return {
        canCreate: actions.includes('create'),
        canRead: true, // explicitly true because we gated above
        canUpdate: actions.includes('update'),
        canDelete: actions.includes('delete'),
        canExport: actions.includes('export'),
        actions
    };
}
