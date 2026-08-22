/* ============================================================
   Telecom reference data (India)

   ACCURACY POLICY FOR THIS FILE
   -----------------------------
   Everything here is either (a) structurally fixed by standard
   (E.212 / E.164 / 3GPP TS 23.003), or (b) a stable published
   administrative list. Where an authoritative list is too large or
   changes too often to bundle honestly, this file ships a SEED and
   the tool exposes an "import authoritative list" path instead of
   guessing. Seeded rows are marked  v:0  (unverified) or v:1.

   Do not extend this file with remembered values. Extend it by
   importing the published source.
   ============================================================ */

/* ---- 22 Licensed Service Areas (LSA / telecom circles) ---------
   Stable since the NTP-99 licensing regime. Category A/B/C matters
   because CDR request routing and nodal officers are per-LSA.      */
window.LSA = [
  { c: "AP", name: "Andhra Pradesh",        cat: "A" },
  { c: "AS", name: "Assam",                 cat: "C" },
  { c: "BR", name: "Bihar",                 cat: "C" },
  { c: "CH", name: "Chennai",               cat: "M" },
  { c: "DL", name: "Delhi",                 cat: "M" },
  { c: "GJ", name: "Gujarat",               cat: "A" },
  { c: "HR", name: "Haryana",               cat: "B" },
  { c: "HP", name: "Himachal Pradesh",      cat: "C" },
  { c: "JK", name: "Jammu & Kashmir",       cat: "C" },
  { c: "KA", name: "Karnataka",             cat: "A" },
  { c: "KL", name: "Kerala",                cat: "B" },
  { c: "KO", name: "Kolkata",               cat: "M" },
  { c: "MP", name: "Madhya Pradesh",        cat: "B" },
  { c: "MH", name: "Maharashtra",           cat: "A" },
  { c: "MU", name: "Mumbai",                cat: "M" },
  { c: "NE", name: "North East",            cat: "C" },
  { c: "OR", name: "Odisha",                cat: "C" },
  { c: "PB", name: "Punjab",                cat: "B" },
  { c: "RJ", name: "Rajasthan",             cat: "B" },
  { c: "TN", name: "Tamil Nadu",            cat: "A" },
  { c: "UE", name: "UP (East)",             cat: "B" },
  { c: "UW", name: "UP (West)",             cat: "B" },
  { c: "WB", name: "West Bengal",           cat: "C" }
];

/* ---- Operators currently licensed for mobile access service ---- */
window.TSP = {
  JIO:  { name: "Reliance Jio Infocomm Ltd",  short: "Jio",   type: "Private" },
  AIR:  { name: "Bharti Airtel Ltd",          short: "Airtel", type: "Private" },
  VI:   { name: "Vodafone Idea Ltd (Vi)",     short: "Vi",    type: "Private" },
  BSNL: { name: "Bharat Sanchar Nigam Ltd",   short: "BSNL",  type: "PSU" },
  MTNL: { name: "Mahanagar Telephone Nigam",  short: "MTNL",  type: "PSU", note: "Delhi & Mumbai only" }
};

/* ---- E.212 PLMN codes: MCC 404 / 405 / 406 = India -------------
   Structure (MCC+MNC) is fixed by ITU-T E.212. The India block is
   published by DoT. Consolidation (Vodafone+Idea, RCom/Aircel/Tata
   exit) means many historic MNCs are now dormant or re-assigned --
   a CDR from 2019 will contain codes that no longer resolve to a
   live operator, which is itself useful dating information.        */
