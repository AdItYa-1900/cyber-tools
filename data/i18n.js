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
        what: "The sender name displayed on an electronic mail message can be falsified with ease, whereas the delivery records recorded beneath it cannot. This tool parses those records and reports the originating IP address, the results of sender authentication, and the indicators commonly associated with forgery.",
        need: ["The raw headers of the email, exported by the complainant"],
        steps: ["Ask the complainant to open the mail and use Show original (Gmail) or Internet headers (Outlook)",
                "Paste everything into the box",
                "Press Analyse and read the red boxes first",
                "Take the originating IP to IP Address Check, then requisition the subscriber"] },
      hi: { name: "ईमेल हेडर विश्लेषण",
        desc: "ईमेल हेडर से वास्तविक प्रेषक और मूल आईपी पता ज्ञात करें।",
        what: "ईमेल संदेश पर प्रदर्शित प्रेषक का नाम सरलता से बदला जा सकता है, किंतु उसके नीचे अंकित डिलीवरी अभिलेख नहीं बदले जा सकते। यह टूल उन अभिलेखों का विश्लेषण कर मूल आईपी पता, प्रेषक प्रमाणीकरण का परिणाम तथा जालसाज़ी से संबद्ध सामान्य संकेतक प्रस्तुत करता है।",
        need: ["पीड़ित द्वारा निर्यात किए गए ईमेल के कच्चे हेडर"],
        steps: ["पीड़ित से कहें कि मेल खोलकर Show original (Gmail) या Internet headers (Outlook) चुनें",
                "पूरा पाठ बॉक्स में पेस्ट करें",
                "Analyse दबाएँ और पहले लाल बॉक्स पढ़ें",
                "मूल आईपी को आईपी पता जाँच में डालें, फिर ग्राहक विवरण माँगें"] }
    },

    time: {
      en: { name: "Timestamp Converter",
        desc: "Convert timestamps between epoch, UTC and IST.",
        what: "Web platforms generally record time in Coordinated Universal Time, whereas Indian licensees record it in Indian Standard Time. The two differ by five hours and thirty minutes, and any confusion between them displaces every event in the case by that interval. This tool converts between the two and presents the value in the form required for a requisition.",
        need: ["A timestamp from a log, a platform reply or a complaint"],
        steps: ["Paste the timestamp",
                "Choose whether the source is UTC or IST",
                "Copy the IST line into your requisition and write IST next to it"] },
      hi: { name: "समय रूपांतरक",
        desc: "टाइमस्टैम्प को एपॉक, यूटीसी और भारतीय मानक समय के बीच बदलें।",
        what: "वेब प्लेटफ़ॉर्म सामान्यतः समय समन्वित सार्वभौमिक समय में अंकित करते हैं, जबकि भारतीय लाइसेंसधारी उसे भारतीय मानक समय में अंकित करते हैं। दोनों में पाँच घंटे तीस मिनट का अंतर है, और इनके बीच किसी भ्रम से प्रकरण की प्रत्येक घटना उतने ही अंतराल से विस्थापित हो जाती है। यह टूल दोनों के बीच रूपांतरण कर मान को माँग-पत्र हेतु अपेक्षित रूप में प्रस्तुत करता है।",
        need: ["किसी लॉग, प्लेटफ़ॉर्म उत्तर या शिकायत से मिला समय"],
        steps: ["समय पेस्ट करें",
                "चुनें कि स्रोत यूटीसी है या आईएसटी",
                "आईएसटी वाली पंक्ति माँग-पत्र में लिखें और साथ में IST ज़रूर लिखें"] }
    },

    decode: {
      en: { name: "Text Decoder",
        desc: "Decode encoded text and detect lookalike characters in domain names.",
        what: "Fraudulent links conceal their content behind a limited number of standard encodings. This tool applies each encoding in turn and reports which of them yields readable text. It further identifies domain names composed of characters visually similar to ordinary letters, a technique employed to imitate genuine banking and government websites.",
        need: ["Some encoded text, from an SMS, an email or a file"],
        steps: ["Paste the text", "Press Decode",
                "Read whichever result is legible, that was the encoding used",
                "If a red mixed-script warning appears, treat the domain as hostile"] },
      hi: { name: "पाठ डिकोडर",
        desc: "एन्कोड किया गया पाठ पढ़ें और डोमेन नाम में मिलते-जुलते अक्षर पहचानें।",
        what: "कपटपूर्ण लिंक अपनी सामग्री कुछ सीमित मानक एन्कोडिंग विधियों के पीछे छिपाते हैं। यह टूल प्रत्येक विधि क्रमशः लागू कर बताता है कि किससे पठनीय पाठ प्राप्त हुआ। यह ऐसे डोमेन नामों की भी पहचान करता है जो सामान्य अक्षरों से दृष्टिगत रूप से मिलते-जुलते वर्णों से बने होते हैं, जिस तकनीक का प्रयोग वास्तविक बैंकिंग एवं सरकारी वेबसाइटों की नक़ल हेतु किया जाता है।",
        need: ["एसएमएस, ईमेल या फ़ाइल से मिला कोई एन्कोडेड पाठ"],
        steps: ["पाठ पेस्ट करें", "Decode दबाएँ",
                "जो परिणाम पढ़ने योग्य हो वही असली एन्कोडिंग है",
                "लाल मिश्रित-लिपि चेतावनी दिखे तो डोमेन को संदिग्ध मानें"] }
    },

    mni: {
      en: { name: "Phone Number Check",
        desc: "Validate an Indian mobile number and generate every search format for it.",
        what: "This tool verifies whether a number constitutes a valid Indian mobile number and enumerates every format in which that number may have been stored. These formats are required when examining a seized handset, where a contact saved in an unanticipated form would otherwise escape detection.",
        need: ["A phone number from the complaint or the CDR"],
        steps: ["Type or paste the number, one per line if you have several",
                "Press Analyse",
                "Copy the search variants and use them when searching a seized phone",
                "Copy the ready-made notice text at the bottom for your requisition"] },
      hi: { name: "मोबाइल नंबर जाँच",
        desc: "भारतीय मोबाइल नंबर की वैधता जाँचें और उसके सभी खोज-प्रारूप बनाएँ।",
        what: "यह टूल सत्यापित करता है कि कोई संख्या वैध भारतीय मोबाइल नंबर है अथवा नहीं, तथा उन समस्त प्रारूपों की सूची देता है जिनमें वह संख्या संग्रहीत की गई हो सकती है। ज़ब्तशुदा हैंडसेट की जाँच में ये प्रारूप आवश्यक होते हैं, क्योंकि अप्रत्याशित रूप में संग्रहीत संपर्क अन्यथा जाँच से छूट जाता है।",
        need: ["शिकायत या सीडीआर से मिला मोबाइल नंबर"],
        steps: ["नंबर लिखें या पेस्ट करें. कई हों तो हर पंक्ति में एक",
                "Analyse दबाएँ",
                "खोज-रूप कॉपी करें और ज़ब्त फ़ोन में खोजते समय इस्तेमाल करें",
                "नीचे दिया तैयार नोटिस-मसौदा अपनी माँग-पत्र में लगाएँ"] }
    },

    tsp: {
      en: { name: "Operator & Circle Directory",
        desc: "Reference table of the 22 licensed service areas and the operators in each.",
        what: "India is divided into twenty-two licensed service areas. Each operator holds a separate licence for every area and maintains its records accordingly. A requisition addressed to the incorrect service area is returned unanswered, frequently after a delay of several weeks. This table sets out which area covers which territory.",
        need: ["Nothing, this is a reference list"],
        steps: ["Find the circle you need in the table", "Note that Delhi, Mumbai, Kolkata and Chennai are separate from their states"] },
      hi: { name: "ऑपरेटर व सर्किल सूची",
        desc: "22 लाइसेंस प्राप्त सेवा क्षेत्र और उनमें कार्यरत ऑपरेटरों की संदर्भ तालिका।",
        what: "भारत बाईस लाइसेंस प्राप्त सेवा क्षेत्रों में विभाजित है। प्रत्येक ऑपरेटर प्रत्येक क्षेत्र हेतु पृथक लाइसेंस धारण करता है तथा अभिलेख तदनुसार रखता है। अशुद्ध सेवा क्षेत्र को संबोधित माँग-पत्र अनुत्तरित लौट आता है, प्रायः कई सप्ताह के विलंब के उपरांत। यह तालिका दर्शाती है कि कौन सा क्षेत्र किस भूभाग को समाहित करता है।",
        need: ["कुछ नहीं. यह केवल संदर्भ सूची है"],
        steps: ["तालिका में अपना सर्किल देखें", "ध्यान दें: दिल्ली, मुंबई, कोलकाता और चेन्नई अपने राज्यों से अलग सर्किल हैं"] }
    },

    mccmnc: {
      en: { name: "SIM Number (IMSI) Decoder",
        desc: "Decode an IMSI into its country, network and subscriber components.",
        what: "The IMSI identifies the SIM card. It is neither the telephone number nor an identifier of the subscriber. This tool separates the IMSI into its country, network and subscriber components. A foreign country code indicates that the records are held outside India and that a different procedure is required.",
        need: ["An IMSI from a CDR or a seized phone"],
        steps: ["Paste the IMSI (usually 15 digits)", "Press Decode", "Check the country, a foreign country means a completely different evidence route"] },
      hi: { name: "सिम नंबर (IMSI) डिकोडर",
        desc: "आईएमएसआई को देश, नेटवर्क और ग्राहक भागों में विभाजित करें।",
        what: "आईएमएसआई सिम कार्ड की पहचान करता है। यह न तो दूरभाष संख्या है और न ही ग्राहक का पहचानकर्ता। यह टूल आईएमएसआई को उसके देश, नेटवर्क तथा ग्राहक घटकों में पृथक करता है। विदेशी देश कोड यह दर्शाता है कि अभिलेख भारत के बाहर संधारित हैं तथा भिन्न प्रक्रिया अपेक्षित है।",
        need: ["सीडीआर या ज़ब्त फ़ोन से मिला आईएमएसआई"],
        steps: ["आईएमएसआई पेस्ट करें (आमतौर पर 15 अंक)", "Decode दबाएँ", "देश देखें. विदेशी देश का मतलब बिलकुल अलग साक्ष्य प्रक्रिया"] }
    },

    caf: {
      en: { name: "SIM Form (CAF) Checker",
        desc: "Analyse customer acquisition forms for bulk-SIM and fraudulent-KYC patterns.",
        what: "An individual customer acquisition form is of limited evidentiary value. Indicators of organised misuse emerge only when a body of forms is examined collectively. This tool identifies three such indicators: a single identity document used to obtain multiple connections, a common point of sale issuing all of them, and connections activated within the same narrow interval.",
        need: ["The CAF export from the operator, as a CSV file"],
        steps: ["Drop the file in the box", "Look at the red boxes first, those are the repeated ID documents",
                "Note the Point of Sale code; that shop is a suspect too",
                "Download the flagged list for your case file"] },
      hi: { name: "सिम फ़ॉर्म (CAF) जाँच",
        desc: "ग्राहक आवेदन फ़ॉर्म में थोक-सिम और फ़र्ज़ी केवाईसी के प्रारूप जाँचें।",
        what: "एकल ग्राहक आवेदन फ़ॉर्म का साक्ष्य-मूल्य सीमित होता है। संगठित दुरुपयोग के संकेतक तभी उभरते हैं जब अनेक फ़ॉर्मों की सामूहिक जाँच की जाए। यह टूल ऐसे तीन संकेतक चिह्नित करता है: एक ही पहचान दस्तावेज़ से अनेक कनेक्शन प्राप्त किया जाना, उन सबका एक ही विक्रय केंद्र से निर्गत होना, तथा उनका एक ही अल्प अंतराल में सक्रिय किया जाना।",
        need: ["ऑपरेटर से मिली CAF फ़ाइल, CSV रूप में"],
        steps: ["फ़ाइल बॉक्स में छोड़ें", "पहले लाल बॉक्स देखें. वही दोहराए गए पहचान-पत्र हैं",
                "पॉइंट ऑफ़ सेल कोड नोट करें; वह दुकान भी आरोपी है",
                "चिह्नित सूची अपने केस फ़ाइल के लिए डाउनलोड करें"] }
    },

    verhoeff: {
      en: { name: "Aadhaar Number Verifier",
        desc: "Verify the check digit of an Aadhaar number. It cannot confirm the number was issued.",
        what: "This page demonstrates the Verhoeff check-digit algorithm using synthetic numbers. It does not communicate with UIDAI and cannot establish whether a number has been issued or to whom.",
        need: ["Nothing"],
        steps: ["Press Generate to make practice numbers", "Type one in to see the check pass",
                "Change one digit and watch it fail"] },
      hi: { name: "आधार संख्या सत्यापक",
        desc: "आधार संख्या का जाँच-अंक सत्यापित करें। यह पुष्टि नहीं कर सकता कि संख्या निर्गत हुई है।",
        what: "यह पृष्ठ कृत्रिम संख्याओं के माध्यम से वेरहॉफ़ जाँच-अंक विधि का प्रदर्शन करता है। यह यूआईडीएआई से संपर्क नहीं करता तथा यह स्थापित नहीं कर सकता कि कोई संख्या निर्गत हुई है अथवा किसे निर्गत हुई है।",
        need: ["कुछ नहीं"],
        steps: ["अभ्यास संख्याएँ बनाने के लिए Generate दबाएँ", "एक संख्या डालकर जाँच सफल होते देखें",
                "एक अंक बदलिए और जाँच विफल होते देखिए"] }
    },

    imei: {
      en: { name: "IMEI Check",
        desc: "Validate an IMEI and identify the handset make and model.",
        what: "Every handset carries a fifteen-digit IMEI incorporating a check digit. A fabricated number will ordinarily fail this verification. Failure indicates either a transcription error or a handset that has been reflashed with a false IMEI, the latter being an offence in itself.",
        need: ["An IMEI from a CDR, a seizure memo, or *#06# on the handset"],
        steps: ["Paste the IMEI numbers, one per line", "Press Analyse",
                "A red 'Luhn FAILS' badge means tampering or a typing error, check the seizure memo first",
                "For make and model, send KYM <IMEI> by SMS to 14422"] },
      hi: { name: "आईएमईआई जाँच",
        desc: "आईएमईआई की वैधता जाँचें और हैंडसेट का मेक व मॉडल पहचानें।",
        what: "प्रत्येक हैंडसेट में जाँच-अंक सहित पंद्रह अंकों का आईएमईआई होता है। गढ़ी गई संख्या सामान्यतः इस सत्यापन में विफल रहती है। विफलता या तो लेखन-त्रुटि दर्शाती है अथवा ऐसा हैंडसेट जिसमें मिथ्या आईएमईआई पुनःस्थापित किया गया है, जो स्वयं में एक अपराध है।",
        need: ["सीडीआर, ज़ब्ती पंचनामा, या फ़ोन पर *#06# से मिला आईएमईआई"],
        steps: ["आईएमईआई नंबर हर पंक्ति में एक डालें", "Analyse दबाएँ",
                "लाल 'Luhn FAILS' का मतलब छेड़छाड़ या टाइपिंग ग़लती. पहले पंचनामा मिलाएँ",
                "मेक-मॉडल के लिए 14422 पर KYM <IMEI> एसएमएस भेजें"] }
    },

    mac: {
      en: { name: "Wi-Fi / MAC Address Lookup",
        desc: "Resolve a hardware address to its registered manufacturer and detect randomised addresses.",
        what: "Every device connected to a network holds a hardware address whose leading digits are registered to a manufacturer, and this tool resolves that registration. It further identifies randomly generated addresses. Current versions of iOS and Android present a different address to each network, and such an address cannot be attributed to any device or manufacturer.",
        need: ["A MAC address from a router log, CCTV DVR or Wi-Fi record"],
        steps: ["Paste the address in any format", "Press Look up",
                "If it says 'randomised address', stop, it cannot be traced to a phone"] },
      hi: { name: "वाई-फ़ाई / मैक पता खोज",
        desc: "हार्डवेयर पते से पंजीकृत निर्माता ज्ञात करें और यादृच्छिक पते पहचानें।",
        what: "नेटवर्क से जुड़े प्रत्येक उपकरण का एक हार्डवेयर पता होता है जिसके आरंभिक अंक किसी निर्माता के नाम पंजीकृत होते हैं, और यह टूल वह पंजीकरण ज्ञात करता है। यह यादृच्छिक रूप से निर्मित पतों की भी पहचान करता है। आईओएस तथा एंड्रॉइड के वर्तमान संस्करण प्रत्येक नेटवर्क को भिन्न पता प्रस्तुत करते हैं, और ऐसे पते को किसी उपकरण अथवा निर्माता से संबद्ध नहीं किया जा सकता।",
        need: ["राउटर लॉग, सीसीटीवी डीवीआर या वाई-फ़ाई रिकॉर्ड से मैक पता"],
        steps: ["पता किसी भी रूप में पेस्ट करें", "Look up दबाएँ",
                "'randomised address' दिखे तो रुक जाइए. इससे फ़ोन नहीं पहचाना जा सकता"] }
    },

    ceir: {
      en: { name: "Stolen Phone (CEIR) Request",
        desc: "Prepare the CEIR request for blocking, unblocking or tracing a handset.",
        what: "Two distinct facilities operate under the designation CEIR. The public portal enables a complainant to block a lost handset, whereas the police channel establishes which SIM is presently installed in a handset. This tool prepares the police request. It should be noted that blocking a handset terminates its utility as a source of further evidence.",
        need: ["The IMEI", "Your FIR number and sections"],
        steps: ["Enter the IMEI and case details", "Press Generate",
                "Get it countersigned at the rank your state requires",
                "Send through your State Police nodal officer, not the public portal"] },
      hi: { name: "चोरी फ़ोन (CEIR) अनुरोध",
        desc: "हैंडसेट को अवरुद्ध, पुनर्बहाल या ट्रेस करने हेतु सीईआईआर अनुरोध तैयार करें।",
        what: "सीईआईआर नाम से दो पृथक सुविधाएँ संचालित हैं। सार्वजनिक पोर्टल शिकायतकर्ता को खोया हुआ हैंडसेट अवरुद्ध करने की सुविधा देता है, जबकि पुलिस माध्यम यह स्थापित करता है कि हैंडसेट में वर्तमान में कौन सा सिम स्थापित है। यह टूल पुलिस अनुरोध तैयार करता है। ध्यातव्य है कि हैंडसेट अवरुद्ध करने पर आगे साक्ष्य प्राप्ति की उपयोगिता समाप्त हो जाती है।",
        need: ["आईएमईआई", "एफ़आईआर संख्या और धाराएँ"],
        steps: ["आईएमईआई और केस विवरण भरें", "Generate दबाएँ",
                "अपने राज्य के अनुसार निर्धारित रैंक से प्रतिहस्ताक्षर कराएँ",
                "राज्य पुलिस नोडल अधिकारी के माध्यम से भेजें, सार्वजनिक पोर्टल से नहीं"] }
    },

    cdr: {
      en: { name: "Call Records (CDR) Analysis",
        desc: "Analyse a call detail record for contacts, patterns, handset changes and tower usage.",
        what: "A call detail record may extend to several thousand rows. This tool examines the entire record and reports the most frequent contacts, activity outside ordinary hours, changes of handset, and the cell sites used. The output comprises the limited number of rows that warrant attention.",
        need: ["The CDR file from the operator, as CSV or Excel-exported CSV"],
        steps: ["Drop the CDR file in the box",
                "Read the top four boxes, number of handsets is the one to notice",
                "If it says the SIM was used in more than one handset, look at the short-use one; that is often the crime phone",
                "Scroll to Contacts and look at the 00-05h column, not just the call count",
                "Download the contact list for your case diary"] },
      hi: { name: "कॉल रिकॉर्ड (CDR) विश्लेषण",
        desc: "कॉल डिटेल रिकॉर्ड से संपर्क, प्रारूप, हैंडसेट परिवर्तन और टावर उपयोग निकालें।",
        what: "कॉल डिटेल रिकॉर्ड कई हज़ार पंक्तियों तक विस्तृत हो सकता है। यह टूल संपूर्ण अभिलेख की जाँच कर सर्वाधिक बारंबार संपर्क, सामान्य समय के बाहर की गतिविधि, हैंडसेट परिवर्तन तथा प्रयुक्त सेल साइटें प्रस्तुत करता है। परिणाम में वे सीमित पंक्तियाँ रहती हैं जिन पर ध्यान अपेक्षित है।",
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
        what: "Two subjects under investigation may have no direct contact with one another. Where both are in contact with the same third number, that number is ordinarily of significance. This tool compares several call detail records and reports the numbers common to them.",
        need: ["Two or more CDR files, one per suspect"],
        steps: ["Drop all the CDR files together",
                "Look at 'Shared by ALL', those numbers are your priority",
                "Take each shared number back to Phone Number Check and requisition its CAF and CDR"] },
      hi: { name: "साझा संपर्क खोज",
        desc: "दो या अधिक जाँचाधीन व्यक्तियों द्वारा संपर्क किए गए साझा नंबर पहचानें।",
        what: "जाँचाधीन दो व्यक्तियों के मध्य प्रत्यक्ष संपर्क न होना संभव है। जहाँ दोनों एक ही तृतीय संख्या से संपर्क में हों, वह संख्या सामान्यतः महत्वपूर्ण होती है। यह टूल अनेक कॉल डिटेल रिकॉर्ड की तुलना कर उनमें उभयनिष्ठ संख्याएँ प्रस्तुत करता है।",
        need: ["दो या अधिक सीडीआर फ़ाइलें, हर आरोपी की एक"],
        steps: ["सभी सीडीआर फ़ाइलें एक साथ छोड़ें",
                "'Shared by ALL' देखें. वही नंबर प्राथमिकता हैं",
                "हर साझा नंबर को मोबाइल नंबर जाँच में डालें और उसकी CAF व सीडीआर माँगें"] }
    },

    ipdr: {
      en: { name: "Internet Records (IPDR) Analysis",
        desc: "Resolve an IP address, port and timestamp to a subscriber session.",
        what: "A single public IP address is presently shared among a large number of subscribers, and the address alone therefore identifies no one. The source port and the exact time, to the second, are equally necessary. This tool verifies that a request contains all three particulars and sets out the correct wording.",
        need: ["The IP address, port and timestamp from the platform", "Or the IPDR file from the operator"],
        steps: ["Fill in IP, port and timestamp at the top",
                "Set whether the platform gave you UTC or IST, this is the mistake that ruins cases",
                "Press Check and read the warnings",
                "Copy the requisition text"] },
      hi: { name: "इंटरनेट रिकॉर्ड (IPDR) विश्लेषण",
        desc: "आईपी पता, पोर्ट और समय से ग्राहक सत्र की पहचान करें।",
        what: "वर्तमान में एक सार्वजनिक आईपी पता अनेक ग्राहकों के मध्य साझा रहता है, अतः केवल पता किसी की पहचान नहीं करता। स्रोत पोर्ट तथा सेकंड तक का यथार्थ समय भी समान रूप से आवश्यक हैं। यह टूल सत्यापित करता है कि अनुरोध में तीनों विवरण सम्मिलित हैं तथा शुद्ध शब्दावली प्रस्तुत करता है।",
        need: ["प्लेटफ़ॉर्म से मिला आईपी पता, पोर्ट और समय", "या ऑपरेटर से मिली आईपीडीआर फ़ाइल"],
        steps: ["ऊपर आईपी, पोर्ट और समय भरें",
                "चुनें कि समय UTC में है या IST में. यही ग़लती केस बिगाड़ती है",
                "Check दबाकर चेतावनियाँ पढ़ें",
                "माँग-पत्र का मसौदा कॉपी करें"] }
    },

    smshdr: {
      en: { name: "Fraud SMS Checker",
        desc: "Verify a commercial SMS sender ID against the TRAI DLT format and extract its links.",
        what: "Registered commercial SMS traffic in India employs a sender identifier of prescribed form under the TRAI distributed ledger framework. This tool examines a message against that form. It further extracts any links contained in the message and identifies the wording patterns characteristic of fraudulent communications.",
        need: ["A screenshot or the exact text of the SMS", "The sender ID as shown on the phone"],
        steps: ["Type the sender ID exactly as it appears, e.g. VM-SBIINB",
                "Paste the message text without changing it",
                "Press Analyse and read the red boxes",
                "Do not open any of the extracted links on a police computer"] },
      hi: { name: "फ़र्ज़ी एसएमएस जाँच",
        desc: "व्यावसायिक एसएमएस प्रेषक आईडी को ट्राई डीएलटी प्रारूप से मिलाएँ और लिंक निकालें।",
        what: "भारत में पंजीकृत व्यावसायिक एसएमएस ट्राई वितरित बहीखाता ढाँचे के अंतर्गत निर्धारित रूप के प्रेषक पहचानकर्ता का प्रयोग करते हैं। यह टूल संदेश की उस रूप से जाँच करता है। यह संदेश में सम्मिलित लिंक भी निकालता है तथा कपटपूर्ण संदेशों की विशिष्ट शब्दावली चिह्नित करता है।",
        need: ["एसएमएस का स्क्रीनशॉट या हूबहू पाठ", "फ़ोन पर दिख रही भेजने वाले की आईडी"],
        steps: ["भेजने वाले की आईडी हूबहू लिखें, जैसे VM-SBIINB",
                "संदेश का पाठ बिना बदले पेस्ट करें",
                "Analyse दबाकर लाल बॉक्स पढ़ें",
                "निकाले गए लिंक पुलिस कंप्यूटर पर बिलकुल न खोलें"] }
    },

    tower: {
      en: { name: "Tower Dump Comparison",
        desc: "Compare tower dumps from several locations to identify handsets present at all of them.",
        what: "A tower dump lists every handset present near a cell site during a specified period, the majority of which belong to persons unconnected with the matter. The material acquires evidentiary value only upon comparison. This tool reports the handsets present at every location supplied.",
        need: ["Tower dumps for two or more locations, one file each"],
        steps: ["Drop all the dump files together",
                "Read 'At EVERY location', that is the narrowed list",
                "Requisition the CAF and CDR for each of those numbers",
                "Remember: being in the sector is not being at the address"] },
      hi: { name: "टावर डंप तुलना",
        desc: "कई स्थानों के टावर डंप मिलाकर हर स्थान पर उपस्थित हैंडसेट पहचानें।",
        what: "टावर डंप में निर्दिष्ट अवधि के दौरान किसी सेल साइट के निकट उपस्थित प्रत्येक हैंडसेट की सूची होती है, जिनमें अधिकांश प्रकरण से असंबद्ध व्यक्तियों के होते हैं। इस सामग्री का साक्ष्य-मूल्य केवल तुलना करने पर उत्पन्न होता है। यह टूल उन हैंडसेटों की सूचना देता है जो प्रस्तुत किए गए प्रत्येक स्थान पर उपस्थित थे।",
        need: ["दो या अधिक स्थानों के टावर डंप, हर स्थान की अलग फ़ाइल"],
        steps: ["सभी डंप फ़ाइलें एक साथ छोड़ें",
                "'At EVERY location' पढ़ें. वही छँटी हुई सूची है",
                "उन नंबरों की CAF और सीडीआर माँगें",
                "याद रखें: सेक्टर में होना उस पते पर होना नहीं है"] }
    },

    cellspyder: {
      en: { name: "Cell Tower Finder",
        desc: "Resolve cell identities to site locations and plot sector coverage.",
        what: "A call detail record identifies cell sites by cell identity. This tool resolves those identities to locations using the site list furnished by the operator. It further indicates the direction in which each antenna was oriented, which narrows the area in which the handset was present.",
        need: ["Cell IDs from a CDR", "The cell site list the operator sent with the CDR"],
        steps: ["Load the site list once, it is remembered afterwards",
                "Paste your cell IDs and press Look up",
                "Read the wedge direction on the map",
                "Export as KML and open it in Google Earth for a real map"] },
      hi: { name: "सेल टावर खोज",
        desc: "सेल पहचान से साइट स्थान ज्ञात करें और सेक्टर कवरेज दर्शाएँ।",
        what: "कॉल डिटेल रिकॉर्ड में सेल साइटों की पहचान सेल आइडेंटिटी द्वारा होती है। यह टूल ऑपरेटर द्वारा उपलब्ध कराई गई साइट सूची के आधार पर उन पहचानों को स्थानों में परिवर्तित करता है। यह प्रत्येक एंटीना की दिशा भी दर्शाता है, जिससे हैंडसेट की उपस्थिति का क्षेत्र सीमित होता है।",
        need: ["सीडीआर से मिली सेल आईडी", "सीडीआर के साथ ऑपरेटर से मिली सेल साइट सूची"],
        steps: ["साइट सूची एक बार लोड करें. आगे याद रहेगी",
                "अपनी सेल आईडी पेस्ट करके Look up दबाएँ",
                "नक़्शे पर कोण (wedge) की दिशा देखें",
                "KML में निर्यात कर Google Earth में असली नक़्शे पर खोलें"] }
    },

    ifsc: {
      en: { name: "Bank Branch (IFSC) Lookup",
        desc: "Look up the bank, branch and district behind an IFSC code.",
        what: "Every bank branch is allotted an eleven-character IFSC. This tool reports the bank, branch, district and MICR code corresponding to that IFSC, being the particulars required to address a notice. The branch denotes the place at which the account was opened and does not indicate the residence of the account holder.",
        need: ["An IFSC code from a statement or a cheque"],
        steps: ["Paste the IFSC codes, one per line", "Press Look up",
                "Note: the branch is where the account was opened, not where the accused lives"] },
      hi: { name: "बैंक शाखा (IFSC) खोज",
        desc: "आईएफ़एससी कोड से बैंक, शाखा और ज़िला ज्ञात करें।",
        what: "प्रत्येक बैंक शाखा को ग्यारह वर्णों का आईएफ़एससी आवंटित होता है। यह टूल उस आईएफ़एससी के अनुरूप बैंक, शाखा, ज़िला तथा एमआईसीआर कोड प्रस्तुत करता है, जो नोटिस संबोधित करने हेतु अपेक्षित विवरण हैं। शाखा वह स्थान दर्शाती है जहाँ खाता खोला गया था तथा खाताधारक के निवास का संकेत नहीं देती।",
        need: ["स्टेटमेंट या चेक से मिला आईएफ़एससी कोड"],
        steps: ["आईएफ़एससी कोड हर पंक्ति में एक डालें", "Look up दबाएँ",
                "ध्यान दें: शाखा वह जगह है जहाँ खाता खुला, जहाँ आरोपी रहता है वह नहीं"] }
    },

    upi: {
      en: { name: "UPI ID Lookup",
        desc: "Identify the payment service provider bank behind a UPI address.",
        what: "A UPI address is neither a name nor an account number. The portion following the @ identifies the payment service provider bank, upon which institution notice must be served. That bank is thereafter in a position to identify the underlying account and its KYC record.",
        need: ["A UPI ID from the complaint or a statement"],
        steps: ["Paste the UPI IDs", "Press Resolve",
                "Serve notice on the PSP bank shown",
                "If the part before @ is a mobile number, that is a strong lead, check it too"] },
      hi: { name: "यूपीआई आईडी खोज",
        desc: "यूपीआई पते के पीछे की भुगतान सेवा प्रदाता बैंक पहचानें।",
        what: "यूपीआई पता न तो नाम है और न ही खाता संख्या। @ के पश्चात का भाग भुगतान सेवा प्रदाता बैंक की पहचान करता है, तथा नोटिस उसी संस्था को तामील किया जाना चाहिए। तत्पश्चात वह बैंक अंतर्निहित खाते तथा उसके केवाईसी अभिलेख की पहचान करने की स्थिति में होता है।",
        need: ["शिकायत या स्टेटमेंट से मिली यूपीआई आईडी"],
        steps: ["यूपीआई आईडी पेस्ट करें", "Resolve दबाएँ",
                "दिखाए गए पीएसपी बैंक को नोटिस दें",
                "यदि @ से पहले मोबाइल नंबर है तो वह बड़ा सुराग है. उसे भी जाँचें"] }
    },

    trail: {
      en: { name: "Bank Statement Analysis",
        desc: "Examine a bank statement for layering, mule-account behaviour and beneficiary concentration.",
        what: "Mule accounts exhibit a characteristic pattern. Funds are credited and, within a short interval, dispersed in smaller amounts to several beneficiaries, leaving the balance at or near nil. This tool identifies that pattern together with concentration of beneficiaries and activity outside ordinary hours.",
        need: ["One bank or wallet statement as a CSV file"],
        steps: ["Drop the statement file",
                "Read the red 'mule account' box if it appears",
                "Look at the Layering sequences, each one is money in and straight back out",
                "Take each beneficiary UPI ID to the UPI ID Lookup tool"] },
      hi: { name: "बैंक स्टेटमेंट विश्लेषण",
        desc: "बैंक विवरण में परत-दर-परत हस्तांतरण, म्यूल खाता व्यवहार और लाभार्थी संकेंद्रण जाँचें।",
        what: "म्यूल खाते एक विशिष्ट प्रारूप प्रदर्शित करते हैं। राशि जमा होती है तथा अल्प अंतराल के भीतर छोटी-छोटी रकमों में अनेक लाभार्थियों को वितरित कर दी जाती है, जिससे शेष राशि शून्य अथवा उसके निकट रह जाती है। यह टूल उस प्रारूप के साथ लाभार्थियों का संकेंद्रण तथा सामान्य समय के बाहर की गतिविधि भी चिह्नित करता है।",
        need: ["एक बैंक या वॉलेट स्टेटमेंट, CSV रूप में"],
        steps: ["स्टेटमेंट फ़ाइल छोड़ें",
                "यदि लाल 'mule account' बॉक्स दिखे तो उसे पढ़ें",
                "Layering sequences देखें. हर एक में पैसा आकर तुरंत निकला है",
                "हर लाभार्थी यूपीआई आईडी को यूपीआई आईडी खोज में डालें"] }
    },

    moneytrail: {
      en: { name: "Money Trail Mapper",
        desc: "Reconcile multiple bank statements and reconstruct transfers by reference number.",
        what: "This tool accepts statements for several accounts, which may originate from different banks and in differing formats, and reduces them to a common structure. Transfers are reconstructed by matching the reference or UTR number appearing on both sides of the transaction. Matching on amount alone is not performed, as such matching does not withstand scrutiny in court.",
        need: ["Two or more bank statements as CSV files"],
        steps: ["Drop all the statements together, or press the example button",
                "Open 'BS2BS transfers' to see the money flow diagram",
                "Every arrow is proved by a reference number shown in the table below it",
                "Download that table, it is your exhibit"] },
      hi: { name: "धन-प्रवाह मानचित्र",
        desc: "कई बैंक विवरण मिलाकर संदर्भ संख्या से हस्तांतरण पुनर्निर्मित करें।",
        what: "यह टूल अनेक खातों के विवरण स्वीकार करता है, जो भिन्न बैंकों से तथा भिन्न प्रारूपों में हो सकते हैं, और उन्हें एक समान संरचना में परिवर्तित करता है। हस्तांतरण लेन-देन के दोनों पक्षों पर अंकित संदर्भ अथवा यूटीआर संख्या का मिलान कर पुनर्निर्मित किए जाते हैं। केवल राशि के आधार पर मिलान नहीं किया जाता, क्योंकि ऐसा मिलान न्यायालय में परीक्षण में टिकता नहीं।",
        need: ["दो या अधिक बैंक स्टेटमेंट, CSV रूप में"],
        steps: ["सभी स्टेटमेंट एक साथ छोड़ें, या उदाहरण बटन दबाएँ",
                "धन-प्रवाह का चित्र देखने के लिए 'BS2BS transfers' खोलें",
                "हर तीर नीचे तालिका में दिखे रेफ़रेंस नंबर से सिद्ध है",
                "वह तालिका डाउनलोड करें. यही आपका प्रदर्श है"] }
    },

    hash: {
      en: { name: "File Hash & Certificate",
        desc: "Compute and verify cryptographic hashes of evidence files, and draft the certificate.",
        what: "A hash constitutes a fingerprint of a file. It should be computed when the exhibit is first received and recorded in the seizure memo. Where the integrity of the file is subsequently disputed, the hash is recomputed and compared, and identical values establish that the file is unaltered.",
        need: ["The evidence file itself"],
        steps: ["Drop the file in the box",
                "Copy the SHA-256 value into your seizure memo",
                "Fill the case details and press Generate for the certificate draft",
                "Re-check the same file before filing the chargesheet"] },
      hi: { name: "फ़ाइल हैश व प्रमाणपत्र",
        desc: "साक्ष्य फ़ाइलों का हैश निकालें, सत्यापित करें और प्रमाणपत्र तैयार करें।",
        what: "हैश किसी फ़ाइल की अंगुली-छाप है। इसे प्रदर्श की प्राप्ति के समय ही निकाला जाना चाहिए तथा ज़ब्ती ज्ञापन में अभिलिखित किया जाना चाहिए। जहाँ बाद में फ़ाइल की प्रामाणिकता विवादित हो, वहाँ हैश पुनः निकालकर मिलान किया जाता है, तथा समान मान यह स्थापित करते हैं कि फ़ाइल अपरिवर्तित है।",
        need: ["साक्ष्य फ़ाइल स्वयं"],
        steps: ["फ़ाइल बॉक्स में छोड़ें",
                "SHA-256 मान अपने पंचनामे में लिखें",
                "केस विवरण भरकर प्रमाणपत्र मसौदे के लिए Generate दबाएँ",
                "आरोप-पत्र दाख़िल करने से पहले वही फ़ाइल दोबारा जाँचें"] }
    },

    ip: {
      en: { name: "IP Address Check",
        desc: "Classify an IP address and retrieve its registration and abuse contact.",
        what: "A substantial number of IP addresses cannot be traced to any subscriber, whether because a single address is shared among many users or because it belongs to an anonymising service. This tool determines the category into which an address falls. Where the address is traceable, it identifies the network to which the requisition should be addressed.",
        need: ["An IP address or a website name"],
        steps: ["Type the IP address or domain", "Press Analyse",
                "A red box means the address is private or shared and cannot identify one person",
                "Save the registration record before the website disappears"] },
      hi: { name: "आईपी पता जाँच",
        desc: "आईपी पते का वर्गीकरण करें और उसका पंजीकरण व दुरुपयोग संपर्क प्राप्त करें।",
        what: "अनेक आईपी पतों को किसी ग्राहक तक नहीं पहुँचाया जा सकता, चाहे इसका कारण एक ही पते का अनेक उपयोगकर्ताओं के मध्य साझा होना हो अथवा उसका किसी गोपनीयता सेवा से संबद्ध होना। यह टूल निर्धारित करता है कि पता किस श्रेणी में आता है। जहाँ पता अनुरेखणीय हो, वहाँ यह उस नेटवर्क की पहचान करता है जिसे माँग-पत्र संबोधित किया जाना चाहिए।",
        need: ["एक आईपी पता या वेबसाइट का नाम"],
        steps: ["आईपी पता या डोमेन लिखें", "Analyse दबाएँ",
                "लाल बॉक्स का मतलब पता निजी या साझा है और एक व्यक्ति की पहचान नहीं कर सकता",
                "वेबसाइट हटने से पहले पंजीकरण रिकॉर्ड सहेज लें"] }
    },

    toll: {
      en: { name: "Toll Plaza Finder",
        desc: "Locate NHAI toll plazas by name, operator, radius or route, with site contacts.",
        what: "This tool reports the location and operating concessionaire of NHAI toll plazas, being the particulars required to address a notice for the preservation of CCTV footage. It does not hold FASTag crossing records, which require a separate requisition to NPCI or to the concessionaire.",
        need: ["A route, or a coordinate"],
        steps: ["Choose 'Along a route' and enter start and end coordinates",
                "Note the operator and site contact for each plaza",
                "Copy the preservation notice at the bottom and send it today, plaza CCTV is deleted within days"] },
      hi: { name: "टोल प्लाज़ा खोज",
        desc: "एनएचएआई टोल प्लाज़ा नाम, संचालक, दूरी या मार्ग से खोजें, संपर्क सहित।",
        what: "यह टूल एनएचएआई टोल प्लाज़ा का स्थान तथा संचालक रियायतग्राही प्रस्तुत करता है, जो सीसीटीवी फुटेज के संरक्षण हेतु नोटिस संबोधित करने के लिए अपेक्षित विवरण हैं। इसमें फ़ास्टैग आवागमन अभिलेख संधारित नहीं हैं, जिनके लिए एनपीसीआई अथवा रियायतग्राही को पृथक माँग-पत्र अपेक्षित है।",
        need: ["एक मार्ग, या एक निर्देशांक"],
        steps: ["'Along a route' चुनकर आरंभ और अंत के निर्देशांक भरें",
                "हर प्लाज़ा का संचालक और साइट संपर्क नोट करें",
                "नीचे दिया सुरक्षा-नोटिस आज ही भेजें. प्लाज़ा सीसीटीवी कुछ दिनों में मिट जाता है"] }
    },

    geo: {
      en: { name: "Map & Distance Tool",
        desc: "Convert coordinate formats, measure distance and bearing, and export map files.",
        what: "Coordinates are received by an investigator in several differing notations. This tool converts between them, measures the distance and bearing between points, and produces a file that may be opened in any mapping application.",
        need: ["Coordinates from a CDR, a tower list or a scene"],
        steps: ["Paste points as: label, latitude, longitude, one per line",
                "Press Process",
                "Press Export KML and open the file in Google Earth"] },
      hi: { name: "नक़्शा व दूरी उपकरण",
        desc: "निर्देशांक प्रारूप बदलें, दूरी व दिशा मापें और मानचित्र फ़ाइल निर्यात करें।",
        what: "अन्वेषक को निर्देशांक अनेक भिन्न पद्धतियों में प्राप्त होते हैं। यह टूल उनके मध्य रूपांतरण करता है, बिंदुओं के मध्य दूरी तथा दिशा मापता है, और ऐसी फ़ाइल तैयार करता है जो किसी भी मानचित्र अनुप्रयोग में खोली जा सकती है।",
        need: ["सीडीआर, टावर सूची या घटनास्थल से मिले निर्देशांक"],
        steps: ["बिंदु ऐसे लिखें: नाम, अक्षांश, देशांतर. हर पंक्ति में एक",
                "Process दबाएँ",
                "Export KML दबाकर फ़ाइल Google Earth में खोलें"] }
    },

    ps: {
      en: { name: "Police Station Lookup",
        desc: "Locate a police station by state, district, name or proximity to a coordinate.",
        what: "This tool locates a police station by state, district, name, or distance from a given coordinate. It is intended for determining questions of jurisdiction and for transferring a zero FIR to the station competent to investigate.",
        need: ["A district name, a station name, or a coordinate"],
        steps: ["Choose your state, then your district",
                "Or switch to 'Nearest station' and enter a coordinate",
                "Note: this list is incomplete in rural districts, a station missing here may still exist"] },
      hi: { name: "थाना खोज",
        desc: "राज्य, ज़िला, नाम या निर्देशांक के निकटता से थाना खोजें।",
        what: "यह टूल राज्य, ज़िला, नाम अथवा दिए गए निर्देशांक से दूरी के आधार पर थाना ज्ञात करता है। इसका उद्देश्य क्षेत्राधिकार संबंधी प्रश्नों का निर्धारण तथा शून्य प्राथमिकी को अन्वेषण हेतु सक्षम थाने को अंतरित करना है।",
        need: ["ज़िले का नाम, थाने का नाम, या निर्देशांक"],
        steps: ["अपना राज्य चुनें, फिर ज़िला",
                "या 'Nearest station' पर जाकर निर्देशांक डालें",
                "ध्यान दें: ग्रामीण ज़िलों में यह सूची अधूरी है. यहाँ न दिखने का मतलब थाना नहीं है, ऐसा नहीं"] }
    },

    legal: {
      en: { name: "Which Law Applies",
        desc: "Reference table of the provision, authorising rank and retention period for each class of evidence.",
        what: "Two matters must be determined before evidence is sought: the provision under which the request is made, and the rank competent to authorise it. This table sets out both for each class of record, together with the period for which the holder retains it, which governs what must be requested first.",
        need: ["Nothing"],
        steps: ["Read the retention chart first, it tells you what to ask for today and what can wait",
                "Find your evidence type below",
                "Have your prosecution wing confirm the provision before you sign"] },
      hi: { name: "कौन सा कानून लागू है",
        desc: "प्रत्येक प्रकार के साक्ष्य हेतु प्रावधान, अधिकृत रैंक और प्रतिधारण अवधि की संदर्भ तालिका।",
        what: "साक्ष्य माँगने से पूर्व दो विषय निर्धारित किए जाने चाहिए: वह प्रावधान जिसके अंतर्गत अनुरोध किया जा रहा है, तथा वह पद जो उसे अधिकृत करने में सक्षम है। यह तालिका प्रत्येक प्रकार के अभिलेख हेतु दोनों प्रस्तुत करती है, साथ ही वह अवधि भी जिस तक धारक उसे संधारित रखता है, जिससे यह निर्धारित होता है कि सर्वप्रथम क्या माँगा जाए।",
        need: ["कुछ नहीं"],
        steps: ["पहले अवधारण-चार्ट पढ़ें. इससे पता चलेगा आज क्या माँगना है और क्या रुक सकता है",
                "नीचे अपना साक्ष्य-प्रकार खोजें",
                "हस्ताक्षर से पहले अभियोजन शाखा से धारा की पुष्टि कराएँ"] }
    },

    templates: {
      en: { name: "Notice Writer",
        desc: "Draft preservation notices and BNSS s.94 requisitions with the correct provisions.",
        what: "Requisitions are frequently returned unanswered, ordinarily because the request was imprecise or omitted a particular required by the holder to locate the record. These drafts specify the correct provision and the particulars required, and include the certificate necessary at trial.",
        need: ["FIR number and sections", "Name and address of the bank, operator or platform"],
        steps: ["Choose the type of notice at the top",
                "Fill in your case details",
                "Press Generate, then Copy or Download",
                "Check the rank required in your state before signing"] },
      hi: { name: "नोटिस लेखक",
        desc: "सही प्रावधानों सहित संरक्षण सूचना और बीएनएसएस धारा 94 माँग-पत्र तैयार करें।",
        what: "माँग-पत्र प्रायः अनुत्तरित लौट आते हैं, सामान्यतः इसलिए कि अनुरोध अस्पष्ट था अथवा उसमें वह विवरण छूट गया जो धारक को अभिलेख ढूँढ़ने हेतु आवश्यक था। ये प्रारूप शुद्ध प्रावधान तथा अपेक्षित विवरण निर्दिष्ट करते हैं, और उनमें विचारण के समय आवश्यक प्रमाणपत्र भी सम्मिलित है।",
        need: ["एफ़आईआर संख्या और धाराएँ", "बैंक, ऑपरेटर या प्लेटफ़ॉर्म का नाम-पता"],
        steps: ["ऊपर से नोटिस का प्रकार चुनें",
                "अपने केस का विवरण भरें",
                "Generate दबाएँ, फिर Copy या Download करें",
                "हस्ताक्षर से पहले अपने राज्य में निर्धारित रैंक देख लें"] }
    },

    nodal: {
      en: { name: "Nodal Officer Directory",
        desc: "Directory of nodal officers for banks, wallets, exchanges, service providers and police units.",
        what: "This directory contains the designated nodal officers for banks, payment applications, wallets, cryptocurrency exchanges, service providers and police units. It may be searched by name or by category, and provides the address to which a notice should be sent.",
        need: ["Nothing"],
        steps: ["Type the bank or app name in the search box",
                "Or press a category button such as Payment / Wallet",
                "Use the e-mail or phone shown. A blank means the official source has no value for that officer"] },
      hi: { name: "नोडल अधिकारी सूची",
        desc: "बैंक, वॉलेट, एक्सचेंज, सेवा प्रदाता और पुलिस इकाइयों के नोडल अधिकारियों की निर्देशिका।",
        what: "इस निर्देशिका में बैंकों, भुगतान अनुप्रयोगों, वॉलेट, क्रिप्टोकरेंसी एक्सचेंजों, सेवा प्रदाताओं तथा पुलिस इकाइयों के नामित नोडल अधिकारी सम्मिलित हैं। इसे नाम अथवा श्रेणी से खोजा जा सकता है, तथा यह वह पता उपलब्ध कराती है जिस पर नोटिस भेजा जाना चाहिए।",
        need: ["कुछ नहीं"],
        steps: ["खोज बॉक्स में बैंक या ऐप का नाम लिखें",
                "या Payment / Wallet जैसी श्रेणी का बटन दबाएँ",
                "दिया गया ई-मेल या फ़ोन इस्तेमाल करें। ख़ाली का मतलब सरकारी स्रोत में ही वह जानकारी नहीं है"] }
    },

    timeline: {
      en: { name: "Case Timeline Builder",
        desc: "Merge events from call, financial and case records into a single chronology.",
        what: "A chargesheet sets out a sequence of events. This tool accepts events from any source, maintains them in order, and records the source of each. Events for which no source is stated are marked, as an event that cannot be proved does not belong in the final narrative.",
        need: ["Findings from your other tools, or your case notes"],
        steps: ["Add each event with its date, what happened, and where you got it from",
                "Always fill the Source field, an event you cannot prove does not belong in a chargesheet",
                "Press Export as narrative for a ready chronology"] },
      hi: { name: "केस समय-रेखा",
        desc: "कॉल, वित्तीय और केस अभिलेखों की घटनाओं को एक कालक्रम में संकलित करें।",
        what: "आरोप-पत्र घटनाओं का अनुक्रम प्रस्तुत करता है। यह टूल किसी भी स्रोत से घटनाएँ स्वीकार करता है, उन्हें क्रम में संधारित रखता है, तथा प्रत्येक का स्रोत अभिलिखित करता है। जिन घटनाओं का स्रोत नहीं दिया गया वे चिह्नित की जाती हैं, क्योंकि जिस घटना को सिद्ध नहीं किया जा सकता वह अंतिम विवरण में सम्मिलित नहीं होनी चाहिए।",
        need: ["आपके अन्य टूल से मिले निष्कर्ष, या केस नोट्स"],
        steps: ["हर घटना उसकी तारीख़, विवरण और स्रोत के साथ जोड़ें",
                "स्रोत ज़रूर भरें. जिस घटना को सिद्ध न कर सकें वह आरोप-पत्र में नहीं जानी चाहिए",
                "तैयार कालक्रम के लिए Export as narrative दबाएँ"] }
    },

    docid: {
      en: { name: "Document ID Checker",
        desc: "Identify an Indian document number and verify its structure and check digit.",
        what: "This tool determines the class of document number that has been entered and whether it is correctly formed. A GSTIN and a payment card number incorporate a check digit and can therefore be verified in full. The tool cannot establish whether a number has been issued, or to whom.",
        need: ["Any identifier from the complaint, the FIR or a seized document"],
        steps: ["Paste the number, one per line if you have several",
                "Press Check",
                "Read the verdict. Checksum passes means the number is well-formed, not that it is real",
                "Use the Next line to see where the confirming record sits"] },
      hi: { name: "दस्तावेज़ पहचान जाँच",
        desc: "भारतीय दस्तावेज़ संख्या पहचानें और उसकी संरचना व जाँच-अंक सत्यापित करें।",
        what: "यह टूल निर्धारित करता है कि दर्ज की गई संख्या किस श्रेणी के दस्तावेज़ की है तथा उसका गठन शुद्ध है अथवा नहीं। जीएसटीआईएन तथा भुगतान कार्ड संख्या में जाँच-अंक सम्मिलित होता है, अतः उनका पूर्ण सत्यापन संभव है। यह टूल यह स्थापित नहीं कर सकता कि संख्या निर्गत हुई है अथवा किसे निर्गत हुई है।",
        need: ["शिकायत, प्राथमिकी या ज़ब्त दस्तावेज़ से कोई पहचान संख्या"],
        steps: ["संख्या डालें. कई हों तो हर पंक्ति में एक",
                "Check दबाएँ",
                "परिणाम पढ़ें. Checksum passes का अर्थ है रूप सही है, यह नहीं कि संख्या असली है",
                "पुष्टि कहाँ से होगी, यह Next पंक्ति में देखें"] }
    },

    cryptoaddr: {
      en: { name: "Crypto Address Checker",
        desc: "Identify the blockchain of a wallet address and verify its checksum.",
        what: "Investment and employment frauds frequently terminate at a cryptocurrency wallet address. This tool identifies the blockchain concerned and verifies the checksum contained within the address, which detects transcription errors. Transaction history on public chains may be inspected without legal process; identification of the account holder requires a notice to the exchange.",
        need: ["The wallet address from the complaint, copied and not retyped"],
        steps: ["Paste the address, one per line",
                "Press Check",
                "If the checksum fails, get the address again from the complainant. Do not correct it yourself",
                "Look the address up on the public explorer named in the result",
                "Use the Nodal Officer Directory to find the exchange to serve notice on"] },
      hi: { name: "क्रिप्टो पता जाँच",
        desc: "वॉलेट पते की ब्लॉकचेन पहचानें और उसका चेकसम सत्यापित करें।",
        what: "निवेश तथा रोज़गार संबंधी कपट प्रायः किसी क्रिप्टोकरेंसी वॉलेट पते पर समाप्त होते हैं। यह टूल संबंधित ब्लॉकचेन की पहचान करता है तथा पते में निहित चेकसम का सत्यापन करता है, जिससे लेखन-त्रुटि पकड़ में आती है। सार्वजनिक ब्लॉकचेन का लेन-देन इतिहास विधिक प्रक्रिया के बिना देखा जा सकता है; खाताधारक की पहचान हेतु एक्सचेंज को नोटिस अपेक्षित है।",
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
        what: "A photograph taken on a camera or handset carries embedded particulars of the device, the time of capture and frequently the location, all of which this tool extracts. The absence of such particulars is itself informative, as messaging and social platforms remove them, indicating a forwarded copy rather than the original.",
        need: ["The photograph as a file, ideally taken straight off the device"],
        steps: ["Drop the photo on the box",
                "Read the camera, the date and the location",
                "If it says there is no metadata, ask the complainant to send the file as a document, not as a photo",
                "Hash the file with the File Hash tool and note the value before you do anything else"] },
      hi: { name: "फ़ोटो मेटाडेटा रीडर",
        desc: "फ़ोटो में अंतर्निहित कैमरा, समय और जीपीएस मेटाडेटा निकालें।",
        what: "कैमरे अथवा हैंडसेट से ली गई फ़ोटो में उपकरण, चित्रण के समय तथा प्रायः स्थान के अंतर्निहित विवरण रहते हैं। यह टूल उन्हें निकालता है। ऐसे विवरणों का अभाव स्वयं में सूचनाप्रद है, क्योंकि संदेश तथा सामाजिक मंच उन्हें हटा देते हैं, जिससे यह संकेत मिलता है कि प्रति मूल नहीं बल्कि अग्रेषित है।",
        need: ["फ़ोटो फ़ाइल के रूप में, बेहतर हो कि सीधे उपकरण से ली गई हो"],
        steps: ["फ़ोटो को बॉक्स पर छोड़ें",
                "कैमरा, तारीख़ और स्थान पढ़ें",
                "यदि मेटाडेटा न मिले तो शिकायतकर्ता से फ़ाइल को document के रूप में भेजने को कहें",
                "आगे कुछ करने से पहले File Hash टूल से फ़ाइल का हैश लेकर दर्ज करें"] }
    },

    filetype: {
      en: { name: "File Type Checker",
        desc: "Identify a file's true format from its contents rather than its extension.",
        what: "The extension of a file is merely a label and may be altered at any time, whereas the opening bytes are written by the program that created the file and cannot be altered by renaming. This tool reads those bytes and reports the true format, and issues an express warning where a file presented as a document or image is in fact an executable program.",
        need: ["Any file from the case: an attachment, a download, a seized copy"],
        steps: ["Drop one or more files on the box",
                "Read the Actually is line and compare it with Named as",
                "If it warns that the file is a program, do not open it. Send it to your forensics unit",
                "Note the finding, because a disguised file is itself evidence of intent"] },
      hi: { name: "फ़ाइल प्रकार जाँच",
        desc: "फ़ाइल का वास्तविक प्रारूप उसके नाम से नहीं, सामग्री से पहचानें।",
        what: "फ़ाइल का एक्सटेंशन मात्र एक नाम है तथा किसी भी समय बदला जा सकता है, जबकि आरंभिक बाइट उस प्रोग्राम द्वारा लिखे जाते हैं जिसने फ़ाइल बनाई और नाम बदलने से परिवर्तित नहीं होते। यह टूल उन बाइटों को पढ़कर वास्तविक प्रारूप बताता है, तथा जहाँ दस्तावेज़ या चित्र के रूप में प्रस्तुत फ़ाइल वस्तुतः निष्पादनीय प्रोग्राम हो, वहाँ स्पष्ट चेतावनी देता है।",
        need: ["केस से जुड़ी कोई भी फ़ाइल: अनुलग्नक, डाउनलोड, या ज़ब्त प्रति"],
        steps: ["एक या अधिक फ़ाइलें बॉक्स पर छोड़ें",
                "Actually is और Named as की पंक्तियाँ मिलाकर देखें",
                "यदि चेतावनी मिले कि फ़ाइल एक प्रोग्राम है तो उसे न खोलें, फ़ॉरेंसिक इकाई को भेजें",
                "यह निष्कर्ष दर्ज करें, छिपाई गई फ़ाइल स्वयं मंशा का प्रमाण है"] }
    }
  }
};
