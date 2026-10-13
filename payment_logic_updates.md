# Customer Payment & Balance Update Documentation

## Overview
This document outlines the changes made to the system to ensure that customer partial payments and balance updates are correctly handled and persisted in the `AccMas` (Account Master) table.

## Changes Implemented

### 1. Persistent Balance Updates in `SalesController.php`
- **Objective**: Ensure that when a sale is made on credit (or with a partial payment), the customer's outstanding balance is immediately reflected in their account.
- **Change**:
    - Imported `App\Models\AccMas`.
    - Modified the `store` method to check if there is a remaining `balance_amount` after the sale.
    - If a balance exists, the system now finds the customer's `AccMas` record and **increments** the `CurBal` by that amount.

```php
// In SalesController::store
use App\Models\AccMas;

// ... existing code ...

// Update Customer Account Balance (AccMas)
if ($customer && $balance > 0) {
    $accMas = AccMas::where('AccKy', $customer->AccKy)->first();
    if ($accMas) {
        $accMas->increment('CurBal', $balance);
    }
}
```

### 2. Balance Decrement on Payment in `Admin/CustomerController.php`
- **Objective**: Ensure that when a customer makes a manual payment, their outstanding balance is reduced accordingly.
- **Change**:
    - Modified the `storePayment` method.
    - When a payment is recorded, the system finds the customer's `AccMas` record and **decrements** the `CurBal` by the payment `amount`.

```php
// In Admin/CustomerController::storePayment

// Update Customer Account Balance (AccMas)
// Decrement the balance as they have paid
$accMas = AccMas::where('AccKy', $customer->AccKy)->first();
if ($accMas) {
    $accMas->decrement('CurBal', $validated['amount']);
}
```

### 3. Allocation Logic Fix in `Admin/CustomerPaymentController.php`
- **Objective**: Fix the issue where "Auto-allocation" of payments was creating duplicate `CustomerPayment` records, leading to incorrect reporting.
- **Change**:
    - Removed the creation of `CustomerPayment` records inside the auto-allocation loop.
    - The loop now only updates the `balance_amount` and `status` of the target `SalesTransaction` or `ServiceJob`.
    
**Why this was needed**:
Previously, the system would create one main payment record for the total amount, and then potentially create *more* payment records for each invoice it allocated the payment to. This caused the "Total Payments" report to show double amounts.

**Corrected Logic**:
1.  **Create One Payment**: A single `CustomerPayment` record is created for the full amount.
2.  **Update Ledger**: The `AccMas.CurBal` is decremented once.
3.  **Allocate**: The system iterates through old unpaid invoices/jobs and marks them as paid by updating their `balance_amount` directly, **without** created new payment rows.

```php
// In Admin/CustomerPaymentController::store (Auto-allocation loop)

// checks if item is a job
if ($item['type'] === 'job') {
    $jobModel = $item['model'];
    
    // UPDATED: Just update the job totals, do NOT create another payment record
    $totalPaid = CustomerPayment::where('service_job_id', $jobModel->id)->sum('amount');
    $jobModel->paid_amount = $totalPaid + $payAmount; 
    $jobModel->updateTotals();
    
    // ... check for completion ...
    
} else {
    // It's an invoice
    $invModel = $item['model'];
    
    // UPDATED: Directly update invoice balance
    $invModel->balance_amount = (float)$invModel->balance_amount - $payAmount;
    // ... update status ...
    $invModel->save();
    
    // Do NOT create another payment record here
}
```

## Conclusion
These changes ensure a "Journal & Ledger" approach where:
1.  **Journal**: `CustomerPayment` and `SalesTransaction` provide the detailed history.
2.  **Ledger**: `AccMas.CurBal` provides a performant, real-time view of the customer's total outstanding balance.
3.  **Integrity**: Duplicate payment records are prevented during auto-allocation.
