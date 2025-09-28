## Overview

A Montreal currency‑exchange store is a **money services business (MSB)** under federal law because it conducts foreign‑exchange transactions.  Every MSB operating in Canada must register with the Financial Transactions and Reports Analysis Centre of Canada (**FINTRAC**) and comply with the *Proceeds of Crime (Money Laundering) and Terrorist Financing Act* (PCMLTFA) and its regulations.  In Quebec, the provincial **Money‑Services Businesses Act (E‑12.000001)** also applies.  The act requires a separate provincial licence and subjects currency‑exchange businesses to Revenu Québec oversight.  The store must therefore satisfy **two licensing regimes**: the federal FINTRAC MSB registration and the provincial Revenu Québec MSB licence【606773160300859†L46-L57】.

The storeowner intends to build an operating system (OS) to manage workflow and compliance.  FINTRAC accepts electronic reporting through two channels: the **FINTRAC Web Reporting System (FWR)** and the **FINTRAC API**.  Both can be integrated into the OS.  The following sections describe the regulatory requirements and how the OS can meet them.

## Federal registration and compliance

### MSB registration with FINTRAC

| Requirement | Details (FINTRAC) | Implementation notes |
|---|---|---|
| **Register before operating** | Any person or entity conducting foreign‑exchange transactions, fund transfers, virtual‑currency dealings, cheque cashing or operation of ATMs is an MSB.  The business must register with FINTRAC before starting operations【703084283464944†L55-L91】.  Registration involves submitting a pre‑registration form; FINTRAC contacts the applicant to complete the registration.  Information required includes bank account details, compliance officer information, business owners, estimated transaction volumes and location details【703084283464944†L61-L85】.  Criminal record checks for directors and beneficial owners are required【703084283464944†L128-L147】.  There is no registration fee. | OS should track corporate documentation and renewal deadlines.  Include features to collect the necessary registration information and maintain copies of submissions. |
| **Display registration and keep information current** | The business must keep its FINTRAC registration information up to date and must notify FINTRAC of changes (e.g., new ownership, locations or services).  Renewals are now handled via online forms【522349043219473†L256-L279】. | Include a module to monitor renewal dates and prompt updates. |
| **Compliance program** | MSBs must maintain a compliance program that includes: appointing a compliance officer; written policies and procedures; a risk assessment; training for staff; and a biennial effectiveness review【75003727312326†L88-L114】.  The compliance officer needs sufficient authority and resources, especially in larger businesses【75003727312326†L124-L160】. | The OS should store policy documents, track training completion, schedule effectiveness reviews and flag high‑risk activities. |
| **Know‑Your‑Client (KYC) and identity verification** | MSBs must verify the identity of individuals using one of several methods (government‑issued photo ID, credit‑file, dual‑process, affiliate/member or reliance methods) and verify corporations/entities using confirmation of existence, reliance or simplified methods【12051182081528†L79-L100】. | Integrate KYC modules to capture ID information, check credit files (through third‑party services) and store documents securely. |
| **Record‑keeping** | The business must keep copies of every report filed with FINTRAC (Suspicious Transaction Reports, Large Cash Transaction Reports, Large Virtual Currency Transaction Reports, Electronic Funds Transfer Reports, etc.).  Additional records include detailed transaction records for cash ≥ $10,000, virtual‑currency transactions ≥ $10,000, transfers ≥ $3,000, foreign‑currency exchange tickets, cheque‑cashing records and service agreements【796843540818882†L91-L150】.  Records must be descriptive (e.g., specifying a client’s occupation)【796843540818882†L151-L158】 and must be retained for at least five years (per the regulations). | Build transaction‑logging functions that capture all required fields; implement secure storage with retention logic; generate descriptive fields for occupation/source of funds.  Include the ability to export data for audits. |
| **24‑hour rule** | When multiple transactions of the same type occur within 24 hours and together equal or exceed $10,000, they must be aggregated and treated as a single report (applies to large cash, virtual‑currency, EFTs and casino disbursements)【402638938046896†L125-L160】. | The OS should aggregate transactions by customer, type and 24‑hour period and automatically trigger reporting when thresholds are met. |
| **Ministerial directives and sanctions** | FINTRAC issues ministerial directives restricting certain transactions with high‑risk jurisdictions.  As of 2025, reporting entities may voluntarily share information with other entities to detect money‑laundering and sanctions evasion; a **code of practice** must be submitted to FINTRAC and the Privacy Commissioner【522349043219473†L80-L97】. | Implement sanctions‑screening modules and maintain the ability to share information with partners if a code of practice is adopted.  The OS should track ministerial directives and update screening lists. |

### Transaction reporting obligations

