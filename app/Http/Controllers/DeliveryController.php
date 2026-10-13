<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('deliveries.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view deliveries.');
        }

        $companyCode = request()->user()->company_code;
        $deliveries = \App\Models\Delivery::with(['deliveryRoute', 'distributor'])
            ->where('company_code', $companyCode)
            ->get();

        $routes = \App\Models\DeliveryRoute::where('company_code', $companyCode)->where('is_active', true)->get();
        $distributors = \App\Models\User::where('company_code', $companyCode)
            ->where('role_id', 5) // Distributor role
            ->where('is_active', true)
            ->get();

        return \Inertia\Inertia::render('delivery/index', [
            'deliveries' => $deliveries,
            'routes' => $routes,
            'distributors' => $distributors,
        ]);
    }

    public function create()
    {
        if (!request()->user()->hasPermission('deliveries.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create deliveries.');
        }

        $companyCode = request()->user()->company_code;
        $routes = \App\Models\DeliveryRoute::where('company_code', $companyCode)->where('is_active', true)->get();
        $distributors = \App\Models\User::where('company_code', $companyCode)
            ->where('role_id', 5) // Distributor role
            ->where('is_active', true)
            ->get();

        return \Inertia\Inertia::render('delivery/create', [
            'routes' => $routes,
            'distributors' => $distributors,
        ]);
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('deliveries.create')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create deliveries.');
        }

        $request->validate([
            'customer_name' => 'required|string',
            'customer_address' => 'required|string',
            'customer_phone' => 'required|string',
            'delivery_route_id' => 'required|exists:delivery_routes,id',
            'distributor_id' => 'nullable|exists:users,id',
            'delivery_date' => 'required|date',
            'delivery_time' => 'nullable|string',
            'priority' => 'nullable|string|in:low,normal,high,urgent',
            'notes' => 'nullable|string',
        ]);

        \App\Models\Delivery::create([
            'delivery_number' => 'DEL-' . time(),
            'customer_name' => $request->customer_name,
            'customer_address' => $request->customer_address,
            'customer_phone' => $request->customer_phone,
            'delivery_route_id' => $request->delivery_route_id,
            'distributor_id' => $request->distributor_id,
            'delivery_date' => $request->delivery_date,
            'delivery_time' => $request->delivery_time,
            'priority' => $request->priority ?? 'normal',
            'notes' => $request->notes,
            'company_code' => auth('company')->user()->company_code,
            'status' => 'assigned',
        ]);

        return redirect()->route('delivery.index')->with('success', 'Delivery assigned successfully!');
    }

    public function updateStatus(Request $request, \App\Models\Delivery $delivery)
    {
        if (!request()->user()->hasPermission('deliveries.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to update delivery status.');
        }

        $request->validate([
            'status' => 'required|in:pending,assigned,delivering,delivered,cancelled',
        ]);

        $delivery->update(['status' => $request->status]);

        return redirect()->back();
    }

    public function show(\App\Models\Delivery $delivery)
    {
        if (!request()->user()->hasPermission('deliveries.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view deliveries.');
        }

        $companyCode = auth('company')->user()->company_code;
        if ($delivery->company_code !== $companyCode) {
            abort(404);
        }

        $routes = \App\Models\DeliveryRoute::where('company_code', $companyCode)->where('is_active', true)->get();
        $distributors = \App\Models\User::where('company_code', $companyCode)
            ->where('role_id', 5) // Distributor role
            ->where('is_active', true)
            ->get();

        return \Inertia\Inertia::render('delivery/show', [
            'delivery' => $delivery->load(['deliveryRoute', 'distributor']),
            'routes' => $routes,
            'distributors' => $distributors,
        ]);
    }

    public function edit(\App\Models\Delivery $delivery)
    {
        if (!request()->user()->hasPermission('deliveries.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit deliveries.');
        }

        $companyCode = auth('company')->user()->company_code;
        if ($delivery->company_code !== $companyCode) {
            abort(404);
        }

        $routes = \App\Models\DeliveryRoute::where('company_code', $companyCode)->where('is_active', true)->get();
        $distributors = \App\Models\User::where('company_code', $companyCode)
            ->where('role_id', 5) // Distributor role
            ->where('is_active', true)
            ->get();

        return \Inertia\Inertia::render('delivery/edit', [
            'delivery' => $delivery->load(['deliveryRoute', 'distributor']),
            'routes' => $routes,
            'distributors' => $distributors,
        ]);
    }

    public function update(Request $request, \App\Models\Delivery $delivery)
    {
        if (!request()->user()->hasPermission('deliveries.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit deliveries.');
        }

        $companyCode = auth('company')->user()->company_code;
        if ($delivery->company_code !== $companyCode) {
            abort(404);
        }

        $request->validate([
            'customer_name' => 'required|string',
            'customer_address' => 'required|string',
            'route_id' => 'required|exists:delivery_routes,id',
            'distributor_id' => 'nullable|exists:users,id',
            'status' => 'required|in:assigned,delivering,delivered,cancelled',
        ]);

        $delivery->update([
            'customer_name' => $request->customer_name,
            'customer_address' => $request->customer_address,
            'delivery_route_id' => $request->route_id,
            'distributor_id' => $request->distributor_id,
            'status' => $request->status,
        ]);

        return redirect()->route('delivery.index')->with('success', 'Delivery updated successfully!');
    }

    public function destroy(\App\Models\Delivery $delivery)
    {
        if (!request()->user()->hasPermission('deliveries.delete')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete deliveries.');
        }

        $companyCode = auth('company')->user()->company_code;
        if ($delivery->company_code !== $companyCode) {
            abort(404);
        }

        $delivery->delete();

        return redirect()->route('delivery.index')->with('success', 'Delivery deleted successfully!');
    }
}