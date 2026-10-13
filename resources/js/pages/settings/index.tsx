import { useState, Suspense, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allSettingsItems } from '@/utils/settings';
import { getSettingsComponent } from '@/utils/settings-components';

export default function Settings() {
  const { t } = useTranslation();
  const { auth, globalSettings = {}, emailProviders = {}, cacheSize = '0.00', company } = usePage().props as any;
  const sidebarNavItems = allSettingsItems(auth, t);
  const [activeSection, setActiveSection] = useState(
    sidebarNavItems[0]?.href?.replace('#', '') || 'company-settings'
  );



  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarNavItems.map(item => item.href.replace('#', ''));

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sidebarNavItems]);

  return (
    <AppLayout
      breadcrumbs={[{ title: t('Settings'), href: '/settings' }]}
    >
      <Head title={t('Settings')} />

      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Settings')}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <div className="sticky top-4">
              <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="pr-4 space-y-1">
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn('w-full justify-start', {
                      'bg-muted font-medium': activeSection === item.href.replace('#', ''),
                    })}
                    onClick={() => handleNavClick(item.href)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="pr-4">
              {sidebarNavItems.map((item) => {
                const sectionId = item.href.replace('#', '');
                const Component = getSettingsComponent(item.component);
                if (!Component) return null;

                return (
              <section key={sectionId} id={sectionId} className="mb-8">
                <Suspense fallback={<div className="p-4">Loading...</div>}>
                  <Component
                    userSettings={globalSettings}
                    auth={auth}
                    company={company || auth?.company || auth?.active_company || auth?.user?.company}
                    emailProviders={emailProviders}
                    cacheSize={cacheSize}
                  />
                </Suspense>
              </section>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  </AppLayout>
);
}
