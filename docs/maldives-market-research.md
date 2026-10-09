# WalletMV – Maldives market research (October 2026)

Scope: Maldives only. Gathered from web search on 2026-10-09; figures are from the cited sources and should be re-checked before external use.

## Market size and reach

- Population ~530,000 (UN, Oct 2025); 43% urban, 57% rural (atolls). [DataReportal 2026](https://datareportal.com/reports/digital-2026-maldives)
- 449,000 internet users, 84.7% penetration (end 2025). [DataReportal 2026](https://datareportal.com/reports/digital-2026-maldives)
- 777,000 mobile connections = 147% of population; 383,000 social media identities (72.3%). [DataReportal 2026](https://datareportal.com/reports/digital-2026-maldives)
- Small, highly connected market → a mobile-first app can reach a large share of adults, but the absolute user base is small (~400k adults), so features must be sharply local.

## Payments landscape

- **Favara** – MMA's instant payment system (account-to-account). Favara–UPI corridor with India went live 30 Jul 2026 for BML and MIB customers (MVR → INR, family-maintenance and gift remittances). [Vision IAS](https://visionias.in/current-affairs/upsc-daily-news-summary/article/2026-08-01/the-hindu/miscellaneous/favara-upi-cross-border-payment-corridor-goes-live-between-maldives-india), [Fintech Biz News](https://fintechbiznews.com/fintech-digital-payment-/favara-upi-is-live-for-maldives-india)
- **Payment Maldives Pvt Ltd** set up in early 2026 (MMA 60%) to run Favara, ACH and the upcoming **PayMV QR** system. [The Fintech Times](https://thefintechtimes.com/fintech-landscape-of-the-maldives-in-2026/)
- **Bank of Maldives (BML)** – largest bank; BML Pay wallet; cut merchant discount rate from 2.5% to 1% (Nov 2025). [NOWPayments](https://nowpayments.io/blog/payment-gateways-maldives)
- **DhiraaguPay** – P2P, Favara transfers, bill payments, bill splitting, sub-wallets, spending insights; open to non-Dhiraagu numbers; usable for MIRA tax payments. [Standard.mv](https://standard.mv/dhiraagupay-launches-limited-time-free-credit-promotion-for-reloads/), [Edition.mv](https://edition.mv/business/19545)
- **Ooredoo m-Faisaa** – transfers, utility and merchant payments, accepted on the government Bandeyri Pay portal; PayPal linking launched 15 Jun 2026 (2,159 wallets activated at launch). [Standard.mv](https://standard.mv/?p=18266), [Raajje.mv](https://raajje.mv/155507)
- No public total-user figures for any wallet were found.

**Implication:** money is spread across banks and 3+ wallets, and the existing wallets offer only per-wallet "spending insights". A neutral app that combines spending from all of them, tagged by payment method, fills a gap. Live bank/wallet integration isn't possible yet (no open-banking APIs found), so the MVP uses manual entry.

## Currency: the dollar problem

- Official MMA rate MVR 15.42/USD, but the black-market rate hit a record **MVR 22.10** (Aug 2026), a ~43% premium; it was ~MVR 18 in Feb 2026. [Adhadhu](https://adhadhu.com/85218), [Adhadhu](https://adhadhu.com/84759), [Maldives Voice](https://maldivesvoice.mv/2688)
- Importers can't get dollars at banks → prices passed on to consumers; some SMEs doubled retail prices. [Raajje.mv](https://raajje.mv/186890), [Edition.mv](https://preview.edition.mv/features/44648)
- Government target: back to 15.42 by end of 2027.

**Implication:** households pay in both MVR and USD (online shopping, travel, tuition, rent in some cases) and at different rates. WalletMV stores the **actual rate paid** on each USD transaction, so MVR totals reflect real cost. A competitor using a single rate would understate spending by up to ~40%.

## Tax

- GST: general rate 8%; tourism T-GST raised 16% → **17%** from 1 Jul 2025. Inbound tourism by non-residents taxed from 1 Oct 2026; MIRAconnect filing mandatory by 1 Jan 2027. [Orbitax](https://orbitax.com/news/archive.php/Maldives-Increasing-GST-Rate-f-57147), [LookupTax](https://lookuptax.com/tax-changes/maldives/gst-inbound-tourism-services-2026), [Beancount guide](https://beancount.io/blog/2026/09/26/maldives-tgst-17-percent-guesthouse-tour-operator-bookkeeping-guide)
- GST is 59.6% of MIRA revenue (Mar 2026). [MIRA](https://mira.gov.mv/ContentItems/View/newsmarch2026revenuecollections)
- **Later opportunity:** GST/T-GST bookkeeping for guesthouses and small tourism operators (not in MVP).

## Household finances

- Personal and consumer-durable borrowing is growing fast (reported 20% growth in personal loan credit); salary-advance schemes encourage borrowing. [MFR](https://mfr.mv/financial-sector/it-s-all-about-loans-and-debt-in-the-maldives), [Edition.mv](https://edition.mv/features/45292)
- No Maldives financial-literacy survey was found; MMA Financial Access Survey data on household borrowers exists. [MMA database](https://database.mma.gov.mv/viya/explore/2846)
- Typical costs (low-quality, mostly expat/travel sources; indicative only): Malé 1-bed rent MVR 10,000–30,000; utilities MVR 1,000–2,000/month; groceries MVR 1,000–2,000/week. [SDC](https://www.sdcinternationalshipping.com/cost-of-living-in-the-maldives/), [Trek Zone](https://trek.zone/en/maldives/prices)
- No Maldives-specific budgeting app was found in search results.

**Implication:** loan EMIs, rent and fixed utility/telecom bills take a large share of income → **bills + safe-to-spend** are the core MVP value, plus budget alerts.

## MVP scope decided from this

| Need (Maldives) | MVP feature |
| --- | --- |
| Money split across BML/MIB, Favara, BML Pay, DhiraaguPay, m-Faisaa, cash | Payment-method tag on every transaction |
| USD spending at official vs parallel rates | Per-transaction USD rate, MVR conversion |
| Fixed bills (STELCO, FENAKA, MWSC, Dhiraagu, Ooredoo, rent, loan EMI) | Bills with due dates, overdue status, one-tap "mark paid" |
| Debt pressure, month-end squeeze | Safe-to-spend per day after unpaid bills |
| Family support, remittances, Zakat | Dedicated categories |
| Privacy / no bank APIs | Offline, on-device storage |

## Next (post-MVP)

1. Cloud sync and login (Supabase or similar) shared with the WalletMV web dashboard.
2. SMS/notification parsing of BML/MIB alerts for automatic entry (Android).
3. Bill reminders via push notifications.
4. Dhivehi (Thaana, RTL) language support.
5. GST/T-GST bookkeeping mode for guesthouses and small businesses.
6. Savings goals and family/shared budgets.
