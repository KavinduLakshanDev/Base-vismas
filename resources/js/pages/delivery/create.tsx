import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Truck, Plus, MapPin, Phone, User, Package, Calendar, Clock } from 'lucide-react';

export default function CreateDelivery({ routes, distributors }: { routes: any[], distributors: any[] }) {
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_address: '',
        customer_phone: '',
        delivery_route_id: '',
        distributor_id: '',
        delivery_date: '',
        delivery_time: '',
        priority: 'normal',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/deliveries');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Deliveries', href: '/deliveries' },
            { title: 'Assign New Delivery', href: '/deliveries/create' }
        ]}>
            <Head title="Assign New Delivery - POS System" />

            {/* Radiant Background */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-blue-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-6 max-w-4xl mx-auto">
                    {/* Enhanced Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                            Assign New Delivery
                        </h1>
                        <p className="text-blue-600/80 text-lg">
                            Create and assign a new delivery to your distribution network
                        </p>
                    </div>

                    {/* Form Container with Radiant Effects */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-200/50 p-8">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Customer Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Customer Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_name" className="text-sm font-medium text-gray-700 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-blue-500" />
                                            Customer Name *
                                        </Label>
                                        <Input
                                            id="customer_name"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            required
                                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                            placeholder="e.g., John Smith"
                                        />
                                        <InputError message={errors.customer_name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="customer_phone" className="text-sm font-medium text-gray-700 flex items-center">
                                            <Phone className="w-4 h-4 mr-2 text-blue-500" />
                                            Phone Number *
                                        </Label>
                                        <Input
                                            id="customer_phone"
                                            value={data.customer_phone}
                                            onChange={(e) => setData('customer_phone', e.target.value)}
                                            required
                                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                            placeholder="e.g., +1 (555) 123-4567"
                                        />
                                        <InputError message={errors.customer_phone} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customer_address" className="text-sm font-medium text-gray-700 flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                        Delivery Address *
                                    </Label>
                                    <Input
                                        id="customer_address"
                                        value={data.customer_address}
                                        onChange={(e) => setData('customer_address', e.target.value)}
                                        required
                                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                        placeholder="e.g., 123 Main Street, City, State, ZIP"
                                    />
                                    <InputError message={errors.customer_address} />
                                </div>
                            </div>

                            {/* Delivery Details Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Delivery Details</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="delivery_route_id" className="text-sm font-medium text-gray-700 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            Delivery Route *
                                        </Label>
                                        <Select
                                            value={data.delivery_route_id}
                                            onValueChange={(value) => setData('delivery_route_id', value)}
                                            required
                                        >
                                            <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm">
                                                <SelectValue placeholder="Select delivery route" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {routes.map((route) => (
                                                    <SelectItem key={route.id} value={route.id}>
                                                        🚛 {route.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.delivery_route_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="distributor_id" className="text-sm font-medium text-gray-700 flex items-center">
                                            <Truck className="w-4 h-4 mr-2 text-blue-500" />
                                            Distributor (Driver)
                                        </Label>
                                        <Select
                                            value={data.distributor_id}
                                            onValueChange={(value) => setData('distributor_id', value)}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm">
                                                <SelectValue placeholder="Select distributor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {distributors.map((distributor) => (
                                                    <SelectItem key={distributor.id} value={distributor.id}>
                                                        👤 {distributor.first_name} {distributor.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.distributor_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="delivery_date" className="text-sm font-medium text-gray-700 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                            Delivery Date *
                                        </Label>
                                        <Input
                                            id="delivery_date"
                                            type="date"
                                            value={data.delivery_date}
                                            onChange={(e) => setData('delivery_date', e.target.value)}
                                            required
                                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm"
                                        />
                                        <InputError message={errors.delivery_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="delivery_time" className="text-sm font-medium text-gray-700 flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                            Preferred Time
                                        </Label>
                                        <Select
                                            value={data.delivery_time}
                                            onValueChange={(value) => setData('delivery_time', value)}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm">
                                                <SelectValue placeholder="Select preferred time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="morning">🌅 Morning (9:00 AM - 12:00 PM)</SelectItem>
                                                <SelectItem value="afternoon">☀️ Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                                                <SelectItem value="evening">🌆 Evening (5:00 PM - 8:00 PM)</SelectItem>
                                                <SelectItem value="anytime">🕐 Anytime</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.delivery_time} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority" className="text-sm font-medium text-gray-700 flex items-center">
                                            <Package className="w-4 h-4 mr-2 text-blue-500" />
                                            Priority Level
                                        </Label>
                                        <Select
                                            value={data.priority}
                                            onValueChange={(value) => setData('priority', value)}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm">
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">🟢 Low Priority</SelectItem>
                                                <SelectItem value="normal">🟡 Normal Priority</SelectItem>
                                                <SelectItem value="high">🔴 High Priority</SelectItem>
                                                <SelectItem value="urgent">🚨 Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.priority} />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">Additional Information</h2>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-blue-500" />
                                        Delivery Notes
                                    </Label>
                                    <textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm resize-none"
                                        placeholder="e.g., Special delivery instructions, package details, or customer preferences..."
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 border-t border-blue-200/50">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 font-medium"
                                >
                                    {processing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Assigning Delivery...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Plus className="w-5 h-5" />
                                            <span>Assign Delivery</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-blue-600/60">
                        <p className="text-sm">Streamline your delivery operations • Efficient distribution management</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}