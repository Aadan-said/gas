# ⛽ GASFLOW — BUUGGA HAB-RAACA & HAGAHA DHAMAYSTIRAN EE KAALMAHA SHIDAALKA
**Nidaamka Casriga ah ee Maamulka Kaalmaha Shidaalka, Dhuumaha (POS), Haamaha & Xisaabaadka**

---

## 📌 1. DULMAR GUUD & QIIMAHA GANACSI EE KAALINTA (EXECUTIVE PITCH)

Barnaamijka **GasFlow** waa nidaam heer sare ah (Enterprise ERP & POS) oo si gaar ah loogu habeeyay kaalmaha shidaalka ee dalka. Waxaa loo sameeyay inuu xalliyo dhibaatooyinka ugu weyn ee sababa khasaaraha maalinlaha ah:

1. **Ilaalinta Litir Kasta oo Shidaal ah**: 
   - Kaalmaha badankood waxay ka caban jireen in shidaal dhumo, la xado, ama cabbirka haamuhu khaldamo. 
   - GasFlow wuxuu xisaabiyaa litir kasta oo haanta soo gala ama ka baxa dhuumaha.
2. **Joojinta Buugaagtii Gacanta & Khaladaadka Xisaab-xirka**:
   - Ma jiro xisaab-xir habeenkii qaata 3 saacadood. Hal gujin ayaa lagu helayaa: Wadarta Iibka, Lacagta Caddaan ah, EVC/Sahal/eDahab soo dhacay, iyo shidaalka ku haray haamaha.
3. **Xakameynta Deynta Gaadiidka Shirkadaha & Hay'adaha**:
   - GasFlow wuxuu leeyahay nidaamka **Xadka Deynta (Credit Limit)**. Haddii baabuurka ama shirkaddu gaarto lacagtii loogu talagalay (tusaale $1,000), nidaamku **waa diidayaa** in shidaal kale lagu shubo ilaa qeyb deynta ka mid ah la soo bixiyo.
4. **Internet La'aanta (100% Offline-First Architecture)**:
   - Haddii internet-ku go'o ama hawadu xumaato, **shaqadu hal ilbiriqsi ma istaagayso**! 
   - Taleefannada iyo kumbuyuutarradu waxay ku shaqeynayaan kaydka maxalliga ah (IndexedDB), marka xiriirku soo noqdona si toos ah ayey xogtu isku helaysaa.

---

## 🔄 2. SIDA BARNAAMIJKU U SHAQEYNYO BILOW ILAA DHAMMAAD

Nidaamku wuxuu ka kooban yahay qaybo si toos ah isugu xiran oo wada shaqeynaya:

```
[ Haamaha Shidaalka ] ───(Shidaal Baxay)───> [ Iibka Dhuumaha POS ] ───(Lacag/Rasiidh)───> [ Qasnadda & EVC ]
        ▲                                                │                                        │
        │ (Booyad Keenistii)                             ▼                                        ▼
[ Keenista Shidaalka ]                       [ Macaamiisha & Deynta ]                  [ Warbixinno & Xisaab-xir ]
```

---

### 1️⃣ Galitaanka & Diiwaangelinta (Login & Account Setup)
* **Galitaanka Maamulaha**: Waxaa lagu galaa Magaca Isticmaalaha (Username) iyo Password-ka.
* **Galitaanka Shubooleyaasha (Cashiers / Pump Operators)**: Shaqaaluhu uma baahna password dheer; waxay isticmaalaan **Security PIN (4-6 lambar)** oo u gaar ah, kaas oo u saamaxaya inay si degdeg ah u galaan una xiraan shiftkooda.
* **Diiwaangelinta Kaalin Cusub**: Marka kaalin cusub nidaamka lagu darayo, waxaa la gelinayaa magaca kaalinta, magaalada/laanta, telefoonnada, iyo lacagta rasmiga ah (USD ama Shilin).

---

### 2️⃣ Haamaha Shidaalka (Tank Telemetry & Stock Control)
* **Muraayadda Haamaha**: Waxay muujinaysaa haan kasta oo dhulka hoostiisa ku jirta (Baasiin PMS, Naafto AGO, Gaas Cad DPK, LPG Gas).
* **Cabirka Tooska ah**: Waxay muujinaysaa boqolkiiba inta ay haantu buuxdo (tusaale: `7,500 L / 10,000 L — 75%`).
* **Digniinta Heerka Hoose (Low Alert)**: Haddii shidaalku ka hoos maro 25%, shaashaddu waxay bixinaysaa digniin casaan ah si looga hortago in shidaalku ka go'o kaalinta.
* **Diiwaangelinta Booyad Cusub (Log Delivery)**: 
  - Marka booyadi timaado, waxaa la gelinayaa litirrada ay keentay, qiimaha jumlada, shirkadda keentay (Supplier), iyo lambarka qaansheegta. 
  - Isla markiiba litirrada cusub waxay ku darsamayaan haanta ku habboon.
* **Cabbirka Birta (Calibrate Dipstick)**: Subax kasta birta ayaa lagu cabbiraa haamaha si loo xaqiijiyo in cabbirka birta iyo xogta kumbuyuutarku is leeyihiin.

