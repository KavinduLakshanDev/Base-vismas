import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

interface Delivery {
    id: number;
    delivery_number: string;
    customer_name: string;
    customer_address: string;
    delivery_route_id: string | null;
    distributor_id: string | null;
    status: string;
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

export default function DeliveryEdit({ delivery, routes, distributors }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        customer_name: delivery.customer_name || '',
        customer_address: delivery.customer_address || '',
        route_id: delivery.delivery_route_id || '',
        distributor_id: delivery.distributor_id || '',
        status: delivery.status || 'assigned',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/deliveries/${delivery.id}`);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Deliveries', href: '/deliveries' },
            { title: delivery.delivery_number, href: `/deliveries/${delivery.id}` },
            { title: 'Edit', href: `/deliveries/${delivery.id}/edit` }
        ]}>
            <Head title={`Edit Delivery ${delivery.delivery_number}`} />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <Link
                                    href={`/deliveries/${delivery.id}`}
                                    className="mr-4 text-gray-400 hover:text-gray-600"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Edit Delivery</h1>
                                    <p className="text-sm text-gray-600">{delivery.delivery_number}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-6">
                            {/* Form Container with Radiant Effects */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-8">
                                <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                                        <input
                                            type="text"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Customer Address</label>
                                        <textarea
                                            value={data.customer_address}
                                            onChange={(e) => setData('customer_address', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        {errors.customer_address && <p className="text-red-500 text-sm mt-1">{errors.customer_address}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Route</label>
                                        <select
                                            value={data.route_id}
                                            onChange={(e) => setData('route_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Route</option>
                                            {routes.map((route) => (
                                                <option key={route.id} value={route.id}>{route.name}</option>
                                            ))}
                                        </select>
                                        {errors.route_id && <p className="text-red-500 text-sm mt-1">{errors.route_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Driver</label>
                                        <select
                                            value={data.distributor_id}
                                            onChange={(e) => setData('distributor_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Driver</option>
                                            {distributors.map((distributor) => (
                                                <option key={distributor.id} value={distributor.id}>{distributor.first_name} {distributor.last_name}</option>
                                            ))}
                                        </select>
                                        {errors.distributor_id && <p className="text-red-500 text-sm mt-1">{errors.distributor_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="assigned">Assigned</option>
                                            <option value="delivering">Delivering</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {processing ? 'Updating...' : 'Update Delivery'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
