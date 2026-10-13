import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Code, Database, File, FileText, Folder, LayoutGrid, Layers, Users, Package, Ruler, Truck, Route, User, Box, Shield, Key, ShoppingCart, Receipt, ArrowRightLeft, Wrench, Printer as PrinterIcon, Plus, History, DollarSign, UserCheck, Gift, ScrollText, Tag, AlertTriangle, Trash2, RefreshCw, Building2, Settings } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { resolveUrl } from '@/lib/utils';
import AppLogo from './app-logo';

// Helper to check roles for items
interface RoleNavItem extends NavItem {
    roles?: string[];
}

// Section 1: Company & Users
const companyNavItems: RoleNavItem[] = [
    {
        title: 'Dashboard',
        href: '/company/dashboard',
        icon: LayoutGrid,
        roles: ['company_admin', 'section_admin', 'technician', 'cashier'], // Everyone needs dashboard? Or usually admins.
    },
    {
        title: 'Company Profile',
        href: '/company/profile',
        icon: BookOpen,
        roles: ['company_admin'],
    },
    {
        title: 'Sections',
        href: '/sections',
        icon: Layers,
        roles: ['company_admin'],
    },
    {
        title: 'User Management',
        href: '/users',
        icon: Users,
        roles: ['company_admin'],
    },
    {
        title: 'Media Library',
        href: '/media-library',
        icon: Folder,
        roles: ['company_admin', 'section_admin', 'technician', 'cashier'],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['company_admin', 'super_admin'],
    },
];

// Section 2: Products & Sales
const productsNavItems: RoleNavItem[] = [];

// Section 3: Printer & Stock Transfer
const printerStockNavItems: RoleNavItem[] = [];

// Section 4: Payments
const paymentsNavItems: RoleNavItem[] = [];

// Section 5: Service Jobs
const servicesNavItems: RoleNavItem[] = [];

// Section 6: Reports
const reportsNavItems: RoleNavItem[] = [];

// Admin items
const adminNavItems: RoleNavItem[] = [
    {
        title: 'Controller Master',
        href: '/admin/controller-master',
        icon: Database,
        roles: ['super_admin', 'company_admin'],
    },
    {
        title: 'Code Master',
        href: '/admin/code-master',
        icon: Code,
        roles: ['super_admin', 'company_admin'],
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
        roles: ['super_admin', 'company_admin'],
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Key,
        roles: ['super_admin', 'company_admin'],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const page = usePage();
    const user = auth.user;

    // Determine user role and type
    const userType = user?.user_type as string | undefined;
    // @ts-ignore - role property comes from eager load but might not be in TS definition yet
    const roleSlug = user?.role?.slug as string | undefined;

    // Helper to check if item should be shown
    const shouldShow = (item: RoleNavItem) => {
        if (userType === 'super_admin') return true;

        // If no roles specified, show to everyone (or specify restrictions)
        if (!item.roles || item.roles.length === 0) return true;

        if (!roleSlug && !userType) return false;

        // Check if user's role is in the allowed roles list
        return (roleSlug && item.roles.includes(roleSlug)) || (userType && item.roles.includes(userType));
    };

    // Filter groups
    const filteredCompanyItems = companyNavItems.filter(shouldShow);
    const filteredProductsItems = productsNavItems.filter(shouldShow);
    const filteredPrinterStockItems = printerStockNavItems.filter(shouldShow);
    const filteredPaymentsItems = paymentsNavItems.filter(shouldShow);
    const filteredServicesItems = servicesNavItems.filter(shouldShow);
    const filteredReportsItems = reportsNavItems.filter(shouldShow);
    const filteredAdminItems = adminNavItems.filter(shouldShow);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Section 1: Company & Users */}
                {filteredCompanyItems.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="text-black font-bold text-sm">Company & Users</SidebarGroupLabel>
                        <SidebarMenu>
                            {filteredCompanyItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(resolveUrl(item.href))}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Section 2: Products & Sales */}
                {filteredProductsItems.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="text-black font-bold text-sm">Products & Sales</SidebarGroupLabel>
                        <SidebarMenu>
                            {filteredProductsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(resolveUrl(item.href))}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Section 3: Printer & Stock Transfer */}
                {filteredPrinterStockItems.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="text-black font-bold text-sm">Stock & Wastage</SidebarGroupLabel>
                        <SidebarMenu>
                            {filteredPrinterStockItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(resolveUrl(item.href))}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Section 4: Payments */}
                {filteredPaymentsItems.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="text-black font-bold text-sm">Payments</SidebarGroupLabel>
                        <SidebarMenu>
                            {filteredPaymentsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(resolveUrl(item.href))}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Section 5: Service Jobs */}
                {filteredServicesItems.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel className="text-black font-bold text-sm">Service Jobs</SidebarGroupLabel>
                        <SidebarMenu>
                            {filteredServicesItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(resolveUrl(item.href))}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}


                {/* Admin Section */}
                {filteredAdminItems.length > 0 && (
                    <SidebarGroup className='px-2 py-0'>
                        <SidebarGroupLabel className="text-black font-bold text-sm">Admin</SidebarGroupLabel>
                        <SidebarMenu>
                            {filteredAdminItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(resolveUrl(item.href))}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
