# BEES Analytics 🔋⚡

**Battery Energy Capacity Optimization and Economics Benefit Analysis** - An open-source, browser-based tool for analyzing solar + battery storage systems with advanced optimization features.

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/sztistvan/BEES_Analytics/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Plotly](https://img.shields.io/badge/plotly.js-2.27.0-purple.svg)](https://plotly.com/javascript/)

---

## 🌍 Language / Nyelv
[English](#english) | [Magyar](#magyar)

---

<a name="english"></a>
## English

### 📖 Description

**BEES Analytics** helps solar homeowners, energy consultants, and system designers determine the optimal battery capacity based on high-resolution 15-minute data. 

**Key Features:**
- 🔋 **Battery Simulation Engine** with realistic charging/discharging physics
- 📊 **Optimization Curve** - automated analysis across 11 battery capacities
- � **Solar Self-Consumption Analysis** - yearly breakdown with monthly reports and export
- 💰 **Financial Analysis** with progressive pricing (Tier1/Tier2)
- 🔄 **Dual Inverter Modes** - Asymmetric (modern) / Symmetric (legacy)
- ⏱️ **Time Aggregation** - view data at 15-min, daily, or monthly intervals
- 📈 **Interactive Visualizations** powered by Plotly.js with energy flow charts
- 🌍 **Bilingual Interface** - English & Hungarian with 7-section help system
- 📊 **Demo Data Included** - instant testing with realistic solar scenarios
- 📱 **Mobile Optimized** - responsive design for tablets and phones
- 📁 **Universal CSV Import** - flexible timestamp parsing
- 💾 **No Installation Required** - runs entirely in your browser

### 🎯 What Problems Does It Solve?

1. **Optimal Battery Sizing**: Determine the right capacity to maximize ROI
2. **Self-Consumption Analysis**: Understand how much solar energy you can use directly
3. **Financial Planning**: Calculate savings with progressive electricity pricing
4. **System Comparison**: Test different configurations without expensive trials
5. **Phase-Specific Analysis**: Model modern vs. legacy inverter behavior

### 🚀 Live Demo

**[Try BEES Analytics Now →](https://sztistvan.github.io/BESS-Analytics/)**

No installation needed - just open in your browser!

### 📊 Data Requirements

The simulation requires **two CSV files** with 15-minute interval data:

#### 1. Solar Generation Data
**Format:** `Timestamp, Production (kW)`

**Example:**
```csv
Timestamp,Production (kW)
2024-01-01 00:00,0.0
2024-01-01 00:15,0.0
2024-01-01 08:00,2.5
2024-01-01 12:00,8.3
```

#### 2. Grid Meter Data
**Format:** `Timestamp, Import (kWh), Export (kWh)`

**Example:**
```csv
Timestamp,Import (kWh),Export (kWh)
2024-01-01 00:00,0.5,0.0
2024-01-01 00:15,0.6,0.0
2024-01-01 12:00,0.0,2.1
```

**Supported Timestamp Formats:**
- ISO: `YYYY-MM-DD HH:mm` (e.g., 2024-10-01 14:30)
- US: `M/D/YYYY H:mm` (e.g., 1/1/2024 0:15)
- EU: `YYYY.MM.DD. HH:mm` (e.g., 2024.10.01. 14:30)

⚠️ **Note:** Timestamps don't need to match between files - the app automatically aligns them!

### 🎬 Quick Start

#### Option 1: Use Demo Data (Recommended)
No file preparation needed - demo data includes realistic solar and grid patterns from a real installation.

1. Open `index.html` in your browser
2. Click **"📊 Load Demo Scenarios"** (instantly loads sample data)
3. Select time range (try "Year" for full analysis)
4. Click **"⚡ Run Battery Simulation"**
5. Explore the results!

#### Option 2: Use Your Own Data
1. Prepare your CSV files (see format above)
2. Click **"1. Solar Generation Data"** to upload
3. Click **"2. Grid Meter Data"** to upload
4. Set time range and battery parameters
5. Run simulation and analyze

### ⚙️ Configuration Options

#### Battery Parameters
- **Capacity (kWh)**: 0-200 kWh (typical residential: 5-15 kWh)
- **Charge Efficiency**: 80-100% (typical: 95-96%)
- **Discharge Efficiency**: 80-100% (typical: 92-94%)
- **Max Charge Power (kW)**: Maximum charging rate
- **Max Discharge Power (kW)**: Maximum discharging rate
- **Min/Max SOC (%)**: Operating range (typical: 10-90%)

#### Navigation Controls
- **Preset Buttons**: Week (last 7 days, Monday start), Month (30 days), Year (365 days), Full Range
- **Arrow Navigation**: Use ← and → buttons to quickly move backward/forward by the selected interval
- **Current Button**: Jump to the most recent data in your dataset
- **Custom Range**: Precise start/end date and time picker for specific periods

#### Inverter Modes
- **Asymmetric** (Default): Modern hybrid inverters that optimize power distribution across phases
- **Symmetric**: Legacy inverters with equal phase distribution

#### Currency Selection
- **Supported Currencies**: HUF (Ft) and EUR (€)
- All financial displays (KPIs, charts, exports) update automatically based on selection

#### Financial Settings
- **Import Price Tier1**: Discounted electricity rate (HUF/kWh)
- **Import Price Tier2**: Market electricity rate (HUF/kWh)
- **Export Price**: Feed-in tariff or net-metering credit (HUF/kWh)
- **Tier1 Limit**: Annual quota for discounted rate (default: 2,523 kWh)

### 📈 Key Features Explained

#### Battery Optimization Curve
Automatically tests 11 different battery capacities: **[0, 1, 2, 5, 10, 15, 20, 40, 50, 100, 200 kWh]**

**Output:**
- Interactive chart showing Grid Import/Export Reduction (%)
- Data labels with estimated annual savings (HUF)
- CSV export for further analysis
- Helps identify the "sweet spot" capacity

#### Progressive Pricing (Tier1/Tier2)
Models the Hungarian electricity market:
- **Tier1**: First 2,523 kWh/year at discounted rate
- **Tier2**: Consumption above limit at market rate
- **Auto-scaling**: Proportionally adjusts for periods <1 year

Example: 30-day simulation → Tier1 limit = 2,523 × (30/365) ≈ 207 kWh

#### Energy Flow Visualization
Side-by-side comparison of energy flow before and after battery installation:
- Visualizes original grid import/export (without battery)
- Shows optimized grid import/export (with battery)
- Displays battery state of charge (SOC) over time
- Independent Power/Energy toggle and time aggregation controls
- **Use Case**: See exactly when your battery charges and discharges throughout the day

#### Time Aggregation (15min/Daily/Monthly)
View your data at different time scales for better insights:
- **15-minute**: Original high-resolution data (35,040 points/year)
- **Daily**: Aggregated daily view (365 points/year) - ideal for weekly/monthly patterns
- **Monthly**: Aggregated monthly view (12 points/year) - perfect for seasonal analysis
- Independent controls for each chart (overview and energy flow)
- Smart aggregation: sums energy values (kWh), averages power values (kW) and battery SOC
- **Use Case**: Monthly view reveals seasonal patterns invisible in 15-minute data

#### Solar Self-Consumption Analysis (Yearly Report)
Comprehensive year-based analysis with monthly breakdown and financial tracking:

**Input:**
- Year selection dropdown (auto-populated with complete years)
- Battery capacity input (inherits all other settings from main configuration)

**Summary Cards:**
- Solar Self-Consumption (No Battery): kWh and % of total production
- Solar Self-Consumption (With Battery): kWh and % improvement
- Grid Export Reduction: kWh and % savings

**Monthly Breakdown Table:**
- 12 monthly rows + TOTAL summary row
- Columns: Month, Before Battery, After Battery, Grid Export Reduction
- Optional financial columns (💰 toggle button): Baseline Cost, Battery Cost, Total Savings
- Cumulative tier tracking for accurate utility bill modeling

**Dual Chart Visualization:**
- Chart 1: Absolute values (kWh) - grouped bar chart
- Chart 2: Percentage view (%) - grouped bar chart
- Color-coded: Before (orange), After (green), Reduction (blue)

**Export Capabilities:**
- 📋 Copy to Clipboard: TSV format for pasting into Excel/Google Sheets
- 📥 Download CSV: Full data with metadata and timestamp

**Use Case**: Perfect for annual ROI analysis and professional client reports

⚠️ **Note**: Requires complete calendar year data (Jan 1 00:00 - Dec 31 23:45)

### 📂 Project Structure

```
BEES_Analytics/
├── index.html              # Main application file
├── style.css               # Dark theme styling
├── js/
│   ├── app.js             # Main orchestration (900+ lines)
│   ├── csv_handler.js     # CSV parsing with flexible timestamps
│   ├── data_merger.js     # Dataset alignment & aggregation
│   ├── visualizer.js      # Plotly chart rendering
│   ├── simulation.js      # Battery physics engine
│   ├── yearly_analysis.js # Year-based monthly analysis
│   └── help_modal.js      # Help system & UI components
├── data/
│   ├── solar_power_15min.csv          # Demo solar data
│   └── grid_meter_energy_15_min.csv   # Demo grid data
├── docs/                   # (reserved for future use)
├── local_docs/            # Implementation notes and planning docs
├── README.md              # This file
├── RELEASE_NOTES_v1.0.0.md  # Initial release notes
└── RELEASE_NOTES_v1.1.0.md  # Documentation update release notes
```

### 🛠️ Technologies

- **Pure JavaScript (ES6+)**: No frameworks, no build process
- **Plotly.js 2.27.0**: Interactive charts
- **HTML5 & CSS3**: Modern web standards
- **LocalStorage API**: Save user preferences

### 🔧 Installation & Development

```bash
# Clone the repository
git clone https://github.com/sztistvan/BEES_Analytics.git

# Navigate to directory
cd BEES_Analytics

# Open in browser (no build step!)
# On Windows:
start index.html

# On macOS:
open index.html

# On Linux:
xdg-open index.html
```

**That's it!** No `npm install`, no compilation, no server needed.

### 🧪 Testing

1. Load demo data
2. Try different battery capacities (5 kWh, 10 kWh, 20 kWh)
3. Run optimization curve (takes ~10-15 seconds)
4. Toggle between Import/Export reduction views
5. Export CSV and verify calculations
6. Test with your own data

### 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Recommended |
| Firefox | Latest | ✅ Supported |
| Edge | Latest | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| IE | Any | ❌ Not supported |

### � Mobile & Tablet Support

Fully optimized responsive design for all device sizes:

**Progressive Breakpoints:**
- **Desktop** (>768px): Full-featured layout
- **Tablets** (≤768px): Optimized layouts with touch-friendly controls
- **Phones** (≤600px): Single-column layout, stacked components
- **Small Phones** (≤480px): Compact design with scaled fonts

**Mobile Features:**
- 👆 Touch-friendly controls (48px minimum touch targets)
- 📱 Single-column layouts for easy scrolling
- 📊 Responsive charts with full touch gesture support
- 📊 Horizontal scroll tables with sticky first column
- 🔤 Progressive font scaling for readability

**Use Case**: Perfect for solar consultants presenting analysis on tablets during client site visits

### �🐛 Known Issues

- Large datasets (>1 year): Use Daily/Monthly aggregation for improved chart rendering performance
- CSV files must have consistent 15-minute intervals (no gaps)
- Maximum 200 kWh capacity in optimization curve
- Yearly Analysis feature requires complete calendar year data (Jan 1 - Dec 31)
- No battery degradation modeling (planned for v2.0)

### 🔮 Roadmap

**v1.1.0** (Planned)
- [ ] Time-of-use pricing support
- [ ] PDF report generation
- [ ] Data validation and gap-filling tools
- [ ] Battery degradation modeling

**v2.0.0** (Future)
- [ ] Multi-year trend analysis
- [ ] Cloud data storage
- [ ] REST API
- [ ] Mobile app

### 🤝 Contributing

Contributions welcome!

**Ways to contribute:**
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repo if you find it useful!

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- **Plotly.js Team**: Amazing visualization library
- **Hungarian Solar Community**: Real-world feedback and testing
- **Energy Consultants**: Validation of calculations

### 📧 Contact & Support

- **GitHub**: [@sztistvan](https://github.com/sztistvan)
- **Issues**: [GitHub Issues](https://github.com/sztistvan/BEES_Analytics/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sztistvan/BEES_Analytics/discussions) 

### 📊 Citation

If you use this tool in research, please cite:

```bibtex
@software{bees_analytics_2026,
  author = {István Szatmári},
  title = {BEES Analytics: Battery Energy Economics Simulator},
  year = {2026},
  url = {https://github.com/sztistvan/BEES_Analytics},
  version = {1.1.0}
}
```

---

<a name="magyar"></a>
## Magyar

### 📖 Leírás

A **BEES Analytics** segít a napelemes rendszertulajdonosoknak, energetikai tanácsadóknak és rendszertervezőknek meghatározni az optimális akkumulátor kapacitást 15 perces felbontású adatok alapján.

**Főbb funkciók:**
- 🔋 **Akkumulátor Szimulációs Motor** valósághű töltési/kisütési fizikával
- 📊 **Optimalizációs Görbe** - automata elemzés 11 különböző kapacitásra
- � **Napelemes Önfogyasztás Elemzés** - éves bontás havi riportokkal és exportálással
- 💰 **Pénzügyi Elemzés** sávos árazással (Tier1/Tier2)
- 🔄 **Kettős Inverter Mód** - Aszimmetrikus (modern) / Szimmetrikus (régi)
- ⏱️ **Időaggregáció** - adatok megtekintése 15 perces, napi vagy havi bontásban
- 📈 **Interaktív Vizualizációk** Plotly.js technológiával és energia áramlási diagramokkal
- 🌍 **Kétnyelvű Felület** - Angol és Magyar 7 szakaszos súgórendszerrel
- 📊 **Demo Adatok Mellékelve** - azonnali tesztelés valósághű napelemes forgatókönyvekkel
- 📱 **Mobil Optimalizált** - reszponzív dizájn táblagépekhez és telefonokhoz
- 📁 **Univerzális CSV Import** - rugalmas időbélyeg felismerés
- 💾 **Telepítés Nem Szükséges** - teljesen böngészőben fut

### 🎯 Milyen Problémákat Old Meg?

1. **Optimális Akkumulátor Méretezés**: Határozd meg a megfelelő kapacitást a legjobb megtérüléshez
2. **Önfogyasztás Elemzés**: Értsd meg, mennyi napenergiát tudsz közvetlenül felhasználni
3. **Pénzügyi Tervezés**: Számítsd ki a megtakarítást sávos árazással
4. **Rendszer Összehasonlítás**: Tesztelj különböző konfigurációkat drága próbák nélkül
5. **Fázisonkénti Elemzés**: Modellezd a modern vs. régi inverter viselkedést

### 🚀 Élő Demó

**[Próbáld ki a BEES Analytics-ot most →](https://sztistvan.github.io/BEES_Analytics/)**

Nem kell telepíteni - csak nyisd meg a böngésződben!

### 📊 Adatkövetelmények

A szimulációhoz **két CSV fájl** szükséges 15 perces felbontású adatokkal:

#### 1. Napelemes Termelési Adatok
**Formátum:** `Időbélyeg, Termelés (kW)`

**Példa:**
```csv
Időbélyeg,Termelés (kW)
2024-01-01 00:00,0.0
2024-01-01 00:15,0.0
2024-01-01 08:00,2.5
2024-01-01 12:00,8.3
```

#### 2. Hálózati Mérő Adatok
**Formátum:** `Időbélyeg, Import (kWh), Export (kWh)`

**Példa:**
```csv
Időbélyeg,Import (kWh),Export (kWh)
2024-01-01 00:00,0.5,0.0
2024-01-01 00:15,0.6,0.0
2024-01-01 12:00,0.0,2.1
```

**Támogatott Időbélyeg Formátumok:**
- ISO: `ÉÉÉÉ-HH-NN ÓÓ:pp` (pl. 2024-10-01 14:30)
- US: `H/N/ÉÉÉÉ Ó:pp` (pl. 1/1/2024 0:15)
- EU: `ÉÉÉÉ.HH.NN. ÓÓ:pp` (pl. 2024.10.01. 14:30)

⚠️ **Megjegyzés:** Az időbélyegeknek nem kell egyezniük a fájlok között - az alkalmazás automatikusan igazítja őket!

### 🎬 Gyors Kezdés

#### 1. Opció: Használd a Demo Adatokat (Ajánlott)
Nincs szükség fájl előkészítésre - a demo adatok valós telepítésből származó, valósághű napelemes és hálózati mintákat tartalmaznak.

1. Nyisd meg az `index.html` fájlt a böngésződben
2. Kattints a **"📊 Load Demo Scenarios"** gombra (azonnal betölti a mintaadatokat)
3. Válassz időtartományt (próbáld ki a "Year"-t teljes elemzéshez)
4. Kattints a **"⚡ Run Battery Simulation"** gombra
5. Fedezd fel az eredményeket!

#### 2. Opció: Használd a Saját Adataidat
1. Készítsd elő a CSV fájljaidat (lásd a formátumot fent)
2. Kattints a **"1. Solar Generation Data"** gombra a feltöltéshez
3. Kattints a **"2. Grid Meter Data"** gombra a feltöltéshez
4. Állítsd be az időtartományt és az akkumulátor paramétereket
5. Futtasd a szimulációt és elemezd az eredményeket

### ⚙️ Beállítási Lehetőségek

#### Akkumulátor Paraméterek
- **Kapacitás (kWh)**: 0-200 kWh (tipikus háztartási: 5-15 kWh)
- **Töltési Hatékonyság**: 80-100% (tipikus: 95-96%)
- **Kisütési Hatékonyság**: 80-100% (tipikus: 92-94%)
- **Max Töltési Teljesítmény (kW)**: Maximális töltési sebesség
- **Max Kisütési Teljesítmény (kW)**: Maximális kisütési sebesség
- **Min/Max SOC (%)**: Működési tartomány (tipikus: 10-90%)

#### Navigációs Vezérlők
- **Előre Beállított Gombok**: Hét (utolsó 7 nap, hétfő kezdéssel), Hónap (30 nap), Év (365 nap), Teljes Tartomány
- **Nyíl Navigáció**: Használd a ← és → gombokat a gyors előre/hátra lépéshez a kiválasztott intervallummal
- **Current Gomb**: Ugrás a legfrissebb adatokra az adathalmazban
- **Egyéni Tartomány**: Pontos kezdő/befejező dátum és időválasztó meghatározott időszakokhoz

#### Inverter Módok
- **Aszimmetrikus** (Alapértelmezett): Modern hibrid inverterek, amelyek optimalizálják a teljesítmény elosztást a fázisok között
- **Szimmetrikus**: Régebbi inverterek egyenletes fázis elosztással

#### Valuta Választás
- **Támogatott Valuták**: HUF (Ft) és EUR (€)
- Minden pénzügyi megjelenítés (KPI-ok, diagramok, exportok) automatikusan frissül a választás alapján

#### Pénzügyi Beállítások
- **Import Ár Tier1**: Kedvezményes áramár (Ft/kWh)
- **Import Ár Tier2**: Piaci áramár (Ft/kWh)
- **Export Ár**: Betáplálási díj (Ft/kWh)
- **Tier1 Limit**: Éves kvóta kedvezményes árhoz (alapértelmezett: 2,523 kWh)

### 📈 Főbb Funkciók Részletesen

#### Akkumulátor Optimalizációs Görbe
Automatikusan tesztel 11 különböző akkumulátor kapacitást: **[0, 1, 2, 5, 10, 15, 20, 40, 50, 100, 200 kWh]**

**Kimenet:**
- Interaktív diagram a Hálózati Import/Export Csökkenés %-ban
- Adatcímkék becsült éves megtakarítással (Ft)
- CSV export további elemzéshez
- Segít azonosítani az "ideális" kapacitást

#### Sávos Árazás (Tier1/Tier2)
Modellezi a magyar villamosenergia piacot:
- **Tier1**: Első 2,523 kWh/év kedvezményes áron
- **Tier2**: Limit feletti fogyasztás piaci áron
- **Auto-skálázás**: Arányosan igazodik 1 évnél rövidebb időszakokhoz

Példa: 30 napos szimuláció → Tier1 limit = 2,523 × (30/365) ≈ 207 kWh

#### Energia Áramlás Vizualizáció
Egymás melletti összehasonlítás az energia áramlásról akkumulátor telepítése előtt és után:
- Megjeleníti az eredeti hálózati import/export adatokat (akkumulátor nélkül)
- Mutatja az optimalizált hálózati import/export értékeket (akkumulátorral)
- Kijelzi az akkumulátor töltöttségi szintjét (SOC) az idő múlásával
- Független Teljesítmény/Energia váltó és időaggregációs vezérlők
- **Használati eset**: Lásd pontosan, mikor töltődik és sül ki az akkumulátorod a nap folyamán

#### Időaggregáció (15perc/Napi/Havi)
Tekintsd meg az adatokat különböző időskálákon a jobb betekintésért:
- **15 perces**: Eredeti nagy felbontású adatok (35 040 pont/év)
- **Napi**: Napi aggregált nézet (365 pont/év) - ideális heti/havi mintákhoz
- **Havi**: Havi aggregált nézet (12 pont/év) - tökéletes szezonális elemzéshez
- Független vezérlők minden diagramhoz (áttekintés és energia áramlás)
- Okos aggregáció: összegzi az energia értékeket (kWh), átlagolja a teljesítmény értékeket (kW) és az akkumulátor SOC-t
- **Használati eset**: A havi nézet feltárja a szezonális mintákat, amelyek láthatatlanok a 15 perces adatokban

#### Napelemes Önfogyasztás Elemzés (Éves Riport)
Átfogó évenkénti elemzés havi bontással és pénzügyi követéssel:

**Bemenet:**
- Év választó legördülő menü (automatikusan feltöltve a teljes évekkel)
- Akkumulátor kapacitás bevitel (örökli az összes többi beállítást a fő konfigurációból)

**Összefoglaló Kártyák:**
- Napelemes Önfogyasztás (Akkumulátor Nélkül): kWh és % a teljes termelésből
- Napelemes Önfogyasztás (Akkumulátorral): kWh és % javulás
- Hálózati Export Csökkenés: kWh és % megtakarítás

**Havi Bontási Táblázat:**
- 12 havi sor + ÖSSZESEN összesítő sor
- Oszlopok: Hónap, Akkumulátor Előtt, Akkumulátor Után, Hálózati Export Csökkenés
- Opcionális pénzügyi oszlopok (💰 váltógomb): Alapköltség, Akkumulátoros Költség, Teljes Megtakarítás
- Kumulatív sáv követés pontos közműszámla modellezéshez

**Kettős Diagram Vizualizáció:**
- 1. Diagram: Abszolút értékek (kWh) - csoportosított oszlopdiagram
- 2. Diagram: Százalékos nézet (%) - csoportosított oszlopdiagram
- Színkódolt: Előtte (narancs), Utána (zöld), Csökkenés (kék)

**Exportálási Lehetőségek:**
- 📋 Másolás Vágólapra: TSV formátum Excel/Google Sheets beillesztéshez
- 📥 CSV Letöltés: Teljes adat metaadatokkal és időbélyeggel

**Használati eset**: Tökéletes éves ROI elemzéshez és professzionális ügyfélriportokhoz

⚠️ **Megjegyzés**: Teljes naptári évi adat szükséges (Jan 1 00:00 - Dec 31 23:45)

### 📂 Projekt Struktúra

[Ugyanaz mint az angol verzióban]

### 🛠️ Technológiák

- **Tiszta JavaScript (ES6+)**: Nincs keretrendszer, nincs build folyamat
- **Plotly.js 2.27.0**: Interaktív grafikonok
- **HTML5 & CSS3**: Modern web szabványok
- **LocalStorage API**: Felhasználói beállítások mentése

### 🔧 Telepítés & Fejlesztés

```bash
# Repository klónozása
git clone https://github.com/sztistvan/BEES_Analytics.git

# Navigálj a könyvtárba
cd BEES_Analytics

# Nyisd meg böngészőben (nincs build lépés!)
start index.html
```

**Ennyi!** Nincs `npm install`, nincs fordítás, nincs szerver szükséges.

### 📱 Böngésző Támogatás

[Ugyanaz mint az angol verzióban]

### � Mobil és Táblagép Támogatás

Teljesen optimalizált reszponzív dizájn minden eszközmérethez:

**Progresszív Töréspontok:**
- **Asztali** (>768px): Teljes funkciójú elrendezés
- **Táblagépek** (≤768px): Optimalizált elrendezések érintésbarát vezérlőkkel
- **Telefonok** (≤600px): Egyoszlopos elrendezés, halmozott komponensek
- **Kis telefonok** (≤480px): Kompakt dizájn skálázott betűtípusokkal

**Mobil Funkciók:**
- 👆 Érintésbarát vezérlők (48px minimális érintési célpontok)
- 📱 Egyoszlopos elrendezések könnyű görgetéshez
- 📊 Reszponzív diagramok teljes érintési gesztus támogatással
- 📊 Vízszintes görgetésű táblázatok ragadós első oszloppal
- 🔤 Progresszív betűméret skálázás az olvashatóságért

**Használati eset**: Tökéletes napelemes tanácsadóknak, akik táblagépen mutatják be az elemzést ügyfél helyszíni látogatások során

### �🐛 Ismert Problémák

- Nagy adathalmazok (>1 év): Használd a Napi/Havi aggregációt a javított diagram megjelenítési teljesítményért
- CSV fájloknak konzisztens 15 perces intervallumokkal kell rendelkezniük (rések nélkül)
- Maximum 200 kWh kapacitás az optimalizációs görbében
- Éves Elemzés funkcióhoz teljes naptári évi adat szükséges (Jan 1 - Dec 31)
- Nincs akkumulátor degradációs modell (tervezve v2.0-ban)

### 🔮 Fejlesztési Terv

[Ugyanaz mint az angol verzióban]

### 🤝 Közreműködés

Hozzájárulásokat szívesen fogadunk!

### 📄 Licenc

Ez a projekt MIT licenc alatt van - részletekért lásd a [LICENSE](LICENSE) fájlt.

### 📧 Kapcsolat & Támogatás

- **GitHub**: [@sztistvan](https://github.com/sztistvan)
- **Hibák**: [GitHub Issues](https://github.com/sztistvan/BEES_Analytics/issues)
- **Beszélgetések**: [GitHub Discussions](https://github.com/sztistvan/BEES_Analytics/discussions)

---

## 📸 Screenshots / Képernyőképek

[Add screenshots here / Adj hozzá képernyőképeket ide]

---

**Made with ☀️ and ⚡ for the solar energy community**  
**Készítve ☀️-vel és ⚡-val a napenergia közösségnek**