window.MCCMNC = [
  { mcc: "404", mnc: "01", op: "VI",   lsa: "HR", brand: "Vodafone Haryana",     v: 1 },
  { mcc: "404", mnc: "02", op: "AIR",  lsa: "PB", brand: "Airtel Punjab",        v: 1 },
  { mcc: "404", mnc: "03", op: "AIR",  lsa: "HP", brand: "Airtel Himachal",      v: 1 },
  { mcc: "404", mnc: "04", op: "VI",   lsa: "DL", brand: "Idea Delhi",           v: 1 },
  { mcc: "404", mnc: "05", op: "VI",   lsa: "GJ", brand: "Vodafone Gujarat",     v: 1 },
  { mcc: "404", mnc: "07", op: "VI",   lsa: "RJ", brand: "Idea Rajasthan",       v: 1 },
  { mcc: "404", mnc: "10", op: "AIR",  lsa: "DL", brand: "Airtel Delhi & NCR",   v: 1 },
  { mcc: "404", mnc: "11", op: "VI",   lsa: "DL", brand: "Vodafone Delhi",       v: 1 },
  { mcc: "404", mnc: "12", op: "AIR",  lsa: "HR", brand: "Airtel Haryana",       v: 1 },
  { mcc: "404", mnc: "13", op: "VI",   lsa: "AP", brand: "Vodafone Andhra",      v: 1 },
  { mcc: "404", mnc: "14", op: "AIR",  lsa: "UW", brand: "Airtel UP West",       v: 1 },
  { mcc: "404", mnc: "15", op: "VI",   lsa: "UE", brand: "Vodafone UP East",     v: 1 },
  { mcc: "404", mnc: "16", op: "AIR",  lsa: "NE", brand: "Airtel North East",    v: 0 },
  { mcc: "404", mnc: "19", op: "VI",   lsa: "KL", brand: "Idea Kerala",          v: 1 },
  { mcc: "404", mnc: "20", op: "VI",   lsa: "MU", brand: "Vodafone Mumbai",      v: 1 },
  { mcc: "404", mnc: "21", op: "VI",   lsa: "MU", brand: "Loop Mobile (defunct)", v: 0 },
  { mcc: "404", mnc: "22", op: "VI",   lsa: "MH", brand: "Idea Maharashtra",     v: 1 },
  { mcc: "404", mnc: "24", op: "VI",   lsa: "GJ", brand: "Idea Gujarat",         v: 1 },
  { mcc: "404", mnc: "27", op: "VI",   lsa: "MH", brand: "Vodafone Maharashtra", v: 1 },
  { mcc: "404", mnc: "29", op: "VI",   lsa: "NE", brand: "Vodafone North East",  v: 0 },
  { mcc: "404", mnc: "30", op: "VI",   lsa: "KO", brand: "Vodafone Kolkata",     v: 1 },
  { mcc: "404", mnc: "31", op: "AIR",  lsa: "KO", brand: "Airtel Kolkata",       v: 1 },
  { mcc: "404", mnc: "34", op: "BSNL", lsa: "HR", brand: "BSNL Haryana",         v: 0 },
  { mcc: "404", mnc: "36", op: "VI",   lsa: "BR", brand: "Vodafone Bihar",       v: 1 },
  { mcc: "404", mnc: "38", op: "BSNL", lsa: "AS", brand: "BSNL Assam",           v: 0 },
  { mcc: "404", mnc: "40", op: "AIR",  lsa: "CH", brand: "Airtel Chennai",       v: 1 },
  { mcc: "404", mnc: "41", op: "AIR",  lsa: "TN", brand: "Airtel Tamil Nadu",    v: 1 },
  { mcc: "404", mnc: "42", op: "AIR",  lsa: "TN", brand: "Aircel Tamil Nadu (defunct)", v: 0 },
  { mcc: "404", mnc: "43", op: "VI",   lsa: "TN", brand: "Vodafone Tamil Nadu",  v: 1 },
  { mcc: "404", mnc: "44", op: "VI",   lsa: "KA", brand: "Idea Karnataka",       v: 1 },
  { mcc: "404", mnc: "45", op: "AIR",  lsa: "KA", brand: "Airtel Karnataka",     v: 1 },
  { mcc: "404", mnc: "46", op: "VI",   lsa: "KL", brand: "Vodafone Kerala",      v: 1 },
  { mcc: "404", mnc: "48", op: "AIR",  lsa: "UE", brand: "Airtel UP East",       v: 1 },
  { mcc: "404", mnc: "49", op: "AIR",  lsa: "AP", brand: "Airtel Andhra",        v: 1 },
  { mcc: "404", mnc: "51", op: "BSNL", lsa: "HP", brand: "BSNL Himachal",        v: 0 },
  { mcc: "404", mnc: "52", op: "BSNL", lsa: "OR", brand: "BSNL Odisha",          v: 0 },
  { mcc: "404", mnc: "53", op: "BSNL", lsa: "PB", brand: "BSNL Punjab",          v: 0 },
  { mcc: "404", mnc: "54", op: "BSNL", lsa: "UE", brand: "BSNL UP East",         v: 0 },
  { mcc: "404", mnc: "55", op: "BSNL", lsa: "UW", brand: "BSNL UP West",         v: 0 },
  { mcc: "404", mnc: "57", op: "BSNL", lsa: "GJ", brand: "BSNL Gujarat",         v: 0 },
  { mcc: "404", mnc: "58", op: "BSNL", lsa: "MP", brand: "BSNL Madhya Pradesh",  v: 0 },
  { mcc: "404", mnc: "59", op: "BSNL", lsa: "OR", brand: "BSNL Odisha",          v: 0 },
  { mcc: "404", mnc: "62", op: "BSNL", lsa: "JK", brand: "BSNL Jammu & Kashmir", v: 0 },
  { mcc: "404", mnc: "64", op: "BSNL", lsa: "KA", brand: "BSNL Karnataka",       v: 0 },
  { mcc: "404", mnc: "66", op: "BSNL", lsa: "MH", brand: "BSNL Maharashtra",     v: 0 },
  { mcc: "404", mnc: "67", op: "VI",   lsa: "MP", brand: "Reliance MP (defunct)", v: 0 },
  { mcc: "404", mnc: "68", op: "MTNL", lsa: "DL", brand: "MTNL Delhi",           v: 1 },
  { mcc: "404", mnc: "69", op: "MTNL", lsa: "MU", brand: "MTNL Mumbai",          v: 1 },
  { mcc: "404", mnc: "70", op: "AIR",  lsa: "RJ", brand: "Airtel Rajasthan",     v: 1 },
  { mcc: "404", mnc: "71", op: "BSNL", lsa: "KL", brand: "BSNL Kerala",          v: 0 },
  { mcc: "404", mnc: "72", op: "BSNL", lsa: "NE", brand: "BSNL North East",      v: 0 },
  { mcc: "404", mnc: "73", op: "BSNL", lsa: "OR", brand: "BSNL Odisha",          v: 0 },
  { mcc: "404", mnc: "74", op: "BSNL", lsa: "TN", brand: "BSNL Tamil Nadu",      v: 0 },
  { mcc: "404", mnc: "75", op: "BSNL", lsa: "BR", brand: "BSNL Bihar",           v: 0 },
  { mcc: "404", mnc: "76", op: "BSNL", lsa: "WB", brand: "BSNL West Bengal",     v: 0 },
  { mcc: "404", mnc: "77", op: "BSNL", lsa: "RJ", brand: "BSNL Rajasthan",       v: 0 },
  { mcc: "404", mnc: "78", op: "VI",   lsa: "MP", brand: "Idea Madhya Pradesh",  v: 1 },
  { mcc: "404", mnc: "80", op: "BSNL", lsa: "AN", brand: "BSNL Andaman & Nicobar", v: 0 },
  { mcc: "404", mnc: "81", op: "BSNL", lsa: "CH", brand: "BSNL Chennai",         v: 0 },
  { mcc: "404", mnc: "82", op: "AIR",  lsa: "BR", brand: "Airtel Bihar",         v: 1 },
  { mcc: "404", mnc: "84", op: "VI",   lsa: "CH", brand: "Vodafone Chennai",     v: 1 },
  { mcc: "404", mnc: "86", op: "VI",   lsa: "KA", brand: "Vodafone Karnataka",   v: 1 },
  { mcc: "404", mnc: "88", op: "VI",   lsa: "PB", brand: "Vodafone Punjab",      v: 1 },
  { mcc: "404", mnc: "89", op: "VI",   lsa: "UW", brand: "Idea UP West",         v: 1 },
  { mcc: "404", mnc: "90", op: "AIR",  lsa: "MH", brand: "Airtel Maharashtra",   v: 1 },
  { mcc: "404", mnc: "92", op: "AIR",  lsa: "MU", brand: "Airtel Mumbai",        v: 1 },
  { mcc: "404", mnc: "93", op: "AIR",  lsa: "MP", brand: "Airtel Madhya Pradesh", v: 1 },
  { mcc: "404", mnc: "94", op: "AIR",  lsa: "OR", brand: "Airtel Odisha",        v: 1 },
  { mcc: "404", mnc: "95", op: "AIR",  lsa: "KL", brand: "Airtel Kerala",        v: 1 },
  { mcc: "404", mnc: "96", op: "AIR",  lsa: "HR", brand: "Airtel Haryana",       v: 1 },
  { mcc: "404", mnc: "97", op: "AIR",  lsa: "WB", brand: "Airtel West Bengal",   v: 1 },
  { mcc: "404", mnc: "98", op: "AIR",  lsa: "GJ", brand: "Airtel Gujarat",       v: 1 },

  { mcc: "405", mnc: "51", op: "AIR",  lsa: "-",  brand: "Airtel (3G/LTE block)", v: 1 },
  { mcc: "405", mnc: "52", op: "AIR",  lsa: "-",  brand: "Airtel (3G/LTE block)", v: 0 },
  { mcc: "405", mnc: "53", op: "AIR",  lsa: "-",  brand: "Airtel (3G/LTE block)", v: 0 },
  { mcc: "405", mnc: "70", op: "VI",   lsa: "-",  brand: "Idea (LTE block)",      v: 0 },
  { mcc: "405", mnc: "840", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "854", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "855", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "856", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "857", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "861", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "864", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },
  { mcc: "405", mnc: "874", op: "JIO", lsa: "-",  brand: "Reliance Jio 4G/5G",    v: 1 },

  { mcc: "406", mnc: "-",  op: "",     lsa: "-",  brand: "India, supplementary MCC (limited use)", v: 0 }
];