Canadian MSBs must report specific transactions to FINTRAC by specified deadlines.  The OS must capture all data elements required for each report and transmit them using the FWR or API.

1. **Suspicious Transaction Reports (STRs)** – Reports of transactions where there are reasonable grounds to suspect money‑laundering, terrorist financing or sanctions evasion.  Must be submitted electronically via FWR or API; paper forms can be faxed or mailed only if the business lacks technical capability【424988998376542†L498-L513】.  The STR form has six sections: general information; transaction information; starting action; completing action; details of suspicion; and actions taken【424988998376542†L551-L626】.  The report may include multiple transactions; for each, the business must provide transaction details, the parties involved, reasons for suspicion and actions taken【424988998376542†L553-L671】.  Changes to a submitted STR must be filed within 20 days with an explanation【424988998376542†L520-L527】.

2. **Large Cash Transaction Reports (LCTRs)** – Required when the business receives **$10,000 or more in cash** in a single transaction or a series of transactions within 24 hours.  Reports must be submitted within **15 calendar days** and can be filed via FWR or API; paper forms are permitted only if electronic submission is not possible【130773943937254†L215-L228】.  The LCTR form includes general information, transaction information and actions (starting/completing) and requires details such as location, date, amounts, conductors, third parties and beneficiaries【130773943937254†L254-L299】.

3. **Large Virtual Currency Transaction Reports (LVCTRs)** – When the business receives **$10,000 or more in virtual currency** in a single transaction or aggregated within 24 hours, it must file an LVCTR within 15 days.  Electronic submission via FWR or API is mandatory; paper forms are only for those without electronic capability【195886319837098†L233-L245】.  Required details include the virtual‑currency addresses involved, transaction hash, amounts and purpose【195886319837098†L270-L334】.

4. **Electronic Funds Transfer Reports (EFTRs)** – MSBs must report international electronic funds transfers of **$10,000 or more**, whether initiating or final receiving.  Reports are due within five working days and must be submitted electronically via FWR or API【968906568052593†L722-L735】.  The EFTR form captures sender and receiver details, amount, currency, exchange rate, source of funds, and intermediate banks【968906568052593†L760-L803】.

5. **Casino Disbursement Reports** – Not directly applicable unless the store operates as a casino; included here for completeness.  Reports are required when a casino disburses $10,000 or more in a single or aggregated transaction.

6. **Listed Person or Entity Property Reports** – Reports involving sanctioned individuals/entities must be submitted using paper forms, as API and FWR do not support them【301574286929531†L65-L77】.

### Implementation of reporting mechanisms

#### 1. FINTRAC Web Reporting System (FWR)

- **Purpose** – Provides a secure online portal for submitting individual reports and managing submissions.  Designed for lower reporting volumes【462645201387867†L70-L73】.
- **Access** – The business must email **F2R@fintrac‑canafe.gc.ca** to request access【462645201387867†L52-L86】.  FINTRAC sends a link for enrollment, and the reporting entity administrator must attest to the identities of verification and submission officers【462645201387867†L171-L200】.
- **Capabilities** – Users can create new reports (STR, EFTR, LCTR, LVCTR, casino disbursements), manage incomplete reports, upload batch files (legacy formats) and search previous submissions【462645201387867†L94-L103】.  The system allows organization management: adding locations, assigning verification/submission officers and data‑entry officers, and attesting to their identity【462645201387867†L138-L200】.  Quick search features help find prior reports by reference number or date range【462645201387867†L90-L103】.
- **Integration considerations** – The OS should generate JSON or XML files with the required fields, but because FWR is a manual portal, staff must log in and paste/upload information.  The OS can produce a CSV or JSON for each report to streamline data entry.  The system can also maintain FWR credentials and track submission receipts.

#### 2. FINTRAC API report submission

