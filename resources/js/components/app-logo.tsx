import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useOptionalBrand } from '@/contexts/brand-context';
import { getImagePath } from '@/utils/helpers';
import AppLogoIcon from './app-logo-icon';

export interface AppLogoProps {
    className?: string;
    showText?: boolean;
}

export default function AppLogo({ className = '', showText = true }: AppLogoProps) {
    const brandContext = useOptionalBrand();

    const pageProps = usePage()?.props as any;
    const adminSettings = pageProps?.adminAllSetting || {};
    const companySettings = pageProps?.companyAllSetting || {};
    const pageGlobalSettings = pageProps?.globalSettings || {};

    const settings = {
        ...adminSettings,
        ...companySettings,
        ...pageGlobalSettings,
        ...(brandContext?.settings || {}),
    };

    const getPreviewUrl = brandContext?.getPreviewUrl || ((path: string) => getImagePath(path));

    const resolveLogoUrl = (path?: string | null) => {
        if (!path || typeof path !== 'string') return null;
        const resolved = getPreviewUrl(path);
        if (resolved) return resolved;
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
            return path;
        }
        return `/storage/media/${path}`;
    };

    const themeMode = settings?.themeMode || 'light';
    const isDarkMode =
        themeMode === 'dark' ||
        (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

    const isSidebarColoredOrGradient =
        settings?.sidebarStyle === 'colored' || settings?.sidebarStyle === 'gradient';
    const isDarkBackground = isDarkMode || isSidebarColoredOrGradient;

    // Logo resolution:
    // On dark background (or colored/gradient sidebar), use logo_light (or fallback to logo_dark)
    // On light background, use logo_dark (or fallback to logo_light)
    const selectedLogo = isDarkBackground
        ? (settings?.logo_light || settings?.logo_dark)
        : (settings?.logo_dark || settings?.logo_light);

    const logoUrl = resolveLogoUrl(selectedLogo);
    const faviconUrl = resolveLogoUrl(settings?.favicon);

    const [imgError, setImgError] = useState(false);
    const [favError, setFavError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [logoUrl]);

    useEffect(() => {
        setFavError(false);
    }, [faviconUrl]);

    const titleText = settings?.titleText || 'Vismass';
    const subTitle = settings?.subTitleText || 'Sri Lanka - Yakkala';

    return (
        <div className={`flex items-center gap-2 overflow-hidden ${className}`}>
            {/* Collapsed Icon View (when sidebar is in icon-only mode) */}
            <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full h-full">
                {faviconUrl && !favError ? (
                    <img
                        src={faviconUrl}
                        alt={titleText}
                        className="h-7 w-7 object-contain rounded"
                        onError={() => setFavError(true)}
                    />
                ) : logoUrl && !imgError ? (
                    <img
                        src={logoUrl}
                        alt={titleText}
                        className="h-7 w-7 object-contain rounded"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <AppLogoIcon className="h-6 w-6 fill-current text-sidebar-foreground" />
                )}
            </div>

            {/* Expanded Full Logo View (normal sidebar and headers) */}
            <div className="flex items-center group-data-[collapsible=icon]:hidden max-w-full">
                {logoUrl && !imgError ? (
                    <div className="flex items-center px-1 py-1">
                        <img
                            src={logoUrl}
                            alt={titleText}
                            className="h-9 max-h-9 w-auto max-w-[190px] object-contain object-left shrink-0"
                            onError={() => setImgError(true)}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-start px-2 py-1">
                        <div className="flex items-center font-black tracking-tighter text-2xl leading-none">
                            <span className="text-[#00aeef]">VIS</span>
                            <span className="text-[#737578] dark:text-slate-200">MASS</span>
                        </div>
                        {showText && (
                            <span className="text-[10px] font-medium text-[#444] dark:text-muted-foreground tracking-wider mt-0.5 uppercase truncate max-w-[180px]">
                                {titleText !== 'Vismass' ? titleText : subTitle}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
