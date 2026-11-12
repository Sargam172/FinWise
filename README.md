# FinWise

A personal finance dashboard built with React, Vite and Recharts.

**Live demo:** add your Vercel link here after you deploy

## Features
- Add, edit and delete income and expense transactions, with search and filters
- Dashboard cards, a six-month income vs expenses chart and a spending-by-category chart, all calculated from your transactions
- Month picker to look back at earlier months
- Multi-currency support: 17 currencies, each transaction saved in the currency it was entered in, with live exchange rates from a free public API
- Data is saved in your browser, so it survives a refresh

## Built with
React, Vite, Recharts, lucide-react, plain CSS

## Run it locally
```
npm install
npm run dev
```
Then open the address shown in the terminal, usually http://localhost:5173.

## Notes
- The starting data is fictional demo data.
- Everything is stored in your own browser (localStorage). There is no account or server yet.
- Exchange rates come from a free public service. If it can't be reached, the app shows CAD only.

## Ideas for later
User accounts and a cloud database, budgets and savings goals pages, and exporting transactions to CSV.