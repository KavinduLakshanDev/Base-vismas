import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Wastage {
    id: number;
    product_name: string;
    quantity: number;
    unit: string;
    reason: string;
    wastage_date: string;
    status: string;
    recorded_by: string;
    notes: string | null;
}

interface ShowProps extends PageProps {
    wastage: Wastage;
}

export default function WastageShow({ auth, wastage }: ShowProps) {
  return (
    <AuthenticatedLayout
      user={auth.user}
    >
      <Head title="Wastage Details" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900">Wastage Record #{wastage.id}</h3>
              <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.product_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.quantity} {wastage.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.reason}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Wastage Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.wastage_date}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Recorded By</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.recorded_by}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{wastage.notes || 'N/A'}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