---

### 3️⃣ Iibka Dhuumaha (Sales POS Terminal)
* **Shaashad Fudud oo Degdeg ah**: Loogu talagalay shidaal-shubaha (Pump Attendant).
* **Tallaabooyinka Iibka**:
  1. Dooro nooca shidaalka: **Baasiin**, **Naafto**, ama **Gaas**.
  2. Geli cadadka: Waxaad gelin kartaa litirro (tusaale `25 L`), ama toos u guji badhamada lacagta (`$10`, `$20`, `$50`). Nidaamku isaga ayaa xisaabinaya litirka ku aaddan.
  3. Dooro habka lacag-bixinta:
     - **Caddaan (Cash)**
     - **EVC Plus** (HMD)
     - **eDahab** (STL)
     - **Sahal** (Golis)
     - **Deyn (Credit)** — *Waxaa laga dhex dooranayaa macmiilka diiwaangashan.*
  4. Guji **"Xaqiiji & Bixi Lacagta"**:
     - Isla ilbiriqsigaas, shidaalka la iibiyay waxaa laga jarayaa haantii uu ka baxay.
     - Waxaa soo baxaya **Rasiid Rasmi ah oo leh QR Code**, lambar gaar ah, iyo magaca shubaha.

---

### 4️⃣ Macaamiisha & Deynta Shirkadaha (Fleet Credit Accounts)
* **Yaa loogu talagalay?** Shirkadaha gaadiidka, hay'adaha, safaaradaha, iyo macaamiisha joogtada ah ee shidaalka ku qaata qaansheegta bishiiba mar.
* **Xadka Deynta (Credit Limit)**: Macmiil kasta waxaa loo dejiyaa xad sare (tusaale `$1,500`). Haddii uu gaaro xadkaas, nidaamku wuxuu xannibayaa in shidaal dambe lagu aamino ilaa uu lacag soo shubo.
* **Qabashada Lacag-bixinta (Record Payment)**: Marka macmiilku lacagta bixinayo, waxaa la gelinayaa habka uu ku bixiyay (EVC, Sahal, Bangi ama Caddaan), deyntiina si toos ah ayaa hoos ugu dhacaysaa.
* **Bayaanka Xisaabta (Account Statement)**: Macmiilka waxaa loo daabaci karaa bayaan cad oo muujinaya maalin kasta baabuurkii shidaal qaatay iyo inta uu qaatay.

---

### 5️⃣ Maaliyadda & Kharashka (Finance & Expense Ledger)
* Diiwaangelinta kharashaadka hawlgalka: Korontada matoorrada, biyaha, dayactirka dhuumaha, canshuurta dowladda, iyo mushaharka shaqaalaha.
* Nidaamku wuxuu si toos ah u kala saarayaa:
  - **Wadarta Dakhliga (Gross Revenue)**: Lacagta shidaalka ka soo gashay.
  - **Wadarta Kharashka (Expenses)**: Lacagtii hawlgalka ku baxday.
  - **Faa'iidada Nadiifka ah & Lacagta Qasnadda (Cash in Drawer)**: Lacagta dhabta ah ee gacanta ku jirta.

---

### 6️⃣ Warbixinno & Xisaab-xir (Reports & Audits)
* Mulkiilaha ama Xisaabiyuhu wuxuu heli karaa warbixinno dhamaystiran:
  1. **Warbixinta Iibka (Sales)**: Saacadaha ugu iibka badan, noocyada shidaalka ugu badan.
  2. **Warbixinta Haamaha**: Shidaalkii soo galay iyo kii baxay.
  3. **Warbixinta Qasnadda**: Kala saarista Caddaanka iyo E-Money-ga (Sahal/EVC).
  4. **Diiwaanka Amniga (Audit Log)**: Qof kasta oo wax beddelay, wax tirtiray, ama shidaal iibiyay waxaa u qoran taariikhdiisa iyo daqiiqaddiisa.
* Dhammaan warbixinnada waxaa hal gujin lagula soo degi karaa **Excel (CSV)** ama toos looga daabacan karaa warqad ahaan.

---

### 7️⃣ Shaqaalaha & Xeerarka Gelitaanka (Staff Roles & Permissions - RBAC)
Nidaamku wuxuu leeyahay 4 door oo kala sarreeya:
* 👑 **Maamule Guud (Admin)**: Awood buuxda — beddelidda qiimaha litirka, kudaridda shaqaalaha, xisaab-xirka guud, iyo maamulka kaalinta.
* 🛡️ **Maareeye (Manager)**: Kormeerka haamaha, qaabilaadda booyadaha, ansixinta kharashaadka, iyo xallinta khaladaadka.
* ⛽ **Shuboole / Khasnaji (Cashier POS)**: Wuxuu furi karaa oo kaliya shaashadda POS-ka si uu shidaal u iibiyo una xiro shiftkiisa. Ma tirtiri karo iib hore mana beddeli karo qiimaha.
* 📊 **Xisaabiye (Accountant)**: Maamulka deynta shirkadaha, dafatirada maaliyadda, kharashaadka, iyo soo saarista xisaab-xirka maalinlaha iyo bilaha ah.

