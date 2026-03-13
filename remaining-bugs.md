# Remaining Bugs & Issues

## Medium Priority

### 1. Dashboard revenue excludes tax — inconsistent with Reports page
- **File:** `src/lib/store.ts` lines 662-666 (`getTotalRevenue`) and 690-694 (`getTopCustomers`)
- **Issue:** Revenue is computed as `subtotal - discount`, completely omitting `tax`. The Reports page (`src/pages/reports.tsx`) uses `order.total` (which includes tax) for the same "Total Revenue" metric. The two views show different numbers for the same data.
- **Fix:** Decide on one approach (pre-tax or post-tax revenue) and apply consistently across dashboard and reports.

### 2. Invoice page does not show discount line
- **Files:** `src/pages/invoices/[id].tsx`, database `invoices` table
- **Issue:** The invoice display shows Subtotal → Tax → Total. If an order-level discount was applied, it is not shown as a line item. The `invoices` table has no `discount` column, so even if a discount was applied when the order was created, it cannot be displayed on the invoice.
- **Fix:** Either add a `discount` column to the invoices table, or derive it from the linked order's discount fields.

### 3. Invoice PDF discount calculation is fragile
- **File:** `src/pages/api/generate-invoice-pdf.ts` line ~143
- **Issue:** Rather than reading a discount field directly, it reverse-engineers the discount via `Math.max(0, subtotal - (total - tax))`. Floating-point rounding errors in stored values can produce phantom discounts or swallow small discrepancies.
- **Fix:** Store and read the discount value explicitly rather than computing it from other fields.

## Low Priority

### 4. Receivables payment search is non-functional
- **File:** `src/pages/receivables.tsx` line ~116
- **Issue:** Search only matches on the raw UUID `payment.orderId`. Users will never know to search by UUID. No customer name, amount, payment date, or order number is searchable.
- **Fix:** Extend the search filter to match against customer name, order number, and amount.

### 5. Direct Supabase client calls from browser (inconsistent proxy pattern)
- **Files:** `src/services/supabaseService.ts`, `src/lib/store.ts`
- **Issue:** Only `getCustomers()` uses the `/api/customers` server-side proxy. All other tables (orders, products, invoices, payments, settings, inventory) are fetched directly from the browser via the Supabase JS client. If CORS or response-size issues arise for other tables as data grows, they will need the same proxy treatment.
- **Note:** Currently only customers had enough data (266 records, 143KB) to trigger the issue. Other tables are small. This is a preventive concern, not an active bug.

### 6. Receivables totalReceivables vs totalOverdue potential double-count
- **File:** `src/pages/receivables.tsx` lines ~88-95
- **Issue:** `totalReceivables` sums `amountDue` from orders. `totalOverdue` sums `amount_due` from unpaid invoices past due date. An order can have a corresponding invoice — the same debt could be counted in both figures since they come from different tables.
- **Fix:** Derive both metrics from the same source (either orders or invoices, not a mix).

### 7. Database types file is out of sync
- **File:** `src/integrations/supabase/database.types.ts`
- **Issue:** The types file does not include the `items` JSONB column on the `orders` table (it exists in the actual DB). It also defines an `order_items` table that does not exist in the database. Run `supabase gen types typescript` to regenerate.
