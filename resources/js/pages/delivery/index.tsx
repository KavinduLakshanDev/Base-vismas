import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Truck, Plus, MapPin, CheckCircle, Clock, Package, Eye, Edit, Trash } from 'lucide-react';

export default function DeliveryIndex({ deliveries, routes, distributors }: { deliveries: any[], routes: any[], distributors: any[] }) {
    const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
    const deliveringCount = deliveries.filter(d => d.status === 'delivering').length;
    const assignedCount = deliveries.filter(d => d.status === 'assigned').length;
    const totalRoutes = routes.length;

    const updateStatus = (deliveryId: number, status: string) => {
        router.patch(`/deliveries/${deliveryId}/status`, { status });
    };

    const deactivateDelivery = (deliveryId: number) => {
        if (confirm('Are you sure you want to deactivate this delivery?')) {
            router.patch(`/deliveries/${deliveryId}/deactivate`, {});
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Deliveries', href: '/deliveries' }]}>
            <Head title="Delivery Management - POS System" />

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
                                        Delivery Management
                                    </h1>
                                    <p className="text-sm text-blue-100 drop-shadow-md">
                                        Manage and track delivery operations
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
                                        <Package className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-300">Total Deliveries</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors duration-300">{deliveries.length}</p>
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
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors duration-300">Delivered</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-green-800 transition-colors duration-300">{deliveredCount}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-green-400/10 group-hover:bg-green-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 p-4 shadow-xl shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
                                        <Clock className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-700 transition-colors duration-300">In Transit</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-800 transition-colors duration-300">{deliveringCount}</p>
                                    </div>
                                </div>
                                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-orange-400/10 group-hover:bg-orange-500/20 transition-colors duration-500"></div>
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse"></div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-blue-50/50 to-white p-6 shadow-xl shadow-blue-500/10 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 border border-blue-200/50 backdrop-blur-sm hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-center relative z-10">
                                    <div className="rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 p-4 shadow-xl shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
                                        <MapPin className="h-7 w-7 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors duration-300">Active Routes</p>
                                        <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-800 transition-colors duration-300">{totalRoutes}</p>
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
                                            Delivery Management System
                                        </h3>
                                        <p className="text-blue-100 text-sm mt-1 drop-shadow-md">
                                            Assign and track delivery operations across routes
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-linear-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/30 backdrop-blur-sm border border-white/20">
                                            ✅ Active: {assignedCount + deliveringCount}
                                        </span>
                                        <Link
                                            href="/deliveries/create"
                                            className="inline-flex items-center rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 backdrop-blur-md px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 border border-white/30 shadow-lg shadow-blue-500/20"
                                        >
                                            <Plus className="mr-2 h-5 w-5 drop-shadow-sm" />
                                            Assign Delivery
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 relative z-10">
                                {/* Active Deliveries Table - Full Width */}
                                <div className="rounded-2xl border border-blue-200/50 bg-white/60 backdrop-blur-sm shadow-xl p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="rounded-xl bg-linear-to-br from-green-100 to-green-200 p-3 shadow-md shadow-green-500/20">
                                            <Truck className="h-6 w-6 text-green-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Active Deliveries</h2>
                                    </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-blue-200/50">
                                                <thead className="bg-linear-to-r from-blue-600/90 to-blue-500/90 backdrop-blur-sm">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Package className="h-4 w-4" />
                                                                Delivery
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-4 w-4" />
                                                                Customer
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">Route</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">Driver</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">Status</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white/80 divide-y divide-blue-100/50">
                                                    {deliveries.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center gap-4">
                                                                    <Truck className="h-16 w-16 text-blue-300" />
                                                                    <div>
                                                                        <p className="text-lg font-semibold text-gray-600">No deliveries found</p>
                                                                        <p className="text-sm text-gray-500">Assign your first delivery to get started</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        deliveries.map((delivery) => (
                                                            <tr key={delivery.id} className="group hover:bg-linear-to-r hover:from-blue-50/50 hover:to-white/80 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className="flex-shrink-0 h-10 w-10">
                                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${
                                                                                delivery.status === 'delivered'
                                                                                    ? 'bg-linear-to-br from-green-100 to-green-200 shadow-green-500/20'
                                                                                    : delivery.status === 'delivering'
                                                                                    ? 'bg-linear-to-br from-blue-100 to-blue-200 shadow-blue-500/20'
                                                                                    : delivery.status === 'cancelled'
                                                                                    ? 'bg-linear-to-br from-red-100 to-red-200 shadow-red-500/20'
                                                                                    : 'bg-linear-to-br from-gray-100 to-gray-200 shadow-gray-500/20'
                                                                            }`}>
                                                                                <Package className={`h-5 w-5 ${
                                                                                    delivery.status === 'delivered'
                                                                                        ? 'text-green-600'
                                                                                        : delivery.status === 'delivering'
                                                                                        ? 'text-blue-600'
                                                                                        : delivery.status === 'cancelled'
                                                                                        ? 'text-red-600'
                                                                                        : 'text-gray-500'
                                                                                }`} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="ml-4">
                                                                            <div className="text-sm font-bold text-gray-900">{delivery.delivery_number}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-semibold text-gray-900">{delivery.customer_name}</div>
                                                                    <div className="text-sm text-gray-500">{delivery.customer_address}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                                                        {delivery.route?.name || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{delivery.distributor ? `${delivery.distributor.first_name} ${delivery.distributor.last_name}` : '-'}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                                                                        delivery.status === 'delivered'
                                                                            ? 'bg-green-100 text-green-800 border-green-200 shadow-sm shadow-green-500/20'
                                                                            : delivery.status === 'delivering'
                                                                            ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm shadow-blue-500/20'
                                                                            : delivery.status === 'cancelled'
                                                                            ? 'bg-red-100 text-red-800 border-red-200 shadow-sm shadow-red-500/20'
                                                                            : 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm shadow-gray-500/20'
                                                                    }`}>
                                                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                            delivery.status === 'delivered' ? 'bg-green-500' :
                                                                            delivery.status === 'delivering' ? 'bg-blue-500' :
                                                                            delivery.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                                                        }`}></div>
                                                                        {delivery.status === 'delivered' ? 'Delivered' :
                                                                         delivery.status === 'delivering' ? 'In Transit' :
                                                                         delivery.status === 'cancelled' ? 'Cancelled' : 'Assigned'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center space-x-2">
                                                                        {delivery.status === 'assigned' && (
                                                                            <button
                                                                                onClick={() => updateStatus(delivery.id, 'delivering')}
                                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-200"
                                                                            >
                                                                                <Clock className="w-3 h-3 mr-1" />
                                                                                Start
                                                                            </button>
                                                                        )}
                                                                        {delivery.status === 'delivering' && (
                                                                            <button
                                                                                onClick={() => updateStatus(delivery.id, 'delivered')}
                                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors border border-green-200"
                                                                            >
                                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                                Complete
                                                                            </button>
                                                                        )}
                                                                        <Link
                                                                            href={`/deliveries/${delivery.id}`}
                                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors border border-orange-200"
                                                                        >
                                                                            <Eye className="w-3 h-3 mr-1" />
                                                                            View
                                                                        </Link>
                                                                        <Link
                                                                            href={`/deliveries/${delivery.id}/edit`}
                                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors border border-purple-200"
                                                                        >
                                                                            <Edit className="w-3 h-3 mr-1" />
                                                                            Edit
                                                                        </Link>
                                                                        {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                                                                            <button
                                                                                onClick={() => updateStatus(delivery.id, 'cancelled')}
                                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors border border-red-200"
                                                                            >
                                                                                <Trash className="w-3 h-3 mr-1" />
                                                                                Deactivate
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Radiant Table Footer */}
                                        {deliveries.length > 0 && (
                                            <div className="border-t border-blue-200/50 bg-linear-to-r from-blue-50/40 via-white/60 to-blue-50/40 px-6 py-4 shadow-inner backdrop-blur-sm mt-4">
                                                <div className="flex items-center justify-between text-sm text-blue-800 font-medium">
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse"></div>
                                                        Showing <span className="font-bold text-blue-900">{deliveries.length}</span> deliveries
                                                    </span>
                                                    <span className="flex items-center gap-3 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200/30">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                                                        <span className="font-semibold">Delivery Management System</span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Radiant Footer */}
                <footer className="mt-16 border-t border-blue-200/50 bg-linear-to-r from-white/80 via-blue-50/60 to-white/80 backdrop-blur-sm shadow-inner">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            <p className="text-sm text-gray-700 font-medium drop-shadow-sm">© UNITEC POS System • Delivery Management</p>
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