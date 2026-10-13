<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $reportTitle }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #334155;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        
        /* Layout Helpers */
        .w-full { width: 100%; }
        .w-half { width: 50%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        
        /* Header */
        .header-container {
            margin-bottom: 30px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin: 0;
        }
        .company-details {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
        }
        .report-title {
            font-size: 20px;
            font-weight: bold;
            color: #3b82f6;
            text-align: right;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
        }
        
        /* Information Sections */
        .info-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .info-table td {
            vertical-align: top;
            padding-right: 20px;
        }
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 12px; /* Increased padding */
            height: 110px; /* Fixed height for consistency */
        }
        .info-title {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: bold;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }
        .info-content {
            font-size: 12px;
            color: #1e293b;
            line-height: 1.4; /* Better line spacing */
        }
        .info-row {
            margin-bottom: 4px;
        }
        .label {
            color: #64748b;
            font-weight: 500;
            display: inline-block;
            width: 80px; /* Fixed width for labels */
        }

        /* Data Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0; /* Outer border */
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            padding: 10px 8px; /* More padding */
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .data-table td {
            padding: 10px 8px; /* More padding */
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: top; /* Align top for multi-line content */
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc; /* Zebra striping */
        }
        .data-table tr:last-child td {
            border-bottom: none;
        }

        /* Totals Section */
        .totals-container {
            width: 100%;
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .totals-table {
            width: 40%;
            float: right;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 6px 0;
            text-align: right;
        }
        .totals-label {
            color: #64748b;
            padding-right: 15px;
        }
        .totals-value {
            font-weight: bold;
        }
        .grand-total {
            border-top: 2px solid #3b82f6;
            margin-top: 8px;
            padding-top: 8px !important;
            font-size: 14px;
            color: #1e293b;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-gray { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="w-full header-container">
        <tr>
            <td width="60%">
                <h1 class="company-name">{{ $purchase->company->name ?? 'Company Name' }}</h1>
                <div class="company-details">
                    {{ $purchase->section->name ?? 'Main Branch' }}<br>
                    Goods Received Note
                </div>
            </td>
            <td width="40%" class="text-right" style="vertical-align: top;">
                <h2 class="report-title">GRN Report</h2>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                    Generated on: {{ $generated_at }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Info Boxes -->
    <table class="info-table">
        <tr>
            <td width="33%">
                <div class="info-box">
                    <div class="info-title">Supplier Details</div>
                    <div class="info-content">
                        <div class="info-row" style="margin-bottom: 8px;">
                            <strong style="font-size: 14px;">Name: {{ $purchase->supplier->FstNm ?? $purchase->supplier->full_name ?? 'N/A' }}</strong>
                        </div>
                        <div class="info-row"><span class="label">Code:</span> {{ $purchase->SuppCode ?? '-' }}</div>
                        <div class="info-row"><span class="label">Invoice No:</span> {{ $purchase->SuppInvNo ?? 'N/A' }}</div>
                    </div>
                </div>
            </td>
            <td width="60%">
                <div class="info-box">
                    <div class="info-title">GRN Reference</div>
                    <div class="info-content">
                        <div class="info-row"><span class="label">GRN No:</span> <strong style="color: #1e293b;">{{ $purchase->company_code }}-{{ $purchase->section_code }}-{{ str_pad($purchase->PurchaseNo, 6, '0', STR_PAD_LEFT) }}</strong></div>
                        <div class="info-row"><span class="label">GRN Date:</span> {{ $purchase->GRNDate->format('d M Y') }}</div>
                        <div class="info-row"><span class="label">Batch:</span> {{ $purchase->batch_no ?? '-' }}</div>
                    </div>
                </div>
            </td>
            <td width="10%">
                <div class="info-box">
                    <div class="info-title">Remarks</div>
                    <div class="info-content">
                        <!-- <div class="info-row" style="margin-bottom: 6px;">
                            <span class="label">Status:</span> 
                            @if($purchase->flused)
                                <span class="badge" style="background-color: #dcfce7; color: #166534; border: 1px solid #86efac;">POSTED</span>
                            @elseif($purchase->Status == 'I')
                                <span class="badge" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;">CANCELLED</span>
                            @else
                                <span class="badge" style="background-color: #ffedd5; color: #9a3412; border: 1px solid #fdba74;">DRAFT</span>
                            @endif
                        </div> -->
                        <div class="info-row">
                            <span class="label" style="vertical-align: top;">Note:</span> 
                            <span style="display: inline-block; width: 65%; vertical-align: top;">{{ Str::limit($purchase->Des ?? '-', 100) }}</span>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    </table>


    @php
        $isPrinterGrn = $purchase->details->contains(function($detail) {
            return $detail->stock_location_type === 'printing_section' || ($detail->serial_number && $detail->brand);
        });
    @endphp

    <!-- Items Table -->
    <table class="data-table" style="margin-top: 20px;">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center; padding-left: 10px; border-bottom: 2px solid #e2e8f0;">#</th>
                <th style="width: 35%; text-align: left; border-bottom: 2px solid #e2e8f0;">Product Information</th>
                <th style="width: 10%; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
                @if(!$isPrinterGrn)
                <th style="width: 10%; text-align: center; border-bottom: 2px solid #e2e8f0;">Free</th>
                @endif
                <th style="width: 15%; text-align: right; border-bottom: 2px solid #e2e8f0;">Unit Cost</th>
                <th style="width: 10%; text-align: right; border-bottom: 2px solid #e2e8f0;">Disc %</th>
                <th style="width: 15%; text-align: right; padding-right: 10px; border-bottom: 2px solid #e2e8f0;">Total (Rs)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchase->details as $index => $detail)
            <tr style="{{ $loop->even ? 'background-color: #f8fafc;' : '' }}">
                <td style="text-align: center; vertical-align: top; padding: 12px 5px; color: #64748b;">{{ $index + 1 }}</td>
                <td style="vertical-align: top; padding: 12px 5px;">
                    @if($detail->stock_location_type === 'printing_section' || ($detail->serial_number && $detail->brand))
                        <div style="font-weight: bold; color: #334155; margin-bottom: 4px;">{{ $detail->brand }} {{ $detail->model }}</div>
                        <div style="font-size: 11px; color: #64748b;">
                            <span style="font-weight: 500;">S/N:</span> 
                            <span style="font-family: 'Courier New', monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px;">{{ $detail->serial_number }}</span>
                        </div>
                    @else
                        <div style="font-weight: bold; color: #334155; margin-bottom: 4px;">{{ $detail->product->ItmNm ?? $detail->item_name }}</div>
                        @if($detail->product->ItemCode)
                        <div style="font-size: 11px; color: #64748b;">
                            Code: {{ $detail->product->ItemCode }}
                        </div>
                        @endif
                    @endif
                    @if(!empty($detail->remark))
                        <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 4px;">
                            Note: {{ $detail->remark }}
                        </div>
                    @endif
                </td>
                <td style="text-align: center; vertical-align: top; padding: 12px 5px;">
                    <span style="font-weight: 600; color: #334155;">{{ number_format($detail->Qty, 2) }}</span>
                </td>
                @if(!$isPrinterGrn)
                <td style="text-align: center; vertical-align: top; padding: 12px 5px; color: #64748b;">
                    {{ $detail->Free > 0 ? number_format($detail->Free, 2) : '-' }}
                </td>
                @endif
                <td style="text-align: right; vertical-align: top; padding: 12px 5px; color: #334155;">
                    {{ number_format($detail->CostPrice, 2) }}
                </td>
                <td style="text-align: right; vertical-align: top; padding: 12px 5px; color: #64748b;">
                    {{ $detail->DiscountRate > 0 ? number_format($detail->DiscountRate, 2) . '%' : '-' }}
                </td>
                <td style="text-align: right; vertical-align: top; padding: 12px 10px; font-weight: bold; color: #334155;">
                    {{ number_format($detail->AmountF, 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-container">
        <table class="totals-table">
            <tr>
                <td class="totals-label">Total Amount</td>
                <td class="totals-value">Rs. {{ number_format($purchase->CostTotal, 2) }}</td>
            </tr>
            <tr>
                <td class="totals-label">Total Discount</td>
                <td class="totals-value" style="color: #ef4444;">- Rs. {{ number_format($purchase->ToIDscount, 2) }}</td>
            </tr>
            @if($purchase->TaxAmount > 0)
            <tr>
                <td class="totals-label">Tax Amount</td>
                <td class="totals-value">Rs. {{ number_format($purchase->TaxAmount, 2) }}</td>
            </tr>
            @endif
            <tr>
                <td class="grand-total totals-label u-uppercase">Net Total</td>
                <td class="grand-total totals-value" style="color: #2563eb;">Rs. {{ number_format($purchase->TotalVal, 2) }}</td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>
            Generated by user: <strong>{{ $generated_by }}</strong> | System: UNITEC POS<br>
            This is a computer-generated document and is valid without a signature.
        </p>
    </div>
</body>
</html>