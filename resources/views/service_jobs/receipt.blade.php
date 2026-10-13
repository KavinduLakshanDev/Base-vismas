<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Receipt - {{ $job->job_number }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            margin: 0;
            padding: 0;
            background-color: #fff;
            width: 80mm; /* Standard POS paper width */
        }
        .receipt-box {
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
        .header .receipt-type {
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
            line-height: 1.4;
        }
        .info-section div {
            margin-bottom: 2px;
        }
        .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-top: 5px;
            margin-bottom: 2px;
            font-size: 11px;
        }
        .dotted-line {
            border-top: 1px dashed #000;
            margin: 5px 0;
        }
        .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 5px;
        }
        .signature-box {
            margin-top: 30px;
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
        .important-note {
            margin-top: 10px;
            font-size: 8px;
            font-style: italic;
            text-align: justify;
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
    <div class="receipt-box">
        <div class="header">
            <h1>VIS<span>MASS</span></h1>
            <p class="location">Sri Lanka - Yakkala</p>
            <div class="receipt-type">SERVICE RECEIPT</div>
            <p>Tel: +94 33 22 34300</p>
        </div>

        <div class="info-section">
            <div><strong>Date:</strong> {{ date('Y-m-d H:i') }}</div>
            <div><strong>Job No:</strong> {{ $job->job_number }}</div>
            
            <div class="dotted-line"></div>
            
            <div class="section-title">CUSTOMER DETAILS</div>
            <div><strong>Name:</strong> {{ $job->customer_name }}</div>
            <div><strong>Phone:</strong> {{ $job->customer_phone }}</div>
            @if($job->customer_address)
            <div><strong>Address:</strong> {{ $job->customer_address }}</div>
            @endif
            
            <div class="dotted-line"></div>
            
            <div class="section-title">DEVICE DETAILS</div>
            <div><strong>Device:</strong> {{ $job->device_name ?: $job->device_brand . ' ' . $job->device_model }}</div>
            @if($job->device_model && $job->device_name !== $job->device_model)
            <div><strong>Model:</strong> {{ $job->device_model }}</div>
            @endif
            @if($job->device_serial)
            <div><strong>Serial:</strong> {{ $job->device_serial }}</div>
            @endif
            
            <div class="dotted-line"></div>
            
            <div class="section-title">REPAIR REASON</div>
            <div style="white-space: pre-wrap;">{{ $job->problem_description }}</div>
            
            <div class="dotted-line"></div>
            
            @if($job->advanced_payment > 0)
            <div><strong>Advanced Paid:</strong> Rs {{ number_format($job->advanced_payment, 2) }}</div>
            @endif
            <div><strong>Estimated Date:</strong> {{ $job->estimated_completion_date ? \Carbon\Carbon::parse($job->estimated_completion_date)->format('Y-m-d') : 'TBD' }}</div>
        </div>

        <div class="important-note">
            * Please bring this receipt when collecting your device.<br>
            * We are not responsible for any data loss. Please back up your data.<br>
            * Items not collected within 30 days may be disposed of.
        </div>

        <div class="signature-box">
            <div class="signature">Customer Signature</div>
            <div class="signature">Authorized By</div>
        </div>

        <div class="footer">
            <p>Thank you for choosing VISMASS!</p>
            <p>{{ date('Y-m-d H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
