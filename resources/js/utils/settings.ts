import { SettingMenuItem } from './menus/superadmin-setting';
import { getSuperAdminSettings } from './menus/superadmin-setting';
import { getCompanySettings } from './menus/company-setting';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

// Get role-based core settings items
const getCoreSettingsItems = (userRoles: string[], t: (key: string) => string): SettingMenuItem[] => {
    if (userRoles.includes('superadmin') || userRoles.includes('super_admin')) {
        return getSuperAdminSettings(t);
    }
    return getCompanySettings(t);
};

// Auto-load package settings based on activated packages
const getPackageSettingsItems = (userRoles: string[], activatedPackages: string[], t: (key: string) => string): SettingMenuItem[] => {
    const menuItems: SettingMenuItem[] = [];
    const isSuperAdmin = userRoles.includes('superadmin') || userRoles.includes('super_admin');
    const settingType = isSuperAdmin ? 'superadmin-setting' : 'company-setting';

    const allModules = isSuperAdmin
        ? import.meta.glob('../../../packages/BlackRandy/*/src/Resources/js/settings/superadmin-setting.ts', { eager: true })
        : import.meta.glob('../../../packages/BlackRandy/*/src/Resources/js/settings/company-setting.ts', { eager: true });

    (Array.isArray(activatedPackages) ? activatedPackages : []).forEach(packageName => {
        const settingPath = `../../../packages/BlackRandy/${packageName}/src/Resources/js/settings/${settingType}.ts`;
        const module = allModules[settingPath] as any;

        if (module) {
            Object.values(module).forEach((item: any) => {
                const result = typeof item === 'function' ? item(t) : item;
                const items = Array.isArray(result) ? result : [result];
                menuItems.push(...items);
            });
        }
    });

    return menuItems;
};

// Filter settings items based on permissions
const filterByPermission = (items: SettingMenuItem[], userPermissions: string[], userRoles: string[] = []): SettingMenuItem[] => {
    const isPrivileged = userRoles.some(r => ['superadmin', 'super_admin', 'company', 'company_admin'].includes(r));
    if (isPrivileged) {
        return items;
    }
    if (!userPermissions || userPermissions.length === 0) {
        return items;
    }
    return items.filter(item => userPermissions.includes(item.permission) || !item.permission);
};

// Main function to get filtered settings items
export const allSettingsItems = (authParam?: any, tParam?: (key: string) => string): SettingMenuItem[] => {
    let auth = authParam;
    let t = tParam;
    if (!auth) {
        try {
            auth = (usePage().props as any)?.auth;
        } catch {}
    }
    if (!t) {
        t = (key: string) => key;
    }
    const user = auth?.user || auth?.company;
    const userPermissions: string[] = user?.permissions || [];
    const rawRoles = user?.roles || (user?.user_type ? [user.user_type] : []);
    const userRoles: string[] = Array.isArray(rawRoles) ? [...rawRoles] : Object.values(rawRoles || {});
    if (auth?.company && !userRoles.includes('company')) {
        userRoles.push('company');
    }
    const activatedPackages = user?.activatedPackages || [];

    const coreSettingsItems = getCoreSettingsItems(userRoles, t);
    const packageSettingsItems = getPackageSettingsItems(userRoles, activatedPackages, t);

    const allItems = [...coreSettingsItems, ...packageSettingsItems];

    // Sort by order
    const sortedItems = allItems.sort((a, b) => (a.order || 999) - (b.order || 999));

    return filterByPermission(sortedItems, userPermissions, userRoles);
};