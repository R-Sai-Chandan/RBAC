import { useNavigationContext } from '../context/NavigationContext';

export function useNavigation() {
    const { modules, getModule, loading, error } = useNavigationContext();

    const hasModule = (code: string) => {
        return !!getModule(code);
    };

    return {
        modules,
        getModule,
        hasModule,
        loading,
        error
    };
}
