import { lazy } from 'react';

// Core settings components - only Company and Brand settings
const coreComponents = {
  'company-settings': lazy(() => import('@/pages/settings/components/company-settings')),
  'brand-settings': lazy(() => import('@/pages/settings/components/brand-settings')),
};

// Combined components registry
export const getSettingsComponent = (componentName: string) => {
  return coreComponents[componentName as keyof typeof coreComponents] || null;
};
