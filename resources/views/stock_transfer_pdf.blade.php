<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Stock Transfer Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .document-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-top: 10px;
        }

        .info-section {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }

        .info-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
        }

        .info-label {
            font-weight: bold;
            color: #1e40af;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 14px;
            margin-bottom: 15px;
            color: #333;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        th {
            background-color: #1e40af;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            border: 1px solid #1e40af;
        }

        td {
            padding: 12px;
            border: 1px solid #ddd;
            font-size: 13px;
        }

        tr:nth-child(even) {
            background-color: #f9fafb;
        }

        tr:hover {
            background-color: #f0f4ff;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .total-row {
            background-color: #eff6ff;
            font-weight: bold;
            border-top: 2px solid #1e40af;
        }

        .total-label {
            color: #1e40af;
        }

        .total-value {
            color: #1e40af;
            font-weight: bold;
        }

        .notes-section {
            margin-top: 25px;
            padding: 15px;
            background-color: #f9fafb;
            border-left: 4px solid #1e40af;
            border-radius: 4px;
        }

        .notes-label {
            font-weight: bold;
            color: #1e40af;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .notes-value {
            color: #333;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
            display: table;
            width: 100%;
        }

        .footer-column {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 10px;
        }

        .section-header {
            font-weight: bold;
            color: #1e40af;
            font-size: 12px;
            margin-top: 20px;
            margin-bottom: 10px;
            padding: 10px 0;
            border-bottom: 2px solid #dbeafe;
        }

        .empty-state {
            padding: 40px;
            text-align: center;
            color: #999;
            font-size: 14px;
        }

        .transfer-arrow {
            text-align: center;
            color: #1e40af;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">{{ $company_name }}</div>
            <div class="document-title">STOCK TRANSFER REPORT</div>
            <div style="font-size: 14px; margin-top: 5px; color: #555;">Transaction No: {{ $transfer_number }}</div>
        </div>

        <!-- Transfer Information -->
        <div class="info-section">
            <div class="info-column">
                <div class="info-label">Transfer Date</div>
                <div class="info-value">
                    {{ \Carbon\Carbon::parse($transfer_date)->format('d M Y') }}
                </div>

                <div class="info-label">From Section</div>
                <div class="info-value">{{ $from_section }}</div>
            </div>
            <div class="info-column">
                <div class="info-label">Document Generated</div>
                <div class="info-value">{{ $generated_at }}</div>

                <div class="info-label">To Section</div>
                <div class="info-value">{{ $to_section }}</div>
            </div>
        </div>

        <!-- Transfer Direction -->
        <!-- <div class="transfer-arrow">{{ $from_section }} ➜ {{ $to_section }}</div> -->

        <!-- Items Section -->
        @if(count($items) > 0)
            <div class="section-header">Transfer Items</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Item Code</th>
                        <th style="width: 30%;">Item Name</th>
                        <th style="width: 15%;">Batch No</th>
                        <th class="text-center" style="width: 10%;">Quantity</th>
                        <th class="text-right" style="width: 15%;">Cost Price (Rs)</th>
                        <th class="text-right" style="width: 15%;">Total Value (Rs)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                        <tr>
                            <td>{{ $item['item_code'] }}</td>
                            <td>{{ $item['item_name'] }}</td>
                            <td>{{ $item['batch_no'] }}</td>
                            <td class="text-center">{{ number_format($item['quantity'], 2) }}</td>
                            <td class="text-right">{{ number_format($item['cost_price'], 2) }}</td>
                            <td class="text-right">{{ number_format($item['total_value'], 2) }}</td>
                        </tr>

                    @endforeach
                    <tr class="total-row">
                        <td colspan="5" class="text-right total-label">Grand Total</td>
                        <td class="text-right total-value">{{ number_format($total_cost_value, 2) }}</td>
                    </tr>
                </tbody>
            </table>
        @else
            <div class="empty-state">
                No items in this transfer
            </div>
        @endif

        <!-- Notes Section -->
        @if($notes)
            <div class="notes-section">
                <div class="notes-label">Notes</div>
                <div class="notes-value">{{ $notes }}</div>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <div class="footer-column">
                <strong>Generated By:</strong><br>
                {{ $generated_by }}
            </div>
            <div class="footer-column">
                <strong>Generated On:</strong><br>
                {{ $generated_at }}
            </div>
            <div class="footer-column">
                <strong>Status:</strong><br>
                Pending Execution
            </div>
        </div>
    </div>
</body>
</html>
