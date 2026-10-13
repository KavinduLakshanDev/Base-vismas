import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Truck, Plus, MapPin, CheckCircle, XCircle, Route, Eye, Edit } from 'lucide-react';

export default function DeliveryRoutesIndex({ routes }: { routes: any[] }) {
    const activeRoutes = routes.filter(route => route.is_active).length;
    const inactiveRoutes = routes.filter(route => !route.is_active).length;
    const totalAreas = routes.reduce((sum, route) => sum + (route.areas?.length || 0), 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'Delivery Routes', href: '/deliveries/routes' }]}>
            <Head title="Delivery Routes - POS System" />

            {/* Radiant Layout Structure with Blue and White Mix */}
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
                {/* Radiant Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,197,253,0.1),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(219,234,254,0.05),transparent_70%)]"></div>

                {/* Header Section with Radiant Glow */}
                <div className="relative bg-linear-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl shadow-blue-500/25 border-b border-blue-400/20 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-600/10"></div>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex items-center justify-between py-6">
                            <div className="flex items-center space-x-4">
                                {/* Enhanced Back Button with Glow */}
                                <button
                                    onClick={() => window.history.back()}
                                    className="mr-2 rounded-xl bg-white/20 backdrop-blur-md p-3 hover:bg-white/30 transition-all duration-300 border border-white/40 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                                    title="Go Back"
                                >
                                    <svg className="h-5 w-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div className="rounded-2xl bg-linear-to-br from-white/20 to-blue-500/30 p-4 shadow-2xl shadow-blue-500/30 backdrop-blur-md border border-white/30">
                                    <Truck className="h-8 w-8 text-white drop-shadow-lg" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                                        Delivery Route Management
                                    </h1>
                                    <p className="text-sm text-blue-100 drop-shadow-md">
                                        Manage delivery routes and service areas
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 shadow-lg shadow-blue-500/20">
                                <span className="text-sm text-white font-semibold px-4 py-2 block drop-shadow-sm">
                                    {new Date().toLocaleDateString('en-GB', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        {/* Radiant Stats Cards */}
                        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 p-4 shadow-xl shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                                        <Route className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-300">Total Routes</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors duration-300">{routes.length}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-blue-400/10 group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-green-500 to-green-600 p-4 shadow-xl shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
                                        <CheckCircle className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors duration-300">Active Routes</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-green-800 transition-colors duration-300">{activeRoutes}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-green-400/10 group-hover:bg-green-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-red-500 to-red-600 p-4 shadow-xl shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300">
                                        <XCircle className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-red-700 transition-colors duration-300">Inactive Routes</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-red-800 transition-colors duration-300">{inactiveRoutes}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-red-400/10 group-hover:bg-red-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 p-4 shadow-xl shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
                                        <MapPin className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors duration-300">Total Areas</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-800 transition-colors duration-300">{totalAreas}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-purple-400/10 group-hover:bg-purple-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Radiant Main Content Card */}
                        <div className="relative rounded-3xl border border-blue-200/50 bg-linear-to-br from-white/80 via-blue-50/30 to-white/80 shadow-2xl shadow-blue-500/10 overflow-hidden backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5"></div>
                            <div className="relative bg-linear-to-r from-blue-600/90 via-blue-500/90 to-blue-600/90 px-8 py-6 shadow-lg">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                                            Delivery Route Management System
                                        </h3>
                                        <p className="text-blue-100 text-sm mt-1 drop-shadow-md">
                                            Create and manage delivery routes for efficient service coverage
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-linear-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/30 backdrop-blur-sm border border-white/20">
                                            ✅ Active: {activeRoutes}
                                        </span>
                                        <Link href="/deliveries/routes/create">
                                            <button className="inline-flex items-center rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 backdrop-blur-md px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 border border-white/30 shadow-lg shadow-blue-500/20">
                                                <Plus className="mr-2 h-5 w-5 drop-shadow-sm" />
                                                Create Route
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 relative z-10">
                                {/* Existing Routes */}
                                <div className="rounded-2xl border border-blue-200/50 bg-white/60 backdrop-blur-sm shadow-xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="rounded-xl bg-linear-to-br from-green-100 to-green-200 p-3 shadow-md shadow-green-500/20">
                                            <Route className="h-6 w-6 text-green-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Delivery Routes</h2>
                                    </div>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {routes.length === 0 ? (
                                            <div className="flex flex-col items-center gap-4 py-8">
                                                <Route className="h-16 w-16 text-blue-300" />
                                                <div className="text-center">
                                                    <p className="text-lg font-semibold text-gray-600">No routes found</p>
                                                    <p className="text-sm text-gray-500">Get started by creating your first delivery route</p>
                                                </div>
                                            </div>
                                        ) : (
                                            routes.map((route) => (
                                                <div key={route.id} className="group relative overflow-hidden rounded-xl border border-blue-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    <div className="flex justify-between items-start relative z-10">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="flex-shrink-0 h-8 w-8">
                                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-md ${
                                                                        route.is_active
                                                                            ? 'bg-linear-to-br from-green-100 to-green-200 shadow-green-500/20'
                                                                            : 'bg-linear-to-br from-gray-100 to-gray-200 shadow-gray-500/20'
                                                                    }`}>
                                                                        <Truck className={`h-4 w-4 ${
                                                                            route.is_active ? 'text-green-600' : 'text-gray-500'
                                                                        }`} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-gray-900">{route.name}</h3>
                                                                    <p className="text-sm text-gray-600">{route.description}</p>
                                                                </div>
                                                            </div>

                                                            {route.areas && route.areas.length > 0 && (
                                                                <div className="mt-3">
                                                                    <p className="text-xs font-semibold text-gray-500 mb-2">Areas Covered:</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {route.areas.map((area: string, index: number) => (
                                                                            <span key={index} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-1 rounded-full">
                                                                                {area}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 ml-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                                                route.is_active
                                                                    ? 'bg-green-100 text-green-800 border-green-200 shadow-sm shadow-green-500/20'
                                                                    : 'bg-red-100 text-red-800 border-red-200 shadow-sm shadow-red-500/20'
                                                            }`}>
                                                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                    route.is_active ? 'bg-green-500' : 'bg-red-500'
                                                                }`}></div>
                                                                {route.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Link
                                                                    href={`/deliveries/routes/${route.id}`}
                                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-200 shadow-sm hover:shadow-md"
                                                                >
                                                                    <Eye className="w-3 h-3 mr-1" />
                                                                    View
                                                                </Link>
                                                                <Link
                                                                    href={`/deliveries/routes/${route.id}/edit`}
                                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors border border-orange-200 shadow-sm hover:shadow-md"
                                                                >
                                                                    <Edit className="w-3 h-3 mr-1" />
                                                                    Edit
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Radiant Footer */}
                <footer className="mt-16 border-t border-blue-200/50 bg-linear-to-r from-white/80 via-blue-50/60 to-white/80 backdrop-blur-sm shadow-inner">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            <p className="text-sm text-gray-700 font-medium drop-shadow-sm">© UNITEC POS System • Delivery Route Management</p>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200/30">
                                <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-pulse"></div>
                                <p className="text-sm text-blue-800 font-semibold">v1.0.0 • Professional POS Solution</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </AppLayout>
    );
}