/* Neighbouring / commonly-seen foreign MCCs - a foreign MCC in an
   Indian CDR means roaming or an international leg, which changes
   who holds the record.                                            */
window.MCC_WORLD = {
  "404": "India", "405": "India", "406": "India",
  "410": "Pakistan", "413": "Sri Lanka", "414": "Myanmar", "415": "Lebanon",
  "419": "Kuwait", "420": "Saudi Arabia", "422": "Oman", "424": "UAE",
  "425": "Israel", "426": "Bahrain", "427": "Qatar", "429": "Nepal",
  "432": "Iran", "434": "Uzbekistan", "437": "Kyrgyzstan", "438": "Turkmenistan",
  "440": "Japan", "450": "South Korea", "452": "Vietnam", "454": "Hong Kong",
  "455": "Macau", "456": "Cambodia", "457": "Laos", "460": "China",
  "466": "Taiwan", "470": "Bangladesh", "472": "Maldives",
  "502": "Malaysia", "505": "Australia", "510": "Indonesia", "515": "Philippines",
  "520": "Thailand", "525": "Singapore", "530": "New Zealand",
  "234": "United Kingdom", "262": "Germany", "208": "France", "222": "Italy",
  "310": "United States", "311": "United States", "312": "United States",
  "313": "United States", "316": "United States", "302": "Canada",
  "748": "Uruguay", "724": "Brazil", "655": "South Africa", "621": "Nigeria",
  "639": "Kenya", "602": "Egypt", "286": "Turkey", "250": "Russia"
};

