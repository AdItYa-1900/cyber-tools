/* ============================================================
   Cross-tool reference data: legal authority matrix, banking
   codes, UPI handles, port vocabulary.

   THE LEGAL MATRIX IS TRAINING MATERIAL, NOT LEGAL ADVICE.
   It reflects the BNSS/BSA/BNS regime that replaced CrPC/IEA/IPC
   from 01-07-2024, and the Telecommunications Act 2023 which is
   replacing the Telegraph Act 1885 in phases. Provisions, ranks
   and state SOPs change. Have your prosecution wing vet every
   row before it goes into a real notice.
   ============================================================ */

window.LEGAL = {
  updated: "Drafted against the position as at 2026. Verify before use.",

  /* Each entry answers: what am I asking for, from whom, under what,
     who has to sign it, and how long does the holder keep it.        */
  matrix: [
    {
      id: "cdr",
      what: "Call Detail Records (CDR)",
      holder: "Access provider (TSP) nodal officer for the LSA",
      authority: "BNSS 2023 s.94 - written order to produce a document or thing " +
                 "(the provision that replaced CrPC s.91).",
      rank: "DoT instructions restrict CDR requisitions to officers of SP / DCP rank " +
            "and above, with a monthly report to the District Magistrate. Several states " +
            "delegate to ACP / DySP by SOP - check your state's standing order.",
      retention: "Licence conditions require access providers to retain CDR for at least " +
                 "one year. Assume anything older is gone; ask early.",
      caution: "A CDR is metadata only - who called whom, when, for how long, from which " +
               "cell. It is NOT call content. Asking for content turns this into an " +
               "interception request under a different provision entirely.",
      pitfall: "Do not accept a CDR as a bare spreadsheet. Ask for it with the certificate " +
               "under BSA s.63(4) at the same time, or you will be chasing the nodal officer " +
               "for it during trial."
    },
    {
      id: "ipdr",
      what: "Internet Protocol Detail Records (IPDR)",
      holder: "Access provider / ISP nodal officer",
      authority: "BNSS 2023 s.94. For sustained monitoring of traffic data rather than a " +
                 "historic pull, IT Act 2000 s.69B with the IT (Procedure and Safeguard for " +
                 "Monitoring and Collecting Traffic Data) Rules 2009 applies instead.",
      rank: "Same practice as CDR - SP / DCP and above in most states.",
      retention: "Typically one year under licence conditions; some providers keep less for " +
                 "NAT translation logs specifically. NAT logs are the perishable part.",
      caution: "Without the source port AND the exact timestamp with timezone, a public IP " +
               "from a CGNAT pool resolves to hundreds of subscribers. An IPDR request that " +
               "omits port and second-level time is functionally useless.",
      pitfall: "State the timezone explicitly (IST / UTC). Platform logs are usually UTC and " +
               "operator logs usually IST; a 5:30 mismatch has sunk cases."
    },
    {
      id: "content",
      what: "Call content / live interception",
      holder: "Access provider, executed through the designated LEA channel",
      authority: "Telecommunications Act 2023 s.20(2) (progressively replacing Indian " +
                 "Telegraph Act 1885 s.5(2) read with Rule 419A). For computer resources, " +
                 "IT Act 2000 s.69 with the Interception Rules 2009.",
      rank: "Order of the Secretary (Home) of the Union or State Government. In unavoidable " +
            "circumstances a Joint Secretary-level officer so authorised, confirmed within " +
            "seven days. Reviewed by a Review Committee.",
      retention: "Intercepted material and records are destroyed on the schedule set in the rules.",
      caution: "This is the highest threshold in the whole toolkit. An investigating officer " +
               "cannot authorise it, and no amount of urgency substitutes for the order.",
      pitfall: "Interception is prospective. It cannot recover a conversation that already happened."
    },
    {
      id: "subscriber",
      what: "Subscriber details / Customer Acquisition Form (CAF)",
      holder: "Access provider nodal officer; retailer/PoS records sit with the distributor",
      authority: "BNSS 2023 s.94.",
      rank: "Generally delegated lower than CDR - commonly Inspector / SHO level by state SOP.",
      retention: "CAF and KYC documents are retained for the life of the connection and a " +
                 "period after disconnection under licence conditions.",
      caution: "The CAF proves who the connection was SOLD to. It does not prove who was " +
               "holding the handset. Bulk-issued and fraudulently-KYCd SIMs are the single " +
               "most common dead end in mule-account cases.",
      pitfall: "Always ask for the PoS/retailer code and the activation-time details alongside " +
               "the CAF - that is what exposes a bulk-SIM racket."
    },
    {
      id: "bank",
      what: "Bank account statements, KYC and beneficiary details",
      holder: "Bank nodal officer (list published on cybercrime.gov.in)",
      authority: "BNSS 2023 s.94. Certified copies are admissible under the Bankers' Books " +
                 "Evidence Act 1891 (s.2A certificate for printouts, s.4 certified copy).",
      rank: "Investigating officer may issue; freezing / attachment needs the appropriate " +
            "order (BNSS s.106/107 for seizure and attachment of proceeds of crime).",
      retention: "Banks retain records for a minimum of five years (eight for some categories) " +
                 "under PMLA record-keeping obligations - far longer than telecom.",
      caution: "Request the s.2A Bankers' Books certificate WITH the statement. A bare PDF from " +
               "a branch manager is not self-proving.",
      pitfall: "Ask for the beneficiary account's KYC, the registered mobile, the device/IP that " +
               "operated net banking, and the onward transfer trail - not just the statement."
    },
    {
      id: "upi",
      what: "UPI / wallet transaction trail",
      holder: "PSP bank and the payer/payee banks; switch-level data with NPCI",
      authority: "BNSS 2023 s.94 to the PSP and to the banks.",
      rank: "Investigating officer.",
      retention: "Per PMLA record-keeping obligations at the bank; app-side logs vary by PSP.",
      caution: "A UPI ID is not an identity. Resolve handle -> PSP -> underlying account -> KYC. " +
               "Skipping a hop produces an attribution you cannot defend.",
      pitfall: "The UTR/RRN is the join key across banks. Collect it for every leg or the trail breaks."
    },
    {
      id: "device",
      what: "Device tracing by IMEI (which SIM is in the handset now)",
      holder: "Access providers, coordinated through State Police / CEIR",
      authority: "BNSS 2023 s.94 to the TSPs; CEIR blocking/tracing through the State Police " +
                 "nodal channel to DoT.",
      rank: "Per state SOP, commonly SP / DCP for tracing requests.",
      retention: "Tied to CDR retention - the IMEI/IMSI pairing lives in the CDR.",
      caution: "IMEI is software-reportable and can be spoofed or reflashed. Two handsets sharing " +
               "an IMEI is evidence of tampering, not of one device.",
      pitfall: "The public KYM/14422 check returns make, model and blacklist status only. It never " +
               "returns an owner. Do not let anyone record it as an ownership result."
    },
    {
      id: "platform",
      what: "Platform / intermediary records (social media, e-mail, apps)",
      holder: "The intermediary's India nodal / grievance officer; foreign entities via MLAT " +
              "or the provider's own LEA portal",
      authority: "BNSS 2023 s.94 for Indian entities. IT Rules 2021 rule 3(1)(j) obliges " +
                 "significant intermediaries to assist and to preserve. Cross-border evidence " +
                 "routes through BNSS Chapter on reciprocal arrangements / MLAT.",
      rank: "Investigating officer for preservation and basic subscriber information; content " +
            "generally requires a court order or MLAT.",
      retention: "Rule 3(1)(j) preservation is commonly 180 days on a lawful request. " +
                 "SEND A PRESERVATION REQUEST ON DAY ONE - it is free and it stops the clock.",
      caution: "Preservation and production are two different requests. Preservation freezes the " +
               "data; you still need the production order to see it.",
      pitfall: "Include the exact account identifier, URL, and the timestamp window with timezone. " +
               "Vague requests are refused, and the refusal burns your retention window."
    },
    {
      id: "aadhaar",
      what: "Aadhaar-linked identity information",
      holder: "UIDAI",
      authority: "Aadhaar Act 2016 s.33 - disclosure only on the order of a court not inferior " +
                 "to a District Judge, or on a national-security direction under s.33(2). " +
                 "s.29 bars sharing of core biometric information outright.",
      rank: "Court order. An investigating officer cannot requisition this directly.",
      retention: "N/A",
      caution: "There is no lawful route by which an investigator 'looks up' a person from an " +
               "Aadhaar number. Any tool or service offering that is operating illegally.",
      pitfall: "Do not paste real Aadhaar numbers into any tool, including this one. Storing or " +
               "processing them without authority is itself an offence under the Act."
    },
    {
      id: "toll",
      what: "FASTag / toll crossing records",
      holder: "NPCI and IHMCL; the issuing bank holds the tag's KYC",
      authority: "BNSS 2023 s.94 to NPCI/IHMCL and to the issuer bank.",
      rank: "Investigating officer.",
      retention: "Transaction records per the issuer's retention policy.",
      caution: "Plaza locations, operators and rates are public. WHICH VEHICLE CROSSED WHEN IS NOT. " +
               "That distinction is the whole legal boundary of the toll tool in this kit.",
      pitfall: "Ask for the tag ID, vehicle registration, plaza ID, lane and timestamp together - " +
               "and the tag's KYC from the issuing bank in the same breath."
    },
    {
      id: "electronic",
      what: "Producing any of the above in court",
      holder: "You",
      authority: "Bharatiya Sakshya Adhiniyam 2023 s.63 governs admissibility of electronic " +
                 "records (the provision that replaced Indian Evidence Act s.65B). The " +
                 "certificate under s.63(4) must be in the form set out in the Schedule and " +
                 "signed by the person in charge of the device AND an expert.",
      rank: "N/A",
      retention: "N/A",
      caution: "The certificate is mandatory for secondary electronic evidence. Get it from the " +
               "data holder at the time of production, not two years later from a transferred officer.",
      pitfall: "Hash every file the moment you receive it, record the hash in the seizure memo, " +
               "and re-verify before filing. That is what makes tampering arguments fail."
    }
  ]
};

