import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageProps } from '@/types';

interface Product {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

interface Wastage {
    id: number;
    product_id: number;
    quantity: number;
    reason: string;
    wastage_date: string;
    notes: string;
    status: string;
    serial_number: string;
    batch_no: string;
    warranty: string;
    section_id: number;
    cost_price: number;
}

interface EditProps extends PageProps {
    wastage: Wastage;
    products: Product[];
    sections: Section[];
}

export default function WastageEdit({ auth, wastage, products, sections }: EditProps) {
  const { data, setData, put, processing, errors } = useForm({
    product_id: wastage.product_id || '',
    quantity: wastage.quantity || '',
    reason: wastage.reason || '',
    wastage_date: wastage.wastage_date || '',
    notes: wastage.notes || '',
    status: wastage.status || 'pending',
    serial_number: wastage.serial_number || '',
    batch_no: wastage.batch_no || '',
    warranty: wastage.warranty || '',
    section_id: wastage.section_id || '',
    cost_price: wastage.cost_price || 0,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    put(route('wastages.update', wastage.id));
  }

  return (
    <AuthenticatedLayout
      user={auth.user}
    >
      <Head title="Edit Wastage" />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="product_id">Product</Label>
                  <Select
                    value={String(data.product_id)}
                    onValueChange={(value) => setData('product_id', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', Number(e.target.value))}
                  />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <Label htmlFor="section_id">Section</Label>
                  <Select
                    value={String(data.section_id)}
                    onValueChange={(value) => setData('section_id', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={String(section.id)}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.section_id && <p className="text-red-500 text-xs mt-1">{errors.section_id}</p>}
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={data.reason}
                    onChange={(e) => setData('reason', e.target.value)}
                  />
                  {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                </div>

                <div>
                  <Label htmlFor="wastage_date">Wastage Date</Label>
                  <Input
                    id="wastage_date"
                    type="date"
                    value={data.wastage_date}
                    onChange={(e) => setData('wastage_date', e.target.value)}
                  />
                  {errors.wastage_date && <p className="text-red-500 text-xs mt-1">{errors.wastage_date}</p>}
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                  />
                  {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                </div>

                <div className="flex items-center justify-end">
                  <Button type="submit" disabled={processing}>
                    Update Wastage
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
