# SZC ERP — fixed local-first build

## Deploy to Vercel
1. Upload this folder/project to your GitHub repository, or import it directly into Vercel.
2. Framework Preset: **Other** (or leave auto-detected).
3. Build Command: **leave empty**.
4. Output Directory: **leave empty**.
5. Deploy.

This is a static app: there is no Node server, database, API key, or environment variable required.

## Important
- The app stores data in the browser's localStorage.
- Do not deploy multiple copies if you need the same browser data; each browser/device has its own local dataset.
- Use **Backup & Restore** regularly to export the JSON backup.
- `vercel.json` routes direct page requests back to `index.html` so a direct URL does not return a blank/404 page.
- The app now has a visible error boundary. If a JavaScript module fails, it shows the error instead of leaving the workspace blank.
- Startup data is normalized so malformed/old localStorage records do not crash the entire UI.
- Google Fonts were removed from the critical path so the UI does not depend on an external font request.
- QR generation still uses the QR library CDN when an invoice is being created. If that CDN is unavailable, the invoice workflow remains usable and shows the UPI details instead of crashing.


## Record management update
- Edit and delete invoices.
- Edit invoice customer details and line items.
- Change invoice/payment status, including partial payment amount.
- Edit/delete product and service catalogue entries.
- Edit/delete customers and projects.
- Edit/delete expenses and purchases.
- Purchases and expenses support tags/categories.
- Payment records can be deleted; invoice status can be edited from Payments.
- Existing invoice line items remain unchanged when a catalogue product/service is edited or deleted.
