import { Palette, Building } from 'lucide-react';

export interface SettingMenuItem {
  order: number;
  title: string;
  href: string;
  icon: any;
  permission: string;
  component: string;
}

export const getCompanySettings = (t: (key: string) => string): SettingMenuItem[] => [
  {
    order: 10,
    title: t('Company Settings'),
    href: '#company-settings',
    icon: Building,
    permission: 'manage-company-settings',
    component: 'company-settings'
  },
  {
    order: 20,
    title: t('Brand Settings'),
    href: '#brand-settings',
    icon: Palette,
    permission: 'manage-brand-settings',
    component: 'brand-settings'
  }
];
