// import { useAuthContext } from '../store/AuthContext';
import { useAuthContext } from '../context/AuthContext';

/**
 * Convenience hook for auth state.
 */
export function useAuth() {
    return useAuthContext();
}
