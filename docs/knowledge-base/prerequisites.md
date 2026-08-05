# Prerequisites: eye test, first aid, biometric photos

*Research pass: 3 August 2026. Adversarial verification pass: 4 August 2026. Where the two disagreed, the verification pass wins and the correction is shown. Prices and processing times in Berlin move; treat every euro figure as "check before you go".*

## Bottom line

- You need all three: an eye test certificate, a first aid course certificate, and one biometric passport photo **on paper**. On your route — converting a non-EU (Argentine) licence, which is not listed in *Anlage 11 FeV* and therefore requires both German exams — the eye test and first aid are **not** waived. This is the single most commonly mis-stated fact about conversions.
- Your Italian passport makes you an EU citizen but does nothing for your **licence**. The relevant question is which country issued the driving licence, not which country issued your passport.
- The old "€6.43 maximum by law" eye-test fee **no longer exists**. The fee item was struck from the federal fee tariff; opticians now set their own price. *Fielmann* does the official test free of charge — verified verbatim on their own page.
- The smartest move is the *Erste Hilfe Station* combo: one ~7.5-hour English-language first aid course that includes a free official eye test **and** free biometric photos, so one day produces all three documents. Price is **€72.99 booked online** (€82.99 if you pay cash on the day) — not the €59.99 still shown on their homepage banner.
- The first aid certificate never expires (*FeV* § 19 Abs. 2 Satz 2). The eye test certificate must be less than two years old on the day you file (*FeV* § 12 Abs. 7). The photo must be a current likeness.
- Then file quickly. Berlin's own processing tracker showed roughly **eight weeks** as of 28 July 2026, and the driving-school online route was no faster.

---

## Does this apply to you? Yes — read this first

Two provisions of the *Fahrerlaubnis-Verordnung* (FeV, Driving Licence Ordinance) create the obligation, and both attach to the **class of licence being applied for**, not to your nationality and not to whether you already hold a foreign licence:

