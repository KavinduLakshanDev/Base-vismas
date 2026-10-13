import { lazy, ComponentType } from 'react';

// Core settings components - only Company and Brand settings
const coreComponents: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {
  'company-settings': lazy(() => import('@/pages/settings/components/company-settings')),
  'brand-settings': lazy(() => import('@/pages/settings/components/brand-settings')),
};

// Combined components registry
export const getSettingsComponent = (componentName: string): React.LazyExoticComponent<ComponentType<any>> | null => {
  return coreComponents[componentName] || null;
};
