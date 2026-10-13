import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Truck, MapPin, Edit, ArrowLeft, Calendar, Tag, ToggleLeft, ToggleRight, User, CheckCircle } from 'lucide-react';

interface Delivery {
    id: number;
    delivery_number: string;
    customer_name: string;
    customer_address: string;
    delivery_route_id: string | null;
    distributor_id: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    route?: { name: string };
    distributor?: Distributor | null;
}

interface Route {
    id: number;
    name: string;
}

interface Distributor {
    id: number;
    first_name: string;
    last_name: string;
    username?: string;
    email?: string;
}

interface Props {
    delivery: Delivery;
    routes: Route[];
    distributors: Distributor[];
}

export default function DeliveryShow({ delivery, routes, distributors }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'green';
            case 'delivering': return 'blue';
            case 'cancelled': return 'red';
            default: return 'gray';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'delivered': return 'Delivered';
            case 'delivering': return 'In Transit';
            case 'cancelled': return 'Cancelled';
            default: return 'Assigned';
        }
    };

    const handleStatusChange = (newStatus: string) => {
        if (confirm(`Are you sure you want to change the status to ${getStatusText(newStatus)}?`)) {
            router.patch(`/deliveries/${delivery.id}/status`, { status: newStatus });
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to deactivate this delivery? This action cannot be undone.')) {
            router.patch(`/deliveries/${delivery.id}/status`, { status: 'cancelled' });
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Deliveries', href: '/deliveries' },
            { title: delivery.delivery_number, href: `/deliveries/${delivery.id}` }
        ]}>
            <Head title={`Delivery ${delivery.delivery_number}`} />

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
                            href="/deliveries"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Deliveries</span>
                        </Link>
                    </div>

                    {/* Enhanced Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
                            <Truck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            {delivery.delivery_number}
                        </h1>
                        <div className="flex items-center justify-center space-x-4 text-blue-600/80">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${
                                delivery.status === 'delivered'
                                    ? 'bg-green-100 text-green-800 border-green-200 shadow-sm shadow-green-500/20'
                                    : delivery.status === 'delivering'
                                    ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm shadow-blue-500/20'
                                    : delivery.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 border-red-200 shadow-sm shadow-red-500/20'
                                    : 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm shadow-gray-500/20'
                            }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 bg-${getStatusColor(delivery.status)}-500`}></div>
                                {getStatusText(delivery.status)}
                            </span>
                        </div>
                    </div>

                    {/* Main Content Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Information Card */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Delivery Information */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Delivery Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Tag className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Delivery Number</p>
                                                <p className="font-medium text-gray-800">{delivery.delivery_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Status</p>
                                                <p className="font-medium text-gray-800">{getStatusText(delivery.status)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Created</p>
                                                <p className="font-medium text-gray-800">{formatDate(delivery.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Last Updated</p>
                                                <p className="font-medium text-gray-800">{formatDate(delivery.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Customer Name</p>
                                                <p className="font-medium text-gray-800">{delivery.customer_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Customer Address</p>
                                                <p className="font-medium text-gray-800">{delivery.customer_address}</p>
                                            </div>
                                        </div>
                                        {delivery.route && (
                                            <div className="flex items-center space-x-3">
                                                <Truck className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Route</p>
                                                    <p className="font-medium text-gray-800">{delivery.route.name}</p>
                                                </div>
                                            </div>
                                        )}
                                        {delivery.distributor && (
                                            <div className="flex items-center space-x-3">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Driver</p>
                                                    <p className="font-medium text-gray-800">{delivery.distributor.first_name} {delivery.distributor.last_name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Status Management</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Current Status</span>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                                            delivery.status === 'delivered'
                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                : delivery.status === 'delivering'
                                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                : delivery.status === 'cancelled'
                                                ? 'bg-red-100 text-red-800 border-red-200'
                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                        }`}>
                                            {getStatusText(delivery.status)}
                                        </span>
                                    </div>

                                    {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                                        <div className="space-y-2">
                                            {delivery.status === 'assigned' && (
                                                <Button
                                                    onClick={() => handleStatusChange('delivering')}
                                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                                >
                                                    <ToggleRight className="w-4 h-4" />
                                                    <span>Start Delivery</span>
                                                </Button>
                                            )}
                                            {delivery.status === 'delivering' && (
                                                <Button
                                                    onClick={() => handleStatusChange('delivered')}
                                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Mark as Delivered</span>
                                                </Button>
                                            )}
                                            <Button
                                                onClick={handleDelete}
                                                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                            >
                                                <ToggleLeft className="w-4 h-4" />
                                                <span>Cancel Delivery</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
                                <div className="space-y-3">
                                    <Link
                                        href={`/deliveries/${delivery.id}/edit`}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 font-medium inline-flex items-center justify-center space-x-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Delivery</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-12 text-blue-600/60">
                        <p className="text-sm">Delivery details • Part of your delivery management system</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}