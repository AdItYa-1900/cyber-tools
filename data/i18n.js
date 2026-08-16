/* ============================================================
   Bilingual content. English / हिन्दी

   All user-facing naming and guidance lives here, in one file, so
   translation is a single-file job and the tool code stays clean.

   Written for an officer who is good at investigation and not
   necessarily at computers. Every tool answers three questions
   before it shows a single control:
       what , what this does, in one plain sentence
       need , what you must have in hand before starting
       steps, what to click, in order

   Hindi is written in the register used in police paperwork, with
   established English terms kept in Devanagari transliteration
   where a translation would confuse rather than help (सीडीआर, आईपी).
   ============================================================ */

window.I18N = {

  /* ---------------------------------------------- shell + common UI */
  ui: {
    en: {
      brand: "Sutra",
      brandSub: "Investigation bench",
      search: "Search tools…",
      searchAll: "Search all tools",
      runsLocal: "Runs entirely on this machine",
      home: "All tools",
      backHome: "Back to all tools",
      whatIsThis: "What this tool does",
      youWillNeed: "What you need before you start",
      howToUse: "How to use it",
      step: "Step",
      openTool: "Open",
      language: "भाषा / Language",
      tier1: "Works on real public data",
      tier2: "Reads a file you already have",
      tier3: "Shows you the correct procedure",
      tierShort1: "Ready to use",
      tierShort2: "Needs your file",
      tierShort3: "Guide only",
      noResults: "Nothing matched",
      loading: "Loading…",
      dropFile: "Drop your file here, or click to browse",
      neverUploaded: "Your file is read on this computer. It is never sent anywhere.",
      loadExample: "Try it with example data",
      exampleNote: "Practice data, made up, safe to experiment with",
      clearAll: "Clear",
      exportCsv: "Download as CSV",
      copy: "Copy",
      copied: "Copied",
      print: "Print",
      filterRows: "Filter rows…",
      rowsOf: "of",
      rows: "rows",
      prev: "Previous",
      next: "Next",
      page: "Page",
      needHelp: "Not sure where to start?",
      helpLine: "Pick the question you are trying to answer. Each group below is one kind of question."
    },
    hi: {
      brand: "सूत्र",
      brandSub: "अन्वेषण उपकरण",
      search: "टूल खोजें…",
      searchAll: "सभी टूल खोजें",
      runsLocal: "पूरी तरह इसी कंप्यूटर पर चलता है",
      home: "सभी टूल",
      backHome: "सभी टूल पर वापस",
      whatIsThis: "यह टूल क्या करता है",
      youWillNeed: "शुरू करने से पहले क्या चाहिए",
      howToUse: "इसे कैसे इस्तेमाल करें",
      step: "चरण",
      openTool: "खोलें",
      language: "भाषा / Language",
      tier1: "वास्तविक सार्वजनिक डेटा पर काम करता है",
      tier2: "आपके पास मौजूद फ़ाइल पढ़ता है",
      tier3: "सही प्रक्रिया बताता है",
      tierShort1: "तुरंत उपयोग योग्य",
      tierShort2: "फ़ाइल चाहिए",
      tierShort3: "केवल मार्गदर्शन",
      noResults: "कुछ नहीं मिला",
      loading: "लोड हो रहा है…",
      dropFile: "अपनी फ़ाइल यहाँ छोड़ें, या चुनने के लिए क्लिक करें",
      neverUploaded: "आपकी फ़ाइल इसी कंप्यूटर पर पढ़ी जाती है। यह कहीं नहीं भेजी जाती।",
      loadExample: "उदाहरण डेटा से आज़माएँ",
      exampleNote: "अभ्यास डेटा. काल्पनिक है, बेझिझक प्रयोग करें",
      clearAll: "साफ़ करें",
      exportCsv: "CSV में डाउनलोड करें",
      copy: "कॉपी करें",
      copied: "कॉपी हो गया",
      print: "प्रिंट करें",
      filterRows: "पंक्तियाँ छाँटें…",
      rowsOf: "में से",
      rows: "पंक्तियाँ",
      prev: "पिछला",
      next: "अगला",
      page: "पृष्ठ",
      needHelp: "समझ नहीं आ रहा कहाँ से शुरू करें?",
      helpLine: "वह सवाल चुनिए जिसका जवाब आपको चाहिए। नीचे हर समूह एक तरह का सवाल है।"
    }
  },

  /* ---------------------------------------------- clusters */
  clusters: {
    identity: {
      en: { name: "Who is this person?",      q: "Number, SIM and identity" },
      hi: { name: "यह व्यक्ति कौन है?",        q: "नंबर, सिम और पहचान" }
    },
    device: {
      en: { name: "Which phone was used?",    q: "Handset and device tracing" },
      hi: { name: "कौन सा फ़ोन इस्तेमाल हुआ?", q: "हैंडसेट और डिवाइस" }
    },
    telecom: {
      en: { name: "Who did they talk to?",    q: "Call records and tower data" },
      hi: { name: "किससे बात की?",            q: "कॉल रिकॉर्ड और टावर डेटा" }
    },
    money: {
      en: { name: "Where did the money go?",  q: "Bank, UPI and wallet trail" },
      hi: { name: "पैसा कहाँ गया?",           q: "बैंक, यूपीआई और वॉलेट" }
    },
    network: {
      en: { name: "What is on the internet side?", q: "IP address and file integrity" },
      hi: { name: "इंटरनेट की तरफ़ क्या है?",  q: "आईपी पता और फ़ाइल की सत्यता" }
    },
    movement: {
      en: { name: "How did they move?",       q: "Location, toll and police stations" },
      hi: { name: "आवाजाही कैसे हुई?",         q: "स्थान, टोल और थाने" }
    },
    "case": {
      en: { name: "How do I run the case?",   q: "Notices, law and case papers" },
      hi: { name: "केस कैसे चलाऊँ?",          q: "नोटिस, कानून और केस दस्तावेज़" }
    }
  },

  /* ---------------------------------------------- tools
     name  : short label
     desc  : one line for the card
     what  : plain-language explanation, no jargon
     need  : what to have in hand (array)
     steps : numbered actions (array)                            */
  tools: {

    mailhdr: {
      en: { name: "Email Header Analyser",
        desc: "Find the real sender of an email and the IP it came from.",
        what: "The name shown on an email can be faked in seconds. The delivery details underneath cannot. This reads them and tells you the IP address the message really came from. It also flags the usual signs of forgery.",
        need: ["The raw headers of the email, exported by the complainant"],
        steps: ["Ask the complainant to open the mail and use Show original (Gmail) or Internet headers (Outlook)",
                "Paste everything into the box",
                "Press Analyse and read the red boxes first",
                "Take the originating IP to IP Address Check, then requisition the subscriber"] },
      hi: { name: "ईमेल हेडर विश्लेषण",
        desc: "ईमेल का असली भेजने वाला और उसका आईपी पता खोजें।",
        what: "ईमेल पर दिखने वाला नाम पलभर में नक़ली बनाया जा सकता है। नीचे छिपे डिलीवरी विवरण नहीं। यह उन्हें पढ़कर बताता है कि संदेश असल में किस आईपी से आया। यह जालसाज़ी के आम लक्षण भी चिह्नित करता है।",
        need: ["पीड़ित द्वारा निर्यात किए गए ईमेल के कच्चे हेडर"],
        steps: ["पीड़ित से कहें कि मेल खोलकर Show original (Gmail) या Internet headers (Outlook) चुनें",
                "पूरा पाठ बॉक्स में पेस्ट करें",
                "Analyse दबाएँ और पहले लाल बॉक्स पढ़ें",
                "मूल आईपी को आईपी पता जाँच में डालें, फिर ग्राहक विवरण माँगें"] }
    },

    time: {
      en: { name: "Timestamp Converter",
        desc: "Convert between epoch, UTC and IST without losing five and a half hours.",
        what: "Websites and apps usually record time in UTC. Indian operators record it in IST. The two differ by 5 hours 30 minutes. Mix them up and every event in your case shifts. This converts safely and shows you exactly what to write in the notice.",
        need: ["A timestamp from a log, a platform reply or a complaint"],
        steps: ["Paste the timestamp",
                "Choose whether the source is UTC or IST",
                "Copy the IST line into your requisition and write IST next to it"] },
      hi: { name: "समय रूपांतरक",
        desc: "एपॉक, यूटीसी और आईएसटी में बदलें, साढ़े पाँच घंटे खोए बिना।",
        what: "वेबसाइटें और ऐप आमतौर पर समय यूटीसी में रखते हैं। भारतीय ऑपरेटर आईएसटी में रखते हैं। दोनों में 5 घंटे 30 मिनट का अंतर है। गड़बड़ हुई तो केस की हर घटना खिसक जाती है। यह सुरक्षित रूप से बदलता है और बताता है कि नोटिस में क्या लिखना है।",
        need: ["किसी लॉग, प्लेटफ़ॉर्म उत्तर या शिकायत से मिला समय"],
        steps: ["समय पेस्ट करें",
                "चुनें कि स्रोत यूटीसी है या आईएसटी",
                "आईएसटी वाली पंक्ति माँग-पत्र में लिखें और साथ में IST ज़रूर लिखें"] }
    },

    decode: {
      en: { name: "Text Decoder",
        desc: "Open up hidden text and spot lookalike domain letters.",
        what: "Fraud links usually hide their real content behind one of a few common encodings. Paste the jumbled text and this tries them all. Whichever result reads as normal words was the encoding used. It also warns when a domain uses letters that only look normal.",
        need: ["Some encoded text, from an SMS, an email or a file"],
        steps: ["Paste the text", "Press Decode",
                "Read whichever result is legible, that was the encoding used",
                "If a red mixed-script warning appears, treat the domain as hostile"] },
      hi: { name: "पाठ डिकोडर",
        desc: "छिपा हुआ पाठ खोलें और मिलते-जुलते नक़ली अक्षर पकड़ें।",
        what: "धोखाधड़ी वाले लिंक अपनी असली सामग्री कुछ आम तरीक़ों से छिपाते हैं। उलझा हुआ पाठ पेस्ट कीजिए, यह सभी तरीक़े आज़मा लेगा। जो नतीजा सामान्य शब्दों जैसा पढ़ा जाए, वही असली तरीक़ा था। यह तब भी चेताता है जब डोमेन में ऐसे अक्षर हों जो केवल दिखने में सामान्य हैं।",
        need: ["एसएमएस, ईमेल या फ़ाइल से मिला कोई एन्कोडेड पाठ"],
        steps: ["पाठ पेस्ट करें", "Decode दबाएँ",
                "जो परिणाम पढ़ने योग्य हो वही असली एन्कोडिंग है",
                "लाल मिश्रित-लिपि चेतावनी दिखे तो डोमेन को संदिग्ध मानें"] }
    },

    mni: {
      en: { name: "Phone Number Check",
        desc: "Check that a mobile number is real, and get every way of writing it.",
        what: "Type any phone number. The tool tells you if it is a valid Indian mobile number. It also lists every format that number can be written in. Use those when you search a seized phone, so you do not miss a contact saved a different way.",
        need: ["A phone number from the complaint or the CDR"],
        steps: ["Type or paste the number, one per line if you have several",
                "Press Analyse",
                "Copy the search variants and use them when searching a seized phone",
                "Copy the ready-made notice text at the bottom for your requisition"] },
      hi: { name: "मोबाइल नंबर जाँच",
        desc: "जाँचें कि मोबाइल नंबर असली है, और उसे लिखने के सभी तरीक़े पाएँ।",
        what: "कोई भी मोबाइल नंबर लिखिए। टूल बताएगा कि वह वैध भारतीय नंबर है या नहीं। साथ ही उस नंबर को लिखने के सभी रूप देगा। ज़ब्त फ़ोन में खोजते समय ये रूप काम आते हैं, क्योंकि नंबर किसी और तरीक़े से सेव हो सकता है।",
        need: ["शिकायत या सीडीआर से मिला मोबाइल नंबर"],
        steps: ["नंबर लिखें या पेस्ट करें. कई हों तो हर पंक्ति में एक",
                "Analyse दबाएँ",
                "खोज-रूप कॉपी करें और ज़ब्त फ़ोन में खोजते समय इस्तेमाल करें",
                "नीचे दिया तैयार नोटिस-मसौदा अपनी माँग-पत्र में लगाएँ"] }
    },

    tsp: {
      en: { name: "Operator & Circle Directory",
        desc: "The 22 telecom circles, and which operator works in each.",
        what: "India is divided into 22 telecom circles. Each operator holds a separate licence in each circle. Send your notice to the wrong circle and it comes back empty weeks later. This table shows which circle covers which area.",
        need: ["Nothing, this is a reference list"],
        steps: ["Find the circle you need in the table", "Note that Delhi, Mumbai, Kolkata and Chennai are separate from their states"] },
      hi: { name: "ऑपरेटर व सर्किल सूची",
        desc: "22 टेलीकॉम सर्किल, और हर सर्किल में काम करने वाले ऑपरेटर।",
        what: "भारत 22 टेलीकॉम सर्किल में बँटा है। हर ऑपरेटर का हर सर्किल में अलग लाइसेंस होता है। ग़लत सर्किल में भेजा नोटिस हफ़्तों बाद ख़ाली लौटता है। यह तालिका बताती है कि कौन सा सर्किल किस इलाक़े को कवर करता है।",
        need: ["कुछ नहीं. यह केवल संदर्भ सूची है"],
        steps: ["तालिका में अपना सर्किल देखें", "ध्यान दें: दिल्ली, मुंबई, कोलकाता और चेन्नई अपने राज्यों से अलग सर्किल हैं"] }
    },

    mccmnc: {
      en: { name: "SIM Number (IMSI) Decoder",
        desc: "Break a SIM number into country, network and subscriber parts.",
        what: "The IMSI is the SIM card's own number. It is not the phone number. This splits it into three parts and names the country and network that issued the SIM. A foreign country means the records sit abroad, which is a completely different process.",
        need: ["An IMSI from a CDR or a seized phone"],
        steps: ["Paste the IMSI (usually 15 digits)", "Press Decode", "Check the country, a foreign country means a completely different evidence route"] },
      hi: { name: "सिम नंबर (IMSI) डिकोडर",
        desc: "सिम नंबर को देश, नेटवर्क और ग्राहक हिस्सों में बाँटें।",
        what: "आईएमएसआई सिम कार्ड का अपना नंबर है। यह मोबाइल नंबर नहीं है। यह उसे तीन हिस्सों में बाँटता है और बताता है कि सिम किस देश और नेटवर्क ने जारी की। विदेशी देश का मतलब है कि रिकॉर्ड विदेश में हैं, और प्रक्रिया बिलकुल अलग होगी।",
        need: ["सीडीआर या ज़ब्त फ़ोन से मिला आईएमएसआई"],
        steps: ["आईएमएसआई पेस्ट करें (आमतौर पर 15 अंक)", "Decode दबाएँ", "देश देखें. विदेशी देश का मतलब बिलकुल अलग साक्ष्य प्रक्रिया"] }
    },

    caf: {
      en: { name: "SIM Form (CAF) Checker",
        desc: "Find bulk-SIM and fake-KYC patterns across many customer forms.",
        what: "One form tells you little. The pattern across many forms tells you everything. This finds one ID document used for many SIMs, one shop issuing all of them, and connections switched on within the same hour. That pattern is the racket.",
        need: ["The CAF export from the operator, as a CSV file"],
        steps: ["Drop the file in the box", "Look at the red boxes first, those are the repeated ID documents",
                "Note the Point of Sale code; that shop is a suspect too",
                "Download the flagged list for your case file"] },
      hi: { name: "सिम फ़ॉर्म (CAF) जाँच",
        desc: "कई ग्राहक फ़ॉर्मों में थोक-सिम और फ़र्ज़ी केवाईसी का पैटर्न खोजें।",
        what: "एक फ़ॉर्म से कुछ पता नहीं चलता। कई फ़ॉर्मों का पैटर्न सब बता देता है। यह देखता है कि एक ही पहचान-पत्र पर कितनी सिम लीं। यह भी कि सब किस दुकान से लीं, और क्या सब एक ही घंटे में चालू हुईं। यही पैटर्न गिरोह है।",
        need: ["ऑपरेटर से मिली CAF फ़ाइल, CSV रूप में"],
        steps: ["फ़ाइल बॉक्स में छोड़ें", "पहले लाल बॉक्स देखें. वही दोहराए गए पहचान-पत्र हैं",
                "पॉइंट ऑफ़ सेल कोड नोट करें; वह दुकान भी आरोपी है",
                "चिह्नित सूची अपने केस फ़ाइल के लिए डाउनलोड करें"] }
    },

    verhoeff: {
      en: { name: "Checksum Demonstration",
        desc: "Shows how the Aadhaar check digit works. For training only.",
        what: "This is a teaching page. It shows how a check digit catches typing mistakes. It does not connect to UIDAI and cannot confirm anyone's identity. Never type a real Aadhaar number here.",
        need: ["Nothing"],
        steps: ["Press Generate to make practice numbers", "Type one in to see the check pass",
                "Change one digit and watch it fail"] },
      hi: { name: "चेकसम प्रदर्शन",
        desc: "आधार का जाँच-अंक कैसे काम करता है। केवल प्रशिक्षण के लिए।",
        what: "यह सिखाने वाला पृष्ठ है। यह दिखाता है कि जाँच-अंक टाइपिंग की ग़लती कैसे पकड़ता है। इसका यूआईडीएआई से कोई संबंध नहीं है। यह किसी की पहचान नहीं बता सकता। यहाँ असली आधार संख्या कभी न लिखें।",
        need: ["कुछ नहीं"],
        steps: ["अभ्यास संख्याएँ बनाने के लिए Generate दबाएँ", "एक संख्या डालकर जाँच सफल होते देखें",
                "एक अंक बदलिए और जाँच विफल होते देखिए"] }
    },

    imei: {
      en: { name: "IMEI Check",
        desc: "Check a phone's IMEI and see if it has been tampered with.",
        what: "Every phone has a 15-digit IMEI. The number has a built-in check, so a fake one usually fails it. If the check fails, either the number was typed wrong or the phone was reflashed with a false IMEI. Reflashing is itself an offence.",
        need: ["An IMEI from a CDR, a seizure memo, or *#06# on the handset"],
        steps: ["Paste the IMEI numbers, one per line", "Press Analyse",
                "A red 'Luhn FAILS' badge means tampering or a typing error, check the seizure memo first",
                "For make and model, send KYM <IMEI> by SMS to 14422"] },
      hi: { name: "आईएमईआई जाँच",
        desc: "फ़ोन का आईएमईआई जाँचें और छेड़छाड़ पकड़ें।",
        what: "हर फ़ोन का 15 अंकों का आईएमईआई होता है। इस नंबर में एक जाँच छिपी होती है, इसलिए नक़ली नंबर आमतौर पर फेल हो जाता है। जाँच फेल हो तो या तो नंबर ग़लत टाइप हुआ है, या फ़ोन में नक़ली आईएमईआई डाला गया है। नक़ली आईएमईआई डालना अपने आप में अपराध है।",
        need: ["सीडीआर, ज़ब्ती पंचनामा, या फ़ोन पर *#06# से मिला आईएमईआई"],
        steps: ["आईएमईआई नंबर हर पंक्ति में एक डालें", "Analyse दबाएँ",
                "लाल 'Luhn FAILS' का मतलब छेड़छाड़ या टाइपिंग ग़लती. पहले पंचनामा मिलाएँ",
                "मेक-मॉडल के लिए 14422 पर KYM <IMEI> एसएमएस भेजें"] }
    },

    mac: {
      en: { name: "Wi-Fi / MAC Address Lookup",
        desc: "Find which company made a device from its hardware address.",
        what: "Every device on a network has a hardware address. This names the company that registered it. It also warns you when the address is a random one. Modern phones make up a fresh address for every Wi-Fi network, and those cannot be traced to any phone.",
        need: ["A MAC address from a router log, CCTV DVR or Wi-Fi record"],
        steps: ["Paste the address in any format", "Press Look up",
                "If it says 'randomised address', stop, it cannot be traced to a phone"] },
      hi: { name: "वाई-फ़ाई / मैक पता खोज",
        desc: "हार्डवेयर पते से पता करें कि डिवाइस किस कंपनी का है।",
        what: "नेटवर्क पर हर डिवाइस का एक हार्डवेयर पता होता है। यह बताता है कि उसे किस कंपनी ने पंजीकृत कराया। यह चेताता भी है कि पता यादृच्छिक तो नहीं। आजकल के फ़ोन हर वाई-फ़ाई के लिए नया पता बनाते हैं। ऐसे पते से कोई फ़ोन नहीं पकड़ा जा सकता।",
        need: ["राउटर लॉग, सीसीटीवी डीवीआर या वाई-फ़ाई रिकॉर्ड से मैक पता"],
        steps: ["पता किसी भी रूप में पेस्ट करें", "Look up दबाएँ",
                "'randomised address' दिखे तो रुक जाइए. इससे फ़ोन नहीं पहचाना जा सकता"] }
    },

    ceir: {
      en: { name: "Stolen Phone (CEIR) Request",
        desc: "Write the correct request to trace or block a stolen handset.",
        what: "Two different things are called CEIR. The public portal lets a victim block a lost phone. The police channel tells you which SIM is in that handset now. This writes the police request. Remember that blocking a phone stops it producing any further evidence.",
        need: ["The IMEI", "Your FIR number and sections"],
        steps: ["Enter the IMEI and case details", "Press Generate",
                "Get it countersigned at the rank your state requires",
                "Send through your State Police nodal officer, not the public portal"] },
      hi: { name: "चोरी फ़ोन (CEIR) अनुरोध",
        desc: "चोरी हुए फ़ोन को ट्रेस या ब्लॉक कराने का सही अनुरोध बनाएँ।",
        what: "सीईआईआर नाम की दो अलग चीज़ें हैं। सार्वजनिक पोर्टल से पीड़ित खोया फ़ोन ब्लॉक कराता है। पुलिस मार्ग से पता चलता है कि उस फ़ोन में अभी कौन सी सिम है। यह पुलिस वाला अनुरोध बनाता है। ध्यान रखें: फ़ोन ब्लॉक करने पर आगे कोई सबूत नहीं बनेगा।",
        need: ["आईएमईआई", "एफ़आईआर संख्या और धाराएँ"],
        steps: ["आईएमईआई और केस विवरण भरें", "Generate दबाएँ",
                "अपने राज्य के अनुसार निर्धारित रैंक से प्रतिहस्ताक्षर कराएँ",
                "राज्य पुलिस नोडल अधिकारी के माध्यम से भेजें, सार्वजनिक पोर्टल से नहीं"] }
    },

    cdr: {
      en: { name: "Call Records (CDR) Analysis",
        desc: "Read a call record file and find contacts, patterns and phone changes.",
        what: "A call record file can run to twenty thousand rows. This reads them all for you. It shows who was called most, who was called at night, when the person changed phones, and which towers they used. You are left with the few rows that matter.",
        need: ["The CDR file from the operator, as CSV or Excel-exported CSV"],
        steps: ["Drop the CDR file in the box",
                "Read the top four boxes, number of handsets is the one to notice",
                "If it says the SIM was used in more than one handset, look at the short-use one; that is often the crime phone",
                "Scroll to Contacts and look at the 00-05h column, not just the call count",
                "Download the contact list for your case diary"] },
      hi: { name: "कॉल रिकॉर्ड (CDR) विश्लेषण",
        desc: "कॉल रिकॉर्ड फ़ाइल पढ़ें और संपर्क, पैटर्न व फ़ोन बदलना पकड़ें।",
        what: "एक कॉल रिकॉर्ड फ़ाइल में बीस हज़ार पंक्तियाँ हो सकती हैं। यह सब आपके लिए पढ़ लेता है। यह दिखाता है कि सबसे ज़्यादा किससे बात हुई, रात में किससे हुई, कब फ़ोन बदला, और कौन से टावर इस्तेमाल हुए। आपके सामने बस काम की पंक्तियाँ बचती हैं।",
        need: ["ऑपरेटर से मिली सीडीआर फ़ाइल, CSV रूप में"],
        steps: ["सीडीआर फ़ाइल बॉक्स में छोड़ें",
                "ऊपर के चार बॉक्स पढ़ें. हैंडसेट की संख्या सबसे ध्यान देने लायक़ है",
                "यदि एक सिम कई हैंडसेट में दिखे तो कम इस्तेमाल वाला देखें; अक्सर वही अपराध का फ़ोन होता है",
                "Contacts में जाकर केवल कॉल संख्या नहीं, 00-05h कॉलम देखें",
                "संपर्क सूची केस डायरी के लिए डाउनलोड करें"] }
    },

    common: {
      en: { name: "Common Contact Finder",
        desc: "Find the numbers that two or more suspects both called.",
        what: "Two suspects may never call each other. But if both call the same third number, that number usually belongs to the organiser. Load several call record files and this finds the shared numbers for you.",
        need: ["Two or more CDR files, one per suspect"],
        steps: ["Drop all the CDR files together",
                "Look at 'Shared by ALL', those numbers are your priority",
                "Take each shared number back to Phone Number Check and requisition its CAF and CDR"] },
      hi: { name: "साझा संपर्क खोज",
        desc: "वे नंबर खोजें जिन पर दो या अधिक आरोपियों ने बात की।",
        what: "हो सकता है दो आरोपी आपस में कभी बात न करें। पर अगर दोनों एक ही तीसरे नंबर पर बात करते हैं, तो वह नंबर आमतौर पर सरगना का होता है। कई कॉल रिकॉर्ड फ़ाइलें डालिए, यह साझा नंबर आपके लिए निकाल देगा।",
        need: ["दो या अधिक सीडीआर फ़ाइलें, हर आरोपी की एक"],
        steps: ["सभी सीडीआर फ़ाइलें एक साथ छोड़ें",
                "'Shared by ALL' देखें. वही नंबर प्राथमिकता हैं",
                "हर साझा नंबर को मोबाइल नंबर जाँच में डालें और उसकी CAF व सीडीआर माँगें"] }
    },

    ipdr: {
      en: { name: "Internet Records (IPDR) Analysis",
        desc: "Turn an IP address and a time back into a subscriber.",
        what: "Many people share one public IP address today. So the address alone identifies nobody. You also need the port number and the exact time, down to the second. This checks whether your request has all three, and writes it correctly.",
        need: ["The IP address, port and timestamp from the platform", "Or the IPDR file from the operator"],
        steps: ["Fill in IP, port and timestamp at the top",
                "Set whether the platform gave you UTC or IST, this is the mistake that ruins cases",
                "Press Check and read the warnings",
                "Copy the requisition text"] },
      hi: { name: "इंटरनेट रिकॉर्ड (IPDR) विश्लेषण",
        desc: "आईपी पता और समय से ग्राहक तक पहुँचें।",
        what: "आजकल एक ही सार्वजनिक आईपी कई लोग साझा करते हैं। इसलिए अकेले पते से किसी की पहचान नहीं होती। साथ में पोर्ट नंबर और सेकंड तक सही समय भी चाहिए। यह जाँचता है कि आपके अनुरोध में तीनों हैं या नहीं, और सही माँग-पत्र बनाता है।",
        need: ["प्लेटफ़ॉर्म से मिला आईपी पता, पोर्ट और समय", "या ऑपरेटर से मिली आईपीडीआर फ़ाइल"],
        steps: ["ऊपर आईपी, पोर्ट और समय भरें",
                "चुनें कि समय UTC में है या IST में. यही ग़लती केस बिगाड़ती है",
                "Check दबाकर चेतावनियाँ पढ़ें",
                "माँग-पत्र का मसौदा कॉपी करें"] }
    },

    smshdr: {
      en: { name: "Fraud SMS Checker",
        desc: "Check whether a bank SMS is genuine, and pull out the links.",
        what: "Every genuine commercial SMS in India uses a registered sender ID with a fixed shape. Paste the message and this checks the shape. It also flags fake links, hurry-up wording, and any request for an OTP.",
        need: ["A screenshot or the exact text of the SMS", "The sender ID as shown on the phone"],
        steps: ["Type the sender ID exactly as it appears, e.g. VM-SBIINB",
                "Paste the message text without changing it",
                "Press Analyse and read the red boxes",
                "Do not open any of the extracted links on a police computer"] },
      hi: { name: "फ़र्ज़ी एसएमएस जाँच",
        desc: "जाँचें कि बैंक का एसएमएस असली है या नहीं, और लिंक निकालें।",
        what: "भारत में हर असली व्यावसायिक एसएमएस एक पंजीकृत सेंडर आईडी से आता है, जिसका रूप तय होता है। संदेश पेस्ट कीजिए, यह वह रूप जाँचेगा। यह नक़ली लिंक, जल्दबाज़ी वाली भाषा और ओटीपी माँगने को भी चिह्नित करता है।",
        need: ["एसएमएस का स्क्रीनशॉट या हूबहू पाठ", "फ़ोन पर दिख रही भेजने वाले की आईडी"],
        steps: ["भेजने वाले की आईडी हूबहू लिखें, जैसे VM-SBIINB",
                "संदेश का पाठ बिना बदले पेस्ट करें",
                "Analyse दबाकर लाल बॉक्स पढ़ें",
                "निकाले गए लिंक पुलिस कंप्यूटर पर बिलकुल न खोलें"] }
    },

    tower: {
      en: { name: "Tower Dump Comparison",
        desc: "Find the phone that was present at every crime scene.",
        what: "A tower dump lists every phone near a tower at that time. That is thousands of innocent people. It only becomes useful when you compare two or more scenes. The phone that appears at all of them is your short list.",
        need: ["Tower dumps for two or more locations, one file each"],
        steps: ["Drop all the dump files together",
                "Read 'At EVERY location', that is the narrowed list",
                "Requisition the CAF and CDR for each of those numbers",
                "Remember: being in the sector is not being at the address"] },
      hi: { name: "टावर डंप तुलना",
        desc: "वह फ़ोन खोजें जो हर घटनास्थल पर मौजूद था।",
        what: "टावर डंप में उस समय टावर के पास मौजूद हर फ़ोन होता है। यानी हज़ारों निर्दोष लोग। यह तभी काम का बनता है जब दो या अधिक स्थान मिलाए जाएँ। जो फ़ोन हर जगह मिले, वही आपकी छोटी सूची है।",
        need: ["दो या अधिक स्थानों के टावर डंप, हर स्थान की अलग फ़ाइल"],
        steps: ["सभी डंप फ़ाइलें एक साथ छोड़ें",
                "'At EVERY location' पढ़ें. वही छँटी हुई सूची है",
                "उन नंबरों की CAF और सीडीआर माँगें",
                "याद रखें: सेक्टर में होना उस पते पर होना नहीं है"] }
    },

    cellspyder: {
      en: { name: "Cell Tower Finder",
        desc: "Turn a cell ID into a place, and see which way the antenna faced.",
        what: "A call record gives you cell IDs like 404-45-1149-21. This turns them into places on a map. It also shows which way each antenna was pointing, which narrows down where the phone actually was.",
        need: ["Cell IDs from a CDR", "The cell site list the operator sent with the CDR"],
        steps: ["Load the site list once, it is remembered afterwards",
                "Paste your cell IDs and press Look up",
                "Read the wedge direction on the map",
                "Export as KML and open it in Google Earth for a real map"] },
      hi: { name: "सेल टावर खोज",
        desc: "सेल आईडी से स्थान निकालें और एंटीना की दिशा देखें।",
        what: "कॉल रिकॉर्ड में 404-45-1149-21 जैसी सेल आईडी होती हैं। यह उन्हें नक़्शे पर स्थान में बदलता है। यह भी दिखाता है कि हर एंटीना किस दिशा में था। इससे फ़ोन का असली इलाक़ा और सिमट जाता है।",
        need: ["सीडीआर से मिली सेल आईडी", "सीडीआर के साथ ऑपरेटर से मिली सेल साइट सूची"],
        steps: ["साइट सूची एक बार लोड करें. आगे याद रहेगी",
                "अपनी सेल आईडी पेस्ट करके Look up दबाएँ",
                "नक़्शे पर कोण (wedge) की दिशा देखें",
                "KML में निर्यात कर Google Earth में असली नक़्शे पर खोलें"] }
    },

    ifsc: {
      en: { name: "Bank Branch (IFSC) Lookup",
        desc: "Find the bank and branch behind an IFSC code.",
        what: "Every bank branch has an 11-character IFSC code. This tells you the bank and the branch, so you know where to send the notice. Remember the branch is where the account was opened. It is not where the accused lives.",
        need: ["An IFSC code from a statement or a cheque"],
        steps: ["Paste the IFSC codes, one per line", "Press Look up",
                "Note: the branch is where the account was opened, not where the accused lives"] },
      hi: { name: "बैंक शाखा (IFSC) खोज",
        desc: "आईएफ़एससी कोड से बैंक और शाखा पता करें।",
        what: "हर बैंक शाखा का 11 अक्षरों का आईएफ़एससी कोड होता है। यह बैंक और शाखा बताता है, जिससे पता चलता है नोटिस कहाँ भेजना है। याद रखें, शाखा वह जगह है जहाँ खाता खुला था। आरोपी वहीं रहता हो, ज़रूरी नहीं।",
        need: ["स्टेटमेंट या चेक से मिला आईएफ़एससी कोड"],
        steps: ["आईएफ़एससी कोड हर पंक्ति में एक डालें", "Look up दबाएँ",
                "ध्यान दें: शाखा वह जगह है जहाँ खाता खुला, जहाँ आरोपी रहता है वह नहीं"] }
    },

    upi: {
      en: { name: "UPI ID Lookup",
        desc: "Find which bank sits behind a UPI ID such as name@ybl.",
        what: "A UPI ID is not a name and not an account number. The part after the @ tells you which bank to serve notice on. That bank can then give you the real account behind the ID.",
        need: ["A UPI ID from the complaint or a statement"],
        steps: ["Paste the UPI IDs", "Press Resolve",
                "Serve notice on the PSP bank shown",
                "If the part before @ is a mobile number, that is a strong lead, check it too"] },
      hi: { name: "यूपीआई आईडी खोज",
        desc: "पता करें कि name@ybl जैसी यूपीआई आईडी के पीछे कौन सा बैंक है।",
        what: "यूपीआई आईडी न नाम है और न खाता संख्या। @ के बाद वाला हिस्सा बताता है कि नोटिस किस बैंक को देना है। वह बैंक फिर उस आईडी के पीछे का असली खाता बता सकता है।",
        need: ["शिकायत या स्टेटमेंट से मिली यूपीआई आईडी"],
        steps: ["यूपीआई आईडी पेस्ट करें", "Resolve दबाएँ",
                "दिखाए गए पीएसपी बैंक को नोटिस दें",
                "यदि @ से पहले मोबाइल नंबर है तो वह बड़ा सुराग है. उसे भी जाँचें"] }
    },

    trail: {
      en: { name: "Bank Statement Analysis",
        desc: "Spot mule-account behaviour in a single bank statement.",
        what: "Mule accounts have a shape. Money arrives, and within minutes it leaves in several smaller pieces. The balance drops back to almost nothing. This finds that shape for you.",
        need: ["One bank or wallet statement as a CSV file"],
        steps: ["Drop the statement file",
                "Read the red 'mule account' box if it appears",
                "Look at the Layering sequences, each one is money in and straight back out",
                "Take each beneficiary UPI ID to the UPI ID Lookup tool"] },
      hi: { name: "बैंक स्टेटमेंट विश्लेषण",
        desc: "एक ही बैंक स्टेटमेंट में खच्चर-खाते का व्यवहार पकड़ें।",
        what: "खच्चर खातों का एक ढर्रा होता है। पैसा आता है, और मिनटों में कई छोटे हिस्सों में निकल जाता है। बाक़ी रक़म लगभग शून्य रह जाती है। यह वही ढर्रा आपके लिए पकड़ लेता है।",
        need: ["एक बैंक या वॉलेट स्टेटमेंट, CSV रूप में"],
        steps: ["स्टेटमेंट फ़ाइल छोड़ें",
                "यदि लाल 'mule account' बॉक्स दिखे तो उसे पढ़ें",
                "Layering sequences देखें. हर एक में पैसा आकर तुरंत निकला है",
                "हर लाभार्थी यूपीआई आईडी को यूपीआई आईडी खोज में डालें"] }
    },

    moneytrail: {
      en: { name: "Money Trail Mapper",
        desc: "Load many bank statements and see how money moved between accounts.",
        what: "Load statements from several accounts. They can be from different banks in different formats. The tool matches a withdrawal in one account to the deposit in another, using the reference or UTR number. It never guesses from the amount alone, so the trail holds up in court.",
        need: ["Two or more bank statements as CSV files"],
        steps: ["Drop all the statements together, or press the example button",
                "Open 'BS2BS transfers' to see the money flow diagram",
                "Every arrow is proved by a reference number shown in the table below it",
                "Download that table, it is your exhibit"] },
      hi: { name: "धन-प्रवाह मानचित्र",
        desc: "कई बैंक स्टेटमेंट डालें और देखें पैसा किस खाते से किस खाते में गया।",
        what: "कई खातों के स्टेटमेंट डालिए। वे अलग बैंकों के और अलग प्रारूप के हो सकते हैं। टूल एक खाते की निकासी को दूसरे खाते की जमा से मिलाता है, रेफ़रेंस या यूटीआर नंबर के आधार पर। यह केवल रक़म देखकर अनुमान नहीं लगाता। इसीलिए यह रास्ता अदालत में टिकता है।",
        need: ["दो या अधिक बैंक स्टेटमेंट, CSV रूप में"],
        steps: ["सभी स्टेटमेंट एक साथ छोड़ें, या उदाहरण बटन दबाएँ",
                "धन-प्रवाह का चित्र देखने के लिए 'BS2BS transfers' खोलें",
                "हर तीर नीचे तालिका में दिखे रेफ़रेंस नंबर से सिद्ध है",
                "वह तालिका डाउनलोड करें. यही आपका प्रदर्श है"] }
    },

    hash: {
      en: { name: "File Hash & Certificate",
        desc: "Prove that an evidence file has not been changed.",
        what: "A hash is a fingerprint of a file. Take it the moment evidence reaches you and write it in the seizure memo. If anyone later says the file was altered, run this again. If the fingerprints match, the file is untouched.",
        need: ["The evidence file itself"],
        steps: ["Drop the file in the box",
                "Copy the SHA-256 value into your seizure memo",
                "Fill the case details and press Generate for the certificate draft",
                "Re-check the same file before filing the chargesheet"] },
      hi: { name: "फ़ाइल हैश व प्रमाणपत्र",
        desc: "सिद्ध करें कि साक्ष्य फ़ाइल में कोई बदलाव नहीं हुआ।",
        what: "हैश फ़ाइल की उँगली-छाप है। साक्ष्य मिलते ही इसे निकालिए और पंचनामे में लिख दीजिए। बाद में कोई कहे कि फ़ाइल बदली गई है, तो दोबारा निकाल लीजिए। छाप मिल जाए तो फ़ाइल में कोई छेड़छाड़ नहीं हुई।",
        need: ["साक्ष्य फ़ाइल स्वयं"],
        steps: ["फ़ाइल बॉक्स में छोड़ें",
                "SHA-256 मान अपने पंचनामे में लिखें",
                "केस विवरण भरकर प्रमाणपत्र मसौदे के लिए Generate दबाएँ",
                "आरोप-पत्र दाख़िल करने से पहले वही फ़ाइल दोबारा जाँचें"] }
    },

    ip: {
      en: { name: "IP Address Check",
        desc: "Find who owns an IP address, and whether it can be traced at all.",
        what: "Half the IP addresses that reach an investigator cannot be traced to anybody. This tells you straight away which half you are holding. For the rest, it names the network to write to.",
        need: ["An IP address or a website name"],
        steps: ["Type the IP address or domain", "Press Analyse",
                "A red box means the address is private or shared and cannot identify one person",
                "Save the registration record before the website disappears"] },
      hi: { name: "आईपी पता जाँच",
        desc: "पता करें आईपी किसका है, और क्या उसे ट्रेस किया भी जा सकता है।",
        what: "अन्वेषक तक पहुँचने वाले आधे आईपी पते किसी तक नहीं पहुँचाए जा सकते। यह तुरंत बता देता है कि आपके हाथ में कौन सा आधा है। बाक़ी के लिए यह बताता है कि किस नेटवर्क को लिखना है।",
        need: ["एक आईपी पता या वेबसाइट का नाम"],
        steps: ["आईपी पता या डोमेन लिखें", "Analyse दबाएँ",
                "लाल बॉक्स का मतलब पता निजी या साझा है और एक व्यक्ति की पहचान नहीं कर सकता",
                "वेबसाइट हटने से पहले पंजीकरण रिकॉर्ड सहेज लें"] }
    },

    toll: {
      en: { name: "Toll Plaza Finder",
        desc: "Find toll plazas on a route, with the operator's contact details.",
        what: "This shows where toll plazas are and who runs them. Use it to find the right operator for a CCTV preservation notice. It does not hold FASTag crossing records. Those need a separate notice to NPCI.",
        need: ["A route, or a coordinate"],
        steps: ["Choose 'Along a route' and enter start and end coordinates",
                "Note the operator and site contact for each plaza",
                "Copy the preservation notice at the bottom and send it today, plaza CCTV is deleted within days"] },
      hi: { name: "टोल प्लाज़ा खोज",
        desc: "मार्ग पर टोल प्लाज़ा और संचालक के संपर्क खोजें।",
        what: "यह बताता है कि टोल प्लाज़ा कहाँ हैं और कौन चलाता है। सीसीटीवी सुरक्षित रखने का नोटिस सही संचालक को भेजने के लिए इसका उपयोग कीजिए। इसमें फ़ास्टैग आवागमन रिकॉर्ड नहीं हैं। उनके लिए एनपीसीआई को अलग नोटिस देना होगा।",
        need: ["एक मार्ग, या एक निर्देशांक"],
        steps: ["'Along a route' चुनकर आरंभ और अंत के निर्देशांक भरें",
                "हर प्लाज़ा का संचालक और साइट संपर्क नोट करें",
                "नीचे दिया सुरक्षा-नोटिस आज ही भेजें. प्लाज़ा सीसीटीवी कुछ दिनों में मिट जाता है"] }
    },

    geo: {
      en: { name: "Map & Distance Tool",
        desc: "Convert coordinates, measure distance, and make a map file.",
        what: "Paste coordinates in any format. This measures the distance and direction between places. It also makes a file you can open in Google Earth.",
        need: ["Coordinates from a CDR, a tower list or a scene"],
        steps: ["Paste points as: label, latitude, longitude, one per line",
                "Press Process",
                "Press Export KML and open the file in Google Earth"] },
      hi: { name: "नक़्शा व दूरी उपकरण",
        desc: "निर्देशांक बदलें, दूरी नापें, और नक़्शा फ़ाइल बनाएँ।",
        what: "किसी भी रूप में निर्देशांक पेस्ट कीजिए। यह स्थानों के बीच दूरी और दिशा नापता है। यह ऐसी फ़ाइल भी बनाता है जिसे Google Earth में खोला जा सके।",
        need: ["सीडीआर, टावर सूची या घटनास्थल से मिले निर्देशांक"],
        steps: ["बिंदु ऐसे लिखें: नाम, अक्षांश, देशांतर. हर पंक्ति में एक",
                "Process दबाएँ",
                "Export KML दबाकर फ़ाइल Google Earth में खोलें"] }
    },

    ps: {
      en: { name: "Police Station Lookup",
        desc: "Find a police station by district, by name, or nearest to a place.",
        what: "Find which police station covers an area, and where it is. Useful for jurisdiction questions and for zero-FIR transfers.",
        need: ["A district name, a station name, or a coordinate"],
        steps: ["Choose your state, then your district",
                "Or switch to 'Nearest station' and enter a coordinate",
                "Note: this list is incomplete in rural districts, a station missing here may still exist"] },
      hi: { name: "थाना खोज",
        desc: "ज़िले से, नाम से, या किसी जगह के सबसे पास का थाना खोजें।",
        what: "पता करें कि कौन सा थाना किस इलाक़े में आता है और कहाँ है। क्षेत्राधिकार के सवालों और ज़ीरो-एफ़आईआर स्थानांतरण में यह काम आता है।",
        need: ["ज़िले का नाम, थाने का नाम, या निर्देशांक"],
        steps: ["अपना राज्य चुनें, फिर ज़िला",
                "या 'Nearest station' पर जाकर निर्देशांक डालें",
                "ध्यान दें: ग्रामीण ज़िलों में यह सूची अधूरी है. यहाँ न दिखने का मतलब थाना नहीं है, ऐसा नहीं"] }
    },

    legal: {
      en: { name: "Which Law Applies",
        desc: "What each kind of evidence needs, who signs it, and how long it lasts.",
        what: "Before you ask for evidence, you need to know two things. Which law lets you ask, and who has to sign. This lists both for each kind of record. It also tells you how long the holder keeps it before deleting, so you know what to ask for first.",
        need: ["Nothing"],
        steps: ["Read the retention chart first, it tells you what to ask for today and what can wait",
                "Find your evidence type below",
                "Have your prosecution wing confirm the provision before you sign"] },
      hi: { name: "कौन सा कानून लागू है",
        desc: "किस साक्ष्य के लिए क्या चाहिए, कौन हस्ताक्षर करे, और वह कितने दिन बचता है।",
        what: "साक्ष्य माँगने से पहले दो बातें जाननी ज़रूरी हैं। किस कानून से माँग सकते हैं, और हस्ताक्षर किसे करने हैं। यह हर तरह के रिकॉर्ड के लिए दोनों बताता है। साथ ही यह भी कि रखने वाला उसे कितने दिन रखता है, ताकि आप जान सकें पहले क्या माँगना है।",
        need: ["कुछ नहीं"],
        steps: ["पहले अवधारण-चार्ट पढ़ें. इससे पता चलेगा आज क्या माँगना है और क्या रुक सकता है",
                "नीचे अपना साक्ष्य-प्रकार खोजें",
                "हस्ताक्षर से पहले अभियोजन शाखा से धारा की पुष्टि कराएँ"] }
    },

    templates: {
      en: { name: "Notice Writer",
        desc: "Write a preservation notice or a BNSS s.94 request correctly.",
        what: "Most requests come back useless because they asked for the wrong thing. These drafts already ask for the right things. They also include the certificate you will need at trial.",
        need: ["FIR number and sections", "Name and address of the bank, operator or platform"],
        steps: ["Choose the type of notice at the top",
                "Fill in your case details",
                "Press Generate, then Copy or Download",
                "Check the rank required in your state before signing"] },
      hi: { name: "नोटिस लेखक",
        desc: "सुरक्षा-नोटिस या बीएनएसएस धारा 94 का माँग-पत्र सही बनाएँ।",
        what: "ज़्यादातर माँग-पत्र इसलिए बेकार लौटते हैं क्योंकि उनमें ग़लत चीज़ माँगी जाती है। इन मसौदों में सही चीज़ें पहले से माँगी गई हैं। इनमें वह प्रमाणपत्र भी है जो मुक़दमे में चाहिए होगा।",
        need: ["एफ़आईआर संख्या और धाराएँ", "बैंक, ऑपरेटर या प्लेटफ़ॉर्म का नाम-पता"],
        steps: ["ऊपर से नोटिस का प्रकार चुनें",
                "अपने केस का विवरण भरें",
                "Generate दबाएँ, फिर Copy या Download करें",
                "हस्ताक्षर से पहले अपने राज्य में निर्धारित रैंक देख लें"] }
    },

    nodal: {
      en: { name: "Nodal Officer Directory",
        desc: "Contact details for bank, wallet, crypto, ISP and police nodal officers.",
        what: "When you need to send a notice to a bank, a payment app or a crypto exchange, this is who it goes to. Search by name, or pick a category.",
        need: ["Nothing"],
        steps: ["Type the bank or app name in the search box",
                "Or press a category button such as Payment / Wallet",
                "Use the e-mail or phone shown. A blank means the official source has no value for that officer"] },
      hi: { name: "नोडल अधिकारी सूची",
        desc: "बैंक, वॉलेट, क्रिप्टो, आईएसपी और पुलिस नोडल अधिकारियों के संपर्क।",
        what: "किसी बैंक, भुगतान ऐप या क्रिप्टो एक्सचेंज को नोटिस भेजना हो, तो वह इन्हीं के पास जाता है। नाम से खोजिए, या कोई श्रेणी चुन लीजिए।",
        need: ["कुछ नहीं"],
        steps: ["खोज बॉक्स में बैंक या ऐप का नाम लिखें",
                "या Payment / Wallet जैसी श्रेणी का बटन दबाएँ",
                "दिया गया ई-मेल या फ़ोन इस्तेमाल करें। ख़ाली का मतलब सरकारी स्रोत में ही वह जानकारी नहीं है"] }
    },

    timeline: {
      en: { name: "Case Timeline Builder",
        desc: "Put events from calls, money and your notes into one order.",
        what: "The story in a chargesheet is a sequence of events. Add events here from any source and the tool keeps them in order. Each event carries the source it came from.",
        need: ["Findings from your other tools, or your case notes"],
        steps: ["Add each event with its date, what happened, and where you got it from",
                "Always fill the Source field, an event you cannot prove does not belong in a chargesheet",
                "Press Export as narrative for a ready chronology"] },
      hi: { name: "केस समय-रेखा",
        desc: "कॉल, पैसे और अपने नोट्स की घटनाओं को एक क्रम में रखें।",
        what: "आरोप-पत्र की कहानी घटनाओं का क्रम होती है। यहाँ किसी भी स्रोत से घटनाएँ जोड़िए, टूल उन्हें क्रम में रख देगा। हर घटना के साथ उसका स्रोत भी लिखा रहता है।",
        need: ["आपके अन्य टूल से मिले निष्कर्ष, या केस नोट्स"],
        steps: ["हर घटना उसकी तारीख़, विवरण और स्रोत के साथ जोड़ें",
                "स्रोत ज़रूर भरें. जिस घटना को सिद्ध न कर सकें वह आरोप-पत्र में नहीं जानी चाहिए",
                "तैयार कालक्रम के लिए Export as narrative दबाएँ"] }
    }
  }
};
