# ⛽ GASFLOW — HAGAHA ISTICMAALKA & SHARAXAADDA SALDHIGGA SHIDAALKA
**Petroleum Station Management, POS & Telemetry CRM**

---

## 📌 1. DULMAR GUUD (EXECUTIVE SUMMARY)

Barnaamijka **GasFlow** waa nidaam casri ah oo loogu talagalay in lagu xalliyo caqabadaha ugu waaweyn ee haysta saldhigyada shidaalka:
1. **Xisaab-xirka Daaha ama Qaldama**: Meesha ka saarista buugaagtii gacanta lagu qori jiray ee shidaalka iyo lacagta.
2. **Ilaalinta Shidaalka & Khasaarihii Haamaha**: Ogaanshaha litir kasta oo haamaha ka baxa ama soo gala si looga hortago xatooyada, qasaaraha iyo uumi-baxa shidaalka.
3. **Maamulka Deynta Shirkadaha & Gaadiidka**: Xakameynta deynta baabuurta shirkadaha ama hay'adaha iyadoo la adeegsanayo xad deyn ah (*Credit Limit*).
4. **Internet La'aanta (Offline-First)**: Haddii internet-ku go'o, shaqadu **hal ilbiriqsi ma istaagayso**; nidaamku wuxuu wax ku kaydsanayaa kumbuyuutarka maxalliga ah, marka internet-ku soo noqdana si toos ah ayuu xogta ugu gudbinayaa Cloud-ka.

---

## 🧭 2. QAYBAHA BARNAAMIJKA & SIDA MID KASTA U SHAQEYSO

Barnaamijku wuxuu u qaybsan yahay qaybo si toos ah isugu xiran:

---

### 1️⃣ Guud ahaan (Dashboard) — Muraayadda Kormeerka Saldhigga
* **Yaa isticmaala?** Mulkiilaha, Maareeyaha, iyo Xisaabiyaha.
* **Maxaa loogu talagalay?** In hal shaashad lagula socdo xaaladda guud ee saldhigga xilligan la joogo:
  * **Wadarta Iibka (Maanta)**: Lacagta guud ee soo gashay maanta.
  * **Shidaalka La Iibiyay (Litir)**: Xaddiga litir shidaal ah ee dhuumaha ka baxay.
  * **Lacag Caddaan / EVC**: Lacagta gacanta ku jirta ee khasnadda ku jirta.
  * **Tirada Iibka**: Immisa jeer oo iib ah ayaa dhacay maanta.
  * **Jaantuska Saacadlaha ah (Sales Overview Curve)**: Wuxuu muujinayaa saacadaha uu saldhiggu ugu mashquulka badan yahay.
  * **Saamiga Shidaalka (Donut Chart)**: Boqolkiiba inta uu baasiinku (PMS), naaftada (AGO), gaaska cad (DPK), iyo LPG Gas ka yihiin iibka.

---

### 2️⃣ Iibka (Sales POS Terminal) — Shaashadda Dhuumaha Shidaalka
* **Yaa isticmaala?** Shaqaalaha shidaalka shuba (Cashier / Pump Operator).
* **Sida loo isticmaalo (Tallaabo-Tallaabo):**
  1. **Dooro Nooca Shidaalka**: Guji Baasiin (PMS), Naafto (AGO), Gaas Cad (DPK), ama LPG.
  2. **Geli Xaddiga**: 
     * Waxaad gelin kartaa Litirro (tusaale: `20 L`).
     * Ama waxaad toos u gujin kartaa badhamada degdegga ah ee lacagta (`$10`, `$20`, `$50`) — nidaamka ayaa xisaabinaya litirrada ku aaddan.
  3. **Dooro Habka Lacag-bixinta**:
     * **Caddaan (Cash)**
     * **EVC Plus** (Hormuud)
     * **eDahab** (Somtel)
     * **Sahal / Zaad** (Golis / Telesom)
     * **Deyn (Credit)** — *Haddii macmiilku deyn ku qaadanayo, dooro magaciisa.*
  4. **Guji "Xaqiiji & Bixi Lacagta"**:
     * 2 ilbiriqsi gudahood waxaa soo baxaya **Rasiidka Rasmiga ah** oo leh QR Code iyo faahfaahin buuxda.
     * Isla markiiba shidaalka la iibiyay waxaa laga jarayaa haanta uu ka baxay.

---

