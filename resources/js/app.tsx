import '../css/app.css';
import './i18n';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Import all route definitions via manual aggregator to ensure all modules are included
import routes from './manual-routes';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Set up global route function for Wayfinder compatibility
declare global {
    function route(name?: string, params?: any, absolute?: boolean): any;
}

const resolveRoute = (name: string): any => {
    if (name === 'stock-transfers.index') {
        return {
            url: (params?: any) => {
                const baseUrl = '/stock-transfers';
                const queryString = params ? new URLSearchParams(params).toString() : '';
                return queryString ? `${baseUrl}?${queryString}` : baseUrl;
            }
        };
    }

    const parts = name.split('.');
    let current: any = routes;

    for (const part of parts) {
        if (current && (typeof current === 'object' || typeof current === 'function') && part in current) {
            current = current[part];
        } else {
            // Try converting kebab-case to camelCase
            const camelPart = part.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (current && (typeof current === 'object' || typeof current === 'function') && camelPart in current) {
                current = current[camelPart];
            } else {
                return null;
            }
        }
    }

    return current;
};

const routeFn = (name?: string, params?: any, absolute?: boolean): any => {
    if (!name) {
        return {
            has: (n: string) => {
                const target = resolveRoute(n);
                return !!target && typeof target.url === 'function';
            }
        };
    }

    const current = resolveRoute(name);
    if (!current) {
        throw new Error(`Route '${name}' not found.`);
    }

    if (current && typeof current.url === 'function') {
        const definition = current.definition;
        const hasParams = definition && definition.url && definition.url.includes('{');

        let result;
        if (hasParams) {
            result = current.url(params);
        } else {
            result = current.url(params ? { query: params } : undefined);
        }
        return absolute ? window.location.origin + result : result;
    }

    throw new Error(`Route '${name}' resolved but does not have a url method.`);
};

routeFn.has = (n: string) => {
    const target = resolveRoute(n);
    return !!target && typeof target.url === 'function';
};

globalThis.route = routeFn as any;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
