import {useMemo} from 'react';
import {useAuthContext} from '../context/AuthContext';
import {UserRole, ADMIN_ROLES} from '../types';

interface UserRoleInfo {
  role: UserRole | null;
  isStudent: boolean;
  isContentAdmin: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canManageContent: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageSubscriptions: boolean;
  canViewAuditLogs: boolean;
}

/**
 * Derived role checks for the current user.
 */
export function useUserRole(): UserRoleInfo {
  const {role} = useAuthContext();

  return useMemo<UserRoleInfo>(
    () => ({
      role,
      isStudent: role === 'student',
      isContentAdmin: role === 'content_admin',
      isSuperAdmin: role === 'super_admin',
      isAdmin: role !== null && ADMIN_ROLES.includes(role),
      canManageContent: role === 'content_admin' || role === 'super_admin',
      canManageUsers: role === 'content_admin' || role === 'super_admin',
      canManageRoles: role === 'super_admin',
      canManageSubscriptions: role === 'super_admin',
      canViewAuditLogs: role === 'content_admin' || role === 'super_admin',
    }),
    [role],
  );
}