/* ---- Bank IFSC prefixes -------------------------------------------
   First four characters of an IFSC identify the bank; the fifth is a
   reserved '0'; the last six identify the branch. The bank-code layer
   is small and stable, so it is bundled. The branch layer is ~170k
   rows and is resolved live via the public Razorpay IFSC endpoint.   */
window.IFSC_BANKS = {
  SBIN: "State Bank of India", HDFC: "HDFC Bank", ICIC: "ICICI Bank",
  UTIB: "Axis Bank", PUNB: "Punjab National Bank", BARB: "Bank of Baroda",
  CNRB: "Canara Bank", UBIN: "Union Bank of India", IOBA: "Indian Overseas Bank",
  IDIB: "Indian Bank", CBIN: "Central Bank of India", MAHB: "Bank of Maharashtra",
  BKID: "Bank of India", UCBA: "UCO Bank", PSIB: "Punjab & Sind Bank",
  KKBK: "Kotak Mahindra Bank", YESB: "Yes Bank", INDB: "IndusInd Bank",
  IDFB: "IDFC First Bank", FDRL: "Federal Bank", SIBL: "South Indian Bank",
  KVBL: "Karur Vysya Bank", CIUB: "City Union Bank", TMBL: "Tamilnad Mercantile Bank",
  DCBL: "DCB Bank", RATN: "RBL Bank", BDBL: "Bandhan Bank", CSBK: "CSB Bank",
  JAKA: "Jammu & Kashmir Bank", KARB: "Karnataka Bank", NKGS: "NKGSB Co-op Bank",
  AUBL: "AU Small Finance Bank", ESFB: "Equitas Small Finance Bank",
  UJVN: "Ujjivan Small Finance Bank", JSFB: "Jana Small Finance Bank",
  SURY: "Suryoday Small Finance Bank", FINO: "Fino Payments Bank",
  PYTM: "Paytm Payments Bank", AIRP: "Airtel Payments Bank",
  IPOS: "India Post Payments Bank", NSPB: "NSDL Payments Bank",
  HSBC: "HSBC India", SCBL: "Standard Chartered Bank", CITI: "Citibank India",
  DEUT: "Deutsche Bank", BNPA: "BNP Paribas", DBSS: "DBS Bank India",
  ABNA: "Royal Bank of Scotland / ABN AMRO", BOFA: "Bank of America",
  JPCB: "JPMorgan Chase", MSCB: "Maharashtra State Co-op Bank",
  APGB: "Andhra Pradesh Grameena Vikas Bank", BARC: "Barclays Bank"
};

