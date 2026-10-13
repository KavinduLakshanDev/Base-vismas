<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DeliveryRouteController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('deliveries.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view delivery routes.');
        }

        $companyCode = request()->user()->company_code;

        $routes = \App\Models\DeliveryRoute::where('company_code', $companyCode)->get();

        return \Inertia\Inertia::render('delivery/routes/index', [
            'routes' => $routes
        ]);
    }

    public function create()
    {
        if (!request()->user()->hasPermission('deliveries.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create delivery routes.');
        }

        return \Inertia\Inertia::render('delivery/routes/create');
    }

    public function store(Request $request)
    {
        if (!request()->user()->hasPermission('deliveries.create')) {
             return redirect()->back()->with('error', 'Unauthorized. You do not have permission to create delivery routes.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'areas' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        \App\Models\DeliveryRoute::create([
            'name' => $request->name,
            'areas' => $request->areas,
            'description' => $request->description,
            'company_code' => request()->user()->company_code,
        ]);

        return redirect()->route('delivery.routes.index');
    }

    public function show(\App\Models\DeliveryRoute $route)
    {
        if (!request()->user()->hasPermission('deliveries.view')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view delivery routes.');
        }

        // Ensure the route belongs to the current company
        if ($route->company_code !== request()->user()->company_code) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to view this delivery route.');
        }

        return \Inertia\Inertia::render('delivery/routes/show', [
            'route' => $route
        ]);
    }

    public function edit(\App\Models\DeliveryRoute $route)
    {
        if (!request()->user()->hasPermission('deliveries.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit delivery routes.');
        }

        // Ensure the route belongs to the current company
        if ($route->company_code !== auth('company')->user()->company_code) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit this delivery route.');
        }

        return \Inertia\Inertia::render('delivery/routes/edit', [
            'route' => $route
        ]);
    }

    public function update(Request $request, \App\Models\DeliveryRoute $route)
    {
        if (!request()->user()->hasPermission('deliveries.edit')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit delivery routes.');
        }

        // Ensure the route belongs to the current company
        if ($route->company_code !== auth('company')->user()->company_code) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to edit this delivery route.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'areas' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        $route->update([
            'name' => $request->name,
            'areas' => $request->areas,
            'description' => $request->description,
        ]);

        return redirect()->route('delivery.routes.show', $route);
    }

    public function destroy(\App\Models\DeliveryRoute $route)
    {
        if (!request()->user()->hasPermission('deliveries.delete')) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete delivery routes.');
        }

        // Ensure the route belongs to the current company
        if ($route->company_code !== auth('company')->user()->company_code) {
            return redirect()->back()->with('error', 'Unauthorized. You do not have permission to delete this delivery route.');
        }

        $route->delete();

        return redirect()->route('delivery.routes.index');
    }
}