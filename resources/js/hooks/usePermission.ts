import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { props } = usePage<any>();
    const user = props.auth?.user;

    const hasPermission = (permissionSlug: string): boolean => {
        if (!user) return false;

        // Super Admin users bypass all checks
        if (user.user_type === 'super_admin') return true;

        if (!user.role) return false;

        // Super Admin and Company Admin roles bypass checks
        if (user.role.level === 'super_admin' || user.role.level === 'company_admin') return true;

        const permissions = user.role.permissions || [];

        // Direct check
        if (permissions.some((p: any) => p.slug === permissionSlug || p.name === permissionSlug)) {
            return true;
        }

        // Bridge hyphenated and dot notation (e.g. create-roles <-> roles.create)
        if (permissionSlug.includes('-')) {
            const [action, resource] = permissionSlug.split('-', 2);
            if (permissions.some((p: any) => p.slug === `${resource}.${action}`)) return true;
            if (action === 'manage' && permissions.some((p: any) => p.slug === `${resource}.view`)) return true;
        } else if (permissionSlug.includes('.')) {
            const [resource, action] = permissionSlug.split('.', 2);
            if (permissions.some((p: any) => p.slug === `${action}-${resource}`)) return true;
            if (action === 'view' && permissions.some((p: any) => p.slug === `manage-${resource}`)) return true;
        }

        return false;
    };

    return { hasPermission };
}