> "Bewerber um eine Fahrerlaubnis der Klassen AM, A1, A2, A, B, BE, L oder T haben sich einem Sehtest zu unterziehen." — *FeV* § 12 Abs. 2 ([gesetze-im-internet.de](https://www.gesetze-im-internet.de/fev_2010/__12.html))

> "…an einer Schulung in Erster Hilfe teilnehmen, die mindestens neun Unterrichtseinheiten zu je 45 Minuten umfasst" — *FeV* § 19 Abs. 1 ([gesetze-im-internet.de](https://www.gesetze-im-internet.de/fev_2010/__19.html))

You are a *Bewerber um eine Fahrerlaubnis der Klasse B* — an applicant for a German class B licence — because the *Umschreibung* (conversion) ends with Germany issuing you a German licence. Both provisions therefore bite.

**Scope of the exemption — now verified from a separate research pass.** This document's own source files did not cover *FeV* § 31 or Berlin's *Umschreibung* page, so the original draft flagged the "waived only for EU and *Anlage 11* conversions" framing as unverified. The Argentina-specific research pass (`ar-legal-core.json` and `ar-berlin-process.json`) did retrieve both, and it confirms the framing on two independent grounds:

1. **The statute.** *FeV* § 31 Abs. 1 — which applies to *Anlage 11* states — is what disapplies § 12 Abs. 2 and § 19. § 31 Abs. 2, the provision that governs all other third countries including Argentina, disapplies only *"die Vorschriften über die Ausbildung"* (the rules on training). The eye test and first aid are therefore untouched for you.
2. **Berlin's own checklist.** The required-documents list on [service.berlin.de/dienstleistung/327537](https://service.berlin.de/dienstleistung/327537/) — the *Umschreibung* page — marks first aid as *"Nachweis über Schulung in Erster Hilfe (Drittstaat)"*, i.e. third countries only, and the eye test as *"Drittstaat = immer erforderlich; Anlage-11-Staat = in der Regel nicht erforderlich"* (third country = always required; *Anlage 11* state = generally not required).

So both items are genuinely required on your route, and the widespread shortcut "first aid is only for first-time licences" is true for EU and *Anlage 11* conversions and false for yours. See [argentina-conversion.md](argentina-conversion.md) for the full legal analysis.

Two Berlin gates that apply to every route ([service.berlin.de](https://service.berlin.de/dienstleistung/121627/), verified verbatim): you need *Hauptwohnsitz in Berlin* (main residence in Berlin — a secondary residence only in justified exceptions and with the main-residence authority's consent), and *"Persönliche Vorsprache ist erforderlich"* (you must appear in person).

---

## 1. The eye test — *Sehtest*

### What the law requires

| Item | Rule | Basis |
|---|---|---|
| Who performs it | An *amtlich anerkannte Sehteststelle* (officially recognised vision-test centre), testing to DIN 58220 Teil 6 (Sept 2013 edition) | *FeV* § 12 Abs. 2; recognition governed by *FeV* § 67 |
| In practice | Opticians (*Fielmann*, *Apollo*, independents), *Augenärzte* (ophthalmologists), some recognised course providers | *FeV* § 67; Apollo: "vom Optiker, Amts- oder Augenarzt" |
| Pass threshold | Central daytime visual acuity of at least **0.7 in each eye**, with or without correction | *FeV* Anlage 6 Nr. 1.1: "mit oder ohne Sehhilfen mindestens beträgt: 0,7/0,7" |
| Validity | Certificate must be **no older than two years** when you file the application | *FeV* § 12 Abs. 7: "dürfen bei Antragstellung nicht älter als zwei Jahre sein" |
| ID check | The test centre must verify your identity from a *Personalausweis*, *Reisepass* or other ID document | *FeV* § 12 Abs. 2 Satz 3 |

**For you specifically:** you have an Italian passport, not a German *Personalausweis*. *Apollo*'s own instruction is: *"Bitte denken Sie daran, Ihren Personalausweis oder beim Reisepass zusätzlich die Meldebescheinigung mitzubringen"* — passport plus your Berlin registration certificate (*Anmeldebestätigung* / *Meldebescheinigung*). Bring both. *Fielmann* asks simply for passport or ID card: *"Es ist wichtig, dass Sie sich ausweisen können und Ihren Reisepass oder den Personalausweis mitbringen."*

### The fee: the €6.43 rule is gone

The federal fee tariff (*Gebührenordnung für Maßnahmen im Straßenverkehr*, GebOSt) contains **no eye-test fee at all**. Item 403, historically the *Sehtest* item, now reads simply *"403 (weggefallen)"* — abolished ([GebOSt Anlage, gesetze-im-internet.de](https://www.gesetze-im-internet.de/stgebo_2011/anlage.html)). The verification pass read the whole current tariff: the only *Sehtest*-related entry left is item 214.2, the €51.10–€307.00 fee an authority charges for *recognising* a test centre under § 67 *FeV* — nothing to do with your test.

So: **any 2026 website telling you "§ 12 FeV caps the eye test at €6.43" is wrong.** The price is freely set by the provider. Typical Berlin market range today is €0–10.

⚠️ Unverified detail: the attribution of old item 403 specifically to the *Sehtest*, and the date of the abolishing decision (reported as a *Bundesrat* decision of 15 February 2019), rest on secondary sources only — the pre-2019 tariff text could not be retrieved. The conclusion that matters (no regulated price today) is confirmed from the official tariff.

### Where to get it in Berlin

*Fielmann* is the obvious choice if you are not doing the combo course: **free**, verified verbatim on their own page — *"Der Führerscheinsehtest ist bei Fielmann kostenlos"* — for classes A, A1, A2, B, BE, AM, L and T ([fielmann.de](https://www.fielmann.de/service/fuehrerschein-sehtest/)). They also offer a free eye check *without* a certificate, useful as a pre-check. Their page links to appointment booking and says nothing about walk-ins or same-minute certificate issue, so book a slot rather than assuming.

| Provider / branch | Address | Price | Notes |
|---|---|---|---|
| Fielmann Friedrichshain | Frankfurter Allee 71–77, 10247 Berlin | Free | Friedrichshain, between U Samariterstraße and Frankfurter Tor |
| Fielmann ALEXA (Mitte) | Grunerstraße 20 (ALEXA mall), 10179 Berlin | Free | Mall also has drugstore + photo options |
| Fielmann Prenzlauer Berg | Schönhauser Allee 70c, 10437 Berlin | Free | Near U/S Schönhauser Allee |
| Fielmann Charlottenburg | Wilmersdorfer Straße 57, 10627 Berlin | Free | U7 Wilmersdorfer Str. |
| Fielmann Neukölln | Karl-Marx-Straße 151, 12043 Berlin | Free | Near U Karl-Marx-Straße |
| Fielmann Steglitz | Schloßstraße 28, 12163 Berlin | Free | Schloßstraße shopping district |
| Apollo ALEXA (Mitte) | Grunerstraße 20 (ALEXA mall), 10179 Berlin | Set per branch — ask | Online booking offered ("Jetzt Termin buchen") |
| Apollo Gesundbrunnen-Center | Badstraße 4, 13357 Berlin | Set per branch — ask | Mall also has a Fielmann branch and photo services |
| Apollo Charlottenburg | Wilmersdorfer Straße 52, 10627 Berlin | Set per branch — ask | Directly opposite Fielmann at no. 57 |
| Apollo Steglitz | Schloßstraße 29, 12163 Berlin | Set per branch — ask | Next to the Fielmann branch |

Correction applied: the researcher listed *Apollo* at "approx. €6.43". Verification found **zero** price statements on Apollo's page (no occurrence of "6,43", "Preis", "Kosten" or "Euro"); the figure circulates only via sites that wrongly present it as a statutory cap. Ask at the branch.

### If you need glasses, or if you fail

- **Passing only with correction** gives you a licence carrying harmonised code **01** *"Korrektur des Sehvermögens und/oder Augenschutz"* in field 12: 01.01 *Brille* (glasses), 01.02 *Kontaktlinse(n)*, 01.06 either (*FeV* [Anlage 9](https://www.gesetze-im-internet.de/fev_2010/anlage_9.html), B.I). Driving without the aid then breaches a restriction on your licence. The research does not contain a verified fine figure for that, so none is given here.
- **Failing the test** routes you to an *augenärztliche Untersuchung* (ophthalmologist's examination) under *FeV* Anlage 6 Nr. 1.2 instead: minimum 0.5 in the better eye or binocularly, plus a field of view of at least 120° horizontally with the central field normal to 20°.
- **Shortcut worth knowing:** under *FeV* § 12 Abs. 4 you can skip the *Sehtest* entirely by submitting an ophthalmologist's *Zeugnis* or *Gutachten* confirming you meet Anlage 6 Nr. 1.1. Useful if you already have a recent eye-doctor report.
- Anlage 6 Nr. 1.4 imposes a minimum three-month driving pause after loss of sight in one eye or newly occurring double vision. Applies only if that is your situation.

---

## 2. First aid course — *Erste-Hilfe-Kurs*

### What the law requires

> "…an einer Schulung in Erster Hilfe teilnehmen, die mindestens neun Unterrichtseinheiten zu je 45 Minuten umfasst … durch theoretischen Unterricht und durch praktische Übungen … Gegenstand der Schulung ist auch die Vermittlung von Grundwissen zur Organ- und Gewebespende." — *FeV* § 19 Abs. 1

The certificate must come from *"einer für solche Schulungen amtlich anerkannten Stelle oder eines Trägers der öffentlichen Verwaltung, insbesondere der Bundeswehr, der Polizei oder der Bundespolizei"* (*FeV* § 19 Abs. 2; recognition of providers under *FeV* § 68).

| Item | Detail |
|---|---|
| Length | 9 × 45 min plus breaks = about **7.5 hours**, one day. Typical Berlin course days run 09:00–16:30, 09:00–17:00 or 10:00–17:30 |
| Validity | **No expiry** for licence purposes |
| Not accepted | The old short *"Sofortmaßnahmen am Unfallort"* course. Berlin states this verbatim: *"Unterweisungen über die 'Sofortmaßnahmen am Unfallort' finden keine Anerkennung. In jedem Fall ist eine Teilnahmebescheinigung der 'Erste-Hilfe-Schulung' vorzulegen."* ([service.berlin.de](https://service.berlin.de/dienstleistung/121627/)) |
| Exempt | Doctors and dentists (including foreign training), regulated health professions, people with *Schwesternhelferin*/*Pflegediensthelfer*/*Sanitäts*- or *Rettungsdienst* training, and holders of the *Rettungsschwimmer* badge in silver or gold (*FeV* § 19 Abs. 3) |

**Why it never expires — cite the statute, not blogs.** § 19 sets no validity period, and § 19 Abs. 2 Satz 2 goes further: *"Im Falle der Erweiterung oder der Neuerteilung einer Fahrerlaubnis ist auf einen Nachweis zu verzichten, wenn der Bewerber zuvor bereits an einer Schulung in Erster Hilfe im Sinne des Absatzes 1 teilgenommen hat."* The researcher's original citation for "lifetime validity" was a *Bußgeldkatalog* blog; the verification pass replaced it with this provision.

**Do not confuse regimes.** Workplace first-aiders (*betriebliche Ersthelfer*) must refresh every two years under DGUV rules. That is a different system and has nothing to do with your licence certificate.

### The bundle worth taking: *Erste Hilfe Station*

This is the efficient option and the reason the whole prerequisite block can be one day. *Erste Hilfe Station* is recognised by the Berlin Senate department under **both** § 68 *FeV* (first aid) **and** § 67 *FeV* (vision-test centre), in their own words:

> "certificated as an official institute for First aid courses and Eye tests by the Berlin Senate Department for Environment, Transport and Climate Protection according to §§ 67 and 68 of the … Fahrerlaubnisverordnung"

(That Senate department has since been renamed *Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt*; their page text is dated but the dual recognition is the substance.) The course ticket includes a **free official eye test and free biometric photos** — confirmed in their live shop listings, e.g. *"First Aid Course - English - DRIVING LICENSE/TRAINER/MED.PERSONAL + gratis eye test + photos / Berliner Stadtmission, Frankfurter Allee 96 … 9am - 4:30pm - Regular price €72,99"*.

**Price correction — important.** The homepage banner advertising **€59.99 is stale; do not rely on it.** Every driving-licence ticket in their own shop is priced **€72.99 when booked online**, and their FAQ states: *"If you exceptionally pay on the spot, a surcharge of 10 EUR will be charged. Cash payment only."* → **€82.99 cash on the day.** Online booking is mandatory: *"you can only join the course with an online booking."*

**Schedule correction.** The researcher said Wednesday/Saturday/Sunday. The live August–November 2026 schedule shows **Thursday, Friday, Saturday and Sunday** dates and **no Wednesday** dates. Some dates also run in Spanish (*en español*) and Russian — relevant to you if you would rather do it in Spanish.

Six venues host the driving-licence course (their FAQ's "8 places" count includes baby/child-only venues):

| Venue | Address | Note |
|---|---|---|
| Berliner Stadtmission | Frankfurter Allee 96, 10247 Berlin | **Friedrichshain**, on the same street as the Fielmann branch above |
| St. Georg parish hall | Kissingenstraße 33, 13189 Berlin | Pankow |
| MediPoint | Bismarckstraße 42/43, 10627 Berlin | Charlottenburg |
| Fahrschule Frenzel | Esmarchstraße 4, 10407 Berlin | Prenzlauer Berg |
| SprengelHaus | Sprengelstraße 15, 13353 Berlin | Wedding |
| Fahrschule Oscar | Hauptstraße 92, 12159 Berlin | Schöneberg |

Booking and dates: [first-aid-course-english-berlin.com/dates-places](https://www.first-aid-course-english-berlin.com/dates-places); prices and FAQ: [/prices-faq](https://www.first-aid-course-english-berlin.com/prices-faq); live shop: [first-aid-courses-berlin.myshopify.com](https://first-aid-courses-berlin.myshopify.com/collections/all). "Certificate issued same day" is *not* stated on their pages — ⚠️ unverified; ask when booking.

### Other English-language first aid options in Berlin

| Provider | Address | Price | Status |
|---|---|---|---|
| **ANB Berlin** | anb-berlin.de (venue not captured in research) | **from €55.00** | Cheapest **verified** English option; page says explicitly "for the driving license" |
| Erste Hilfe Station | 6 venues above | €72.99 online / €82.99 cash | Includes free eye test + photos |
| ASB Berlin-Südwest | Lahnstraße 52, 12055 Berlin, 4th floor (Neukölln, near S Köllnische Heide) | **€75.00 regular / €70.00 reduced** | Live booking system; 15–16 places; dates 09:00–17:00 on varied weekdays |
| DRK Berlin-Zentrum | Herbartstraße 25, 14057 Berlin | €80.00 | **English courses paused** — check before relying on it |
| SoftAid | 14 Berlin venues, e.g. Storkower Str. 101B, 10407 Berlin (Weißensee); also Friedrichshain, Koppenstr. 62 | Not published — ask | Recognised for all classes under § 19 *FeV*; "Passfotos & Sehtest vor Ort möglich"; certificate on the course day |
| Johanniter | Ausbildungszentrum Berlin/Brandenburg | Not published — ask | English events listed in principle |

Corrections and caveats behind that table:

- **ASB:** the researcher's €65/€60 came from a static page last updated 06.03.2025. The live *hiorg-server* booking system shows **€75 regular / €70 reduced** (students, trainees, FSJ/BFD volunteers, retirees, disability ≥70%) and confirms licence validity: *"Participation in the basic first aid course is required for obtaining a driver's license (all classes)."* Oddly, the static page's body text describes the childcare-facilities variant — trust the booking page.
- **DRK:** verbatim on their own page — *"Duration: 8 hours | Course fee: 80,00 Euro"*, *"This first aid training is valid for the acquisition of a driving licence"*, and *"Unfortunately, we are not currently offering first aid courses in English. We hope to be able to offer courses again in the second half of the year."* That notice was still up on 4 August 2026 and is undated, so no resumption date should be inferred. Contact: Team Ausbildung, (030) 600 300 5120.
- **SoftAid:** the "from €35" figure the researcher reported appears **nowhere** on soft-aid.de — dropped. Also soften the English promise: their FAQ says *"Yes, of course! We provide First Aid courses in English"* but adds that in all other courses instructors *hand out English translations* and support you during practicals. Not every date is an English-language course.
- **Johanniter:** English provision is confirmed in principle (their Berlin/Brandenburg training-centre page lists *"Veranstaltungen in englischer Sprache"*), but the address Culemeyerstraße 2, 12277 Berlin and the phone number +49 30 816901-705 that the researcher gave **could not be verified** — ⚠️ unverified, call before travelling.
- **German-language courses**, for comparison: *Primeros* Berlin-Mitte from **€45.90** with online payment. No Berlin German-language course at €35 was verifiable, so treat "from about €40" as the realistic floor. ⚠️ The researcher's "€35–50" range is not supported.
- M-A-U-S (erstehilfe.de) and erstehilfeschuleberlin.de were listed by the researcher but **not re-verified** — treat as unconfirmed leads.

### One practical trap

The *Bürgeramt* **keeps your original first-aid certificate** (*Erste Hilfe Station* FAQ: "The Citizen's Office (Bürgeramt) will retain your official certificate of attendance"), and a replacement official copy from that provider costs **€29.99**. Photograph or scan the certificate before your appointment.

---

## 3. Biometric photos

### What Berlin asks for

Berlin's requirement, verbatim from the official service page:

> "1 aktuelles, biometrisches Passfoto auf Papier — Bitte bringen Sie ein Foto mit. Vor Ort werden keine Papierfotos gedruckt."

One current biometric passport photo **on paper**; bring it with you, because no paper photos are printed at the office ([service.berlin.de/dienstleistung/121627/](https://service.berlin.de/dienstleistung/121627/)). The page links a sample-photo chart, the [*Foto-Mustertafel* PDF](https://www.berlin.de/labo/_assets/kraftfahrzeugwesen/foto-mustertafel.pdf) (image-only, so the text could not be machine-checked).

Correction: the researcher stated "35×45 mm" as a Berlin-quoted figure. It is **not** on the Berlin page — the page only says *biometrisches Passfoto auf Papier*. 35×45 mm is the standard German biometric format and dm's app offers a dedicated *Führerschein* template, so ask for that template rather than quoting a size Berlin never printed.

### The 2025 change — and why it does not affect you

Since **1 May 2025**, only digital biometric photos are admissible for *Reisepässe*, *Personalausweise*, *elektronische Aufenthaltstitel* and *Reiseausweise nach dem Ausländerrecht*: produced at the authority or an authorised photo provider, transferred via a secure cloud and retrieved with a DataMatrix code. Paper photos were still accepted for those documents until **31 July 2025**. Federal guidance is explicit that licences are outside this:

> "Für andere Dokumente, bspw. den Führerschein können auch weiterhin Papierlichtbilder verwendet werden."

Source: [personalausweisportal.de](https://www.personalausweisportal.de/SharedDocs/kurzmeldungen/Webs/PA/DE/2025/neue-passbilder.html). This federal page replaces the municipal (Stadt Datteln) citation the researcher used, and its document list replaces the researcher's — in particular "eID-Karte" was not verifiable and has been dropped. Berlin still required a paper photo for the licence in 2026, so the two sources agree.

**Watch this:** pilot projects for fully digital photo submission were reported for ID documents in 2026. If Germany ever extends the e-photo rules to licences, this section needs updating.

### Costs

| Where | Price | Confidence |
|---|---|---|
| **Free** inside the *Erste Hilfe Station* combo course | €0 | Confirmed |
| dm-drogerie markt, via the **dm-Passbild-App** (you shoot it yourself, print at any dm photo station, pay at the till) | **€5.95** incl. VAT | Confirmed on dm's own site: *"nur 5,95 EUR"*. You get two 10×15 cm sheets — one with 6 biometric photos sized to the chosen document template, plus an enlargement sheet with a QR code for the digital copy |
| Rossmann | "about €1 cheaper than dm" | ⚠️ Unverified — Rossmann's site is JavaScript-only and could not be checked |
| Fotofix-style booths (Alexanderplatz station, Hauptbahnhof, most major S+U stations) | quoted as €6–12 per set | ⚠️ Unverified |
| Photographers | quoted as €15–25 | ⚠️ Unverified |

Correction: the researcher's dm figures (€9.95–€14.95) are wrong for your purpose. dm's staff-photographed in-store service is now oriented to the **digital** e-photo flow for *Pass*/*Personalausweis*/*Aufenthaltstitel*; *Führerschein* paper photos are routed to the self-service app at **€5.95** ([foto.dm.de](https://foto.dm.de/app-biometrische-passfotos-selber-machen.html)).

---

## The smartest order

1. **Book an English *Erste Hilfe Station* course online** at the Friedrichshain venue (Frankfurter Allee 96, Berliner Stadtmission). Book early: English dates sell out and online booking is mandatory. One ~7.5-hour day gives you the first aid certificate, the official *Sehtest* certificate and the biometric photos. Cost: **€72.99 online**.
2. **Bring your passport and your Berlin *Anmeldebestätigung*.** The eye test cannot legally be issued without an identity check (*FeV* § 12 Abs. 2 Satz 3), and providers ask for a passport *plus* registration certificate when you have no German ID card.
3. **Photograph or scan the first aid certificate** the same evening — the *Bürgeramt* keeps the original, and a replacement copy costs €29.99.
4. **File immediately.** Berlin's own tracker ([LABO *Aktuelle Bearbeitungsstände*](https://www.berlin.de/labo/mobilitaet/aktuelles/aktuelle-bearbeitungsstaende-736453.php), page updated 28 July 2026) showed *Ersterteilung* applications dated 02.06.2026 in processing — about **eight weeks** — and driving-school online submissions at 04.06.2026, i.e. the online route was **not** faster. Quote the tracker, not a static number: LABO also notes those dates allow no conclusions about collection appointments, and that processing starts only once all documents are in and all fees are paid.
5. **If you skip the combo:** do the eye test free at *Fielmann* Friedrichshain (Frankfurter Allee 71–77) and photos at a dm with the *Passbild*-App on the same walk. Malls such as ALEXA and the Gesundbrunnen-Center put optician, drugstore and photo booth under one roof.

Timing constraints to hold in your head: **eye test — maximum two years old at filing** (*FeV* § 12 Abs. 7); **first aid — never expires** (*FeV* § 19 Abs. 2 Satz 2); **photo — must be a current likeness** (*service.berlin.de*: *"1 aktuelles … Passfoto"*).

---

## Adjacent facts you will need next (not prerequisites, but don't get caught out)

These belong to the application and exam stages, and some apply to a different persona than yours. Included because they change how you plan.

- **Deadlines after approval:** once you have the *Prüfungszulassung* (exam approval), the theory exam must be passed within **12 months**, and the practical within **12 months** of passing the theory. Source: LABO, "Informationen zum Erwerb einer Fahrerlaubnis" — ⚠️ the research recorded only a partial path (`berlin.de/labo/…/artikel.283188.php`), so look it up rather than trusting a reconstructed URL.
- **Prüfstelle lock-in:** the application names both your *Fahrschule* and your *Prüfstelle* (examining body), and Berlin words the lock-in as *"Nach Erhalt der Prüfungszulassung ist ein Wechsel der Prüfstelle nicht mehr möglich"* — after you receive the exam approval, no switching.
- **Berlin's fee — the €45.90 on the first-issuance page is *not* yours.** This document's sources covered only *Ersterteilung* (€45.90 plus €6.32 *Direktversand*). The Argentina-specific pass since retrieved the correct figure for your route: **€45.10** for *"Umschreibung einer ausländischen Fahrerlaubnis mit Prüfung"* (conversion with examination), verified against both LABO's fee list and [service.berlin.de/dienstleistung/327537](https://service.berlin.de/dienstleistung/327537/). Note the trap: the €37.50 you may also see is the *without examination* rate for EU and *Anlage 11* licences, which does not apply to an Argentine licence.
  - ⚠️ **Unresolved conflict on the postage fee.** The *Ersterteilung* research gives **€6.32** for *Direktversand*, while the *Umschreibung* research gives **€5.31** for "FSW Direktversand", each citing LABO's fee schedule. These may be two distinct fee items or one may be stale. It is a few euros either way — confirm at the counter rather than budgeting precisely.
- **FAO is not a self-service online application.** *Führerschein-Antrag Online* is a driving-school-side digital submission, currently open only to Berlin driving schools, and LABO's page lists it as covering *Ersterteilung*, *Erweiterung*, *Begleitetes Fahren ab 17* and AM15 — **conversion is not in that list** (⚠️ so its availability for your route is unverified). Berlin still says *"Persönliche Vorsprache ist erforderlich"*.
- **Exam fees in Berlin** (DEKRA *Technische Prüfstelle* price list valid from 05.02.2024): theory **€21.00 net / €24.99 gross**; practical class B/BE **€109.10 net / €129.83 gross**. GebOSt amounts are net and the *Prüfstelle* adds 19% VAT. Relevant to you because your route requires both exams.
- **DEKRA payment deadline — corrected:** the fee must reach DEKRA at least **10 days** before the exam (not "10 working days"): *"überweisen Sie die entsprechende Prüfgebühr … bitte bis spätestens 10 Tage vor dem Prüfungstermin"*. The reference must read `FE` + your 10-digit *Bewerbernummer* + surname, first name; with an unassignable payment the exam may not take place.
- **Where exams happen.** DEKRA theory exams are **walk-in, no appointment**, Mon–Thu 13:00–17:00 and Fri 07:30–15:00 at Hohenschönhausen (Ferdinand-Schultze-Str. 65, 13055, tel 030/9860983-0), Reinickendorf (Kurt-Schumacher-Damm 28, 13405, tel 030/9860982-0) and Tempelhof (Ullsteinstr. 86–94, 12109, tel 030/9860981-0). DEKRA Spandau explicitly runs none: *"An diesem Standort werden keine Theorieprüfungen durchgeführt."* The theory exam is available in English on the PC. Practical exams are arranged through your *Fahrschule*.
- **Berlin is unusual in having two examining bodies.** TÜV Rheinland also examines here, at **three** Berlin theory sites — Schöneberg (Alboinstr. 56, 12103), Spandau (Pichelswerderstr. 9, 13597) and **Marzahn (Allee der Kosmonauten 39, 12681)**, which the researcher missed — plus a *Führerscheinbüro* at Alboinstr. 56. TÜV publishes **no opening hours** for these sites (*"Bitte informieren Sie sich vor der Anfahrt … auf Google"*), so the widely reported Mon–Thu 14:00–18:00 / Fri 08:00–14:00 hours come from a driving school's page only — ⚠️ verify locally.
- **After you pass:** you receive a temporary *Nachweis der Fahrberechtigung* valid 3 months and only together with photo ID; the card licence is then produced and delivered by Deutsche Post as *Einschreiben Einwurf* to the address on the application — which is what the optional €6.32 fee covers. Your name must be on the letterbox.
- The researcher's claim "DEKRA has been an authorised *Prüfinstitution* in Berlin since 1990" and "Berlin wants originals, not copies" were both **not verifiable** — dropped.

---

## Still open — verify these yourself before spending money

1. Whether Berlin's *Umschreibung* required-documents list names the *Sehtestbescheinigung* and *Erste-Hilfe-Bescheinigung*, and the exact wording of any exemption in *FeV* § 31. Neither was retrieved in this research.
2. The *Umschreibung* fee for a third-country licence in Berlin — absent from this research.
3. *Erste Hilfe Station*'s live price at booking. €72.99/€82.99 is verified from their shop and FAQ; their homepage still shows €59.99.
4. Whether your chosen *Erste Hilfe Station* date is genuinely English (or Spanish) — the schedule rotates by venue.
5. DRK Berlin-Zentrum: whether English courses have resumed.
6. Johanniter: English dates, price, and the address/phone number (unverified above).
7. Whether the dm branch nearest you supports the *Passbild*-App print flow — check dm's store finder.
8. Whether Germany extends the digital-photo mandate to driving licences; pilots were reported in 2026 for ID documents.
9. Current *Bürgeramt* appointment lead times, which fluctuate.
10. TÜV Rheinland Spandau's coordinates in the research are block-level estimates; TÜV writes the street number as "9", the driving-school source as "9–11".

---

## Sources

| Name | URL | Official? |
|---|---|---|
| *FeV* § 12 — *Sehvermögen* (eye test, 2-year validity, ID check, § 12 Abs. 4 shortcut) | https://www.gesetze-im-internet.de/fev_2010/__12.html | Yes |
| *FeV* Anlage 6 — visual acuity 0.7/0.7, failure path Nr. 1.2, Nr. 1.4 | https://www.gesetze-im-internet.de/fev_2010/anlage_6.html | Yes |
| *FeV* § 19 — *Schulung in Erster Hilfe* (9 × 45 min, no expiry via Abs. 2 S. 2, exemptions) | https://www.gesetze-im-internet.de/fev_2010/__19.html | Yes |
| *FeV* Anlage 9 — *Schlüsselzahlen* (code 01 glasses/contacts) | https://www.gesetze-im-internet.de/fev_2010/anlage_9.html | Yes |
| GebOSt *Gebührentarif* — item 403 *(weggefallen)*, no eye-test fee exists | https://www.gesetze-im-internet.de/stgebo_2011/anlage.html | Yes |
| service.berlin.de — *Fahrerlaubnis Ersterteilung* (paper photo, documents, fees, Hauptwohnsitz) | https://service.berlin.de/dienstleistung/121627/ | Yes |
| LABO *Foto-Mustertafel* (sample photo chart, image-only PDF) | https://www.berlin.de/labo/_assets/kraftfahrzeugwesen/foto-mustertafel.pdf | Yes |
| LABO — *Aktuelle Bearbeitungsstände* (live processing times) | https://www.berlin.de/labo/mobilitaet/aktuelles/aktuelle-bearbeitungsstaende-736453.php | Yes |
| LABO *Fahrerlaubnisbehörde* (Puttkamerstr. 16–18, 10969 Berlin, tel 030/90269-2300) | https://www.berlin.de/labo/mobilitaet/fahrerlaubnisse-personen-und-gueterbefoerderung/ | Yes |
| Personalausweisportal (BMI) — digital photos from 1 May 2025, licences excluded | https://www.personalausweisportal.de/SharedDocs/kurzmeldungen/Webs/PA/DE/2025/neue-passbilder.html | Yes |
| DEKRA Berlin-Hohenschönhausen (theory hours, walk-in, payment rules) | https://www.dekra.de/de/berlin-hohenschoenhausen/ | Yes |
| DEKRA Berlin-Reinickendorf | https://www.dekra.de/de/berlin-reinickendorf/ | Yes |
| DEKRA Berlin-Tempelhof | https://www.dekra.de/de/berlin-tempelhof/ | Yes |
| DEKRA Berlin-Spandau (no theory exams) | https://www.dekra.de/de/berlin-spandau/ | Yes |
| TÜV Rheinland location finder — Berlin theory sites (Schöneberg / Spandau / Marzahn) | https://www.tuv.com/germany/de/locationfinder/location-detail-page_130122.html | Yes |
| Fielmann — *Führerschein-Sehtest* free of charge | https://www.fielmann.de/service/fuehrerschein-sehtest/ | No |
| Fielmann Berlin branches | https://www.fielmann.de/niederlassungen/stadt/be/berlin/ | No |
| Apollo — *Führerschein-Sehtest* (ID requirements, no price published) | https://www.apollo.de/service/fuehrerschein-sehtest | No |
| Apollo Berlin branches | https://www.apollo.de/filialen/berlin | No |
| Erste Hilfe Station — homepage (stale €59.99 banner; §§ 67/68 recognition) | https://www.first-aid-course-english-berlin.com/ | No |
| Erste Hilfe Station — dates and places | https://www.first-aid-course-english-berlin.com/dates-places | No |
| Erste Hilfe Station — prices & FAQ (€72.99, +€10 cash surcharge, 7.5 h, Bürgeramt keeps original) | https://www.first-aid-course-english-berlin.com/prices-faq | No |
| Erste Hilfe Station — live shop listings (per-date prices) | https://first-aid-courses-berlin.myshopify.com/collections/all | No |
| ASB Berlin-Südwest — English course (static page, €65/€60, last updated 06.03.2025) | https://www.asb-berlin-suedwest.de/ausbildungsangebote/courses-in-english/first-aid-course.html | No |
| ASB — live booking system (€75/€70, Lahnstr. 52, licence validity) | https://www.hiorg-server.de/kurse_extern.php?ov=rvs&id=1541&kt=21630 | No |
| DRK Berlin-Zentrum — English first aid (€80, currently paused) | https://www.drk-berlin-zentrum.de/angebote/kurse-in-erster-hilfe/first-aid-in-english.html | No |
| SoftAid Berlin — *Führerschein* first aid, 14 venues | https://soft-aid.de/erste-hilfe/fuehrerschein/berlin | No |
| SoftAid — English *Führerschein* page | https://soft-aid.de/erste-hilfe/fuehrerschein-englisch/berlin | No |
| Johanniter — *Erste-Hilfe Führerschein* | https://www.johanniter.de/dienste-leistungen/medizinische-hilfe/erste-hilfe/erste-hilfe-kurse-fuer-privatpersonen/erste-hilfe-fuehrerschein/ | No |
| dm — biometric *Führerschein* photos via the dm-Passbild-App, €5.95 | https://foto.dm.de/app-biometrische-passfotos-selber-machen.html | No |
| dm — biometric photos overview | https://foto.dm.de/biometrische-passbilder-passfotos.html | No |
| AS Fahrschule — TÜV/DEKRA *Prüfstellen* list (source of the unverified TÜV opening hours) | https://www.as-fahrschule.de/service/tuev-dekra/ | No |
| schein-sehtest.de — history of the €6.43 figure (secondary; the "statutory cap" claim is wrong) | https://www.schein-sehtest.de/sehtest-fuehrerschein-kosten | No |
| bussgeldkatalog.org — *Erste-Hilfe-Kurs* (superseded by *FeV* § 19 Abs. 2 S. 2 for the no-expiry claim) | https://www.bussgeldkatalog.org/erste-hilfe-kurs/ | No |
| drohnen.de — dm/Rossmann photo price survey 2026 (superseded by dm's own site) | https://www.drohnen.de/76313/passbilder-bei-dm-rossmann-2026-preise-oeffnungszeiten-qualitaet-wartezeit/ | No |
| Stadt Datteln — digital photos not required for licences (superseded by the federal source) | https://www.datteln.de/news/ab-1-mai-muessen-sie-fuer-ausweise-digitale-bilder-einreichen-fuer-fuehrerscheine-sind | Yes (municipal) |
| ANB Berlin — English first aid course from €55 (URL not captured in research; site: anb-berlin.de) | https://www.anb-berlin.de/ | No |
| Primeros Berlin-Mitte — German course from €45.90 online | https://www.primeros.de/erste-hilfe-kurse/erste-hilfe-berlin-mitte/ | No |