/* ---- Mobile numbering (National Numbering Plan) ----------------
   India moved to a 10-digit closed plan; mobile access codes are
   levels 6,7,8,9. The authoritative sub-block -> (operator, LSA)
   allocation is published by DoT and runs to thousands of rows;
   it is NOT bundled here because a wrong row produces a wrong
   attribution. The tools do structural validation and let you
   import the DoT list.                                            */
window.NNP = {
  mobileLevels: ["6", "7", "8", "9"],
  length: 10,
  cc: "91",
  note: "Levels 6/7/8/9 are mobile access codes. Levels 2,3,4,5 are fixed-line " +
        "(subscriber trunk dialling area codes). 1XX are short codes/services.",
  shortCodes: {
    "100": "Police", "101": "Fire", "102": "Ambulance", "108": "Emergency response",
    "112": "Single emergency number (ERSS)", "1091": "Women helpline",
    "1098": "Childline", "1930": "Cyber-crime financial fraud helpline",
    "14422": "CEIR / KYM device status (SMS)", "1909": "DND / UCC complaints",
    "197": "Telephone directory enquiry", "198": "Operator complaint"
  }
};

/* ---- TRAI DLT commercial-SMS header grammar --------------------
   Post-2020 all commercial SMS in India travels under a DLT-
   registered header. The grammar is fixed and is the single most
   useful thing in a phishing-SMS triage: a header that does not
   fit the grammar was not sent through a registered Indian route. */
