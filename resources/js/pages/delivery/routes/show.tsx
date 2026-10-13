import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Truck, MapPin, Edit, ArrowLeft, Calendar, Tag, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface DeliveryRoute {
    id: number;
    name: string;
    areas: string[] | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    company_code: string;
}

interface Props {
    route: DeliveryRoute;
}

export default function ShowRoute({ route }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleToggleStatus = () => {
        if (confirm(`Are you sure you want to ${route.is_active ? 'deactivate' : 'activate'} this route?`)) {
            router.patch(`/deliveries/routes/${route.id}/status`, {}, {
                onSuccess: () => {
                    // Refresh the page to show updated status
                    window.location.reload();
                }
            });
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
            router.delete(`/deliveries/routes/${route.id}`, {
                onSuccess: () => {
                    router.visit('/deliveries/routes');
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Delivery Routes', href: '/deliveries/routes' },
            { title: route.name, href: `/deliveries/routes/${route.id}` }
        ]}>
            <Head title={route.name} />

            {/* Radiant Background */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-6 max-w-4xl mx-auto">
                    {/* Navigation */}
                    <div className="mb-6">
                        <Link
                            href="/deliveries/routes"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Delivery Routes</span>
                        </Link>
                    </div>

                    {/* Enhanced Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
                            <Truck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            {route.name}
                        </h1>
                        <div className="flex items-center justify-center space-x-4 text-blue-600/80">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${
                                route.is_active
                                    ? 'bg-green-100 text-green-800 border-green-200 shadow-sm shadow-green-500/20'
                                    : 'bg-red-100 text-red-800 border-red-200 shadow-sm shadow-red-500/20'
                            }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                    route.is_active ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                {route.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* Main Content Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Information Card */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Route Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Tag className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Route Name</p>
                                                <p className="font-medium text-gray-800">{route.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Created</p>
                                                <p className="font-medium text-gray-800">{formatDate(route.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Last Updated</p>
                                                <p className="font-medium text-gray-800">{formatDate(route.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {route.description && (
                                            <div className="flex items-start space-x-3">
                                                <Eye className="w-4 h-4 text-blue-500 mt-1" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Description</p>
                                                    <p className="font-medium text-gray-800">{route.description}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Areas Covered */}
                            {route.areas && route.areas.length > 0 && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-800">Service Areas</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {route.areas.map((area: string, index: number) => (
                                            <div key={index} className="flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-100 text-sm px-3 py-2 rounded-lg">
                                                <MapPin className="w-3 h-3" />
                                                <span>{area}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Status</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Current Status</span>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                                            route.is_active
                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                : 'bg-red-100 text-red-800 border-red-200'
                                        }`}>
                                            {route.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleToggleStatus}
                                        className={`w-full inline-flex items-center justify-center space-x-2 ${
                                            route.is_active
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                        } px-4 py-2 rounded-xl shadow-lg transition-all duration-200 font-medium`}
                                    >
                                        {route.is_active ? (
                                            <>
                                                <ToggleRight className="w-4 h-4" />
                                                <span>Deactivate Route</span>
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-4 h-4" />
                                                <span>Activate Route</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
                                <div className="space-y-3">
                                    <Link
                                        href={`/deliveries/routes/${route.id}/edit`}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Route</span>
                                    </Link>
                                    <Button
                                        onClick={handleDelete}
                                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete Route</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12 text-blue-600/60">
                        <p className="text-sm">Route details • Part of your delivery network</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}