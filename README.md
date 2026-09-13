# 2027 Tactical Plan Dashboard

Interactive GitHub Pages dashboard for the **Tracking 2027** worksheet in `2027 Tactical Plan - Copy.xlsx`.

## Included analysis
- Total cost by Specialty
- Type of Activity linked to Specialty and total Cost
- Cost by Team Member: Abdullah Bone, Rana, Abdullah, Momen, Ibraheem, BU
- Cost by Zone
- Connected checkbox multi-select filters for Team Member, Specialty, Zone, Cost, and Type of Activity
- Global search across customer, specialty, zone, activity and team member
- Neon + glassmorphism design
- Charts and summary tables

## Privacy
This repository is public, so the Excel data itself is **not** stored here. Open the dashboard and click **Load Excel**. Processing happens locally in the browser.

## Data mapping
The dashboard reads the `Tracking 2027` sheet and maps:
- `Cust Name`
- `Specialty`
- `zone`
- `Abdullah Bone`
- `Rana`
- `Abdullah`
- `Momen`
- `Ibraheem`
- `BU`
- `cost`
- `type Of Activity`

Specialty / Zone / Activity analysis uses the row-level `cost` column. Team-member analysis sums each member's own column.

## Publish with GitHub Pages
Go to **Settings → Pages → Deploy from a branch**, then choose:
- Branch: `main`
- Folder: `/ (root)`

Save. Then open the published site and load the Excel file.