/* ---- UPI handles -> PSP ---------------------------------------------
   The handle after '@' identifies the Payment Service Provider bank,
   NOT the customer's own bank. Resolving it is the first hop of any
   UPI trail: handle -> PSP -> underlying account -> KYC.              */
window.UPI_HANDLES = {
  "ybl": { psp: "Yes Bank", app: "PhonePe" },
  "ibl": { psp: "ICICI Bank", app: "PhonePe" },
  "axl": { psp: "Axis Bank", app: "PhonePe" },
  "okhdfcbank": { psp: "HDFC Bank", app: "Google Pay" },
  "okaxis": { psp: "Axis Bank", app: "Google Pay" },
  "oksbi": { psp: "State Bank of India", app: "Google Pay" },
  "okicici": { psp: "ICICI Bank", app: "Google Pay" },
  "paytm": { psp: "Paytm Payments Bank", app: "Paytm" },
  "ptaxis": { psp: "Axis Bank", app: "Paytm" },
  "ptsbi": { psp: "State Bank of India", app: "Paytm" },
  "ptyes": { psp: "Yes Bank", app: "Paytm" },
  "apl": { psp: "Axis Bank", app: "Amazon Pay" },
  "yapl": { psp: "Yes Bank", app: "Amazon Pay" },
  "rapl": { psp: "RBL Bank", app: "Amazon Pay" },
  "upi": { psp: "NPCI (BHIM)", app: "BHIM" },
  "abfspay": { psp: "Aditya Birla", app: "ABFSPay" },
  "freecharge": { psp: "Axis Bank", app: "Freecharge" },
  "jio": { psp: "Jio Payments Bank", app: "JioMoney" },
  "airtel": { psp: "Airtel Payments Bank", app: "Airtel Thanks" },
  "fbl": { psp: "Federal Bank", app: "various" },
  "idfcbank": { psp: "IDFC First Bank", app: "IDFC" },
  "kotak": { psp: "Kotak Mahindra Bank", app: "Kotak 811" },
  "indus": { psp: "IndusInd Bank", app: "IndusInd" },
  "sbi": { psp: "State Bank of India", app: "YONO / BHIM SBI Pay" },
  "hdfcbank": { psp: "HDFC Bank", app: "PayZapp" },
  "icici": { psp: "ICICI Bank", app: "iMobile" },
  "axisbank": { psp: "Axis Bank", app: "Axis Mobile" },
  "pnb": { psp: "Punjab National Bank", app: "PNB One" },
  "barodampay": { psp: "Bank of Baroda", app: "bob World" },
  "cnrb": { psp: "Canara Bank", app: "ai1" },
  "cboi": { psp: "Central Bank of India", app: "Cent Mobile" },
  "slc": { psp: "Slice / SBM", app: "Slice" },
  "naviaxis": { psp: "Axis Bank", app: "Navi" },
  "timecosmos": { psp: "Cosmos Bank", app: "Cred (historic)" },
  "axisb": { psp: "Axis Bank", app: "Cred" },
  "waaxis": { psp: "Axis Bank", app: "WhatsApp Pay" },
  "wahdfcbank": { psp: "HDFC Bank", app: "WhatsApp Pay" },
  "waicici": { psp: "ICICI Bank", app: "WhatsApp Pay" },
  "wasbi": { psp: "State Bank of India", app: "WhatsApp Pay" }
};

