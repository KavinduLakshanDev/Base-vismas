import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Truck, Edit, MapPin, Save, ArrowLeft, FileText } from 'lucide-react';

interface DeliveryRoute {
    id: number;
    name: string;
    areas: string[] | null;
    description: string | null;
    is_active: boolean;
    company_code: string;
}

interface Props {
    route: DeliveryRoute;
}

export default function EditRoute({ route }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: route.name,
        areas: route.areas || [],
        description: route.description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/deliveries/routes/${route.id}`);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Delivery Routes', href: '/deliveries/routes' },
            { title: route.name, href: `/deliveries/routes/${route.id}` },
            { title: 'Edit', href: `/deliveries/routes/${route.id}/edit` }
        ]}>
            <Head title={`Edit ${route.name}`} />

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
                            href={`/deliveries/routes/${route.id}`}
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Route Details</span>
                        </Link>
                    </div>

                    {/* Enhanced Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
                            <Edit className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            Edit Delivery Route
                        </h1>
                        <p className="text-blue-600/80 text-lg">
                            Update information for <span className="font-semibold text-blue-700">{route.name}</span>
                        </p>
                    </div>

                    {/* Form Container with Radiant Effects */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-8">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Route Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Route Information</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                                            <Truck className="w-4 h-4 mr-2 text-blue-500" />
                                            Route Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                            placeholder="e.g., Colombo North Route, Western Province Route"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="areas" className="text-sm font-medium text-gray-700 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            Service Areas *
                                        </Label>
                                        <Input
                                            id="areas"
                                            value={data.areas.join(', ')}
                                            onChange={(e) => setData('areas', e.target.value.split(',').map(s => s.trim()))}
                                            required
                                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                            placeholder="e.g., Colombo 1, Pettah, Fort, Slave Island"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Enter areas separated by commas</p>
                                        <InputError message={errors.areas} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm min-h-[100px]"
                                            placeholder="Optional description of the route coverage, delivery schedule, or special notes..."
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Section */}
                            <div className="pt-6 border-t border-blue-200/50">
                                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                    <Link
                                        href={`/deliveries/routes/${route.id}`}
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center justify-center"
                                    >
                                        Cancel
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 px-6 py-3 rounded-xl font-medium inline-flex items-center justify-center space-x-2"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                <span>Updating Route...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Update Route</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Additional Info Card */}
                    <div className="mt-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50 p-6 shadow-lg shadow-blue-500/10">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <Truck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Route Planning Tips</h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Define clear geographical boundaries for efficient delivery coverage</li>
                                    <li>• Consider traffic patterns and delivery time windows</li>
                                    <li>• Group areas with similar delivery volumes for optimal routing</li>
                                    <li>• Include backup routes for peak hours or road closures</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}