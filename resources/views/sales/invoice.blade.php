<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Invoice - {{ $sale->invoice_no }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            margin: 0;
            padding: 0;
            background-color: #fff;
            width: 80mm; /* Standard POS paper width */
        }
        .invoice-box {
            width: 76mm; /* Content width slightly less than paper width */
            margin: 0 auto;
            padding: 2mm;
        }
        .header {
            text-align: center;
            margin-bottom: 5px;
            padding-bottom: 5px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            text-transform: uppercase;
            color: #03a9f4;
            letter-spacing: 1px;
        }
        .header h1 span {
            color: #757575;
        }
        .header .location {
            font-weight: bold;
            font-size: 12px;
            margin: 0;
        }
        .header .bill-type {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            margin: 5px 0;
            padding: 2px 0;
            font-size: 14px;
            font-weight: bold;
        }
        .header p {
            margin: 2px 0;
            font-size: 10px;
        }
        .info-section {
            width: 100%;
            margin-bottom: 5px;
            font-size: 10px;
            line-height: 1.2;
        }
        .info-section div {
            margin-bottom: 2px;
        }
        .dotted-line {
            border-top: 1px dashed #000;
            margin: 5px 0;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        .items-table th {
            text-align: left;
            border-bottom: 1px dashed #000;
            padding: 2px 0;
        }
        .items-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .totals-table {
            width: 100%;
            margin-top: 5px;
            font-size: 11px;
            border-top: 1px dashed #000;
            padding-top: 5px;
        }
        .totals-table td {
            padding: 2px 0;
        }
        .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 5px;
        }
        .signature-box {
            margin-top: 20px;
            font-size: 9px;
            display: flex;
            justify-content: space-between;
        }
        .signature {
            border-top: 1px dotted #000;
            width: 32mm;
            text-align: center;
            padding-top: 2px;
        }
        @media print {
            body { 
                width: 80mm;
            }
            .no-print { display: none; }
            @page {
                size: 80mm auto;
                margin: 0;
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="invoice-box">
        <div class="header">
            <h1>VIS<span>MASS</span></h1>
            <p class="location">Sri Lanka - Yakkala</p>
            <div class="bill-type">SALES INVOICE</div>
            <p>Tel: +94 33 22 34300</p>
        </div>

        <div class="info-section">
            <div><strong>Date:</strong> {{ $sale->created_at->format('Y-m-d H:i') }}</div>
            <div><strong>Inv No:</strong> {{ $sale->invoice_no }}</div>
            <div class="dotted-line"></div>
            <div><strong>Customer:</strong> {{ $sale->customer_name ?: 'Walk-in Customer' }}</div>
            @if($sale->customer_code && $sale->customer_code !== '0001')
            <div><strong>Cust Code:</strong> {{ $sale->customer_code }}</div>
            @endif
            <div><strong>Cashier:</strong> {{ $sale->cashier->name ?? 'Admin' }}</div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align: right;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sale->items as $item)
                <tr>
                    <td colspan="4" style="padding-bottom: 0;">{{ $item->item_name }}</td>
                </tr>
                <tr>
                    <td style="font-size: 9px; color: #555;">
                        @if($item->serial_number)
                            (S/N: {{ $item->serial_number }})
                        @else
                            ({{ $item->item_code }})
                        @endif
                    </td>
                    <td style="text-align: right;">{{ number_format($item->quantity, 0) }}</td>
                    <td style="text-align: right;">{{ number_format($item->unit_price, 2) }}</td>
                    <td style="text-align: right;">{{ number_format($item->line_total, 2) }}</td>
                </tr>
                @if($item->free_quantity > 0)
                <tr>
                    <td colspan="4" style="font-size: 9px; color: #555;">Free Qty: {{ number_format($item->free_quantity, 0) }}</td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>

        <table class="totals-table">
            @php
                // Calculate gross total and net total from items
                $grossTotal = 0;
                $netTotal = 0;
                
                foreach($sale->items as $item) {
                    // Gross = unit_price * quantity (before any discount)
                    $grossTotal += ($item->unit_price * $item->quantity);
                    // Net = line_total (after discount already applied)
                    $netTotal += $item->line_total;
                }
                
                // Total discount is the difference between gross and net
                $itemLevelDiscounts = $grossTotal - $netTotal;
                
                // Add manual discount from sale
                $manualDiscount = $sale->discount_amount ?? 0;
                $totalDiscount = $itemLevelDiscounts + $manualDiscount;
                
                $totalAmount = $sale->total_amount;
                
                // VAT amount
                $vatAmount = $sale->is_vat_invoice ? $sale->tax_amount : 0;
                
                // Calculate payment details
                $paymentDetails = is_array($sale->payment_details) ? $sale->payment_details : json_decode($sale->payment_details, true);
                $cashPaid = $paymentDetails['cash'] ?? 0;
                $cardPaid = $paymentDetails['card'] ?? 0;
                $pointsPaid = $paymentDetails['points'] ?? 0;
                $totalPayments = $cashPaid + $cardPaid + $pointsPaid;
                
                // Calculate change or balance due
                $changeAmount = $totalPayments > $totalAmount ? $totalPayments - $totalAmount : 0;
                $balanceDue = $totalAmount > $totalPayments ? $totalAmount - $totalPayments : 0;
            @endphp

            <tr>
                <td><strong>SUBTOTAL</strong></td>
                <td style="text-align: right;"><strong>{{ number_format($grossTotal, 2) }}</strong></td>
            </tr>

            @if($totalDiscount > 0)
            <tr>
                <td><strong>DISCOUNT (-)</strong></td>
                <td style="text-align: right;"><strong>{{ number_format($totalDiscount, 2) }}</strong></td>
            </tr>
            @endif

            @if($sale->is_vat_invoice)
            <tr>
                <td>VAT ({{ number_format($sale->vat_rate, 2) }}%)</td>
                <td style="text-align: right;">{{ number_format($vatAmount, 2) }}</td>
            </tr>
            @endif

            <tr style="font-weight: bold; font-size: 12px; border-top: 1px solid #000;">
                <td><strong>TOTAL</strong></td>
                <td style="text-align: right;"><strong>{{ number_format($totalAmount, 2) }}</strong></td>
            </tr>

            {{-- Payment Details --}}
            <tr>
                <td colspan="2" style="padding-top: 5px; font-weight: bold; border-top: 1px dashed #000;">PAYMENT DETAILS</td>
            </tr>

            @if($cashPaid > 0)
            <tr>
                <td>CASH PAID</td>
                <td style="text-align: right;">{{ number_format($cashPaid, 2) }}</td>
            </tr>
            @endif

            @if($cardPaid > 0)
            <tr>
                <td>CARD PAID</td>
                <td style="text-align: right;">{{ number_format($cardPaid, 2) }}</td>
            </tr>
            @endif

            @if($pointsPaid > 0)
            <tr>
                <td>POINTS REDEEMED</td>
                <td style="text-align: right;">{{ number_format($pointsPaid, 2) }}</td>
            </tr>
            @endif

            <tr style="font-size: 11px;">
                <td><strong>TOTAL PAID</strong></td>
                <td style="text-align: right;"><strong>{{ number_format($totalPayments, 2) }}</strong></td>
            </tr>

            @if($changeAmount > 0)
            <tr style="font-size: 11px; color: #4caf50;">
                <td><strong>CHANGE DUE</strong></td>
                <td style="text-align: right;"><strong>{{ number_format($changeAmount, 2) }}</strong></td>
            </tr>
            @endif

            @if($balanceDue > 0)
            <tr style="font-size: 11px; color: #d32f2f;">
                <td><strong>BALANCE DUE</strong></td>
                <td style="text-align: right;"><strong>{{ number_format($balanceDue, 2) }}</strong></td>
            </tr>
            @endif
        </table>

        <div class="signature-box">
            <div class="signature">Customer</div>
            <div class="signature">Authorized</div>
        </div>

        <div class="footer">
            @if($sale->is_vat_invoice)
            <div style="font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;">
                @php
                    $company = \App\Models\Company::first();
                    $customer = \App\Models\Customer::where('AdrCd', $sale->customer_code)->first();
                @endphp
                @if($company && $company->vat_no)
                <div>Company VAT No: {{ $company->vat_no }}</div>
                @endif
                @if($customer && $customer->VATNo)
                <div>Customer VAT No: {{ $customer->VATNo }}</div>
                @endif
            </div>
            @endif
            Thank you for your business!<br>
            Please keep this invoice for warranty and returns.<br>
            {{ date('Y-m-d H:i:s') }}
        </div>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Print Again</button>
        <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer;">Close</button>
    </div>
</body>
</html>