/* ---- Ports seen in IPDR / firewall evidence ---------------------- */
window.PORTS = {
  20: "FTP data", 21: "FTP control", 22: "SSH / SFTP", 23: "Telnet (cleartext)",
  25: "SMTP", 53: "DNS", 67: "DHCP server", 68: "DHCP client", 69: "TFTP",
  80: "HTTP", 110: "POP3", 123: "NTP", 135: "MSRPC", 137: "NetBIOS name",
  139: "NetBIOS session", 143: "IMAP", 161: "SNMP", 389: "LDAP",
  443: "HTTPS / QUIC", 445: "SMB", 465: "SMTPS", 500: "IKE / IPsec",
  514: "syslog", 587: "SMTP submission", 993: "IMAPS", 995: "POP3S",
  1080: "SOCKS proxy", 1194: "OpenVPN", 1433: "MS SQL", 1723: "PPTP VPN",
  3306: "MySQL", 3389: "RDP", 4444: "Metasploit default / common RAT",
  5060: "SIP", 5061: "SIP-TLS", 5222: "XMPP", 5432: "PostgreSQL",
  5938: "TeamViewer", 6667: "IRC", 8080: "HTTP alt / proxy", 8443: "HTTPS alt",
  8888: "HTTP alt", 9001: "Tor ORPort (common)", 9030: "Tor DirPort (common)",
  9050: "Tor SOCKS (local)", 27017: "MongoDB", 51820: "WireGuard"
};

/* ---- Private / reserved IP space (RFC 1918, 6598, 3927, 4193) ---- */
window.IP_RESERVED = [
  { cidr: "0.0.0.0/8",        label: "This network (RFC 1122)" },
  { cidr: "10.0.0.0/8",       label: "Private (RFC 1918)" },
  { cidr: "100.64.0.0/10",    label: "Carrier-grade NAT (RFC 6598) - shared by many subscribers" },
  { cidr: "127.0.0.0/8",      label: "Loopback" },
  { cidr: "169.254.0.0/16",   label: "Link-local (RFC 3927)" },
  { cidr: "172.16.0.0/12",    label: "Private (RFC 1918)" },
  { cidr: "192.0.0.0/24",     label: "IETF protocol assignments" },
  { cidr: "192.0.2.0/24",     label: "Documentation TEST-NET-1" },
  { cidr: "192.168.0.0/16",   label: "Private (RFC 1918)" },
  { cidr: "198.18.0.0/15",    label: "Benchmarking" },
  { cidr: "198.51.100.0/24",  label: "Documentation TEST-NET-2" },
  { cidr: "203.0.113.0/24",   label: "Documentation TEST-NET-3" },
  { cidr: "224.0.0.0/4",      label: "Multicast" },
  { cidr: "240.0.0.0/4",      label: "Reserved" },
  { cidr: "255.255.255.255/32", label: "Broadcast" }
];
