# BESS-Analytics 🔋

**BESS-Analytics** is an open-source, browser-based battery energy storage system (BESS) sizing and simulation tool.  
A **BESS-Analytics** egy nyílt forráskódú, böngészőben futó akkumulátoros energiatároló (BESS) méretező és szimulációs eszköz.

---

## 🌍 Language / Nyelv
[English](#english) | [Magyar](#magyar)

---

<a name="english"></a>
## English

### Description
What is **BESS-Analytics** for?  
This tool helps solar homeowners and energy professionals determine the optimal battery capacity based on high-resolution, 15-minute data. It simulates energy flows to maximize self-consumption and calculate financial ROI.

### Data Requirements
The simulation requires two separate Excel files:
* **`grid_meter_energy_15_min.xlsx`**: Contains grid import and export data measured in **Energy [kWh]** per 15-minute intervals.
* **`solar_power_15_min.xlsx`**: Contains solar production data measured in **Power [kW]**.

### How to use
1. **Upload your data:** Drag & drop your Excel files.
2. **Configure parameters:** Adjust battery capacity (kWh), charge/discharge power, and efficiency.
3. **Analyze results:** View interactive Plotly charts and check the estimated payback period.

### Live Demo
🚀 **[Link to GitHub Pages - Coming Soon]**

---

<a name="magyar"></a>
## Magyar

### Leírás
Mire jó a **BESS-Analytics**?  
Ez az eszköz segít a napelemes rendszertulajdonosoknak és szakembereknek meghatározni az optimális akkumulátor kapacitást 15 perces felbontású adatok alapján. A program szimulálja az energiaáramlást, segítve az önfogyasztás maximalizálását és a megtérülés kiszámítását.

### Adatkövetelmények
A szimulációhoz két különálló Excel fájl szükséges:
* **`grid_meter_energy_15_min.xlsx`**: A hálózati import és export adatokat tartalmazza **Energia [kWh]** mértékegységben, 15 perces intervallumokban.
* **`solar_power_15_min.xlsx`**: A napelemes termelési adatokat tartalmazza **Teljesítmény [kW]** mértékegységben.

### Használat
1. **Adatok feltöltése:** Húzd be az Excel fájljaidat a megfelelő mezőbe.
2. **Paraméterek beállítása:** Állítsd be az akkumulátor kapacitását (kWh), a töltési/kisütési teljesítményt és a hatásfokot.
3. **Eredmények elemzése:** Vizsgáld meg az interaktív Plotly grafikonokat és a számított megtérülési időt.

### Élő Demo
🚀 **[Link a GitHub Pages-hez - Hamarosan]**

---

## 📂 Sample Data / Minta adatok
You can find sample templates in the `/data` folder to test the application:  
A `/data` mappában találsz minta fájlokat a teszteléshez:
* `grid_meter_energy_15_min.xlsx`
* `solar_power_15_min.xlsx`