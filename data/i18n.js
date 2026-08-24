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
      guideToggle: "How to use this tool",
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
      guideToggle: "इस टूल का उपयोग कैसे करें",
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
        what: "Reads the delivery records in an email header to show the originating IP address and the results of sender authentication. The displayed sender name is easy to fake; the headers beneath it are not.",
        need: ["The raw headers of the email, exported by the complainant"],
        steps: ["Ask the complainant to open the mail and use Show original (Gmail) or Internet headers (Outlook)",
                "Paste everything into the box",
                "Press Analyse and read the red boxes first",
                "Take the originating IP to IP Address Check, then requisition the subscriber"] },
      hi: { name: "ईमेल हेडर विश्लेषण",
        desc: "ईमेल हेडर से वास्तविक प्रेषक और मूल आईपी पता ज्ञात करें।",
        what: "ईमेल हेडर के डिलीवरी रिकॉर्ड पढ़कर मूल आईपी पता और प्रेषक प्रमाणीकरण के परिणाम बताता है। दिखने वाला प्रेषक नाम आसानी से नकली बनाया जा सकता है; उसके नीचे के हेडर नहीं।",
        need: ["पीड़ित द्वारा निर्यात किए गए ईमेल के कच्चे हेडर"],
        steps: ["पीड़ित से कहें कि मेल खोलकर Show original (Gmail) या Internet headers (Outlook) चुनें",
                "पूरा पाठ बॉक्स में पेस्ट करें",
                "Analyse दबाएँ और पहले लाल बॉक्स पढ़ें",
                "मूल आईपी को आईपी पता जाँच में डालें, फिर ग्राहक विवरण माँगें"] }
    },

    time: {
      en: { name: "Timestamp Converter",
        desc: "Convert timestamps between epoch, UTC and IST.",
        what: "Converts timestamps between epoch, UTC and IST. Platforms log in UTC and Indian licensees log in IST, and missing the five-and-a-half hour difference shifts every event in the case.",
        need: ["A timestamp from a log, a platform reply or a complaint"],
        steps: ["Paste the timestamp",
                "Choose whether the source is UTC or IST",
                "Copy the IST line into your requisition and write IST next to it"] },
      hi: { name: "समय रूपांतरक",
        desc: "टाइमस्टैम्प को एपॉक, यूटीसी और भारतीय मानक समय के बीच बदलें।",
        what: "टाइमस्टैम्प को एपॉक, यूटीसी और आईएसटी के बीच बदलता है। प्लेटफ़ॉर्म यूटीसी में और भारतीय लाइसेंसधारी आईएसटी में लॉग रखते हैं, और साढ़े पाँच घंटे का अंतर चूकने पर केस की हर घटना खिसक जाती है।",
        need: ["किसी लॉग, प्लेटफ़ॉर्म उत्तर या शिकायत से मिला समय"],
        steps: ["समय पेस्ट करें",
                "चुनें कि स्रोत यूटीसी है या आईएसटी",
                "आईएसटी वाली पंक्ति माँग-पत्र में लिखें और साथ में IST ज़रूर लिखें"] }
    },

    decode: {
      en: { name: "Text Decoder",
        desc: "Decode encoded text and detect lookalike characters in domain names.",
        what: "Tries each common encoding and shows which one turns the text into something readable. It also flags web addresses built from lookalike characters, a common way of imitating bank and government sites.",
        need: ["Some encoded text, from an SMS, an email or a file"],
        steps: ["Paste the text", "Press Decode",
                "Read whichever result is legible, that was the encoding used",
                "If a red mixed-script warning appears, treat the domain as hostile"] },
      hi: { name: "पाठ डिकोडर",
        desc: "एन्कोड किया गया पाठ पढ़ें और डोमेन नाम में मिलते-जुलते अक्षर पहचानें।",
        what: "हर सामान्य एन्कोडिंग आज़माता है और बताता है कौन-सी पाठ को पठनीय बनाती है। ऐसे वेब पते भी चिह्नित करता है जो मिलते-जुलते अक्षरों से बने हों, जो बैंक और सरकारी साइटों की नकल का सामान्य तरीक़ा है।",
        need: ["एसएमएस, ईमेल या फ़ाइल से मिला कोई एन्कोडेड पाठ"],
        steps: ["पाठ पेस्ट करें", "Decode दबाएँ",
                "जो परिणाम पढ़ने योग्य हो वही असली एन्कोडिंग है",
                "लाल मिश्रित-लिपि चेतावनी दिखे तो डोमेन को संदिग्ध मानें"] }
    },

    mni: {
      en: { name: "Phone Number Check",
        desc: "Validate an Indian mobile number and generate every search format for it.",
        what: "Checks whether a number is a valid Indian mobile number and lists every format it could have been saved in. Those formats matter when searching a seized handset, where a contact stored in an unexpected form is easily missed.",
        need: ["A phone number from the complaint or the CDR"],
        steps: ["Type or paste the number, one per line if you have several",
                "Press Analyse",
                "Copy the search variants and use them when searching a seized phone",
                "Copy the ready-made notice text at the bottom for your requisition"] },
      hi: { name: "मोबाइल नंबर जाँच",
        desc: "भारतीय मोबाइल नंबर की वैधता जाँचें और उसके सभी खोज-प्रारूप बनाएँ।",
        what: "जाँचता है कि नंबर वैध भारतीय मोबाइल नंबर है या नहीं, और वे सभी प्रारूप बताता है जिनमें वह सहेजा गया हो सकता है। ज़ब्त हैंडसेट खोजते समय यह ज़रूरी है, जहाँ अप्रत्याशित रूप में सहेजा संपर्क आसानी से छूट जाता है।",
        need: ["शिकायत या सीडीआर से मिला मोबाइल नंबर"],
        steps: ["नंबर लिखें या पेस्ट करें. कई हों तो हर पंक्ति में एक",
                "Analyse दबाएँ",
                "खोज-रूप कॉपी करें और ज़ब्त फ़ोन में खोजते समय इस्तेमाल करें",
                "नीचे दिया तैयार नोटिस-मसौदा अपनी माँग-पत्र में लगाएँ"] }
    },

    tsp: {
      en: { name: "Operator & Circle Directory",
        desc: "The 22 licensed service areas and which operator works in each.",
        what: "Reference table of the twenty-two licensed service areas and the operators working in each. A requisition sent to the wrong service area is returned unanswered, often after several weeks.",
        need: ["Nothing, this is a reference list"],
        steps: ["Find the circle you need in the table", "Note that Delhi, Mumbai, Kolkata and Chennai are separate from their states"] },
      hi: { name: "ऑपरेटर व सर्किल सूची",
        desc: "22 लाइसेंस सेवा क्षेत्र और हर क्षेत्र में कौन-सा ऑपरेटर काम करता है।",
        what: "बाईस लाइसेंस सेवा क्षेत्रों और हर क्षेत्र में काम करने वाले ऑपरेटरों की संदर्भ तालिका। ग़लत सेवा क्षेत्र को भेजी अधियाचना बिना उत्तर लौट आती है, अक्सर कई सप्ताह बाद।",
        need: ["कुछ नहीं. यह केवल संदर्भ सूची है"],
        steps: ["तालिका में अपना सर्किल देखें", "ध्यान दें: दिल्ली, मुंबई, कोलकाता और चेन्नई अपने राज्यों से अलग सर्किल हैं"] }
    },

    mccmnc: {
      en: { name: "SIM Number (IMSI) Decoder",
        desc: "Decode an IMSI into its country, network and subscriber components.",
        what: "Splits an IMSI into its country, network and subscriber parts. The IMSI identifies the SIM, not the phone number or the person, and a foreign country code means the records sit outside India and need a different route.",
        need: ["An IMSI from a CDR or a seized phone"],
        steps: ["Paste the IMSI (usually 15 digits)", "Press Decode", "Check the country, a foreign country means a completely different evidence route"] },
      hi: { name: "सिम नंबर (IMSI) डिकोडर",
        desc: "आईएमएसआई को देश, नेटवर्क और ग्राहक भागों में विभाजित करें।",
        what: "आईएमएसआई को देश, नेटवर्क और ग्राहक भागों में बाँटता है। आईएमएसआई सिम की पहचान है, फ़ोन नंबर या व्यक्ति की नहीं, और विदेशी देश कोड का अर्थ है कि रिकॉर्ड भारत से बाहर हैं और अलग मार्ग चाहिए।",
        need: ["सीडीआर या ज़ब्त फ़ोन से मिला आईएमएसआई"],
        steps: ["आईएमएसआई पेस्ट करें (आमतौर पर 15 अंक)", "Decode दबाएँ", "देश देखें. विदेशी देश का मतलब बिलकुल अलग साक्ष्य प्रक्रिया"] }
    },

    caf: {
      en: { name: "SIM Form (CAF) Checker",
        desc: "Analyse customer acquisition forms for bulk-SIM and fraudulent-KYC patterns.",
        what: "Checks a set of SIM application forms together and flags three signs of bulk misuse: one ID document used for many connections, one retailer issuing all of them, and activations clustered into a short window. A single form rarely shows this; the set does.",
        need: ["The CAF export from the operator, as a CSV file"],
        steps: ["Drop the file in the box", "Look at the red boxes first, those are the repeated ID documents",
                "Note the Point of Sale code; that shop is a suspect too",
                "Download the flagged list for your case file"] },
      hi: { name: "सिम फ़ॉर्म (CAF) जाँच",
        desc: "ग्राहक आवेदन फ़ॉर्म में थोक-सिम और फ़र्ज़ी केवाईसी के प्रारूप जाँचें।",
        what: "कई सिम आवेदन फ़ॉर्म एक साथ जाँचता है और थोक दुरुपयोग के तीन संकेत बताता है: एक ही पहचान दस्तावेज़ पर कई कनेक्शन, सभी एक ही दुकान से जारी, और सक्रियण एक छोटी अवधि में एकत्र। अकेला फ़ॉर्म यह नहीं दिखाता, पूरा समूह दिखाता है।",
        need: ["ऑपरेटर से मिली CAF फ़ाइल, CSV रूप में"],
        steps: ["फ़ाइल बॉक्स में छोड़ें", "पहले लाल बॉक्स देखें. वही दोहराए गए पहचान-पत्र हैं",
                "पॉइंट ऑफ़ सेल कोड नोट करें; वह दुकान भी आरोपी है",
                "चिह्नित सूची अपने केस फ़ाइल के लिए डाउनलोड करें"] }
    },

    verhoeff: {
      en: { name: "Aadhaar Verifier",
        desc: "Check Aadhaar and VID numbers, singly or in bulk, and decode the Secure QR printed on a card.",
        what: "Checks the Verhoeff check digit on Aadhaar and VID numbers already in your case file, one at a time or in bulk from a CSV or PDF, and decodes the Secure QR on a card so it can be compared with what is printed. It never contacts UIDAI.",
        need: ["The number or the card already in your possession",
               "For the QR check, any phone scanner to read the code off the card"],
        steps: ["Type a number to test its check digit",
                "Or drop a CSV, text file or PDF to check every number in it at once",
                "Scan the card's QR with a phone and paste the digits it returns",
                "Type what is printed on the card, and the two are compared"] },
      hi: { name: "आधार सत्यापक",
        desc: "आधार और वीआईडी संख्याएँ एक-एक या थोक में जाँचें, और कार्ड पर छपा सुरक्षित क्यूआर पढ़ें।",
        what: "आपकी केस फ़ाइल में पहले से मौजूद आधार और वीआईडी संख्याओं पर वेरहोफ़ चेक डिजिट जाँचता है, एक-एक करके या सीएसवी/पीडीएफ़ से थोक में, और कार्ड का सुरक्षित क्यूआर पढ़ता है ताकि छपी जानकारी से मिलान हो सके। यह यूआईडीएआई से कभी संपर्क नहीं करता।",
        need: ["आपके पास पहले से मौजूद संख्या या कार्ड",
               "क्यूआर जाँच के लिए, कार्ड से कोड पढ़ने हेतु कोई भी फ़ोन स्कैनर"],
        steps: ["चेक डिजिट जाँचने के लिए संख्या टाइप करें",
                "या सीएसवी, टेक्स्ट फ़ाइल या पीडीएफ़ डालें और उसकी हर संख्या एक साथ जाँचें",
                "कार्ड का क्यूआर फ़ोन से स्कैन करें और लौटे अंक चिपकाएँ",
                "कार्ड पर छपी जानकारी टाइप करें, दोनों की तुलना हो जाएगी"] }
    },
    imei: {
      en: { name: "IMEI Check",
        desc: "Validate an IMEI and identify the handset make and model.",
        what: "Checks the fifteen-digit IMEI of a handset and identifies its make and model. A failed check means either a typing error or a handset reflashed with a false IMEI, which is an offence in itself.",
        need: ["An IMEI from a CDR, a seizure memo, or *#06# on the handset"],
        steps: ["Paste the IMEI numbers, one per line", "Press Analyse",
                "A red 'Luhn FAILS' badge means tampering or a typing error, check the seizure memo first",
                "For make and model, send KYM <IMEI> by SMS to 14422"] },
      hi: { name: "आईएमईआई जाँच",
        desc: "आईएमईआई की वैधता जाँचें और हैंडसेट का मेक व मॉडल पहचानें।",
        what: "हैंडसेट का पंद्रह अंकों का आईएमईआई जाँचता है और उसका मेक व मॉडल बताता है। जाँच विफल होने का अर्थ है या तो टंकण त्रुटि, या ऐसा हैंडसेट जिसमें झूठा आईएमईआई डाला गया है, जो स्वयं में अपराध है।",
        need: ["सीडीआर, ज़ब्ती पंचनामा, या फ़ोन पर *#06# से मिला आईएमईआई"],
        steps: ["आईएमईआई नंबर हर पंक्ति में एक डालें", "Analyse दबाएँ",
                "लाल 'Luhn FAILS' का मतलब छेड़छाड़ या टाइपिंग ग़लती. पहले पंचनामा मिलाएँ",
                "मेक-मॉडल के लिए 14422 पर KYM <IMEI> एसएमएस भेजें"] }
    },

    mac: {
      en: { name: "Wi-Fi / MAC Address Lookup",
        desc: "Resolve a hardware address to its registered manufacturer and detect randomised addresses.",
        what: "Identifies the manufacturer registered to a hardware address using the full IEEE registry, and flags randomised addresses. Modern phones show a different address to each network, and those identify no device at all.",
        need: ["A MAC address from a router log, CCTV DVR or Wi-Fi record"],
        steps: ["Paste the address in any format", "Press Look up",
                "If it says 'randomised address', stop, it cannot be traced to a phone"] },
      hi: { name: "वाई-फ़ाई / मैक पता खोज",
        desc: "हार्डवेयर पते से पंजीकृत निर्माता ज्ञात करें और यादृच्छिक पते पहचानें।",
        what: "पूर्ण आईईईई रजिस्ट्री से बताता है कि हार्डवेयर पता किस निर्माता के नाम पंजीकृत है, और यादृच्छिक पते चिह्नित करता है। आधुनिक फ़ोन हर नेटवर्क को अलग पता दिखाते हैं, और वे किसी उपकरण की पहचान नहीं कराते।",
        need: ["राउटर लॉग, सीसीटीवी डीवीआर या वाई-फ़ाई रिकॉर्ड से मैक पता"],
        steps: ["पता किसी भी रूप में पेस्ट करें", "Look up दबाएँ",
                "'randomised address' दिखे तो रुक जाइए. इससे फ़ोन नहीं पहचाना जा सकता"] }
    },

    ceir: {
      en: { name: "Stolen Phone (CEIR) Request",
        desc: "Prepare the CEIR request for blocking, unblocking or tracing a handset.",
        what: "Prepares the CEIR request used to block, unblock or trace a handset, including the police request that shows which SIM is in it now. Blocking a handset stops it producing any further evidence, so trace first.",
        need: ["The IMEI", "Your FIR number and sections"],
        steps: ["Enter the IMEI and case details", "Press Generate",
                "Get it countersigned at the rank your state requires",
                "Send through your State Police nodal officer, not the public portal"] },
      hi: { name: "चोरी फ़ोन (CEIR) अनुरोध",
        desc: "हैंडसेट को अवरुद्ध, पुनर्बहाल या ट्रेस करने हेतु सीईआईआर अनुरोध तैयार करें।",
        what: "हैंडसेट ब्लॉक, अनब्लॉक या ट्रेस करने का सीईआईआर अनुरोध तैयार करता है, साथ ही वह पुलिस अनुरोध जो बताता है कि अभी उसमें कौन-सा सिम है। ब्लॉक करने पर हैंडसेट आगे कोई साक्ष्य नहीं देता, इसलिए पहले ट्रेस करें।",
        need: ["आईएमईआई", "एफ़आईआर संख्या और धाराएँ"],
        steps: ["आईएमईआई और केस विवरण भरें", "Generate दबाएँ",
                "अपने राज्य के अनुसार निर्धारित रैंक से प्रतिहस्ताक्षर कराएँ",
                "राज्य पुलिस नोडल अधिकारी के माध्यम से भेजें, सार्वजनिक पोर्टल से नहीं"] }
    },

    cdr: {
      en: { name: "Call Records (CDR) Analysis",
        desc: "Analyse a call detail record for contacts, patterns, handset changes and tower usage.",
        what: "Reads a full call detail record and reports the most frequent contacts, calls outside normal hours, handset changes and the towers used. It reduces several thousand rows to the few that need attention.",
        need: ["The CDR file from the operator, as CSV or Excel-exported CSV"],
        steps: ["Drop the CDR file in the box",
                "Read the top four boxes, number of handsets is the one to notice",
                "If it says the SIM was used in more than one handset, look at the short-use one; that is often the crime phone",
                "Scroll to Contacts and look at the 00-05h column, not just the call count",
                "Download the contact list for your case diary"] },
      hi: { name: "कॉल रिकॉर्ड (CDR) विश्लेषण",
        desc: "कॉल डिटेल रिकॉर्ड से संपर्क, प्रारूप, हैंडसेट परिवर्तन और टावर उपयोग निकालें।",
        what: "पूरा कॉल डिटेल रिकॉर्ड पढ़ता है और सबसे अधिक संपर्क, सामान्य समय से बाहर की कॉल, हैंडसेट बदलाव और प्रयुक्त टावर बताता है। कई हज़ार पंक्तियों को घटाकर उन थोड़ी पंक्तियों तक लाता है जिन पर ध्यान चाहिए।",
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
        what: "Compares two or more call records and lists the numbers that appear in all of them. Two suspects who never call each other often share a third contact, and that number is usually worth pursuing.",
        need: ["Two or more CDR files, one per suspect"],
        steps: ["Drop all the CDR files together",
                "Look at 'Shared by ALL', those numbers are your priority",
                "Take each shared number back to Phone Number Check and requisition its CAF and CDR"] },
      hi: { name: "साझा संपर्क खोज",
        desc: "दो या अधिक जाँचाधीन व्यक्तियों द्वारा संपर्क किए गए साझा नंबर पहचानें।",
        what: "दो या अधिक कॉल रिकॉर्ड की तुलना करता है और वे नंबर बताता है जो सभी में मिलते हैं। जो दो संदिग्ध आपस में कभी बात नहीं करते, उनका अक्सर एक साझा तीसरा संपर्क होता है, और वही नंबर आमतौर पर काम का होता है।",
        need: ["दो या अधिक सीडीआर फ़ाइलें, हर आरोपी की एक"],
        steps: ["सभी सीडीआर फ़ाइलें एक साथ छोड़ें",
                "'Shared by ALL' देखें. वही नंबर प्राथमिकता हैं",
                "हर साझा नंबर को मोबाइल नंबर जाँच में डालें और उसकी CAF व सीडीआर माँगें"] }
    },

    ipdr: {
      en: { name: "Internet Records (IPDR) Analysis",
        desc: "Resolve an IP address, port and timestamp to a subscriber session.",
        what: "Confirms that an internet-record request carries all three details needed to identify a session: the public IP, the source port and the time to the second. One public address is shared by many subscribers, so the address alone identifies nobody.",
        need: ["The IP address, port and timestamp from the platform", "Or the IPDR file from the operator"],
        steps: ["Fill in IP, port and timestamp at the top",
                "Set whether the platform gave you UTC or IST, this is the mistake that ruins cases",
                "Press Check and read the warnings",
                "Copy the requisition text"] },
      hi: { name: "इंटरनेट रिकॉर्ड (IPDR) विश्लेषण",
        desc: "आईपी पता, पोर्ट और समय से ग्राहक सत्र की पहचान करें।",
        what: "जाँचता है कि इंटरनेट रिकॉर्ड अनुरोध में सत्र पहचानने के तीनों विवरण हैं: सार्वजनिक आईपी, स्रोत पोर्ट और सेकंड तक का समय। एक सार्वजनिक पता कई ग्राहकों में साझा होता है, इसलिए अकेला पता किसी की पहचान नहीं कराता।",
        need: ["प्लेटफ़ॉर्म से मिला आईपी पता, पोर्ट और समय", "या ऑपरेटर से मिली आईपीडीआर फ़ाइल"],
        steps: ["ऊपर आईपी, पोर्ट और समय भरें",
                "चुनें कि समय UTC में है या IST में. यही ग़लती केस बिगाड़ती है",
                "Check दबाकर चेतावनियाँ पढ़ें",
                "माँग-पत्र का मसौदा कॉपी करें"] }
    },

    smshdr: {
      en: { name: "Fraud SMS Checker",
        desc: "Verify a commercial SMS sender ID against the TRAI DLT format and extract its links.",
        what: "Checks a commercial SMS sender ID against the format required under the TRAI DLT rules, extracts any links in the message, and points out wording typical of fraud.",
        need: ["A screenshot or the exact text of the SMS", "The sender ID as shown on the phone"],
        steps: ["Type the sender ID exactly as it appears, e.g. VM-SBIINB",
                "Paste the message text without changing it",
                "Press Analyse and read the red boxes",
                "Do not open any of the extracted links on a police computer"] },
      hi: { name: "फ़र्ज़ी एसएमएस जाँच",
        desc: "व्यावसायिक एसएमएस प्रेषक आईडी को ट्राई डीएलटी प्रारूप से मिलाएँ और लिंक निकालें।",
        what: "वाणिज्यिक एसएमएस के प्रेषक आईडी को ट्राई डीएलटी नियमों के अपेक्षित प्रारूप से जाँचता है, संदेश के लिंक निकालता है, और धोखाधड़ी में सामान्य शब्दावली बताता है।",
        need: ["एसएमएस का स्क्रीनशॉट या हूबहू पाठ", "फ़ोन पर दिख रही भेजने वाले की आईडी"],
        steps: ["भेजने वाले की आईडी हूबहू लिखें, जैसे VM-SBIINB",
                "संदेश का पाठ बिना बदले पेस्ट करें",
                "Analyse दबाकर लाल बॉक्स पढ़ें",
                "निकाले गए लिंक पुलिस कंप्यूटर पर बिलकुल न खोलें"] }
    },

    tower: {
      en: { name: "Tower Dump Comparison",
        desc: "Compare tower dumps from several locations to identify handsets present at all of them.",
        what: "Compares tower dumps from several places and reports the handsets present at all of them. A single dump is mostly people with no connection to the case; the value comes from the overlap.",
        need: ["Tower dumps for two or more locations, one file each"],
        steps: ["Drop all the dump files together",
                "Read 'At EVERY location', that is the narrowed list",
                "Requisition the CAF and CDR for each of those numbers",
                "Remember: being in the sector is not being at the address"] },
      hi: { name: "टावर डंप तुलना",
        desc: "कई स्थानों के टावर डंप मिलाकर हर स्थान पर उपस्थित हैंडसेट पहचानें।",
        what: "कई स्थानों के टावर डंप की तुलना करता है और वे हैंडसेट बताता है जो सभी जगह मौजूद थे। अकेले डंप में अधिकतर ऐसे लोग होते हैं जिनका केस से कोई संबंध नहीं; काम की बात दोहराव से निकलती है।",
        need: ["दो या अधिक स्थानों के टावर डंप, हर स्थान की अलग फ़ाइल"],
        steps: ["सभी डंप फ़ाइलें एक साथ छोड़ें",
                "'At EVERY location' पढ़ें. वही छँटी हुई सूची है",
                "उन नंबरों की CAF और सीडीआर माँगें",
                "याद रखें: सेक्टर में होना उस पते पर होना नहीं है"] }
    },

    cellspyder: {
      en: { name: "Cell Tower Finder",
        desc: "Resolve cell identities to site locations and plot sector coverage.",
        what: "Converts the cell IDs in a call record into tower locations using the site list the operator supplied, and shows which way each antenna faced. That narrows where the handset actually was, not just which tower it used.",
        need: ["Cell IDs from a CDR", "The cell site list the operator sent with the CDR"],
        steps: ["Load the site list once, it is remembered afterwards",
                "Paste your cell IDs and press Look up",
                "Read the wedge direction on the map",
                "Export as KML and open it in Google Earth for a real map"] },
      hi: { name: "सेल टावर खोज",
        desc: "सेल पहचान से साइट स्थान ज्ञात करें और सेक्टर कवरेज दर्शाएँ।",
        what: "कॉल रिकॉर्ड की सेल आईडी को ऑपरेटर द्वारा दी गई साइट सूची से टावर स्थानों में बदलता है, और बताता है कि हर एंटीना किस दिशा में था। इससे यह सँकरा होता है कि हैंडसेट वास्तव में कहाँ था, केवल यह नहीं कि किस टावर से जुड़ा था।",
        need: ["सीडीआर से मिली सेल आईडी", "सीडीआर के साथ ऑपरेटर से मिली सेल साइट सूची"],
        steps: ["साइट सूची एक बार लोड करें. आगे याद रहेगी",
                "अपनी सेल आईडी पेस्ट करके Look up दबाएँ",
                "नक़्शे पर कोण (wedge) की दिशा देखें",
                "KML में निर्यात कर Google Earth में असली नक़्शे पर खोलें"] }
    },

    ifsc: {
      en: { name: "Bank Branch (IFSC) Lookup",
        desc: "Look up the bank, branch and district behind an IFSC code.",
        what: "Gives the bank, branch, district and MICR code for any IFSC, which is what a notice has to be addressed to. The branch is where the account was opened, not where the account holder lives.",
        need: ["An IFSC code from a statement or a cheque"],
        steps: ["Paste the IFSC codes, one per line", "Press Look up",
                "Note: the branch is where the account was opened, not where the accused lives"] },
      hi: { name: "बैंक शाखा (IFSC) खोज",
        desc: "आईएफ़एससी कोड से बैंक, शाखा और ज़िला ज्ञात करें।",
        what: "किसी भी आईएफ़एससी के लिए बैंक, शाखा, ज़िला और एमआईसीआर कोड देता है, जिस पर नोटिस भेजा जाना होता है। शाखा वह जगह है जहाँ खाता खोला गया, वह नहीं जहाँ खाताधारक रहता है।",
        need: ["स्टेटमेंट या चेक से मिला आईएफ़एससी कोड"],
        steps: ["आईएफ़एससी कोड हर पंक्ति में एक डालें", "Look up दबाएँ",
                "ध्यान दें: शाखा वह जगह है जहाँ खाता खुला, जहाँ आरोपी रहता है वह नहीं"] }
    },

    upi: {
      en: { name: "UPI ID Lookup",
        desc: "Identify the payment service provider bank behind a UPI address.",
        what: "Identifies the payment service provider bank behind a UPI address, which is the institution a notice must be served on. That bank can then trace the underlying account and its KYC record.",
        need: ["A UPI ID from the complaint or a statement"],
        steps: ["Paste the UPI IDs", "Press Resolve",
                "Serve notice on the PSP bank shown",
                "If the part before @ is a mobile number, that is a strong lead, check it too"] },
      hi: { name: "यूपीआई आईडी खोज",
        desc: "यूपीआई पते के पीछे की भुगतान सेवा प्रदाता बैंक पहचानें।",
        what: "यूपीआई पते के पीछे की भुगतान सेवा प्रदाता बैंक बताता है, जिसी संस्था पर नोटिस तामील करना होता है। वही बैंक फिर अंतर्निहित खाता और उसका केवाईसी रिकॉर्ड निकाल सकता है।",
        need: ["शिकायत या स्टेटमेंट से मिली यूपीआई आईडी"],
        steps: ["यूपीआई आईडी पेस्ट करें", "Resolve दबाएँ",
                "दिखाए गए पीएसपी बैंक को नोटिस दें",
                "यदि @ से पहले मोबाइल नंबर है तो वह बड़ा सुराग है. उसे भी जाँचें"] }
    },

    trail: {
      en: { name: "Bank Statement Analysis",
        desc: "Examine a bank statement for layering, mule-account behaviour and beneficiary concentration.",
        what: "Examines a bank statement for the mule pattern: money credited, then sent out within a short time in smaller amounts to several beneficiaries, leaving almost no balance. It also reports beneficiary concentration and activity outside normal hours.",
        need: ["One bank or wallet statement as a CSV file"],
        steps: ["Drop the statement file",
                "Read the red 'mule account' box if it appears",
                "Look at the Layering sequences, each one is money in and straight back out",
                "Take each beneficiary UPI ID to the UPI ID Lookup tool"] },
      hi: { name: "बैंक स्टेटमेंट विश्लेषण",
        desc: "बैंक विवरण में परत-दर-परत हस्तांतरण, म्यूल खाता व्यवहार और लाभार्थी संकेंद्रण जाँचें।",
        what: "बैंक विवरण में म्यूल पैटर्न देखता है: पैसा जमा होता है, फिर थोड़े समय में छोटी-छोटी राशियों में कई लाभार्थियों को भेज दिया जाता है और शेष लगभग शून्य रह जाता है। लाभार्थियों का जमाव और सामान्य समय से बाहर की गतिविधि भी बताता है।",
        need: ["एक बैंक या वॉलेट स्टेटमेंट, CSV रूप में"],
        steps: ["स्टेटमेंट फ़ाइल छोड़ें",
                "यदि लाल 'mule account' बॉक्स दिखे तो उसे पढ़ें",
                "Layering sequences देखें. हर एक में पैसा आकर तुरंत निकला है",
                "हर लाभार्थी यूपीआई आईडी को यूपीआई आईडी खोज में डालें"] }
    },

    moneytrail: {
      en: { name: "Money Trail Mapper",
        desc: "Reconcile multiple bank statements and reconstruct transfers by reference number.",
        what: "Brings statements from several accounts and banks into one common format, then matches transfers using the reference or UTR that appears on both sides. It does not match on amount alone, which does not stand up in court.",
        need: ["Two or more bank statements as CSV files"],
        steps: ["Drop all the statements together, or press the example button",
                "Open 'BS2BS transfers' to see the money flow diagram",
                "Every arrow is proved by a reference number shown in the table below it",
                "Download that table, it is your exhibit"] },
      hi: { name: "धन-प्रवाह मानचित्र",
        desc: "कई बैंक विवरण मिलाकर संदर्भ संख्या से हस्तांतरण पुनर्निर्मित करें।",
        what: "कई खातों और बैंकों के विवरण एक समान प्रारूप में लाता है, फिर दोनों ओर दिखने वाले संदर्भ या यूटीआर से हस्तांतरण मिलाता है। केवल राशि से मिलान नहीं करता, जो अदालत में नहीं टिकता।",
        need: ["दो या अधिक बैंक स्टेटमेंट, CSV रूप में"],
        steps: ["सभी स्टेटमेंट एक साथ छोड़ें, या उदाहरण बटन दबाएँ",
                "धन-प्रवाह का चित्र देखने के लिए 'BS2BS transfers' खोलें",
                "हर तीर नीचे तालिका में दिखे रेफ़रेंस नंबर से सिद्ध है",
                "वह तालिका डाउनलोड करें. यही आपका प्रदर्श है"] }
    },

    hash: {
      en: { name: "File Hash & Certificate",
        desc: "Compute and verify cryptographic hashes of evidence files, and draft the certificate.",
        what: "Calculates the hash of an exhibit file, which works as its fingerprint, and drafts the certificate for the record. Recomputing it later and getting the same value shows the file has not been altered.",
        need: ["The evidence file itself"],
        steps: ["Drop the file in the box",
                "Copy the SHA-256 value into your seizure memo",
                "Fill the case details and press Generate for the certificate draft",
                "Re-check the same file before filing the chargesheet"] },
      hi: { name: "फ़ाइल हैश व प्रमाणपत्र",
        desc: "साक्ष्य फ़ाइलों का हैश निकालें, सत्यापित करें और प्रमाणपत्र तैयार करें।",
        what: "प्रदर्श फ़ाइल का हैश निकालता है, जो उसकी अंगुली-छाप की तरह काम करता है, और रिकॉर्ड हेतु प्रमाणपत्र का मसौदा बनाता है। बाद में वही मान दोबारा आने पर सिद्ध होता है कि फ़ाइल बदली नहीं गई।",
        need: ["साक्ष्य फ़ाइल स्वयं"],
        steps: ["फ़ाइल बॉक्स में छोड़ें",
                "SHA-256 मान अपने पंचनामे में लिखें",
                "केस विवरण भरकर प्रमाणपत्र मसौदे के लिए Generate दबाएँ",
                "आरोप-पत्र दाख़िल करने से पहले वही फ़ाइल दोबारा जाँचें"] }
    },

    ip: {
      en: { name: "IP Address Check",
        desc: "Classify an IP address and retrieve its registration and abuse contact.",
        what: "Shows whether an IP address can be traced to a subscriber at all, since many are shared or belong to anonymising services, and names the network the requisition should go to.",
        need: ["An IP address or a website name"],
        steps: ["Type the IP address or domain", "Press Analyse",
                "A red box means the address is private or shared and cannot identify one person",
                "Save the registration record before the website disappears"] },
      hi: { name: "आईपी पता जाँच",
        desc: "आईपी पते का वर्गीकरण करें और उसका पंजीकरण व दुरुपयोग संपर्क प्राप्त करें।",
        what: "बताता है कि आईपी पता किसी ग्राहक तक पहुँचाया भी जा सकता है या नहीं, क्योंकि कई साझा होते हैं या गुमनामी सेवाओं के होते हैं, और वह नेटवर्क बताता है जिसे अधियाचना भेजनी है।",
        need: ["एक आईपी पता या वेबसाइट का नाम"],
        steps: ["आईपी पता या डोमेन लिखें", "Analyse दबाएँ",
                "लाल बॉक्स का मतलब पता निजी या साझा है और एक व्यक्ति की पहचान नहीं कर सकता",
                "वेबसाइट हटने से पहले पंजीकरण रिकॉर्ड सहेज लें"] }
    },

    toll: {
      en: { name: "Toll Plaza Finder",
        desc: "Locate NHAI toll plazas by name, operator, radius or route, with site contacts.",
        what: "Gives the location and operating concessionaire of NHAI toll plazas, which is what a CCTV preservation notice has to be addressed to. It holds no FASTag crossing records; those need a separate requisition to NPCI or the concessionaire.",
        need: ["A route, or a coordinate"],
        steps: ["Choose 'Along a route' and enter start and end coordinates",
                "Note the operator and site contact for each plaza",
                "Copy the preservation notice at the bottom and send it today, plaza CCTV is deleted within days"] },
      hi: { name: "टोल प्लाज़ा खोज",
        desc: "एनएचएआई टोल प्लाज़ा नाम, संचालक, दूरी या मार्ग से खोजें, संपर्क सहित।",
        what: "एनएचएआई टोल प्लाज़ा का स्थान और संचालक रियायतग्राही बताता है, जिस पर सीसीटीवी परिरक्षण नोटिस भेजा जाना होता है। इसमें फ़ास्टैग क्रॉसिंग रिकॉर्ड नहीं हैं; उनके लिए एनपीसीआई या रियायतग्राही को अलग अधियाचना चाहिए।",
        need: ["एक मार्ग, या एक निर्देशांक"],
        steps: ["'Along a route' चुनकर आरंभ और अंत के निर्देशांक भरें",
                "हर प्लाज़ा का संचालक और साइट संपर्क नोट करें",
                "नीचे दिया सुरक्षा-नोटिस आज ही भेजें. प्लाज़ा सीसीटीवी कुछ दिनों में मिट जाता है"] }
    },

    geo: {
      en: { name: "Map & Distance Tool",
        desc: "Convert coordinate formats, measure distance and bearing, and export map files.",
        what: "Converts coordinates between the formats they arrive in, measures the distance and bearing between points, and exports them as a file that any map application can open.",
        need: ["Coordinates from a CDR, a tower list or a scene"],
        steps: ["Paste points as: label, latitude, longitude, one per line",
                "Press Process",
                "Press Export KML and open the file in Google Earth"] },
      hi: { name: "नक़्शा व दूरी उपकरण",
        desc: "निर्देशांक प्रारूप बदलें, दूरी व दिशा मापें और मानचित्र फ़ाइल निर्यात करें।",
        what: "निर्देशांक जिस-जिस प्रारूप में आते हैं उनके बीच बदलता है, बिंदुओं के बीच दूरी और दिशा मापता है, और उन्हें ऐसी फ़ाइल में निर्यात करता है जो किसी भी मानचित्र ऐप में खुल जाए।",
        need: ["सीडीआर, टावर सूची या घटनास्थल से मिले निर्देशांक"],
        steps: ["बिंदु ऐसे लिखें: नाम, अक्षांश, देशांतर. हर पंक्ति में एक",
                "Process दबाएँ",
                "Export KML दबाकर फ़ाइल Google Earth में खोलें"] }
    },

    ps: {
      en: { name: "Police Station Lookup",
        desc: "Locate a police station by state, district, name or proximity to a coordinate.",
        what: "Finds a police station by state, district, name, or distance from a coordinate. Use it to settle jurisdiction and to route a zero FIR to the station that has to investigate.",
        need: ["A district name, a station name, or a coordinate"],
        steps: ["Choose your state, then your district",
                "Or switch to 'Nearest station' and enter a coordinate",
                "Note: this list is incomplete in rural districts, a station missing here may still exist"] },
      hi: { name: "थाना खोज",
        desc: "राज्य, ज़िला, नाम या निर्देशांक के निकटता से थाना खोजें।",
        what: "राज्य, ज़िला, नाम या किसी निर्देशांक से दूरी के आधार पर थाना खोजता है। क्षेत्राधिकार तय करने और ज़ीरो एफ़आईआर उस थाने भेजने के लिए उपयोग करें जिसे अन्वेषण करना है।",
        need: ["ज़िले का नाम, थाने का नाम, या निर्देशांक"],
        steps: ["अपना राज्य चुनें, फिर ज़िला",
                "या 'Nearest station' पर जाकर निर्देशांक डालें",
                "ध्यान दें: ग्रामीण ज़िलों में यह सूची अधूरी है. यहाँ न दिखने का मतलब थाना नहीं है, ऐसा नहीं"] }
    },

    legal: {
      en: { name: "Which Law Applies",
        desc: "Which law applies to each kind of evidence, who can authorise it, and how long it is kept.",
        what: "Sets out, for each kind of record, the provision to request it under, the rank that can authorise the request, and how long the holder keeps it. The retention period decides what has to be asked for first.",
        need: ["Nothing"],
        steps: ["Read the retention chart first, it tells you what to ask for today and what can wait",
                "Find your evidence type below",
                "Have your prosecution wing confirm the provision before you sign"] },
      hi: { name: "कौन सा कानून लागू है",
        desc: "किस साक्ष्य पर कौन-सा क़ानून लागू है, कौन अधिकृत कर सकता है, और वह कितने समय रखा जाता है।",
        what: "हर प्रकार के रिकॉर्ड के लिए बताता है कि अनुरोध किस धारा के अंतर्गत होगा, कौन-सा पद उसे अधिकृत कर सकता है, और धारक उसे कितने समय रखता है। यही अवधि तय करती है कि सबसे पहले क्या माँगना है।",
        need: ["कुछ नहीं"],
        steps: ["पहले अवधारण-चार्ट पढ़ें. इससे पता चलेगा आज क्या माँगना है और क्या रुक सकता है",
                "नीचे अपना साक्ष्य-प्रकार खोजें",
                "हस्ताक्षर से पहले अभियोजन शाखा से धारा की पुष्टि कराएँ"] }
    },

    templates: {
      en: { name: "Notice Writer",
        desc: "Draft preservation notices and BNSS s.94 requisitions with the correct provisions.",
        what: "Drafts preservation notices and BNSS s.94 requisitions with the correct provision, the details the holder needs to locate the record, and the certificate required at trial. Most requisitions fail because one of those was left out.",
        need: ["FIR number and sections", "Name and address of the bank, operator or platform"],
        steps: ["Choose the type of notice at the top",
                "Fill in your case details",
                "Press Generate, then Copy or Download",
                "Check the rank required in your state before signing"] },
      hi: { name: "नोटिस लेखक",
        desc: "सही प्रावधानों सहित संरक्षण सूचना और बीएनएसएस धारा 94 माँग-पत्र तैयार करें।",
        what: "सही धारा, रिकॉर्ड खोजने हेतु धारक को आवश्यक विवरण, और मुक़दमे में अपेक्षित प्रमाणपत्र के साथ परिरक्षण नोटिस और बीएनएसएस धारा 94 की अधियाचना का मसौदा बनाता है। अधिकतर अधियाचनाएँ इन्हीं में से कुछ छूट जाने से विफल होती हैं।",
        need: ["एफ़आईआर संख्या और धाराएँ", "बैंक, ऑपरेटर या प्लेटफ़ॉर्म का नाम-पता"],
        steps: ["ऊपर से नोटिस का प्रकार चुनें",
                "अपने केस का विवरण भरें",
                "Generate दबाएँ, फिर Copy या Download करें",
                "हस्ताक्षर से पहले अपने राज्य में निर्धारित रैंक देख लें"] }
    },

    nodal: {
      en: { name: "Nodal Officer Directory",
        desc: "Directory of nodal officers for banks, wallets, exchanges, service providers and police units.",
        what: "Directory of nodal officers for banks, payment apps, wallets, exchanges, service providers and police units, searchable by name or category. It gives the address a notice should be sent to.",
        need: ["Nothing"],
        steps: ["Type the bank or app name in the search box",
                "Or press a category button such as Payment / Wallet",
                "Use the e-mail or phone shown. A blank means the official source has no value for that officer"] },
      hi: { name: "नोडल अधिकारी सूची",
        desc: "बैंक, वॉलेट, एक्सचेंज, सेवा प्रदाता और पुलिस इकाइयों के नोडल अधिकारियों की निर्देशिका।",
        what: "बैंकों, भुगतान ऐप, वॉलेट, एक्सचेंज, सेवा प्रदाताओं और पुलिस इकाइयों के नोडल अधिकारियों की निर्देशिका, नाम या श्रेणी से खोजी जा सकती है। यह वह पता देती है जिस पर नोटिस भेजा जाना चाहिए।",
        need: ["कुछ नहीं"],
        steps: ["खोज बॉक्स में बैंक या ऐप का नाम लिखें",
                "या Payment / Wallet जैसी श्रेणी का बटन दबाएँ",
                "दिया गया ई-मेल या फ़ोन इस्तेमाल करें। ख़ाली का मतलब सरकारी स्रोत में ही वह जानकारी नहीं है"] }
    },

    timeline: {
      en: { name: "Case Timeline Builder",
        desc: "Merge events from call, financial and case records into a single chronology.",
        what: "Collects events from call records, bank statements and your own notes into one chronology, keeping the source of each. Events with no source are marked, because an event that cannot be proved does not belong in the final narrative.",
        need: ["Findings from your other tools, or your case notes"],
        steps: ["Add each event with its date, what happened, and where you got it from",
                "Always fill the Source field, an event you cannot prove does not belong in a chargesheet",
                "Press Export as narrative for a ready chronology"] },
      hi: { name: "केस समय-रेखा",
        desc: "कॉल, वित्तीय और केस अभिलेखों की घटनाओं को एक कालक्रम में संकलित करें।",
        what: "कॉल रिकॉर्ड, बैंक विवरण और आपके अपने नोट्स की घटनाओं को एक कालक्रम में जोड़ता है, हर एक का स्रोत रखते हुए। बिना स्रोत की घटनाएँ चिह्नित होती हैं, क्योंकि जो घटना सिद्ध न हो सके वह अंतिम विवरण में नहीं आती।",
        need: ["आपके अन्य टूल से मिले निष्कर्ष, या केस नोट्स"],
        steps: ["हर घटना उसकी तारीख़, विवरण और स्रोत के साथ जोड़ें",
                "स्रोत ज़रूर भरें. जिस घटना को सिद्ध न कर सकें वह आरोप-पत्र में नहीं जानी चाहिए",
                "तैयार कालक्रम के लिए Export as narrative दबाएँ"] }
    },

    docid: {
      en: { name: "Document ID Checker",
        desc: "Identify an Indian document number and verify its structure and check digit.",
        what: "Identifies which kind of Indian document number has been entered and checks that it is correctly formed. GSTIN and card numbers carry a check digit and can be fully verified. It cannot confirm that a number was actually issued, or to whom.",
        need: ["Any identifier from the complaint, the FIR or a seized document"],
        steps: ["Paste the number, one per line if you have several",
                "Press Check",
                "Read the verdict. Checksum passes means the number is well-formed, not that it is real",
                "Use the Next line to see where the confirming record sits"] },
      hi: { name: "दस्तावेज़ पहचान जाँच",
        desc: "भारतीय दस्तावेज़ संख्या पहचानें और उसकी संरचना व जाँच-अंक सत्यापित करें।",
        what: "बताता है कि दर्ज संख्या किस प्रकार का भारतीय दस्तावेज़ नंबर है और वह सही ढंग से बनी है या नहीं। जीएसटीआईएन और कार्ड नंबर में चेक डिजिट होता है, इसलिए वे पूरी तरह जाँचे जा सकते हैं। यह पुष्टि नहीं कर सकता कि संख्या वास्तव में जारी हुई थी, या किसे।",
        need: ["शिकायत, प्राथमिकी या ज़ब्त दस्तावेज़ से कोई पहचान संख्या"],
        steps: ["संख्या डालें. कई हों तो हर पंक्ति में एक",
                "Check दबाएँ",
                "परिणाम पढ़ें. Checksum passes का अर्थ है रूप सही है, यह नहीं कि संख्या असली है",
                "पुष्टि कहाँ से होगी, यह Next पंक्ति में देखें"] }
    },

    cryptoaddr: {
      en: { name: "Crypto Address Checker",
        desc: "Identify the blockchain of a wallet address and verify its checksum.",
        what: "Identifies which blockchain a wallet address belongs to and verifies the checksum inside it, which catches typing errors before a notice goes out. Transactions are public; the account holder's identity has to come from the exchange.",
        need: ["The wallet address from the complaint, copied and not retyped"],
        steps: ["Paste the address, one per line",
                "Press Check",
                "If the checksum fails, get the address again from the complainant. Do not correct it yourself",
                "Look the address up on the public explorer named in the result",
                "Use the Nodal Officer Directory to find the exchange to serve notice on"] },
      hi: { name: "क्रिप्टो पता जाँच",
        desc: "वॉलेट पते की ब्लॉकचेन पहचानें और उसका चेकसम सत्यापित करें।",
        what: "बताता है कि वॉलेट पता किस ब्लॉकचेन का है और उसमें निहित चेकसम जाँचता है, जिससे नोटिस भेजने से पहले टंकण त्रुटि पकड़ी जाती है। लेन-देन सार्वजनिक हैं; खाताधारक की पहचान एक्सचेंज से ही मिलेगी।",
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
        what: "Extracts the camera, capture time and often the GPS location stored inside a photograph. Finding none is itself useful: messaging and social platforms strip this out, so a bare file is a forwarded copy rather than the original.",
        need: ["The photograph as a file, ideally taken straight off the device"],
        steps: ["Drop the photo on the box",
                "Read the camera, the date and the location",
                "If it says there is no metadata, ask the complainant to send the file as a document, not as a photo",
                "Hash the file with the File Hash tool and note the value before you do anything else"] },
      hi: { name: "फ़ोटो मेटाडेटा रीडर",
        desc: "फ़ोटो में अंतर्निहित कैमरा, समय और जीपीएस मेटाडेटा निकालें।",
        what: "तस्वीर के भीतर संग्रहीत कैमरा, खींचने का समय और अक्सर जीपीएस स्थान निकालता है। कुछ न मिलना भी काम का है: मैसेजिंग और सोशल प्लेटफ़ॉर्म इसे हटा देते हैं, इसलिए खाली फ़ाइल मूल नहीं, अग्रेषित प्रति है।",
        need: ["फ़ोटो फ़ाइल के रूप में, बेहतर हो कि सीधे उपकरण से ली गई हो"],
        steps: ["फ़ोटो को बॉक्स पर छोड़ें",
                "कैमरा, तारीख़ और स्थान पढ़ें",
                "यदि मेटाडेटा न मिले तो शिकायतकर्ता से फ़ाइल को document के रूप में भेजने को कहें",
                "आगे कुछ करने से पहले File Hash टूल से फ़ाइल का हैश लेकर दर्ज करें"] }
    },

    filetype: {
      en: { name: "File Type Checker",
        desc: "Identify a file's true format from its contents rather than its extension.",
        what: "Reads the first bytes of a file, which the program that created it writes, and reports what the file actually is. This catches a program renamed to look like a document or a photograph.",
        need: ["Any file from the case: an attachment, a download, a seized copy"],
        steps: ["Drop one or more files on the box",
                "Read the Actually is line and compare it with Named as",
                "If it warns that the file is a program, do not open it. Send it to your forensics unit",
                "Note the finding, because a disguised file is itself evidence of intent"] },
      hi: { name: "फ़ाइल प्रकार जाँच",
        desc: "फ़ाइल का वास्तविक प्रारूप उसके नाम से नहीं, सामग्री से पहचानें।",
        what: "फ़ाइल की पहली बाइट पढ़ता है, जो उसे बनाने वाला प्रोग्राम लिखता है, और बताता है कि फ़ाइल वास्तव में क्या है। इससे वह प्रोग्राम पकड़ में आता है जिसका नाम बदलकर उसे दस्तावेज़ या तस्वीर जैसा दिखाया गया हो।",
        need: ["केस से जुड़ी कोई भी फ़ाइल: अनुलग्नक, डाउनलोड, या ज़ब्त प्रति"],
        steps: ["एक या अधिक फ़ाइलें बॉक्स पर छोड़ें",
                "Actually is और Named as की पंक्तियाँ मिलाकर देखें",
                "यदि चेतावनी मिले कि फ़ाइल एक प्रोग्राम है तो उसे न खोलें, फ़ॉरेंसिक इकाई को भेजें",
                "यह निष्कर्ष दर्ज करें, छिपाई गई फ़ाइल स्वयं मंशा का प्रमाण है"] }
    },

    linkfinder: {
      en: { name: "Entity Link Finder",
        desc: "Load every file in a case and find the identifiers that appear in more than one.",
        what: "Reads every file in a case, pulls out the identifiers it recognises, and lists those appearing in more than one file. A value shared between two sources is a lead to be explained, not proof in itself.",
        need: ["Two or more files from the same case, as CSV or text"],
        steps: ["Drop all the case files together",
                "Read the rows where the source count equals the number of files first",
                "Establish what each shared value is before treating it as a connection",
                "Download the table for the case record"] },
      hi: { name: "पहचान संबंध खोजक",
        desc: "प्रकरण की सभी फ़ाइलें लोड कर वे पहचान ज्ञात करें जो एक से अधिक में मिलती हैं।",
        what: "केस की हर फ़ाइल पढ़ता है, पहचाने जाने वाले पहचानकर्ता निकालता है, और वे बताता है जो एक से अधिक फ़ाइल में मिलें। दो स्रोतों में साझा मान एक सुराग है जिसे समझाना होगा, स्वयं में प्रमाण नहीं।",
        need: ["एक ही प्रकरण की दो या अधिक फ़ाइलें, सीएसवी अथवा पाठ रूप में"],
        steps: ["प्रकरण की सभी फ़ाइलें एक साथ छोड़ें",
                "पहले वे पंक्तियाँ पढ़ें जिनमें स्रोत संख्या कुल फ़ाइलों के बराबर है",
                "किसी साझा मान को संबंध मानने से पूर्व यह स्थापित करें कि वह मान है क्या",
                "प्रकरण अभिलेख हेतु तालिका डाउनलोड करें"] }
    },

    chat: {
      en: { name: "Chat Export Analyser",
        desc: "Read an exported chat into a record of who spoke, when, and what the export left out.",
        what: "Turns a chat export into a summary: who took part, how many messages, over what period, which identifiers were mentioned and at what hours. It also flags missing media and deleted messages, both of which change what the export can prove.",
        need: ["The .txt file produced by the Export chat function, taken with media"],
        steps: ["Drop the exported file on the box",
                "Read the media and deletion warnings before anything else",
                "Put every link through the Text Decoder before opening any of it",
                "Take the numbers and UPI addresses found here into the other tools"] },
      hi: { name: "चैट निर्यात विश्लेषण",
        desc: "निर्यात की गई चैट को पढ़कर जानें किसने कब क्या कहा, और निर्यात में क्या छूट गया।",
        what: "चैट एक्सपोर्ट को सारांश में बदलता है: कौन शामिल थे, कितने संदेश, किस अवधि में, कौन-से पहचानकर्ता उल्लिखित हुए और किन घंटों में। छूटा मीडिया और हटाए गए संदेश भी बताता है, दोनों बदलते हैं कि एक्सपोर्ट क्या सिद्ध कर सकता है।",
        need: ["Export chat से बनी .txt फ़ाइल, मीडिया सहित"],
        steps: ["निर्यात फ़ाइल बॉक्स पर छोड़ें",
                "सबसे पहले मीडिया तथा विलोपन संबंधी चेतावनियाँ पढ़ें",
                "कोई भी लिंक खोलने से पूर्व उसे Text Decoder में जाँचें",
                "यहाँ मिले नंबर व यूपीआई पते अन्य टूल में ले जाएँ"] }
    },

    canary: {
      en: { name: "Investigative Tracer Link",
        desc: "Generate a link that records the IP, device and time when a person of interest opens it.",
        what: "Creates a link that records the IP address, device, browser and exact time when someone opens it. The IP and the exact time are what an internet provider needs to identify the subscriber. No camera and no microphone are used, and location is asked for through the browser's own prompt.",
        need: ["The capture server running on a host the person's device can reach",
               "Your unit's authority to deploy a tracer against this person"],
        steps: ["Start the toolkit with the Start Sutra shortcut, which runs the capture server for you",
                "Generate a link and note its token",
                "Send the link through your normal channel",
                "Pull the captured visits and take the IP and time to IP Address Check"] },
      hi: { name: "अन्वेषण ट्रेसर लिंक",
        desc: "ऐसा लिंक बनाएँ जो खोले जाने पर आईपी, उपकरण और समय दर्ज कर ले।",
        what: "ऐसा लिंक बनाता है जो खोले जाने पर आईपी पता, उपकरण, ब्राउज़र और यथार्थ समय दर्ज करता है। आईपी और यथार्थ समय वही हैं जो इंटरनेट प्रदाता को ग्राहक पहचानने के लिए चाहिए। कैमरा और माइक्रोफ़ोन का उपयोग नहीं होता, और स्थान ब्राउज़र की अपनी अनुमति से ही माँगा जाता है।",
        need: ["कैप्चर सर्वर ऐसे होस्ट पर चलता हुआ जहाँ व्यक्ति का उपकरण पहुँच सके",
               "इस व्यक्ति के विरुद्ध ट्रेसर लगाने का इकाई का अधिकार"],
        steps: ["Start Sutra शॉर्टकट से टूलकिट चालू करें, यह कैप्चर सर्वर स्वयं चला देता है",
                "लिंक बनाएँ और उसका टोकन नोट करें",
                "लिंक अपने सामान्य माध्यम से भेजें",
                "कैप्चर की गई विज़िट खींचें और आईपी व समय को IP Address Check में ले जाएँ"] }
    },
    enhance: {
      en: { name: "CCTV Image Enhancer",
        desc: "Recover readable detail from a blurred or dark CCTV still without inventing anything.",
        what: "Recovers detail already present in the pixels: it registers several frames to a fraction of a pixel and rebuilds them on a finer grid, reverses focus or movement blur, squares up a plate seen at an angle, and lifts local contrast. It adds nothing that was not recorded, and logs every step so the result can be reproduced from the original file.",
        need: ["The original still or video frame at full resolution, not a screen photograph or a forwarded copy",
               "Ideally several consecutive frames of the same scene"],
        steps: ["Load the still, or several frames of the same scene together",
                "Drag a box over the number plate, face or object that must be read",
                "Start with a preset, then adjust while watching the focus score",
                "Save the enhanced image and the processing log together into the case file"] },
      hi: { name: "सीसीटीवी छवि सुधारक",
        desc: "धुँधली या अँधेरी सीसीटीवी तस्वीर से पढ़ने योग्य विवरण निकालें, बिना कुछ गढ़े।",
        what: "पिक्सेल में पहले से मौजूद विवरण निकालता है: कई फ़्रेम को पिक्सेल के अंश तक मिलाकर बारीक ग्रिड पर फिर से बनाता है, फ़ोकस या गति की धुँधलाहट उलटता है, तिरछी दिखने वाली नंबर प्लेट को सीधा करता है, और स्थानीय कंट्रास्ट बढ़ाता है। जो दर्ज नहीं हुआ वह कुछ नहीं जोड़ता, और हर चरण लॉग करता है ताकि मूल फ़ाइल से वही परिणाम दोबारा बनाया जा सके।",
        need: ["पूर्ण रिज़ॉल्यूशन में मूल स्थिर चित्र या वीडियो फ़्रेम, स्क्रीन की तस्वीर या अग्रेषित प्रति नहीं",
               "यथासंभव एक ही दृश्य के कई लगातार फ़्रेम"],
        steps: ["स्थिर चित्र लोड करें, या एक ही दृश्य के कई फ़्रेम एक साथ",
                "नंबर प्लेट, चेहरे या वस्तु पर बॉक्स खींचें",
                "किसी प्रीसेट से शुरू करें, फिर फ़ोकस स्कोर देखते हुए समायोजित करें",
                "सुधारी गई छवि और प्रोसेसिंग लॉग दोनों केस फ़ाइल में सहेजें"] }
    }
  }
};