- **Purpose** – Enables automated, system‑to‑system transfer of report information for high‑volume reporters【301574286929531†L65-L74】.
- **Registration** – Businesses must register for API access via the **FINTRAC API portal**.  Technical administrators create an application and secret key to authenticate API calls【301574286929531†L91-L100】.  High‑volume reporters without access should email **F2R@fintrac‑canafe.gc.ca**【301574286929531†L103-L105】.
- **Reports supported** – Suspicious Transaction, Large Cash, Large Virtual Currency, Electronic Funds Transfer and Casino Disbursement Reports.  Listed Person or Entity Property Reports must still use paper forms【301574286929531†L65-L77】.
- **Endpoint types** – Two groups of endpoints exist: single report submissions and bulk submissions.  Both support create, change and delete actions【301574286929531†L118-L127】.  Single report endpoints allow up to **500 transactions per report** with a maximum file size of **25 MB**【301574286929531†L129-L137】.  Bulk submissions can include **up to 5,000 reports** and **5,000 transactions per report**, with a file size limit of **300 MB**【301574286929531†L129-L137】.
- **Linking transactions** – When multiple reports are needed due to transaction limits, transactions can be linked by using the reporting entity reference number with a suffix (‑01, ‑02, etc.)【301574286929531†L146-L149】.
- **Technical documentation** – FINTRAC provides schemas and validation rules for each report type (JSON).  Updated validation rules for Suspicious Transaction Reports, Large Cash Transaction Reports, Large Virtual Currency Transaction Reports and EFTRs were published in February and July 2025【301574286929531†L213-L259】.  Sample JSON files and a Swagger endpoint for API calls are available【301574286929531†L170-L293】.  Technical support is provided via **tech@fintrac‑canafe.gc.ca**【301574286929531†L296-L299】.
- **Integration considerations** – The OS should implement modules to serialize transactions into the appropriate JSON schema, sign requests with the API key/secret, handle validation errors and store acknowledgement responses.  Rate limits and file size constraints must be respected.  Implement logs to track when reports are created, changed or deleted.

### Comparison: Web Reporting System vs API

| Feature | Web Reporting System (FWR) | FINTRAC API                                                                                                                                                               |
|---|---|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Target users** | Entities with lower reporting volumes. | High‑volume reporters who need system‑to‑system automation.                                                                                                               |
| **Submission method** | Manual entry via web forms; uploading of batch files for legacy formats【462645201387867†L90-L103】. | Automated JSON submissions via REST endpoints; supports single and bulk submissions.                                                            |
| **Transaction capacity** | No explicit per‑report limit, but manual entry is practical for a small number of transactions. | Single submission: up to 500 transactions per report (25 MB limit); Bulk: up to 5,000 reports and 5,000 transactions per report (300 MB limit)【301574286929531†L129-L137】. |
| **Change/delete reports** | Users can modify or delete reports within the FWR interface. | API endpoints include change and delete actions for submitted reports【301574286929531†L118-L127】.                                                                         |
| **Suitable for OS integration** | OS can pre‑populate data and export files for manual upload; human interaction required. | OS can fully automate report generation and submission; suitable for high‑volume or integrated workflows.                                                                 |

## Provincial obligations – Money‑Services Businesses Act (Quebec)

### Licensing requirements

The **Money‑Services Businesses Act (E‑12.000001)** requires anyone who operates a money‑services business for remuneration in Quebec to hold a licence【351122498378286†L52-L72】.  The Act lists six money services: currency exchange, fund transfers, issuing or redeeming travellers’ cheques/money orders/bank drafts, cheque cashing, operation of automated teller machines, and operation of crypto‑asset ATMs【351122498378286†L52-L72】.  Licences are issued for each class of service【351122498378286†L102-L129】.  A respondent (director/officer) who is at least 18 years old, resides in Quebec and meets integrity criteria must file the application; the business must give the respondent access to required information【351122498378286†L145-L164】.

### Revenu Québec MSB licence (2025 guidance)

A 2025 guidance article summarises the provincial requirements for FINTRAC‑licensed entities operating in Quebec【606773160300859†L46-L57】.  Key points include:

- **Dual licensing** – The business must obtain both the **federal FINTRAC MSB registration and a Revenu Québec MSB licence**.  Operating with only one licence is illegal【606773160300859†L46-L57】.  The licence is required if the business has a branch in Quebec or offers services (physical or online) to Quebec residents【606773160300859†L80-L87】.
- **Services covered** – The Quebec licence covers currency exchange, fund transfers (domestic or international), operating ATMs or crypto kiosks, issuing money orders and cashing cheques【606773160300859†L93-L104】.  If the store provides any of these services, it must obtain the provincial licence.
- **Application process** – Applicants must prepare documentation (business identification, articles of incorporation, service descriptions, physical address and AML compliance program), undergo **criminal background checks** for directors and any person/entity holding ≥ 10 % ownership, and demonstrate financial solvency【606773160300859†L124-L150】.  The licence application is filed via Revenu Québec’s online portal and typically takes about **50 days**【606773160300859†L152-L156】.  Applicants should first obtain their FINTRAC MSB registration before applying【606773160300859†L106-L117】.
- **Licence issuance and renewal** – Once approved, the licence must be displayed at the business location and **renewed annually by March 31** by paying the required fee【606773160300859†L160-L166】.  The business must notify Revenu Québec of material changes.  Failure to renew or operating without a licence can lead to fines of **$5,000–$50,000 for individuals** and **$15,000–$200,000 for entities**【606773160300859†L172-L180】; repeated offences attract higher penalties and may lead to licence revocation【606773160300859†L188-L190】.