### 3️⃣ Haamaha Shidaalka (Tanks Management)
* **Yaa isticmaala?** Maareeyaha iyo Shaqaalaha Bakhaarka.
* **Maxaa loogu talagalay?**
  * La socodka mugga haamaha waaweyn ee dhulka hoostiisa ku jira (Underground Tanks).
  * Wuxuu muujinayaa cabbirka shidaalka ku haray haan kasta iyo boqolkiiba inta ay buuxdo (tusaale: `6,800 L / 10,000 L (68%)`).
  * **Digniin Degdeg ah (Low Level Alert)**: Haddii haantu ka hoos marto 25%, nidaamku wuxuu bixinayaa calaamad digniin ah oo casaan/huruud ah si looga hortago in shidaalku ka go'o saldhigga.
  * **Diiwaangeli Shidaal Cusub (Log Delivery)**: Marka booyad shidaal keento, waxaa la gelinayaa litirrada ay keentay, qiimaha jumlada, shirkadda keentay (Supplier), iyo lambarka qaansheegta.
  * **Cabir Dipstick-ga (Calibrate Dipstick)**: Cabbirka birta lagu cabbiro shidaalka subax kasta si loo ogaado haddii shidaal dhumay ama uumi-baxay.

---

### 4️⃣ Bakhaarka & Keenista (Inventory Ledger)
* **Yaa isticmaala?** Xisaabiyaha iyo Maareeyaha.
* **Maxaa loogu talagalay?**
  * Waa buugga xisaabeedka dhabta ah ee litirrada shidaalka.
  * Litir kasta oo haanta soo gala ama ka baxa wuxuu ku qoran yahay waqtigiisa, nooca shidaalka, iyo qofkii mas'uulka ka ahaa.
  * Waxaa lagu hubiyaa xisaabta maalinlaha ah si loo xaqiijiyo inaan hal litir oo shidaal ah la xadin.

---

### 5️⃣ Macaamiisha & Deynta (Customers & Credit Management)
* **Yaa isticmaala?** Xisaabiyaha iyo Maamulka.
* **Maxaa loogu talagalay?**
  * Maamulka gaadiidka shirkadaha, safaaradaha, hay'adaha, iyo macaamiisha gaarka ah ee shidaalka ku qaata qaansheegta bishiiba mar (Fleet Management).
  * **Xadka Deynta (Credit Limit)**: Macmiil kasta waxaa loo cayimaa xad sare (tusaale: `$1,500`). Haddii uu gaaro xadkaas, nidaamku wuxuu diidayaa in shidaal kale lagu aamino ilaa uu lacag soo bixiyo.
  * **Diiwaangelinta Lacag-bixinta (Record Payment)**: Marka macmiilku deyntiisa bixinayo, waxaa la gelinayaa lacagta uu dhiibay (EVC, eDahab, Sahal, ama Caddaan), deyntiina si toos ah ayaa looga goynayaa.

---

### 6️⃣ Maaliyadda & Kharashka (Finance & Expenses)
* **Yaa isticmaala?** Xisaabiyaha iyo Maareeyaha.
* **Maxaa loogu talagalay?**
  * Diiwaangelinta kharashaadka maalinlaha ah ee saldhigga: Koronto, Biyo, Mushahar, Dayactir, Canshuur, iwm.
  * Wuxuu kala saarayaa:
    * **Wadarta Dakhliga (Total Revenue)**: Lacagtii shidaalka laga helay.
    * **Wadarta Kharashka (Total Expenses)**: Lacagtii hawlgalka ku baxday.
    * **Lacagta Nadiifka ah ee Qasnadda (Cash in Register)**: Lacagta dhabta ah ee miiska saaran.

---

### 7️⃣ Warbixinno (Reports & Export)
* **Yaa isticmaala?** Mulkiilaha iyo Xisaabiyaha.
* **Maxaa loogu talagalay?**
  * Soo saarista 6 warbixinood oo kala duwan:
    1. **Warbixinta Iibka (Sales Report)**
    2. **Warbixinta Haamaha (Fuel Stock Report)**
    3. **Warbixinta Qasnadda (Cash Report)**
    4. **Warbixinta Kharashka (Expense Report)**
    5. **Warbixinta Deymaha Macaamiisha (Customer Report)**
    6. **Diiwaanka Amniga (Audit Log)**
  * Waxaa hal gujin lagula soo degi karaa fayl Excel/CSV ah (`Export CSV`) ama toos looga daabacan karaa warqad ahaan (`Print Report`).