window.DLT = {
  pattern: /^([A-Z]{2})-([A-Z0-9]{2,6})$/,
  prefixNote: "Two-character prefix = access-provider + circle code assigned by the TSP. " +
              "Six-character suffix = the principal entity's registered header.",
  categories: {
    "P": "Promotional (sent only 10:00-21:00, scrubbed against DND)",
    "T": "Transactional (OTP / bank alerts, DND-exempt)",
    "S": "Service - implicit consent",
    "G": "Government",
    "A": "Service - explicit consent",
    "M": "Service - explicit (alternate)"
  },
  // Legitimate senders that phishing kits most often impersonate.
  // Presence here is NOT proof of authenticity - only that the exact
  // string is a known registered header.
  knownHeaders: [
    "SBIINB", "SBIBNK", "SBIUPI", "HDFCBK", "ICICIB", "AXISBK", "KOTAKB",
    "PNBSMS", "BOIIND", "CANBNK", "UNIONB", "IDFCFB", "YESBNK", "INDUSB",
    "PAYTMB", "PHONPE", "GPAYIN", "AMZNIN", "FLPKRT", "MYNTRA", "SWIGGY",
    "ZOMATO", "IRCTCI", "UIDAIS", "EPFOHO", "INCTAX", "CBSSMS", "NHAIFT",
    "AIRTEL", "JIOIND", "VILINE", "BSNLIN", "DMTSMS", "MHAGOV"
  ],
  redFlags: [
    { re: /^[A-Z]{2}-[A-Z0-9]{2,6}$/, ok: true,  msg: "Header matches DLT grammar" },
    { re: /^\+?\d{10,14}$/,           ok: false, msg: "Sent from a plain phone number, not a registered header. Commercial/bank SMS never arrives this way." },
    { re: /^[A-Z]{2}-[A-Z0-9]{7,}$/,  ok: false, msg: "Suffix longer than 6 characters - not a valid registered header." },
    { re: /^(?:[A-Z]{2}-)?\d+$/,      ok: false, msg: "Numeric-only header - not DLT-registerable." }
  ]
};

/* ---- CDR / IPDR column vocabularies ----------------------------
   Operators emit wildly different headers for the same field. These
   are the patterns the parsers match on, not a claim about any one
   operator's format.                                               */
window.CDR_COLS = {
  a_party:   [/^(a|calling)?(party)?(msisdn|mobile|number|no|num|tel)$/, /^aparty/, /^callingnumber/, /^callingparty/, /^msisdn$/, /^target/],
  b_party:   [/^(b|called)?(party)?(msisdn|mobile|number|no|num)$/, /^bparty/, /^callednumber/, /^calledparty/, /^othernumber/, /^destination/],
  datetime:  [/^(call)?(date ?time|datetime|dt)$/, /^date$/, /^calldate/, /^starttime/, /^callstart/, /^eventtime/, /^timestamp/],
  time:      [/^time$/, /^calltime/],
  dur:       [/^dur/, /^duration/, /^callduration/, /^secs?$/, /^talktime/],
  type:      [/^(call)?type/, /^direction/, /^inout/, /^callmode/, /^service/],
  imei:      [/^imei/, /^equipment/, /^deviceid/],
  imsi:      [/^imsi/, /^subscriberid/],
  cellid:    [/^(first|last)?cell(id|global)?/, /^cgi$/, /^lac.*cell/, /^cellidentity/, /^siteid/],
  lac:       [/^lac$/, /^tac$/, /^locationarea/],
  site:      [/^(cell|site|tower|bts)?(name|address|location|desc)/, /^firstcell/, /^lastcell/, /^towerlocation/],
  lat:       [/^lat/, /^latitude/],
  lon:       [/^lon/, /^long/, /^longitude/],
  azimuth:   [/^azimuth/, /^bearing/, /^antennadirection/],
  roaming:   [/^roam/, /^circle/, /^lsa/, /^homecircle/],
  smsc:      [/^smsc/, /^smscentre/]
};

window.IPDR_COLS = {
  msisdn:     [/^(msisdn|mobile|number|subscriber|calling)/, /^target/],
  imei:       [/^imei/],
  imsi:       [/^imsi/],
  priv_ip:    [/^(private|source|src|internal|allocated)?ip/, /^privateip/, /^sourceip/],
  pub_ip:     [/^(public|nat|translated|natted)?ip/, /^publicip/, /^natip/, /^translatedip/],
  dest_ip:    [/^(dest|destination|dst|server|remote)ip/],
  src_port:   [/^(source|src|private|translated|nat|start)port/, /^port$/],
  dest_port:  [/^(dest|destination|dst|server)port/],
  start:      [/^(start|session|login|begin)?(time|date|datetime)/, /^starttime/],
  end:        [/^(end|stop|logout|release)(time|date|datetime)/, /^endtime/],
  up:         [/^(up|uplink|sent|tx|ul)(link)?(bytes|volume|data|octets)?/],
  down:       [/^(down|downlink|recv|received|rx|dl)(link)?(bytes|volume|data|octets)?/],
  total:      [/^(total|data)(bytes|volume|usage)/],
  cellid:     [/^cell/, /^cgi/, /^eci/],
  apn:        [/^apn/, /^accesspoint/]
};
