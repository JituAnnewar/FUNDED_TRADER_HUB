# ADMIN GUIDE

Everything happens at **/admin** (sign in with the account from SETUP.md). On your phone, open it in Chrome or Safari and choose **Add to Home Screen**: it then opens like an app.

Press **Ctrl+K** (or **⌘K**) anywhere in admin to jump to a page or start "New trade", "New payout" or "End-of-day update".

---

## The 2-minute daily routine

1. **Log trades as you take them**: **Quick add trade** → pick account → symbol → Long/Short → net P&L (minus sign for a loss) → **Save trade**. It remembers your last account.
2. **After the session**: **End-of-day update**. One row per active account:
   - Type the closing **balance** (equity copies it; change it if you have open trades).
   - **Today's P&L** fills in from yesterday's balance; correct it if needed.
   - Press **Enter** to move to the next box; Enter on the last box saves. Or press **Save all**.
3. Optional: **Journal → New journal entry** for the day. The plan and review boxes start with a template.

The public site updates within seconds. Accounts close to their loss limits appear in amber/red on the **Overview**.

## Adding a firm

**Firms → New firm**: name, website, logo, and the rules (daily loss %, max loss %, drawdown type, targets, minimum days, consistency %, payout frequency). Write your review in **My review**. These rules are the defaults for every account at that firm.

## Adding an account

**Accounts → New account**:
1. Choose the **firm** first: its rules appear as hints in the override fields.
2. Enter the **account size**. Balances fill in automatically if you leave them blank.
3. Choose the **phase** and **platform**. Type only the **last 4 characters** of the account number.
4. Leave the rule overrides blank unless this account has different rules.

## Moving an account between phases

Open the account → **Phase** box → **Move to Phase 2 / Funded / Payout pending / Breached / Closed**. Add a note if you like ("Passed with 8.4%"). Every move is saved in the phase history shown on the public account page.

## Logging trades in detail

**Trades → New trade** (or open any quick-added trade):
- Prices, size, risk ($) for R-multiples, fees, setup and mistake tags, emotions, rating, notes (Markdown with preview).
- **Screenshots**: drag images in, paste from the clipboard (click the box, then Ctrl/⌘+V), or press **Add screenshots**. Mark one **Before** and one **After** to get the comparison slider on the public trade page.
- **Duplicate** copies a trade (handy for scaling in). In the trade list, tick several trades to **make public/private** or **add a tag** to all of them at once.

## Open positions

**Open positions → New position** to show live trades (only visible publicly if you turn it on in Settings). When it closes: open it → **Close position** → exit price and P&L → it becomes a trade.

## Importing a CSV

**CSV import**:
1. Export your history from the platform (MT4/MT5: Account History → right-click → Report; cTrader: History → Export; Tradovate: Performance → CSV; NinjaTrader: Trade Performance → Trades → Export).
2. Choose the file and the **platform preset**. Set **Times in the file are in** (MetaTrader servers are usually UTC+2 in winter, UTC+3 in summer).
3. Check the column matches. Red rows show what's wrong; balance/deposit rows are skipped.
4. Pick the account and press **Import**. Trades already imported (same ticket ID) are skipped, so importing the same file twice is safe.
5. Using an unusual export? Fix the column matches, then **Save preset** so next time it's one click.

## Payouts and certificates

**Payouts → New payout**: firm, account, amount, date, method. Upload the **certificate** (image or PDF; PDFs get a preview image automatically). Add a **verification link** (e.g. the firm's public certificate page) to show a **Verified** badge. Tick **Featured** for the ones you want first.

## Controlling what is public

- Every firm, account, trade, payout, strategy, journal entry, post and toolkit item has **Visible on the public site**. Hiding an account also hides its trades.
- **Settings → What is public** hides whole sections on the home page and controls open positions and the TradingView ticker.
- **Private notes** fields are never shown publicly.

## Strategies, toolkit, goals, insights, milestones

All work the same way: **New**, fill in, **Save**. Use the ↑ ↓ arrows in the list to reorder. Goals can follow total payouts, funded capital or this month's P&L automatically, or use a manual value.

## Messages

**Messages** lists contact-form messages. Opening one marks it read. **Reply by email** opens your mail app and marks it replied. **Archive** to clear the inbox.

## Removing demo data

**Data & backups → Remove all demo data**. Only rows marked as demo are deleted; your own data is safe. The yellow banner disappears.

## Backups

**Data & backups → Download backup (JSON)** once a month and keep it in Google Drive or similar. CSV downloads per table are there for spreadsheets. Supabase also keeps daily backups on paid plans; on the free plan your JSON download is the backup.

## Security habits

- Turn on **two-factor sign-in** (Settings).
- You're signed out automatically after 30 minutes without activity.
- Never store prop firm or broker passwords anywhere on this site.
- Every change you make is listed in **Activity log**.
