<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wastage Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@100..900&display=swap');
        body {
            font-family: 'Noto Sans Sinhala', 'DejaVu Sans', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            background-color: #fff;
        }

        .container {
            max-width: 750px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 5px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .company-info-table {
            width: 85%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }

        .company-info-table td {
            border: none;
            padding: 2px 4px;
            vertical-align: top;
        }

        .company-info-table td:nth-child(odd) {
            font-weight: bold;
            width: 15%;
        }

        .report-info {
            margin-bottom: 20px;
            font-size: 11px;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }

        .summary-table th,
        .summary-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .summary-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }

        .data-table th,
        .data-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }

        .data-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
        }

        .data-table .text-right {
            text-align: right;
        }

        .data-table .text-center {
            text-align: center;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }

        .page-break {
            page-break-before: always;
        }

        @media print {
            body {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="title">{{ $companyInfo['name'] }}</div>
            <div>Wastage Report</div>
        </div>

        <!-- Company Info -->
        <table class="company-info-table">
            <tr>
                <td>Company:</td>
                <td>{{ $companyInfo['name'] }}</td>
                <td>Report Date:</td>
                <td>{{ date('Y-m-d') }}</td>
            </tr>
            <tr>
                <td>Section:</td>
                <td>{{ $companyInfo['section'] }}</td>
                <td>Generated At:</td>
                <td>{{ $generatedAt }}</td>
            </tr>
            <tr>
                <td>Period:</td>
                <td>{{ date('d/m/Y', strtotime($fromDate)) }} - {{ date('d/m/Y', strtotime($toDate)) }}</td>
                <td></td>
                <td></td>
            </tr>
        </table>

        <!-- Summary -->
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Total Wastage Items</th>
                    <th>Total Wastage Quantity</th>
                    <th>Period</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="text-center">{{ count($wastageData) }}</td>
                    <td class="text-center">{{ $wastageData->sum('quantity') }}</td>
                    <td class="text-center">{{ date('d/m/Y', strtotime($fromDate)) }} - {{ date('d/m/Y', strtotime($toDate)) }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Wastage Data -->
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 8%;">Date</th>
                    <th style="width: 10%;">Item Code</th>
                    <th style="width: 25%;">Item Name</th>
                    <th style="width: 15%;">Batch No</th>
                    <th style="width: 12%;" class="text-right">Qty</th>
                    <th style="width: 15%;">Reference</th>
                </tr>
            </thead>
            <tbody>
                @forelse($wastageData as $item)
                <tr>
                    <td class="text-center">{{ date('d/m/Y', strtotime($item['date'])) }}</td>
                    <td>{{ $item['item_code'] }}</td>
                    <td>{{ $item['item_name'] }}</td>
                    <td>{{ $item['batch_no'] }}</td>
                    <td class="text-right">{{ number_format($item['quantity'], 2) }}</td>
                    <td>{{ $item['reference'] }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 20px;">
                        No wastage data found for the selected period
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
            <p>Report generated on {{ date('d/m/Y H:i:s', strtotime($generatedAt)) }}</p>
            <p>Total Records: {{ count($wastageData) }}</p>
        </div>
    </div>
</body>
</html>