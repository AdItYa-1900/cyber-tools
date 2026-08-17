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
        desc: "Identify the true sender and originating IP address of an email from its headers.",
        what: "The sender name shown on an email can be forged. The delivery records beneath it cannot. This tool reads those records. It reports the IP address the message came from, the authentication results, and the common signs of forgery.",
        need: ["The raw headers of the email, exported by the complainant"],
        steps: ["Ask the complainant to open the mail and use Show original (Gmail) or Internet headers (Outlook)",
                "Paste everything into the box",
                "Press Analyse and read the red boxes first",
                "Take the originating IP to IP Address Check, then requisition the subscriber"] },
      hi: { name: "ईमेल हेडर विश्लेषण",
        desc: "ईमेल हेडर से वास्तविक प्रेषक और मूल आईपी पता ज्ञात करें।",
        what: "ईमेल पर दिखाया गया प्रेषक नाम बदला जा सकता है। उसके नीचे दर्ज डिलीवरी विवरण नहीं बदले जा सकते। यह टूल वही विवरण पढ़ता है। यह उस आईपी पते की सूचना देता है जहाँ से संदेश आया, प्रमाणीकरण का परिणाम, और जालसाज़ी के सामान्य लक्षण।",
        need: ["पीड़ित द्वारा निर्यात किए गए ईमेल के कच्चे हेडर"],
        steps: ["पीड़ित से कहें कि मेल खोलकर Show original (Gmail) या Internet headers (Outlook) चुनें",
                "पूरा पाठ बॉक्स में पेस्ट करें",
                "Analyse दबाएँ और पहले लाल बॉक्स पढ़ें",
                "मूल आईपी को आईपी पता जाँच में डालें, फिर ग्राहक विवरण माँगें"] }
    },

    time: {
      en: { name: "Timestamp Converter",
        desc: "Convert timestamps between epoch, UTC and IST.",
        what: "Web platforms usually record time in UTC. Indian operators record it in IST. The difference is 5 hours 30 minutes. Confusing the two shifts every event in the case by that amount. This tool converts between them and gives the value in the form required for a requisition.",
        need: ["A timestamp from a log, a platform reply or a complaint"],
        steps: ["Paste the timestamp",
                "Choose whether the source is UTC or IST",
                "Copy the IST line into your requisition and write IST next to it"] },
      hi: { name: "समय रूपांतरक",
        desc: "टाइमस्टैम्प को एपॉक, यूटीसी और भारतीय मानक समय के बीच बदलें।",
        what: "वेब प्लेटफ़ॉर्म सामान्यतः समय यूटीसी में दर्ज करते हैं। भारतीय ऑपरेटर आईएसटी में दर्ज करते हैं। दोनों में 5 घंटे 30 मिनट का अंतर है। दोनों को मिला देने पर केस की हर घटना उतनी ही खिसक जाती है। यह टूल दोनों के बीच रूपांतरण करता है और माँग-पत्र के लिए आवश्यक रूप में मान देता है।",
        need: ["किसी लॉग, प्लेटफ़ॉर्म उत्तर या शिकायत से मिला समय"],
        steps: ["समय पेस्ट करें",
                "चुनें कि स्रोत यूटीसी है या आईएसटी",
                "आईएसटी वाली पंक्ति माँग-पत्र में लिखें और साथ में IST ज़रूर लिखें"] }
    },

    decode: {
      en: { name: "Text Decoder",
        desc: "Decode encoded text and detect lookalike characters in domain names.",
        what: "Fraudulent links hide their content behind a few standard encodings. This tool applies each one and shows which produced readable text. It also identifies domain names that use characters resembling ordinary letters, a method used to imitate genuine bank and government sites.",
        need: ["Some encoded text, from an SMS, an email or a file"],
        steps: ["Paste the text", "Press Decode",
                "Read whichever result is legible, that was the encoding used",
                "If a red mixed-script warning appears, treat the domain as hostile"] },
      hi: { name: "पाठ डिकोडर",
        desc: "एन्कोड किया गया पाठ पढ़ें और डोमेन नाम में मिलते-जुलते अक्षर पहचानें।",
        what: "धोखाधड़ी वाले लिंक अपनी सामग्री कुछ प्रचलित एन्कोडिंग विधियों के पीछे छिपाते हैं। यह टूल प्रत्येक विधि लगाकर बताता है कि किससे पठनीय पाठ मिला। यह उन डोमेन नामों को भी पहचानता है जिनमें सामान्य अक्षरों जैसे दिखने वाले वर्ण होते हैं, जिनसे असली बैंक और सरकारी साइटों की नक़ल की जाती है।",
        need: ["एसएमएस, ईमेल या फ़ाइल से मिला कोई एन्कोडेड पाठ"],
        steps: ["पाठ पेस्ट करें", "Decode दबाएँ",
                "जो परिणाम पढ़ने योग्य हो वही असली एन्कोडिंग है",
                "लाल मिश्रित-लिपि चेतावनी दिखे तो डोमेन को संदिग्ध मानें"] }
    },

    mni: {
      en: { name: "Phone Number Check",
        desc: "Validate an Indian mobile number and generate every search format for it.",
        what: "This tool confirms whether a number is a valid Indian mobile number. It then lists every format in which that number may have been saved. These formats are used when searching a seized handset, where a contact stored in an unexpected form would otherwise be missed.",
        need: ["A phone number from the complaint or the CDR"],
        steps: ["Type or paste the number, one per line if you have several",
                "Press Analyse",
                "Copy the search variants and use them when searching a seized phone",
                "Copy the ready-made notice text at the bottom for your requisition"] },
      hi: { name: "मोबाइल नंबर जाँच",
        desc: "भारतीय मोबाइल नंबर की वैधता जाँचें और उसके सभी खोज-प्रारूप बनाएँ।",
        what: "यह टूल पुष्टि करता है कि कोई नंबर वैध भारतीय मोबाइल नंबर है या नहीं। फिर यह उन सभी रूपों की सूची देता है जिनमें वह नंबर सहेजा गया हो सकता है। ज़ब्त हैंडसेट की तलाशी में ये रूप काम आते हैं, क्योंकि अप्रत्याशित रूप में सहेजा गया संपर्क अन्यथा छूट जाता है।",
        need: ["शिकायत या सीडीआर से मिला मोबाइल नंबर"],
        steps: ["नंबर लिखें या पेस्ट करें. कई हों तो हर पंक्ति में एक",
                "Analyse दबाएँ",
                "खोज-रूप कॉपी करें और ज़ब्त फ़ोन में खोजते समय इस्तेमाल करें",
                "नीचे दिया तैयार नोटिस-मसौदा अपनी माँग-पत्र में लगाएँ"] }
    },

    tsp: {
      en: { name: "Operator & Circle Directory",
        desc: "Reference table of the 22 licensed service areas and the operators in each.",
        what: "India is divided into 22 licensed service areas. Each operator holds a separate licence for each area and keeps records accordingly. A requisition sent to the wrong service area is returned unanswered, often after several weeks. This table shows which area covers which territory.",
        need: ["Nothing, this is a reference list"],
        steps: ["Find the circle you need in the table", "Note that Delhi, Mumbai, Kolkata and Chennai are separate from their states"] },
      hi: { name: "ऑपरेटर व सर्किल सूची",
        desc: "22 लाइसेंस प्राप्त सेवा क्षेत्र और उनमें कार्यरत ऑपरेटरों की संदर्भ तालिका।",
        what: "भारत 22 लाइसेंस प्राप्त सेवा क्षेत्रों में विभाजित है। प्रत्येक ऑपरेटर का हर क्षेत्र हेतु अलग लाइसेंस होता है और अभिलेख उसी अनुसार रखे जाते हैं। ग़लत सेवा क्षेत्र को भेजा गया माँग-पत्र प्रायः कई सप्ताह बाद अनुत्तरित लौट आता है। यह तालिका बताती है कि कौन सा क्षेत्र किस भूभाग को समाहित करता है।",
        need: ["कुछ नहीं. यह केवल संदर्भ सूची है"],
        steps: ["तालिका में अपना सर्किल देखें", "ध्यान दें: दिल्ली, मुंबई, कोलकाता और चेन्नई अपने राज्यों से अलग सर्किल हैं"] }
    },

    mccmnc: {
      en: { name: "SIM Number (IMSI) Decoder",
        desc: "Decode an IMSI into its country, network and subscriber components.",
        what: "The IMSI identifies the SIM card. It is not the telephone number and does not identify the subscriber. This tool separates the IMSI into its country, network and subscriber parts. A foreign country code means the records are held outside India and require a different process.",
        need: ["An IMSI from a CDR or a seized phone"],
        steps: ["Paste the IMSI (usually 15 digits)", "Press Decode", "Check the country, a foreign country means a completely different evidence route"] },
      hi: { name: "सिम नंबर (IMSI) डिकोडर",
        desc: "आईएमएसआई को देश, नेटवर्क और ग्राहक भागों में विभाजित करें।",
        what: "आईएमएसआई सिम कार्ड की पहचान है। यह न तो दूरभाष संख्या है और न ही ग्राहक की पहचान करता है। यह टूल आईएमएसआई को देश, नेटवर्क और ग्राहक भागों में विभाजित करता है। विदेशी देश कोड का अर्थ है कि अभिलेख भारत के बाहर रखे हैं और उनके लिए भिन्न प्रक्रिया आवश्यक है।",
        need: ["सीडीआर या ज़ब्त फ़ोन से मिला आईएमएसआई"],
        steps: ["आईएमएसआई पेस्ट करें (आमतौर पर 15 अंक)", "Decode दबाएँ", "देश देखें. विदेशी देश का मतलब बिलकुल अलग साक्ष्य प्रक्रिया"] }
    },

    caf: {
      en: { name: "SIM Form (CAF) Checker",
        desc: "Analyse customer acquisition forms for bulk-SIM and fraudulent-KYC patterns.",
        what: "A single customer acquisition form shows little. The pattern across many forms shows a great deal. This tool looks for three things. One identity document used for several connections. A single point of sale issuing all of them. Connections activated within the same short period.",
        need: ["The CAF export from the operator, as a CSV file"],
        steps: ["Drop the file in the box", "Look at the red boxes first, those are the repeated ID documents",
                "Note the Point of Sale code; that shop is a suspect too",
                "Download the flagged list for your case file"] },
      hi: { name: "सिम फ़ॉर्म (CAF) जाँच",
        desc: "ग्राहक आवेदन फ़ॉर्म में थोक-सिम और फ़र्ज़ी केवाईसी के प्रारूप जाँचें।",
        what: "एक अकेला ग्राहक आवेदन फ़ॉर्म बहुत कम बताता है। अनेक फ़ॉर्मों में उभरता प्रारूप बहुत कुछ बताता है। यह टूल पहचानता है कि एक ही पहचान दस्तावेज़ से कई कनेक्शन लिए गए, सभी एक ही विक्रय केंद्र से जारी हुए, और सभी एक ही अल्प अवधि में चालू किए गए।",
        need: ["ऑपरेटर से मिली CAF फ़ाइल, CSV रूप में"],
        steps: ["फ़ाइल बॉक्स में छोड़ें", "पहले लाल बॉक्स देखें. वही दोहराए गए पहचान-पत्र हैं",
                "पॉइंट ऑफ़ सेल कोड नोट करें; वह दुकान भी आरोपी है",
                "चिह्नित सूची अपने केस फ़ाइल के लिए डाउनलोड करें"] }
    },

    verhoeff: {
      en: { name: "Checksum Demonstration",
        desc: "Demonstrate the Verhoeff check-digit algorithm on synthetic numbers.",
        what: "This page demonstrates the Verhoeff check-digit method using synthetic numbers. It does not connect to UIDAI. It cannot confirm whether a number was issued, or to whom. Real Aadhaar numbers must not be entered.",
        need: ["Nothing"],
        steps: ["Press Generate to make practice numbers", "Type one in to see the check pass",
                "Change one digit and watch it fail"] },
      hi: { name: "चेकसम प्रदर्शन",
        desc: "कृत्रिम संख्याओं पर वेरहॉफ़ जाँच-अंक विधि का प्रदर्शन।",
        what: "यह पृष्ठ कृत्रिम संख्याओं पर वेरहॉफ़ जाँच-अंक विधि का प्रदर्शन करता है। यह यूआईडीएआई से संपर्क नहीं करता। यह पुष्टि नहीं कर सकता कि कोई संख्या जारी हुई थी या किसे जारी हुई थी। वास्तविक आधार संख्या यहाँ दर्ज न करें।",
        need: ["कुछ नहीं"],
        steps: ["अभ्यास संख्याएँ बनाने के लिए Generate दबाएँ", "एक संख्या डालकर जाँच सफल होते देखें",
                "एक अंक बदलिए और जाँच विफल होते देखिए"] }
    },

    imei: {
      en: { name: "IMEI Check",
        desc: "Validate an IMEI and identify the handset make and model.",
        what: "Every handset has a 15-digit IMEI that includes a check digit. A fabricated number will usually fail this check. Failure indicates either a typing error or a handset reflashed with a false IMEI. Reflashing is itself an offence.",
        need: ["An IMEI from a CDR, a seizure memo, or *#06# on the handset"],
        steps: ["Paste the IMEI numbers, one per line", "Press Analyse",
                "A red 'Luhn FAILS' badge means tampering or a typing error, check the seizure memo first",
                "For make and model, send KYM <IMEI> by SMS to 14422"] },
      hi: { name: "आईएमईआई जाँच",
        desc: "आईएमईआई की वैधता जाँचें और हैंडसेट का मेक व मॉडल पहचानें।",
        what: "प्रत्येक हैंडसेट में 15 अंकों का आईएमईआई होता है जिसमें एक जाँच-अंक सम्मिलित है। गढ़ी गई संख्या प्रायः इस जाँच में विफल हो जाती है। विफलता या तो टंकण त्रुटि दर्शाती है या ऐसा हैंडसेट जिसमें झूठा आईएमईआई डाला गया है। आईएमईआई बदलना स्वयं एक अपराध है।",
        need: ["सीडीआर, ज़ब्ती पंचनामा, या फ़ोन पर *#06# से मिला आईएमईआई"],
        steps: ["आईएमईआई नंबर हर पंक्ति में एक डालें", "Analyse दबाएँ",
                "लाल 'Luhn FAILS' का मतलब छेड़छाड़ या टाइपिंग ग़लती. पहले पंचनामा मिलाएँ",
                "मेक-मॉडल के लिए 14422 पर KYM <IMEI> एसएमएस भेजें"] }
    },

    mac: {
      en: { name: "Wi-Fi / MAC Address Lookup",
        desc: "Resolve a hardware address to its registered manufacturer and detect randomised addresses.",
        what: "Every device on a network has a hardware address. The opening digits are registered to a manufacturer, and this tool resolves that registration. It also identifies randomly generated addresses. Current versions of iOS and Android present a different address to each network. Such an address cannot be traced to a device or a manufacturer.",
        need: ["A MAC address from a router log, CCTV DVR or Wi-Fi record"],
        steps: ["Paste the address in any format", "Press Look up",
                "If it says 'randomised address', stop, it cannot be traced to a phone"] },
      hi: { name: "वाई-फ़ाई / मैक पता खोज",
        desc: "हार्डवेयर पते से पंजीकृत निर्माता ज्ञात करें और यादृच्छिक पते पहचानें।",
        what: "नेटवर्क पर प्रत्येक उपकरण का एक हार्डवेयर पता होता है। आरंभिक अंक किसी निर्माता के नाम पंजीकृत होते हैं, और यह टूल वह पंजीकरण बताता है। यह यादृच्छिक रूप से बने पतों की भी पहचान करता है। आईओएस और एंड्रॉइड के वर्तमान संस्करण हर नेटवर्क को भिन्न पता देते हैं, और ऐसे पते से किसी उपकरण या निर्माता तक नहीं पहुँचा जा सकता।",
        need: ["राउटर लॉग, सीसीटीवी डीवीआर या वाई-फ़ाई रिकॉर्ड से मैक पता"],
        steps: ["पता किसी भी रूप में पेस्ट करें", "Look up दबाएँ",
                "'randomised address' दिखे तो रुक जाइए. इससे फ़ोन नहीं पहचाना जा सकता"] }
    },

    ceir: {
      en: { name: "Stolen Phone (CEIR) Request",
        desc: "Prepare the CEIR request for blocking, unblocking or tracing a handset.",
        what: "Two separate facilities are called CEIR. The public portal allows a complainant to block a lost handset. The police channel shows which SIM is currently in a handset. This tool prepares the police request. Blocking a handset ends its value as a source of further evidence.",
        need: ["The IMEI", "Your FIR number and sections"],
        steps: ["Enter the IMEI and case details", "Press Generate",
                "Get it countersigned at the rank your state requires",
                "Send through your State Police nodal officer, not the public portal"] },
      hi: { name: "चोरी फ़ोन (CEIR) अनुरोध",
        desc: "हैंडसेट को अवरुद्ध, पुनर्बहाल या ट्रेस करने हेतु सीईआईआर अनुरोध तैयार करें।",
        what: "सीईआईआर नाम से दो अलग सुविधाएँ हैं। सार्वजनिक पोर्टल शिकायतकर्ता को खोया हुआ हैंडसेट अवरुद्ध करने देता है। पुलिस माध्यम बताता है कि हैंडसेट में इस समय कौन सा सिम है। यह टूल पुलिस अनुरोध तैयार करता है। हैंडसेट अवरुद्ध कर देने पर आगे साक्ष्य मिलने की संभावना समाप्त हो जाती है।",
        need: ["आईएमईआई", "एफ़आईआर संख्या और धाराएँ"],
        steps: ["आईएमईआई और केस विवरण भरें", "Generate दबाएँ",
                "अपने राज्य के अनुसार निर्धारित रैंक से प्रतिहस्ताक्षर कराएँ",
                "राज्य पुलिस नोडल अधिकारी के माध्यम से भेजें, सार्वजनिक पोर्टल से नहीं"] }
    },

    cdr: {
      en: { name: "Call Records (CDR) Analysis",
        desc: "Analyse a call detail record for contacts, patterns, handset changes and tower usage.",
        what: "A call detail record may contain many thousands of rows. This tool examines all of them. It reports the most frequent contacts, activity outside normal hours, changes of handset, and the towers used. The result is the small number of rows that need attention.",
        need: ["The CDR file from the operator, as CSV or Excel-exported CSV"],
        steps: ["Drop the CDR file in the box",
                "Read the top four boxes, number of handsets is the one to notice",
                "If it says the SIM was used in more than one handset, look at the short-use one; that is often the crime phone",
                "Scroll to Contacts and look at the 00-05h column, not just the call count",
                "Download the contact list for your case diary"] },
      hi: { name: "कॉल रिकॉर्ड (CDR) विश्लेषण",
        desc: "कॉल डिटेल रिकॉर्ड से संपर्क, प्रारूप, हैंडसेट परिवर्तन और टावर उपयोग निकालें।",
        what: "कॉल डिटेल रिकॉर्ड में कई हज़ार पंक्तियाँ हो सकती हैं। यह टूल उन सभी की जाँच करता है। यह सर्वाधिक बार संपर्क किए गए नंबर, असामान्य समय की गतिविधि, हैंडसेट परिवर्तन और प्रयुक्त टावर बताता है। परिणामस्वरूप केवल वे थोड़ी पंक्तियाँ बचती हैं जिन पर ध्यान देना आवश्यक है।",
        need: ["ऑपरेटर से मिली सीडीआर फ़ाइल, CSV रूप में"],
        steps: ["सीडीआर फ़ाइल बॉक्स में छोड़ें",
                "ऊपर के चार बॉक्स पढ़ें. हैंडसेट की संख्या सबसे ध्यान देने लायक़ है",
                "यदि एक सिम कई हैंडसेट में दिखे तो कम इस्तेमाल वाला देखें; अक्सर वही अपराध का फ़ोन होता है",
                "Contacts में जाकर केवल कॉल संख्या नहीं, 00-05h कॉलम देखें",
                "संपर्क सूची केस डायरी के लिए डाउनलोड करें"] }
    },

    common: {
      en: { name: "Common Contact Finder",
        desc: "Identify the numbers contacted by two or more subjects under investigation.",
        what: "Two subjects may never contact each other directly. If both contact the same third number, that number is usually significant. This tool compares several call detail records and reports the numbers common to them.",
        need: ["Two or more CDR files, one per suspect"],
        steps: ["Drop all the CDR files together",
                "Look at 'Shared by ALL', those numbers are your priority",
                "Take each shared number back to Phone Number Check and requisition its CAF and CDR"] },
      hi: { name: "साझा संपर्क खोज",
        desc: "दो या अधिक जाँचाधीन व्यक्तियों द्वारा संपर्क किए गए साझा नंबर पहचानें।",
        what: "दो व्यक्ति आपस में कभी सीधा संपर्क न करते हों, यह संभव है। यदि दोनों एक ही तीसरे नंबर से संपर्क करते हैं तो वह नंबर प्रायः महत्वपूर्ण होता है। यह टूल कई कॉल डिटेल रिकॉर्ड की तुलना कर उनमें साझा नंबर बताता है।",
        need: ["दो या अधिक सीडीआर फ़ाइलें, हर आरोपी की एक"],
        steps: ["सभी सीडीआर फ़ाइलें एक साथ छोड़ें",
                "'Shared by ALL' देखें. वही नंबर प्राथमिकता हैं",
                "हर साझा नंबर को मोबाइल नंबर जाँच में डालें और उसकी CAF व सीडीआर माँगें"] }
    },

    ipdr: {
      en: { name: "Internet Records (IPDR) Analysis",
        desc: "Resolve an IP address, port and timestamp to a subscriber session.",
        what: "One public IP address is now shared by many subscribers, so the address alone identifies no one. The source port and the exact time, to the second, are also required. This tool checks that a request contains all three and sets out the correct wording.",
        need: ["The IP address, port and timestamp from the platform", "Or the IPDR file from the operator"],
        steps: ["Fill in IP, port and timestamp at the top",
                "Set whether the platform gave you UTC or IST, this is the mistake that ruins cases",
                "Press Check and read the warnings",
                "Copy the requisition text"] },
      hi: { name: "इंटरनेट रिकॉर्ड (IPDR) विश्लेषण",
        desc: "आईपी पता, पोर्ट और समय से ग्राहक सत्र की पहचान करें।",
        what: "आज एक सार्वजनिक आईपी पता अनेक ग्राहकों में साझा होता है, इसलिए अकेला पता किसी की पहचान नहीं करता। स्रोत पोर्ट और सेकंड तक का सटीक समय भी आवश्यक है। यह टूल जाँचता है कि अनुरोध में तीनों हैं या नहीं, और सही शब्दावली प्रस्तुत करता है।",
        need: ["प्लेटफ़ॉर्म से मिला आईपी पता, पोर्ट और समय", "या ऑपरेटर से मिली आईपीडीआर फ़ाइल"],
        steps: ["ऊपर आईपी, पोर्ट और समय भरें",
                "चुनें कि समय UTC में है या IST में. यही ग़लती केस बिगाड़ती है",
                "Check दबाकर चेतावनियाँ पढ़ें",
                "माँग-पत्र का मसौदा कॉपी करें"] }
    },

    smshdr: {
      en: { name: "Fraud SMS Checker",
        desc: "Verify a commercial SMS sender ID against the TRAI DLT format and extract its links.",
        what: "Registered commercial SMS in India uses a sender identifier of a fixed form under TRAI rules. This tool checks a message against that form. It also extracts any links and flags the wording patterns typical of fraudulent messages.",
        need: ["A screenshot or the exact text of the SMS", "The sender ID as shown on the phone"],
        steps: ["Type the sender ID exactly as it appears, e.g. VM-SBIINB",
                "Paste the message text without changing it",
                "Press Analyse and read the red boxes",
                "Do not open any of the extracted links on a police computer"] },
      hi: { name: "फ़र्ज़ी एसएमएस जाँच",
        desc: "व्यावसायिक एसएमएस प्रेषक आईडी को ट्राई डीएलटी प्रारूप से मिलाएँ और लिंक निकालें।",
        what: "भारत में पंजीकृत व्यावसायिक एसएमएस ट्राई नियमों के अंतर्गत निश्चित रूप वाले प्रेषक पहचानकर्ता का प्रयोग करते हैं। यह टूल संदेश को उसी रूप से मिलाकर जाँचता है। यह संदेश में मौजूद लिंक भी निकालता है और धोखाधड़ी वाले संदेशों में सामान्यतः पाई जाने वाली शब्दावली चिह्नित करता है।",
        need: ["एसएमएस का स्क्रीनशॉट या हूबहू पाठ", "फ़ोन पर दिख रही भेजने वाले की आईडी"],
        steps: ["भेजने वाले की आईडी हूबहू लिखें, जैसे VM-SBIINB",
                "संदेश का पाठ बिना बदले पेस्ट करें",
                "Analyse दबाकर लाल बॉक्स पढ़ें",
                "निकाले गए लिंक पुलिस कंप्यूटर पर बिलकुल न खोलें"] }
    },

    tower: {
      en: { name: "Tower Dump Comparison",
        desc: "Compare tower dumps from several locations to identify handsets present at all of them.",
        what: "A tower dump lists every handset near a tower during a period. Most belong to uninvolved persons. The data becomes useful only on comparison. This tool reports the handsets present at every location supplied.",
        need: ["Tower dumps for two or more locations, one file each"],
        steps: ["Drop all the dump files together",
                "Read 'At EVERY location', that is the narrowed list",
                "Requisition the CAF and CDR for each of those numbers",
                "Remember: being in the sector is not being at the address"] },
      hi: { name: "टावर डंप तुलना",
        desc: "कई स्थानों के टावर डंप मिलाकर हर स्थान पर उपस्थित हैंडसेट पहचानें।",
        what: "टावर डंप में उस अवधि के दौरान टावर के निकट रहे प्रत्येक हैंडसेट की सूची होती है। अधिकांश असंबद्ध व्यक्तियों के होते हैं। यह आँकड़ा केवल तुलना करने पर उपयोगी बनता है। यह टूल बताता है कि कौन से हैंडसेट दिए गए सभी स्थानों पर उपस्थित थे।",
        need: ["दो या अधिक स्थानों के टावर डंप, हर स्थान की अलग फ़ाइल"],
        steps: ["सभी डंप फ़ाइलें एक साथ छोड़ें",
                "'At EVERY location' पढ़ें. वही छँटी हुई सूची है",
                "उन नंबरों की CAF और सीडीआर माँगें",
                "याद रखें: सेक्टर में होना उस पते पर होना नहीं है"] }
    },

    cellspyder: {
      en: { name: "Cell Tower Finder",
        desc: "Resolve cell identities to site locations and plot sector coverage.",
        what: "A call detail record identifies towers by cell identity. This tool converts those identities into locations using the operator's own site list. It also shows the direction each antenna faced, which narrows the area where the handset was present.",
        need: ["Cell IDs from a CDR", "The cell site list the operator sent with the CDR"],
        steps: ["Load the site list once, it is remembered afterwards",
                "Paste your cell IDs and press Look up",
                "Read the wedge direction on the map",
                "Export as KML and open it in Google Earth for a real map"] },
      hi: { name: "सेल टावर खोज",
        desc: "सेल पहचान से साइट स्थान ज्ञात करें और सेक्टर कवरेज दर्शाएँ।",
        what: "कॉल डिटेल रिकॉर्ड में टावर की पहचान सेल पहचान द्वारा होती है। यह टूल ऑपरेटर की अपनी साइट सूची का प्रयोग कर उन पहचानों को स्थानों में बदलता है। यह प्रत्येक एंटीना की दिशा भी दर्शाता है, जिससे हैंडसेट की उपस्थिति का क्षेत्र और सीमित हो जाता है।",
        need: ["सीडीआर से मिली सेल आईडी", "सीडीआर के साथ ऑपरेटर से मिली सेल साइट सूची"],
        steps: ["साइट सूची एक बार लोड करें. आगे याद रहेगी",
                "अपनी सेल आईडी पेस्ट करके Look up दबाएँ",
                "नक़्शे पर कोण (wedge) की दिशा देखें",
                "KML में निर्यात कर Google Earth में असली नक़्शे पर खोलें"] }
    },

    ifsc: {
      en: { name: "Bank Branch (IFSC) Lookup",
        desc: "Look up the bank, branch and district behind an IFSC code.",
        what: "Every bank branch has an 11-character IFSC. This tool reports the bank, branch, district and MICR code for that IFSC. That is the information required to address a notice. The branch is where the account was opened. It does not indicate where the account holder lives.",
        need: ["An IFSC code from a statement or a cheque"],
        steps: ["Paste the IFSC codes, one per line", "Press Look up",
                "Note: the branch is where the account was opened, not where the accused lives"] },
      hi: { name: "बैंक शाखा (IFSC) खोज",
        desc: "आईएफ़एससी कोड से बैंक, शाखा और ज़िला ज्ञात करें।",
        what: "प्रत्येक बैंक शाखा का 11 अक्षरों का आईएफ़एससी होता है। यह टूल उस आईएफ़एससी हेतु बैंक, शाखा, ज़िला और एमआईसीआर कोड बताता है। नोटिस भेजने के लिए यही सूचना आवश्यक है। शाखा वह स्थान है जहाँ खाता खोला गया था। यह नहीं बताती कि खाताधारक कहाँ रहता है।",
        need: ["स्टेटमेंट या चेक से मिला आईएफ़एससी कोड"],
        steps: ["आईएफ़एससी कोड हर पंक्ति में एक डालें", "Look up दबाएँ",
                "ध्यान दें: शाखा वह जगह है जहाँ खाता खुला, जहाँ आरोपी रहता है वह नहीं"] }
    },

    upi: {
      en: { name: "UPI ID Lookup",
        desc: "Identify the payment service provider bank behind a UPI address.",
        what: "A UPI address is not a name and not an account number. The part after the @ identifies the payment service provider bank. That bank is the institution on which notice must be served. It can then identify the underlying account and its KYC record.",
        need: ["A UPI ID from the complaint or a statement"],
        steps: ["Paste the UPI IDs", "Press Resolve",
                "Serve notice on the PSP bank shown",
                "If the part before @ is a mobile number, that is a strong lead, check it too"] },
      hi: { name: "यूपीआई आईडी खोज",
        desc: "यूपीआई पते के पीछे की भुगतान सेवा प्रदाता बैंक पहचानें।",
        what: "यूपीआई पता न नाम है और न खाता संख्या। @ के बाद का भाग भुगतान सेवा प्रदाता बैंक की पहचान कराता है। नोटिस उसी बैंक को दिया जाना चाहिए। वह बैंक फिर उससे जुड़े खाते और उसके केवाईसी अभिलेख की पहचान कर सकता है।",
        need: ["शिकायत या स्टेटमेंट से मिली यूपीआई आईडी"],
        steps: ["यूपीआई आईडी पेस्ट करें", "Resolve दबाएँ",
                "दिखाए गए पीएसपी बैंक को नोटिस दें",
                "यदि @ से पहले मोबाइल नंबर है तो वह बड़ा सुराग है. उसे भी जाँचें"] }
    },

    trail: {
      en: { name: "Bank Statement Analysis",
        desc: "Examine a bank statement for layering, mule-account behaviour and beneficiary concentration.",
        what: "Mule accounts follow a recognisable pattern. Funds are credited, then sent out within minutes in smaller amounts to several beneficiaries. The balance returns to almost nothing. This tool identifies that pattern, along with concentration of beneficiaries and activity outside normal hours.",
        need: ["One bank or wallet statement as a CSV file"],
        steps: ["Drop the statement file",
                "Read the red 'mule account' box if it appears",
                "Look at the Layering sequences, each one is money in and straight back out",
                "Take each beneficiary UPI ID to the UPI ID Lookup tool"] },
      hi: { name: "बैंक स्टेटमेंट विश्लेषण",
        desc: "बैंक विवरण में परत-दर-परत हस्तांतरण, म्यूल खाता व्यवहार और लाभार्थी संकेंद्रण जाँचें।",
        what: "म्यूल खातों का एक पहचानने योग्य प्रारूप होता है। राशि जमा होती है, फिर कुछ ही मिनटों में छोटी-छोटी रकमों में कई लाभार्थियों को भेज दी जाती है। शेष राशि लगभग शून्य पर लौट आती है। यह टूल उस प्रारूप के साथ-साथ लाभार्थियों का संकेंद्रण और असामान्य समय की गतिविधि भी पहचानता है।",
        need: ["एक बैंक या वॉलेट स्टेटमेंट, CSV रूप में"],
        steps: ["स्टेटमेंट फ़ाइल छोड़ें",
                "यदि लाल 'mule account' बॉक्स दिखे तो उसे पढ़ें",
                "Layering sequences देखें. हर एक में पैसा आकर तुरंत निकला है",
                "हर लाभार्थी यूपीआई आईडी को यूपीआई आईडी खोज में डालें"] }
    },

    moneytrail: {
      en: { name: "Money Trail Mapper",
        desc: "Reconcile multiple bank statements and reconstruct transfers by reference number.",
        what: "This tool accepts statements from several accounts. They may be from different banks and in different formats. It reduces them to a common structure. Transfers are reconstructed by matching the reference or UTR number that appears on both sides. Amounts alone are never matched, as that does not withstand scrutiny in court.",
        need: ["Two or more bank statements as CSV files"],
        steps: ["Drop all the statements together, or press the example button",
                "Open 'BS2BS transfers' to see the money flow diagram",
                "Every arrow is proved by a reference number shown in the table below it",
                "Download that table, it is your exhibit"] },
      hi: { name: "धन-प्रवाह मानचित्र",
        desc: "कई बैंक विवरण मिलाकर संदर्भ संख्या से हस्तांतरण पुनर्निर्मित करें।",
        what: "यह टूल कई खातों के विवरण स्वीकार करता है। वे भिन्न बैंकों के और भिन्न प्रारूपों में हो सकते हैं। यह उन्हें एक समान संरचना में लाता है। हस्तांतरण दोनों ओर दिखने वाली संदर्भ या यूटीआर संख्या मिलाकर पुनर्निर्मित किए जाते हैं। केवल राशि के आधार पर मिलान कभी नहीं किया जाता, क्योंकि वह न्यायालय में टिकता नहीं।",
        need: ["दो या अधिक बैंक स्टेटमेंट, CSV रूप में"],
        steps: ["सभी स्टेटमेंट एक साथ छोड़ें, या उदाहरण बटन दबाएँ",
                "धन-प्रवाह का चित्र देखने के लिए 'BS2BS transfers' खोलें",
                "हर तीर नीचे तालिका में दिखे रेफ़रेंस नंबर से सिद्ध है",
                "वह तालिका डाउनलोड करें. यही आपका प्रदर्श है"] }
    },

    hash: {
      en: { name: "File Hash & Certificate",
        desc: "Compute and verify cryptographic hashes of evidence files, and draft the certificate.",
        what: "A hash is a fingerprint of a file. It should be taken when the exhibit is first received and recorded in the seizure memo. If the file is later said to have been altered, the hash is computed again and compared. Matching values show the file is unchanged.",
        need: ["The evidence file itself"],
        steps: ["Drop the file in the box",
                "Copy the SHA-256 value into your seizure memo",
                "Fill the case details and press Generate for the certificate draft",
                "Re-check the same file before filing the chargesheet"] },
      hi: { name: "फ़ाइल हैश व प्रमाणपत्र",
        desc: "साक्ष्य फ़ाइलों का हैश निकालें, सत्यापित करें और प्रमाणपत्र तैयार करें।",
        what: "हैश किसी फ़ाइल की अंगुली-छाप है। इसे प्रदर्श प्राप्त होते ही लेना चाहिए और ज़ब्ती ज्ञापन में दर्ज करना चाहिए। यदि बाद में फ़ाइल बदले जाने का आरोप लगे, तो हैश दोबारा निकालकर मिलाया जाता है। मान समान हों तो फ़ाइल अपरिवर्तित है।",
        need: ["साक्ष्य फ़ाइल स्वयं"],
        steps: ["फ़ाइल बॉक्स में छोड़ें",
                "SHA-256 मान अपने पंचनामे में लिखें",
                "केस विवरण भरकर प्रमाणपत्र मसौदे के लिए Generate दबाएँ",
                "आरोप-पत्र दाख़िल करने से पहले वही फ़ाइल दोबारा जाँचें"] }
    },

    ip: {
      en: { name: "IP Address Check",
        desc: "Classify an IP address and retrieve its registration and abuse contact.",
        what: "Many IP addresses cannot be traced to any subscriber. This happens when thousands of users share one address, or when the address belongs to an anonymising service. This tool states which category an address falls into. Where the address is traceable, it names the network to which the requisition should be sent.",
        need: ["An IP address or a website name"],
        steps: ["Type the IP address or domain", "Press Analyse",
                "A red box means the address is private or shared and cannot identify one person",
                "Save the registration record before the website disappears"] },
      hi: { name: "आईपी पता जाँच",
        desc: "आईपी पते का वर्गीकरण करें और उसका पंजीकरण व दुरुपयोग संपर्क प्राप्त करें।",
        what: "अनेक आईपी पतों से किसी ग्राहक तक नहीं पहुँचा जा सकता। ऐसा तब होता है जब हज़ारों उपयोगकर्ता एक ही पता साझा करते हैं, या पता किसी गोपनीयता सेवा का हो। यह टूल बताता है कि पता किस श्रेणी में आता है। जहाँ पता खोजा जा सकता है, वहाँ यह उस नेटवर्क का नाम देता है जिसे माँग-पत्र भेजा जाना चाहिए।",
        need: ["एक आईपी पता या वेबसाइट का नाम"],
        steps: ["आईपी पता या डोमेन लिखें", "Analyse दबाएँ",
                "लाल बॉक्स का मतलब पता निजी या साझा है और एक व्यक्ति की पहचान नहीं कर सकता",
                "वेबसाइट हटने से पहले पंजीकरण रिकॉर्ड सहेज लें"] }
    },

    toll: {
      en: { name: "Toll Plaza Finder",
        desc: "Locate NHAI toll plazas by name, operator, radius or route, with site contacts.",
        what: "This tool shows the location and operating concessionaire of NHAI toll plazas. That is the information required to address a notice for CCTV preservation. It does not hold FASTag crossing records. Those require a separate requisition to NPCI or the concessionaire.",
        need: ["A route, or a coordinate"],
        steps: ["Choose 'Along a route' and enter start and end coordinates",
                "Note the operator and site contact for each plaza",
                "Copy the preservation notice at the bottom and send it today, plaza CCTV is deleted within days"] },
      hi: { name: "टोल प्लाज़ा खोज",
        desc: "एनएचएआई टोल प्लाज़ा नाम, संचालक, दूरी या मार्ग से खोजें, संपर्क सहित।",
        what: "यह टूल एनएचएआई टोल प्लाज़ा का स्थान और संचालक रियायतग्राही बताता है। सीसीटीवी संरक्षण हेतु नोटिस भेजने के लिए यही सूचना आवश्यक है। इसमें फ़ास्टैग आवागमन अभिलेख नहीं हैं। उनके लिए एनपीसीआई अथवा रियायतग्राही को अलग माँग-पत्र देना होता है।",
        need: ["एक मार्ग, या एक निर्देशांक"],
        steps: ["'Along a route' चुनकर आरंभ और अंत के निर्देशांक भरें",
                "हर प्लाज़ा का संचालक और साइट संपर्क नोट करें",
                "नीचे दिया सुरक्षा-नोटिस आज ही भेजें. प्लाज़ा सीसीटीवी कुछ दिनों में मिट जाता है"] }
    },

    geo: {
      en: { name: "Map & Distance Tool",
        desc: "Convert coordinate formats, measure distance and bearing, and export map files.",
        what: "Coordinates reach an investigator in several different notations. This tool converts between them. It measures distance and direction between points, and produces a file that opens in any mapping application.",
        need: ["Coordinates from a CDR, a tower list or a scene"],
        steps: ["Paste points as: label, latitude, longitude, one per line",
                "Press Process",
                "Press Export KML and open the file in Google Earth"] },
      hi: { name: "नक़्शा व दूरी उपकरण",
        desc: "निर्देशांक प्रारूप बदलें, दूरी व दिशा मापें और मानचित्र फ़ाइल निर्यात करें।",
        what: "निर्देशांक अन्वेषक तक कई भिन्न रूपों में पहुँचते हैं। यह टूल उनके बीच रूपांतरण करता है। यह बिंदुओं के बीच दूरी और दिशा मापता है, और ऐसी फ़ाइल बनाता है जो किसी भी मानचित्र ऐप में खुल जाती है।",
        need: ["सीडीआर, टावर सूची या घटनास्थल से मिले निर्देशांक"],
        steps: ["बिंदु ऐसे लिखें: नाम, अक्षांश, देशांतर. हर पंक्ति में एक",
                "Process दबाएँ",
                "Export KML दबाकर फ़ाइल Google Earth में खोलें"] }
    },

    ps: {
      en: { name: "Police Station Lookup",
        desc: "Locate a police station by state, district, name or proximity to a coordinate.",
        what: "This tool locates a police station by state, district, name, or distance from a given coordinate. It is used to settle questions of jurisdiction and to transfer a zero FIR to the station competent to investigate.",
        need: ["A district name, a station name, or a coordinate"],
        steps: ["Choose your state, then your district",
                "Or switch to 'Nearest station' and enter a coordinate",
                "Note: this list is incomplete in rural districts, a station missing here may still exist"] },
      hi: { name: "थाना खोज",
        desc: "राज्य, ज़िला, नाम या निर्देशांक के निकटता से थाना खोजें।",
        what: "यह टूल राज्य, ज़िला, नाम अथवा दिए गए निर्देशांक से दूरी के आधार पर थाना खोजता है। इसका प्रयोग क्षेत्राधिकार के प्रश्न सुलझाने और शून्य प्राथमिकी को सक्षम थाने को अंतरित करने में होता है।",
        need: ["ज़िले का नाम, थाने का नाम, या निर्देशांक"],
        steps: ["अपना राज्य चुनें, फिर ज़िला",
                "या 'Nearest station' पर जाकर निर्देशांक डालें",
                "ध्यान दें: ग्रामीण ज़िलों में यह सूची अधूरी है. यहाँ न दिखने का मतलब थाना नहीं है, ऐसा नहीं"] }
    },

    legal: {
      en: { name: "Which Law Applies",
        desc: "Reference table of the provision, authorising rank and retention period for each class of evidence.",
        what: "Two matters must be settled before evidence is sought: which provision authorises the request, and which rank may authorise it. This table gives both for each class of record. It also gives the period for which the holder keeps the record, which determines what must be requested first.",
        need: ["Nothing"],
        steps: ["Read the retention chart first, it tells you what to ask for today and what can wait",
                "Find your evidence type below",
                "Have your prosecution wing confirm the provision before you sign"] },
      hi: { name: "कौन सा कानून लागू है",
        desc: "प्रत्येक प्रकार के साक्ष्य हेतु प्रावधान, अधिकृत रैंक और प्रतिधारण अवधि की संदर्भ तालिका।",
        what: "साक्ष्य माँगने से पूर्व दो बातें तय होनी चाहिए: कौन सा प्रावधान अनुरोध की अनुमति देता है, और कौन सा पद उसे अधिकृत कर सकता है। यह तालिका प्रत्येक प्रकार के अभिलेख हेतु दोनों बताती है। यह वह अवधि भी बताती है जिस तक धारक अभिलेख रखता है, जिससे तय होता है कि पहले क्या माँगा जाए।",
        need: ["कुछ नहीं"],
        steps: ["पहले अवधारण-चार्ट पढ़ें. इससे पता चलेगा आज क्या माँगना है और क्या रुक सकता है",
                "नीचे अपना साक्ष्य-प्रकार खोजें",
                "हस्ताक्षर से पहले अभियोजन शाखा से धारा की पुष्टि कराएँ"] }
    },

    templates: {
      en: { name: "Notice Writer",
        desc: "Draft preservation notices and BNSS s.94 requisitions with the correct provisions.",
        what: "Requisitions are often returned unanswered. The usual reasons are an imprecise request or a missing detail the holder needs to locate the record. These drafts state the correct provision and the particulars required. They also include the certificate needed at trial.",
        need: ["FIR number and sections", "Name and address of the bank, operator or platform"],
        steps: ["Choose the type of notice at the top",
                "Fill in your case details",
                "Press Generate, then Copy or Download",
                "Check the rank required in your state before signing"] },
      hi: { name: "नोटिस लेखक",
        desc: "सही प्रावधानों सहित संरक्षण सूचना और बीएनएसएस धारा 94 माँग-पत्र तैयार करें।",
        what: "माँग-पत्र प्रायः अनुत्तरित लौट आते हैं। सामान्य कारण हैं अस्पष्ट अनुरोध अथवा वह विवरण छूट जाना जिसकी धारक को अभिलेख ढूँढ़ने हेतु आवश्यकता होती है। ये प्रारूप सही प्रावधान और अपेक्षित विवरण दर्ज करते हैं। इनमें विचारण के समय आवश्यक प्रमाणपत्र भी सम्मिलित है।",
        need: ["एफ़आईआर संख्या और धाराएँ", "बैंक, ऑपरेटर या प्लेटफ़ॉर्म का नाम-पता"],
        steps: ["ऊपर से नोटिस का प्रकार चुनें",
                "अपने केस का विवरण भरें",
                "Generate दबाएँ, फिर Copy या Download करें",
                "हस्ताक्षर से पहले अपने राज्य में निर्धारित रैंक देख लें"] }
    },

    nodal: {
      en: { name: "Nodal Officer Directory",
        desc: "Directory of nodal officers for banks, wallets, exchanges, service providers and police units.",
        what: "This directory holds the designated nodal officers for banks, payment applications, wallets, cryptocurrency exchanges, service providers and police units. It can be searched by name or by category. It gives the address to which a notice should be sent.",
        need: ["Nothing"],
        steps: ["Type the bank or app name in the search box",
                "Or press a category button such as Payment / Wallet",
                "Use the e-mail or phone shown. A blank means the official source has no value for that officer"] },
      hi: { name: "नोडल अधिकारी सूची",
        desc: "बैंक, वॉलेट, एक्सचेंज, सेवा प्रदाता और पुलिस इकाइयों के नोडल अधिकारियों की निर्देशिका।",
        what: "इस निर्देशिका में बैंक, भुगतान ऐप, वॉलेट, क्रिप्टोकरेंसी एक्सचेंज, सेवा प्रदाता और पुलिस इकाइयों के नामित नोडल अधिकारी हैं। इसे नाम अथवा श्रेणी से खोजा जा सकता है। यह वह पता देती है जहाँ नोटिस भेजा जाना चाहिए।",
        need: ["कुछ नहीं"],
        steps: ["खोज बॉक्स में बैंक या ऐप का नाम लिखें",
                "या Payment / Wallet जैसी श्रेणी का बटन दबाएँ",
                "दिया गया ई-मेल या फ़ोन इस्तेमाल करें। ख़ाली का मतलब सरकारी स्रोत में ही वह जानकारी नहीं है"] }
    },

    timeline: {
      en: { name: "Case Timeline Builder",
        desc: "Merge events from call, financial and case records into a single chronology.",
        what: "A chargesheet sets out a sequence of events. This tool accepts events from any source and keeps them in order. It records the source of each event. Events with no stated source are marked, as an event that cannot be proved does not belong in the final narrative.",
        need: ["Findings from your other tools, or your case notes"],
        steps: ["Add each event with its date, what happened, and where you got it from",
                "Always fill the Source field, an event you cannot prove does not belong in a chargesheet",
                "Press Export as narrative for a ready chronology"] },
      hi: { name: "केस समय-रेखा",
        desc: "कॉल, वित्तीय और केस अभिलेखों की घटनाओं को एक कालक्रम में संकलित करें।",
        what: "आरोप-पत्र घटनाओं का क्रम प्रस्तुत करता है। यह टूल किसी भी स्रोत से घटनाएँ लेकर उन्हें क्रम में रखता है। यह हर घटना का स्रोत दर्ज करता है। जिन घटनाओं का स्रोत नहीं दिया गया वे चिह्नित की जाती हैं, क्योंकि असिद्ध घटना अंतिम विवरण में नहीं जानी चाहिए।",
        need: ["आपके अन्य टूल से मिले निष्कर्ष, या केस नोट्स"],
        steps: ["हर घटना उसकी तारीख़, विवरण और स्रोत के साथ जोड़ें",
                "स्रोत ज़रूर भरें. जिस घटना को सिद्ध न कर सकें वह आरोप-पत्र में नहीं जानी चाहिए",
                "तैयार कालक्रम के लिए Export as narrative दबाएँ"] }
    },

    docid: {
      en: { name: "Document ID Checker",
        desc: "Identify an Indian document number and verify its structure and check digit.",
        what: "This tool identifies which type of document number has been entered and whether it is correctly formed. A GSTIN and a payment card number contain a check digit, so these can be verified in full. The tool cannot confirm whether a number was issued, or to whom.",
        need: ["Any identifier from the complaint, the FIR or a seized document"],
        steps: ["Paste the number, one per line if you have several",
                "Press Check",
                "Read the verdict. Checksum passes means the number is well-formed, not that it is real",
                "Use the Next line to see where the confirming record sits"] },
      hi: { name: "दस्तावेज़ पहचान जाँच",
        desc: "भारतीय दस्तावेज़ संख्या पहचानें और उसकी संरचना व जाँच-अंक सत्यापित करें।",
        what: "यह टूल पहचानता है कि दर्ज संख्या किस प्रकार के दस्तावेज़ की है और उसका रूप सही है या नहीं। जीएसटीआईएन और भुगतान कार्ड संख्या में जाँच-अंक होता है, अतः इनकी पूर्ण जाँच संभव है। यह टूल यह पुष्टि नहीं कर सकता कि संख्या जारी हुई थी या किसे जारी हुई थी।",
        need: ["शिकायत, प्राथमिकी या ज़ब्त दस्तावेज़ से कोई पहचान संख्या"],
        steps: ["संख्या डालें. कई हों तो हर पंक्ति में एक",
                "Check दबाएँ",
                "परिणाम पढ़ें. Checksum passes का अर्थ है रूप सही है, यह नहीं कि संख्या असली है",
                "पुष्टि कहाँ से होगी, यह Next पंक्ति में देखें"] }
    },

    cryptoaddr: {
      en: { name: "Crypto Address Checker",
        desc: "Identify the blockchain of a wallet address and verify its checksum.",
        what: "Investment and employment frauds often end at a cryptocurrency wallet address. This tool identifies the blockchain concerned. It also verifies the checksum contained in the address, which detects typing errors. Transaction history on public chains may be inspected without legal process. Identifying the account holder requires a notice to the exchange.",
        need: ["The wallet address from the complaint, copied and not retyped"],
        steps: ["Paste the address, one per line",
                "Press Check",
                "If the checksum fails, get the address again from the complainant. Do not correct it yourself",
                "Look the address up on the public explorer named in the result",
                "Use the Nodal Officer Directory to find the exchange to serve notice on"] },
      hi: { name: "क्रिप्टो पता जाँच",
        desc: "वॉलेट पते की ब्लॉकचेन पहचानें और उसका चेकसम सत्यापित करें।",
        what: "निवेश और रोज़गार संबंधी ठगी प्रायः किसी क्रिप्टोकरेंसी वॉलेट पते पर समाप्त होती है। यह टूल संबंधित ब्लॉकचेन की पहचान करता है। यह पते में निहित चेकसम भी जाँचता है, जिससे टंकण त्रुटि पकड़ी जाती है। सार्वजनिक ब्लॉकचेन का लेन-देन इतिहास बिना विधिक प्रक्रिया के देखा जा सकता है। खाताधारक की पहचान हेतु एक्सचेंज को नोटिस देना आवश्यक है।",
        need: ["शिकायत से वॉलेट पता, कॉपी किया हुआ, दोबारा टाइप किया नहीं"],
        steps: ["पता डालें, हर पंक्ति में एक",
                "Check दबाएँ",
                "जाँच विफल हो तो पता शिकायतकर्ता से दोबारा लें. स्वयं सुधार न करें",
                "परिणाम में दिए सार्वजनिक explorer पर पता देखें",
                "नोटिस किस एक्सचेंज को भेजना है, यह नोडल अधिकारी सूची में देखें"] }
    },

    photometa: {
      en: { name: "Photo Metadata Reader",
        desc: "Extract camera, timestamp and GPS metadata embedded in a photograph.",
        what: "A photograph taken on a camera or handset carries hidden details of the device, the time of capture and often the location. This tool extracts them. Where no such details are present, that is itself informative. Messaging and social platforms remove them, which indicates a forwarded copy rather than the original.",
        need: ["The photograph as a file, ideally taken straight off the device"],
        steps: ["Drop the photo on the box",
                "Read the camera, the date and the location",
                "If it says there is no metadata, ask the complainant to send the file as a document, not as a photo",
                "Hash the file with the File Hash tool and note the value before you do anything else"] },
      hi: { name: "फ़ोटो मेटाडेटा रीडर",
        desc: "फ़ोटो में अंतर्निहित कैमरा, समय और जीपीएस मेटाडेटा निकालें।",
        what: "कैमरे या हैंडसेट से ली गई फ़ोटो में उपकरण, खींचे जाने के समय और प्रायः स्थान का छिपा विवरण रहता है। यह टूल वह विवरण निकालता है। यदि ऐसा विवरण न मिले तो वह भी सूचनाप्रद है। संदेश और सोशल मंच यह विवरण हटा देते हैं, जिससे संकेत मिलता है कि यह मूल नहीं बल्कि आगे भेजी गई प्रति है।",
        need: ["फ़ोटो फ़ाइल के रूप में, बेहतर हो कि सीधे उपकरण से ली गई हो"],
        steps: ["फ़ोटो को बॉक्स पर छोड़ें",
                "कैमरा, तारीख़ और स्थान पढ़ें",
                "यदि मेटाडेटा न मिले तो शिकायतकर्ता से फ़ाइल को document के रूप में भेजने को कहें",
                "आगे कुछ करने से पहले File Hash टूल से फ़ाइल का हैश लेकर दर्ज करें"] }
    },

    filetype: {
      en: { name: "File Type Checker",
        desc: "Identify a file's true format from its contents rather than its extension.",
        what: "A file's extension is only a label and can be changed at any time. The opening bytes are written by the program that created the file and cannot be changed by renaming. This tool reads those bytes and reports the true format. It gives a clear warning where a file presented as a document or image is in fact a program.",
        need: ["Any file from the case: an attachment, a download, a seized copy"],
        steps: ["Drop one or more files on the box",
                "Read the Actually is line and compare it with Named as",
                "If it warns that the file is a program, do not open it. Send it to your forensics unit",
                "Note the finding, because a disguised file is itself evidence of intent"] },
      hi: { name: "फ़ाइल प्रकार जाँच",
        desc: "फ़ाइल का वास्तविक प्रारूप उसके नाम से नहीं, सामग्री से पहचानें।",
        what: "फ़ाइल का एक्सटेंशन केवल एक नाम है और कभी भी बदला जा सकता है। आरंभिक बाइट उस प्रोग्राम द्वारा लिखे जाते हैं जिसने फ़ाइल बनाई, और नाम बदलने से वे नहीं बदलते। यह टूल उन्हीं बाइट को पढ़कर वास्तविक प्रारूप बताता है। यदि दस्तावेज़ या चित्र के रूप में प्रस्तुत फ़ाइल वस्तुतः कोई प्रोग्राम हो, तो यह स्पष्ट चेतावनी देता है।",
        need: ["केस से जुड़ी कोई भी फ़ाइल: अनुलग्नक, डाउनलोड, या ज़ब्त प्रति"],
        steps: ["एक या अधिक फ़ाइलें बॉक्स पर छोड़ें",
                "Actually is और Named as की पंक्तियाँ मिलाकर देखें",
                "यदि चेतावनी मिले कि फ़ाइल एक प्रोग्राम है तो उसे न खोलें, फ़ॉरेंसिक इकाई को भेजें",
                "यह निष्कर्ष दर्ज करें, छिपाई गई फ़ाइल स्वयं मंशा का प्रमाण है"] }
    }
  }
};