---

### 8️⃣ Shaqaalaha & Amniga (Staff & Roles RBAC)
* **Yaa isticmaala?** Maamulaha Sare (Administrator).
* **Awoodaha Shaqaalaha:**
  * **Cashier**: Wuxuu kaliya iibin karaa shidaal, mana beddeli karo qiimaha mana tirtiri karo iib hore.
  * **Manager**: Wuxuu kormeeraa haamaha, booyadaha cusub, iyo ansixinta iibka la tirtirayo.
  * **Accountant**: Wuxuu maamulaa deynta, kharashaadka, iyo xisaab-xirka guud.
  * **Admin**: Wuxuu leeyahay maamulka buuxa ee saldhigga.
  * Shaqaale kasta wuxuu leeyahay **Security PIN** u gaar ah oo uu ku galo POS-ka.

---

### 9️⃣ Mashiinka Sync-ga & Shaqada Internet La'aanta (Offline Sync)
* **Sida uu u shaqeeyo:**
  * **Khadka Online-ka ah (Cloud Online)**: Xogtu waxay toos ugu socotaa Cloud Server-ka.
  * **Khad La'aan (Offline Mode)**: Haddii internet-ku go'o, taleefannada iyo kumbuyuutarrada saldhiggu waxay wax ku kaydsanayaan kaydka maxalliga ah (*IndexedDB*).
  * **Isku-xirka Tooska ah**: Isla marka internet-ku soo noqdo, nidaamku isaga ayaa si otomaatig ah xogta oo dhan Cloud-ka ugu diri doona iyadoo aan hal rasiid lumin.

---

## 👥 3. SIDA HAWL-MAALMEEDKA SALDHIGGU U SOCONAYO

### 🌅 Subaxdii (Shift Open Routine):
1. **Cashier-ka ama Maareeyaha** ayaa galaya barnaamijka isagoo isticmaalaya PIN-kiisa.
2. Waxaa la hubiyaa heerka shidaalka haamaha shaashadda **Haamaha**.
3. Waxaa la bilaabayaa iibinta shidaalka shaashadda **Iibka (POS)**.

### ☀️ Maalintii (Day Operations):
1. Gaari kasta oo yimaada, waxaa shidaalka loogu shubaa shaashadda **POS**, waxaana la siiyaa rasiidkiisa.
2. Macmiilkii lacag mobile ku bixinaya wuxuu isticmaalayaa **EVC Plus, eDahab, ama Sahal**.
3. Baabuurkii shirkadaha deynta ku qaadanaya waxaa laga doortaa liiska macaamiisha.
4. Haddii booyad shidaal keento, Maareeyaha ayaa ku diiwaangeliya shaashadda **Haamaha**.

### 🌙 Habeenkii (Shift Close & Reconciliation):
1. Shaqaaluhu waxay eegayaan **Dashboard-ka**: Lacagta caddaan ah ee khasnadda ku jirta iyo inta mobile-ka ku soo dhacday.
2. Xisaabiyuhu wuxuu eegayaa shaashadda **Warbixinno** si uu u hubiyo in litirrada dhuumaha ka baxay ay la egyihiin lacagta soo xarootay.
3. Waxaa la soo saarayaa warbixinta maalinlaha ah (`Export CSV` ama `Print`).

---

## 💡 4. FAA'IIDOOYINKA GANACSI EE SALDHIGGU KA HELAYO GASFLOW

| Caqabaddii Hore (Gacanta) | Xalka Casriga ah ee GasFlow |
| :--- | :--- |
| Shidaalka oo la waayo meel uu maray ama la xado | Litir kasta si toos ah ayaa loo raad-raacaa loona xisaabiyaa |
| Deymo badan oo dhumay oo buugag ku lumay | Xad deyn ah (Credit Limit) oo nidaamku iskiis u xannibo |
| Xisaab-xir saacado badan qaata habeenkii | Hal gujin ayaa lagu helayaa dakhliga, kharashka & faa'iidada |
| Shaqada oo istaagta marka internet-ku go'o | Barnaamijku wuu shaqaynayaa 100% xitaa internet la'aan |
| Rasiidh la'aan keenta kalsooni-darro | Rasiid xirfadeysan oo leh QR Code rasmi ah |

---
