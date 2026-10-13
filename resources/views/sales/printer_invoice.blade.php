<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printer Sales Invoice - {{ $sale->invoice_no }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 0;
            background-color: #fff;
        }
        .invoice-box {
            width: 210mm;
            height: 148.5mm;
            margin: 0 auto;
            padding: 8mm;
            box-sizing: border-box;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 3px solid #03a9f4;
        }
        .header .company-info h1 {
            margin: 0;
            font-size: 32px;
            text-transform: uppercase;
            color: #03a9f4;
            letter-spacing: 1px;
        }
        .header .company-info h1 span {
            color: #757575;
        }
        .header .company-info p {
            margin: 3px 0;
            font-size: 11px;
            color: #555;
        }
        .header .invoice-info {
            text-align: right;
        }
        .header .invoice-info h2 {
            margin: 0;
            font-size: 24px;
            color: #333;
            font-weight: bold;
        }
        .header .invoice-info p {
            margin: 3px 0;
            font-size: 11px;
            color: #555;
        }
        .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 8px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .customer-section .section-title {
            font-weight: bold;
            color: #03a9f4;
            margin-bottom: 5px;
            font-size: 13px;
        }
        .customer-section .info-row {
            margin: 3px 0;
            font-size: 11px;
        }
        .customer-section .info-row strong {
            display: inline-block;
            width: 100px;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 11px;
        }
        .items-table thead {
            background: #03a9f4;
            color: white;
        }
        .items-table th {
            padding: 5px 8px;
            text-align: left;
            font-weight: 600;
        }
        .items-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e0e0e0;
            vertical-align: top;
        }
        .items-table tbody tr:hover {
            background: #f8f9fa;
        }
        .totals-section {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
        }
        .payment-info {
            width: 48%;
        }
        .totals-table {
            width: 48%;
            font-size: 11px;
        }
        .totals-table tr td {
            padding: 3px 10px;
        }
        .totals-table tr td:first-child {
            text-align: right;
            font-weight: 600;
        }
        .totals-table tr td:last-child {
            text-align: right;
            width: 120px;
        }
        .totals-table .total-row {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #333;
            border-bottom: 3px double #333;
        }
        .footer {
            margin-top: 8px;
            padding-top: 5px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
        }
        .signature-box {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
        }
        .signature {
            text-align: center;
            width: 45%;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 25px;
            padding-top: 3px;
            font-size: 10px;
        }
        .vat-info {
            background: #fff3cd;
            padding: 4px 8px;
            border-radius: 3px;
            margin-bottom: 6px;
            font-size: 9px;
        }
        @media print {
            body { 
                width: 210mm;
                height: 148.5mm;
            }
            .no-print { display: none; }
            @page {
                size: 210mm 148.5mm;
                margin: 0;
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="invoice-box">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>VIS<span>MASS</span></h1>
                <p><strong>Sri Lanka - Yakkala</strong></p>
                <p>Tel: +94 33 22 34300</p>
                <p>Email: info@vismass.lk</p>
            </div>
            <div class="invoice-info">
                <h2>SALES INVOICE</h2>
                <p><strong>Invoice No:</strong> {{ $sale->invoice_no }}</p>
                <p><strong>Date:</strong> {{ $sale->created_at->format('Y-m-d H:i') }}</p>
                <p><strong>Cashier:</strong> {{ $sale->cashier->name ?? 'Admin' }}</p>
            </div>
        </div>

        <!-- VAT Information -->
        @if($sale->is_vat_invoice)
        <div class="vat-info">
            @php
                $company = \App\Models\Company::first();
                $customer = \App\Models\Customer::where('AdrCd', $sale->customer_code)->first();
            @endphp
            <strong>VAT Invoice</strong> - 
            @if($company && $company->vat_no)
                Company VAT No: {{ $company->vat_no }}
            @endif
            @if($customer && $customer->VATNo)
                | Customer VAT No: {{ $customer->VATNo }}
            @endif
        </div>
        @endif

        <!-- Customer Details -->
        <div class="customer-section">
            <div>
                <div class="section-title">BILL TO</div>
                <div class="info-row"><strong>Customer:</strong> {{ $sale->customer_name ?: 'Walk-in Customer' }}</div>
                @if($sale->customer_code && $sale->customer_code !== '0001')
                <div class="info-row"><strong>Customer Code:</strong> {{ $sale->customer_code }}</div>
                @endif
                @php
                    $customer = \App\Models\Customer::where('AdrCd', $sale->customer_code)->first();
                @endphp
                @if($customer)
                    @if($customer->mobile)
                    <div class="info-row"><strong>Mobile:</strong> {{ $customer->mobile }}</div>
                    @endif
                    @if($customer->Address1)
                    <div class="info-row"><strong>Address:</strong> {{ $customer->Address1 }}</div>
                    @endif
                    @if($customer->City)
                    <div class="info-row"><strong>City:</strong> {{ $customer->City }}</div>
                    @endif
                @endif
            </div>
            <div>
                <div class="section-title">PAYMENT INFORMATION</div>
                @php
                    $paymentDetails = is_array($sale->payment_details) ? $sale->payment_details : json_decode($sale->payment_details, true);
                    $cashPaid = $paymentDetails['cash'] ?? 0;
                    $cardPaid = $paymentDetails['card'] ?? 0;
                    $pointsPaid = $paymentDetails['points'] ?? 0;
                    $totalPayments = $cashPaid + $cardPaid + $pointsPaid;
                    $totalAmount = $sale->total_amount;
                    $changeAmount = $totalPayments > $totalAmount ? $totalPayments - $totalAmount : 0;
                    $balanceDue = $totalAmount > $totalPayments ? $totalAmount - $totalPayments : 0;
                @endphp
                @if($cashPaid > 0)
                <div class="info-row"><strong>Cash Paid:</strong> Rs {{ number_format($cashPaid, 2) }}</div>
                @endif
                @if($cardPaid > 0)
                <div class="info-row"><strong>Card Paid:</strong> Rs {{ number_format($cardPaid, 2) }}</div>
                @endif
                @if($pointsPaid > 0)
                <div class="info-row"><strong>Points Redeemed:</strong> Rs {{ number_format($pointsPaid, 2) }}</div>
                @endif
                <div class="info-row"><strong>Total Paid:</strong> Rs {{ number_format($totalPayments, 2) }}</div>
                @if($changeAmount > 0)
                <div class="info-row" style="color: #4caf50;"><strong>Change Due:</strong> Rs {{ number_format($changeAmount, 2) }}</div>
                @endif
                @if($balanceDue > 0)
                <div class="info-row" style="color: #d32f2f;"><strong>Balance Due:</strong> Rs {{ number_format($balanceDue, 2) }}</div>
                @endif
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Item Description</th>
                    <th style="width: 15%;">Serial Number</th>
                    <th style="width: 10%;">Warranty</th>
                    <th style="width: 8%; text-align: center;">Qty</th>
                    <th style="width: 12%; text-align: right;">Unit Price Rs</th>
                    <th style="width: 15%; text-align: right;">Total Rs</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sale->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->item_name }}</strong>
                        @if($item->brand || $item->model)
                        <br><small style="color: #666;">
                            @if($item->brand){{ $item->brand }}@endif
                            @if($item->brand && $item->model) - @endif
                            @if($item->model){{ $item->model }}@endif
                        </small>
                        @endif
                        @if(!$item->serial_number)
                        <br><small style="color: #999;">Code: {{ $item->item_code }}</small>
                        @endif
                    </td>
                    <td>
                        @if($item->serial_number)
                            <strong>{{ $item->serial_number }}</strong>
                        @else
                            <span style="color: #999;">-</span>
                        @endif
                    </td>
                    <td>{{ $item->warranty ?: '-' }}</td>
                    <td style="text-align: center;">{{ number_format($item->quantity, 0) }}</td>
                    <td style="text-align: right;">{{ number_format($item->unit_price, 2) }}</td>
                    <td style="text-align: right;">{{ number_format($item->line_total, 2) }}</td>
                </tr>
                @if($item->free_quantity > 0)
                <tr>
                    <td colspan="7" style="font-size: 10px; color: #4caf50; padding: 2px 8px;">
                        <em>Free Quantity: {{ number_format($item->free_quantity, 0) }}</em>
                    </td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
            <div class="payment-info">
                <p style="margin: 0; font-size: 9px; color: #666; line-height: 1.4;">
                    <strong>Terms & Conditions:</strong><br>
                    • Please keep this invoice for warranty claims<br>
                    • Goods once sold will not be taken back<br>
                    • Warranty terms as per manufacturer policy
                </p>
            </div>
            <div>
                <table class="totals-table">
                    @php
                        $subtotal = $sale->subtotal;
                        
                        // Calculate item-level discounts
                        $itemLevelDiscounts = 0;
                        foreach($sale->items as $item) {
                            $itemLevelDiscounts += $item->discount_amount ?? 0;
                        }
                        
                        // Add manual discount
                        $manualDiscount = $sale->discount_amount ?? 0;
                        $totalDiscount = $itemLevelDiscounts + $manualDiscount;
                        
                        $vatAmount = $sale->is_vat_invoice ? $sale->tax_amount : 0;
                    @endphp
                    @if($sale->is_vat_invoice)
                    <tr>
                        <td>Subtotal:</td>
                        <td>Rs {{ number_format($subtotal, 2) }}</td>
                    </tr>
                    @endif
                    @if($totalDiscount > 0)
                    <tr style="background: #ffebee;">
                        <td style="color: #c62828;">Total Discount:</td>
                        <td style="color: #c62828;">- Rs {{ number_format($totalDiscount, 2) }}</td>
                    </tr>
                    @if($itemLevelDiscounts > 0)
                    <tr style="font-size: 9px; color: #888;">
                        <td style="padding-left: 20px;">Item Discounts:</td>
                        <td>Rs {{ number_format($itemLevelDiscounts, 2) }}</td>
                    </tr>
                    @endif
                    @if($manualDiscount > 0)
                    <tr style="font-size: 9px; color: #888;">
                        <td style="padding-left: 20px;">Additional Discount:</td>
                        <td>Rs {{ number_format($manualDiscount, 2) }}</td>
                    </tr>
                    @endif
                    @endif
                    @if($sale->is_vat_invoice)
                    <tr>
                        <td>VAT ({{ number_format($sale->vat_rate, 2) }}%):</td>
                        <td>Rs {{ number_format($vatAmount, 2) }}</td>
                    </tr>
                    @endif
                    <tr class="total-row">
                        <td>TOTAL:</td>
                        <td>Rs {{ number_format($totalAmount, 2) }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-box">
            <div class="signature">
                <div class="signature-line">Customer Signature</div>
            </div>
            <div class="signature">
                <div class="signature-line">Authorized Signature</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>
                <strong>Thank you for your business!</strong><br>
                For support, contact: +94 33 22 34300
            </div>
            <div style="text-align: right;">
                Printed on: {{ date('Y-m-d H:i:s') }}
            </div>
        </div>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer; margin: 5px;">Print Again</button>
        <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer; margin: 5px;">Close</button>
    </div>
</body>
</html>
