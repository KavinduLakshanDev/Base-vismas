<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Orders Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-info {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        .company-info .left,
        .company-info .right {
            display: table-cell;
            width: 50%;
        }
        
        .company-info .right {
            text-align: right;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }
        
        th {
            border: 1px solid #000;
            padding: 8px;
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        td {
            border: 1px solid #000;
            padding: 6px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .total-row {
            background-color: #e8f5e8;
            font-weight: bold;
        }
        
        .summary-box {
            display: inline-block;
            border: 1px solid #000;
            padding: 10px;
            text-align: center;
            width: 23%;
            margin-right: 1%;
        }
        
        .footer {
            margin-top: 30px;
            font-size: 10px;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>Purchase Orders Report</h1>
        <div>{{ $company['name'] }} - {{ $company['branch'] }}</div>
    </div>

    <!-- Company Information -->
    <div class="company-info">
        <div class="left">
            <strong>Company:</strong> {{ $company['name'] }}<br />
            <strong>Branch:</strong> {{ $company['branch'] }}<br />
            <strong>Code:</strong> {{ $company['code'] }}
        </div>
        <div class="right">
            <strong>Date Range:</strong> {{ \Carbon\Carbon::parse($fromDate)->format('d/m/Y') }} - {{ \Carbon\Carbon::parse($toDate)->format('d/m/Y') }}<br />
            <strong>Supplier:</strong> {{ $filters['supplier_id'] === 'all' ? 'All Suppliers' : $filters['supplier_id'] }}<br />
            <strong>Generated:</strong> {{ now()->format('d/m/Y H:i:s') }}
        </div>
    </div>

    <!-- Data Table -->
    <table>
        <thead>
            <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Branch</th>
                <th>Items</th>
                <th>Total Qty</th>
                <th>Total Value (Rs)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($reportData as $item)
                <tr>
                    <td class="text-center">{{ $item['order_number'] }}</td>
                    <td class="text-center">{{ \Carbon\Carbon::parse($item['order_date'])->format('d/m/Y') }}</td>
                    <td>{{ $item['supplier_name'] }}</td>
                    <td>{{ $item['branch_name'] }}</td>
                    <td class="text-right">{{ $item['total_items'] }}</td>
                    <td class="text-right">{{ number_format($item['total_quantity'], 2) }}</td>
                    <td class="text-right">{{ number_format($item['total_value'], 2) }}</td>
                    <td class="text-center">{{ $item['status'] }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="4" class="text-center">Total</td>
                <td class="text-right"></td>
                <td class="text-right">{{ number_format($totals['total_items'], 2) }}</td>
                <td class="text-right">Rs. {{ number_format($totals['total_value'], 2) }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <!-- Summary -->
    <div style="margin-top: 20px;">
        <div class="summary-box">
            <strong>Total Orders</strong><br />
            {{ $totals['orders_count'] }}
        </div>
        <div class="summary-box">
            <strong>Total Value (Rs)</strong><br />
            Rs. {{ number_format($totals['total_value'], 2) }}
        </div>
        <div class="summary-box">
            <strong>Received Value (Rs)</strong><br />
            Rs. {{ number_format($totals['received_value'], 2) }}
        </div>
        <div class="summary-box">
            <strong>Total Items</strong><br />
            {{ number_format($totals['total_items'], 2) }}
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Generated on {{ now()->format('d/m/Y') }} at {{ now()->format('H:i:s') }}</p>
        <p>This is a computer-generated report.</p>
    </div>
</body>
</html>