### Integration considerations for Quebec licensing

The OS should store provincial licence details, monitor renewal deadlines (March 31 each year), and maintain required documentation (articles of incorporation, directors’ background checks, compliance program).  Because Revenu Québec’s website is protected by anti‑abuse measures, the OS should prepare forms offline and provide instructions for manual upload.  If the store offers additional services (cheque cashing, money orders, ATM operation), ensure the system captures transactions for these services for both FINTRAC and provincial reporting.

## Designing the OS for compliance

1. **Client onboarding and KYC module** – Capture and verify identification documents using the prescribed methods, store ID images securely, conduct credit‑file or dual‑process checks, and record the occupation and source of funds.  The module should flag high‑risk clients (politically exposed persons, sanctions lists) and route them for compliance review.

2. **Transaction processing and aggregation engine** – Record each transaction with date/time, location, currency, amount, payment method, conductor, beneficiary, third parties, and purpose.  Implement logic to aggregate transactions by customer and 24‑hour periods to apply the $10,000 reporting threshold and 24‑hour rule【402638938046896†L125-L160】.  The engine should identify transactions requiring EFTRs, LCTRs or LVCTRs and automatically generate the appropriate report payload.

3. **Reporting manager** – For each report type (STR, LCTR, LVCTR, EFTR), the OS should populate the required fields using the latest FINTRAC schemas and validations.  Provide two submission pathways:
   - **FWR integration** – Generate human‑readable summaries or JSON files that can be manually uploaded into the Web Reporting System.  Track submission status, receipts and reference numbers.
   - **API integration** – Serialize report data into JSON and submit via the FINTRAC API using the application key/secret.  Handle responses and validation errors, and implement change/delete functions.  Respect transaction limits (500 per single report; 5,000 per bulk report)【301574286929531†L129-L137】.  Maintain logs for audit trails.

4. **Compliance dashboard** – Provide analytics on reporting volumes, suspicious activity trends, unresolved alerts, risk levels, and deadlines for report submission.  Include compliance program status (training completion, risk assessments, effectiveness reviews) and highlight ministerial directives or new regulations that may require system changes.

5. **Audit and record management** – Maintain a secure repository of all reports sent to FINTRAC (STRs, LCTRs, LVCTRs, EFTRs) and records such as transaction tickets, client information, service agreements and memos【796843540818882†L91-L150】.  Implement retention controls (minimum five years), with the ability to export data for FINTRAC exams or Revenu Québec inspections.

6. **Updates and regulatory monitoring** – Build functionality to monitor FINTRAC updates (e.g., new validation rules, new fields) and integrate them into the OS.  Recent amendments (2025) include private‑to‑private information sharing requiring submission of a code of practice【522349043219473†L80-L97】 and forthcoming obligations related to beneficial‑ownership discrepancies【522349043219473†L110-L116】.  The OS should allow configuration for new report types or fields as regulations evolve.

## Contact information and support

| Contact | Purpose |
|---|---|
| **F2R@fintrac‑canafe.gc.ca** | Request access to the FINTRAC Web Reporting System or support with electronic reporting【462645201387867†L52-L86】. |
| **tech@fintrac‑canafe.gc.ca** | Technical support for FINTRAC API report submission and related documentation【301574286929531†L296-L299】. |
| **msb‑esm@fintrac‑canafe.gc.ca** | Questions about MSB registration and ongoing obligations (federal). |
| **guidelines‑lignesdirectrices@fintrac‑canafe.gc.ca** | General questions about FINTRAC guidance. |
| **codeofpractice‑codedepratique@fintrac‑canafe.gc.ca** | Submission of voluntary codes of practice for private‑to‑private information sharing【522349043219473†L80-L97】. |
| **Revenu Québec** | For licensing, fees and tariff inquiries. (The Revenu Québec website is accessible through its online portal; the store may need to contact by phone or via the portal due to access restrictions.) |

## Conclusion

Developing an OS for a Montreal currency‑exchange business requires embedding compliance and reporting capabilities that satisfy **both federal and provincial regulations**.  The system must support KYC, risk assessment, record keeping and timely reporting of suspicious transactions, large cash/virtual currency transactions and electronic funds transfers.  Integrating the **FINTRAC API** enables high‑volume automated reporting with strict validation, while the **FINTRAC Web Reporting System** remains available for manual submissions and lower volumes.  Provincial obligations under Quebec’s Money‑Services Businesses Act demand a separate licence and renewal, and the OS must maintain documentation and monitor deadlines accordingly.  By incorporating these regulatory requirements into the system architecture, the storeowner can ensure that daily operations are both efficient and fully compliant.
EOF