---

## 📱 3. SIDEE LOOGU SHUBTAA APP-KA AMA SOFTWARE-KA? (INSTALLATION)

GasFlow waxaa loo dhisay sidii **Progressive Web Application (PWA)** casri ah. Uma baahna PlayStore ama AppStore adag, wuxuuna si toos ah ugu rakibmayaa dhammaan qalabka:

### 📲 Taleefannada Android (Samsung, Redmi, Techno, iwm.):
1. Ka fur link-ga kaalintaada browser-ka **Google Chrome**.
2. Guji saddexda dhibcood ee geeska sare (`⋮`).
3. Dooro **"Add to Home screen"** ama **"Ku dar Shaashadda Koowaad"** (ama **"Install App"**).
4. GasFlow wuxuu toos ugu soo baxayaa shaashadda taleefankaaga isagoo wata astaantiisa (Logo), wuxuuna u furmayaa sidii app rasmi ah oo buuxa.

### 🍏 Taleefannada iPhone / iPad (iOS):
1. Ka fur link-ga browser-ka **Safari**.
2. Guji badhanka Share-ka (calaamadda sanduuqa fallaartu ka kor baxayso `↑`).
3. Hoos u dhaadhac oo dooro **"Add to Home Screen"**.
4. Wuxuu noqonayaa icon madax-bannaan oo shaashadda kaa soo muuqda.

### 💻 Kumbuyuutarrada Windows & Mac:
1. Ka fur link-ga **Google Chrome** ama **Microsoft Edge**.
2. Geeska sare ee URL-ka waxaa kaaga muuqanaya calaamad yar oo leh **"Install GasFlow"** (ama menu-ka ka dooro *Apps -> Install GasFlow*).
3. Wuxuu yeelanayaa daaqad u gaar ah iyo astaanta Desktop-ka, isagoo ka shaqeynaya xawaare aad u dheereeya.

---

## 💾 4. HALKEE AYAY DHIGMAYAAN XOGTA USER-KA & DATA-DA GUUD?

### 📁 1. Faylka Xogta ee Kumbuyuutarka (File Storage):
* Xogta dhammaan shaqaalaha, password-yada la siray (hashed), PIN-yada, haamaha, macaamiisha, iyo iibka waxay ku kaydsan yihiin:
  `c:\Users\Aadan Alli\Desktop\gas\data\gasflow_db.json`
* Faylkani waa kaydka maxalliga ah ee nidaamka. Waad koobiyeysan kartaa, waad qaadan kartaa backup ahaan, waana maamuli kartaa.

### 🗄️ 2. Database-ka Dhexe ee Cloud-ka (PostgreSQL / Prisma):
* Marka nidaamka lagu xiro Cloud Database (`DATABASE_URL`), xog kasta oo kaalinta ka dhacda waxaa isla ilbiriqsigaas lagu kaydiyaa server-ka PostgreSQL oo leh amni aad u sarreeya (ACID compliance & Encryption).

### 📱 3. Kaydka Maxalliga ah ee Moobillada (IndexedDB Cache):
* Qalab kasta (taleefanka shubaha, tablet-ka maareeyaha) wuxuu leeyahay kayd hoose (`IndexedDB`).
* Haddii internet-ku go'o, iib kasta oo shuboolehu sameeyo wuxuu ku qormayaa taleefankiisa gudihiisa. Isla marka internet-ku soo noqdo, qalabku wuxuu xogta toos ugu diraa server-ka isagoon hal rasiid lumin.

### 🌐 4. Isku-xirka Qalabka Kaalinta (Local Wi-Fi Multi-Device Sync):
* Kaalin kasta waxaa yaalla Router Wi-Fi ah.
* 5 ilaa 15 qalab (moobillo iyo laptop-yo) ayaa isku mar shaqeyn kara iyagoo wada arkayo hal xog oo qudha (Real-time synchronization).

---

## 🛡️ 5. AWOODAHA ENGINEER-KA (MASTER DEVELOPER CONTROLS)

Si loo ilaaliyo xuquuqda Engineer-ka iyo lacag-bixinta kaalinta:
1. **Xannibaadda Fogaanta (Kill-Switch Remote Lockout)**:
   - Haddii kaalintu bixin weydo khidmadda softweerka ee bishii/sanadkii, Engineer-ku wuxuu fogaan kaga xannibi karaa nidaamka (`Suspended Mode`).
   - Shaashadda waxaa ka soo baxaya fariin sheegaysa in liisanka softweerku dhacay lana xiriiro Engineer-ka: **Aadan Said**.
2. **Keliya Kumbuyuutarkaaga (Localhost Protection)**:
   - Badhanka iyo awoodaha Engineer-ka waxaa lagu xannibay inaysan ka muuqan Vercel ama kumbuyuutarrada macaamiisha.
   - Kaliya Engineer-ka ayaa kumbuyuutarkiisa ku maamuli kara ama ku furi kara furaha sirta ah.

---

*Buuggan waxaa diyaariyay oo xuquuqdiisa iska leh: **Engineer Aadan Said — GasFlow Systems**.*
