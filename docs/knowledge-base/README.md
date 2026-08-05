# German driving licence knowledge base — Berlin, converting an Argentine licence

This is a research file. It is written for one **scenario**, and everything in it assumes that
scenario holds:

> A holder of a valid **Argentine** class B car licence, resident in Berlin, who holds **no EU
> driving licence**. Some passages additionally assume the reader holds an **EU passport**
> (Italian is used as the worked example), which matters only for the document list and the
> available exam languages.

The route assumed throughout is the *Umschreibung* — the conversion of a third-country licence
under *FeV* § 31 — and **not** a first licence from scratch. Because Argentina is not listed in
*Anlage 11 FeV*, that route requires both German exams, which shapes almost every page here. An
EU passport helps with administration and identity documents; it does not shorten the exam
requirements by a single question.

Everything in these documents was researched from web sources — primary law on
gesetze-im-internet.de first, then official Berlin and examiner pages — and then put through an
adversarial fact-checking pass. The research passes are dated **3–4 August 2026** and the
verification passes **4 August 2026**. Where a verifier corrected the researcher, the correction
won and is used in place; where a claim could not be confirmed against a primary source, it is
marked "⚠️ unverified" in the text rather than quietly dropped.

## The short version

1. **Argentina is not in *Anlage 11 FeV*, so you must pass both German exams.** The country annex
   listing states whose licences convert without examination contains no Argentine entry (and no
   Latin American state at all). The general rule of *FeV* § 31 Abs. 2 therefore applies: theory
   **and** practical are mandatory (*FeV* § 15 Abs. 1). What § 31 Abs. 2 *does* switch off is
   "*die Vorschriften über die Ausbildung*" — the formal training rules. No compulsory theory
   course, no 12 *Sonderfahrten*, no legal minimum number of driving lessons.
2. **You may drive on the Argentine licence for six months only, and then it is a crime.**
   *FeV* § 29 Abs. 1 Satz 4 grants six months from the factual establishment of your ordinary
   residence in Germany. After that window closes, and before your German *Fahrerlaubnis* issues,
   driving alone is *Fahren ohne Fahrerlaubnis* under *StVG* § 21 Abs. 1 Nr. 1 — up to one year's
   imprisonment or a fine. Lessons and exam drives with a *Fahrlehrer* stay covered
   (*StVG* § 2 Abs. 15). The § 29 Abs. 1 Satz 5 extension needs a credible sub-twelve-month stay,
   so it is not available to a permanent resident.
3. **There is no deadline to apply for the conversion.** The widely repeated "you must convert
   within three years" rule does not exist anywhere in *FeV* §§ 28–31 or *Anlage 11* — both the
   research and the independent verification pass read the full consolidated text to confirm this.
   The real cliff-edges are different: the Argentine licence must still be **valid and produced in
   the original** when you apply, and a licence obtained while you were already ordinarily resident
   in Germany is never recognised (*FeV* § 29 Abs. 3 Nr. 2). Note that the six-month driving clock
   in point 2 is a separate thing and is already running.
4. **The theory exam is available in Spanish, Italian and English; the practical is German only.**
   *Anlage 7 Nr. 1.3 FeV* lists all three among the 12 permitted foreign languages — and the
   English translations are widely criticised, so Spanish or Italian is probably your better
   choice. Nothing equivalent exists for the practical exam: it is in German, and no interpreter is
   permitted. Your instructor may sit in the car but may not translate the examiner's instructions.
5. **The eye test and the first aid course are both required on this route — neither is waived.**
   This is the single most commonly mis-stated fact about conversions. You need a *Sehtest*
   certificate less than two years old on the day you file (*FeV* § 12 Abs. 7), a first aid
   certificate that never expires (*FeV* § 19 Abs. 2 Satz 2), and one biometric passport photo on
   paper. One combined English-language first aid course in Berlin can produce all three in a day.

## Documents

| File | What it covers | Who it applies to |
| --- | --- | --- |
| [prerequisites.md](prerequisites.md) | Eye test, first aid course and biometric photos: what the law demands, what each costs in Berlin, which providers to use, and the smartest order to do them in | You, directly — first thing to act on |
| [theory-exam.md](theory-exam.md) | *Theorieprüfung* format and scoring, the frozen question catalogue, the 12 exam languages, fees, DEKRA's advance-transfer trap, retakes, and study materials in English, Spanish and Italian | You, directly — mandatory on the conversion route |
| [practical-exam.md](practical-exam.md) | *Praktische Prüfung*: 55-minute format, *Grundfahraufgaben*, instant-fail versus minor faults, German-only rule, fees, Berlin booking and backlogs, pass rates, and the habits experienced non-EU drivers get wrong | You, directly — mandatory on the conversion route |
| [costs-and-driving-schools.md](costs-and-driving-schools.md) | What the conversion actually costs versus a full first licence, unavoidable official fees, how to compare Berlin schools, English- and Spanish-speaking schools, and a warning about one specific website | You, directly — budgeting and choosing a school |
| [eu-licence-rules.md](eu-licence-rules.md) | *FeV* § 28 and why an EU passport does not help a third-country licence, the 185-day ordinary-residence rule, the Italian angle, and Directive (EU) 2025/2205's staggered timetable | You, for context — plus a hard stop if you have ever held an Italian *patente* |
| [first-licence-process.md](first-licence-process.md) | *Ersterteilung* from scratch: authority and filing points, fees, processing times, the *Prüfauftrag* mechanism, the 12-month deadlines, *Probezeit*, and the 2027 reform | Not your route — kept for the shared exam machinery and as a fallback if the conversion route closes |

## Raw research

[`raw/`](raw/) holds the output of the research agents: one
JSON per research domain, plus a `*-verification.json` carrying the adversarial fact-checker's
per-claim verdicts wherever that pass completed. This is the audit trail behind every claim in the
documents above. If you want to know where a number came from, whether a verifier confirmed it, or
what the researcher's original (possibly wrong) figure was before correction, it is in here. The
documents cite these filenames directly.

One caveat on fidelity: these files are the agents' findings, but they are **not byte-for-byte
verbatim**. They were re-serialised (pretty-printed) and passed through a de-personalisation
sweep that replaced the original per-person framing with the neutral scenario described above.
Substance, figures, sources and verdicts are untouched.

**Argentina-specific conversion research**

- `ar-legal-core.json` — the core legal question: whether Argentina appears in *Anlage 11 FeV* and
  what § 31 FeV then requires, read against the official consolidated text (last amended 12 May 2026).
- `ar-legal-core-verification.json` — adversarial re-check of that legal core.
- `ar-deadlines.json` — the six-month entitlement under § 29 Abs. 1 Satz 4, criminal exposure under
  *StVG* § 21, and the debunking of the phantom three-year conversion deadline.
- `ar-deadlines-verification.json` — verification pass that independently re-read §§ 28, 29 and 31
  FeV and all 24 official *Anmerkungen* to *Anlage 11* verbatim.
- `ar-berlin-process.json` — the Berlin procedure step by step: where to file, fees, processing
  time, documents, Argentina-specific requirements, and what happens after approval.
- `ar-berlin-process-verification.json` — verification pass that landed late (4 August 2026,
  after the documents above were written). It rates the research "medium" overall: the legal core
  holds up, but it finds material errors on where the finished licence is handed over, when the
  provisional driving entitlement is issued, the on-site photo, the GebOSt/VAT reasoning,
  translation timing, and several stale processing dates. **Read this before relying on any
  procedural detail marked "⚠️ unverified" in `costs-and-driving-schools.md`.**
- `ar-exams-practical.json` — what the exams look like on the conversion route specifically:
  the *Befähigungsprüfung* is the identical exam, not a reduced one. **No verification file.**
- `ar-alternatives.json` — alternative routes and long-term consequences, including Italy's
  open-ended bilateral reciprocity agreement with Argentina and why it does not rescue you in
  Berlin. **No verification file.**

**Domain research shared with the first-licence route**

- `prereqs.json` / `prereqs-verification.json` — eye test, first aid and photos with named Berlin
  providers. The verification pass found five material errors, all in the commercial pricing layer.
- `theory-exam.json` / `theory-exam-verification.json` — theory exam format, scoring, languages,
  fees and catalogue cycle.
- `practical-exam.json` — the practical exam under the OPFEP regime, researched for a first-time
  applicant rather than a converter. **No verification file.**
- `process.json` / `process-verification.json` — the official *Ersterteilung* application process
  in Berlin: LABO, the *Bürgerämter*, and the driving-school online route (FAO).
- `costs-schools.json` / `costs-schools-verification.json` — cost blocks and Berlin driving schools.
- `eu-italian.json` / `eu-italian-verification.json` — EU and Italian citizen specifics plus EU law
  changes. The verifier confirmed 18 of 26 claims, corrected 7 and could not resolve 3.

## How this was produced

Research was split across parallel agents, one per domain, under an official-sources-first rule:
primary law from **gesetze-im-internet.de** (*FeV*, *StVG*, *GebOSt* and their annexes) takes
precedence over everything; then official Berlin sources (**service.berlin.de**, LABO's own
processing-time tracker and information pages); then the examining organisations (**DEKRA**,
**TÜV**) and **ADAC**; then commercial and journalistic sources, which were treated as weak
evidence and flagged as such. Statutory claims were expected to quote the German text verbatim
rather than paraphrase it.

Each domain was then handed to a **separate, independent verifier that had not seen the research
being checked and was instructed to refute rather than confirm** — to go back to the primary source,
re-read it, and record a per-claim verdict. That adversarial framing is what caught the errors that
matter here: the phantom three-year conversion deadline, the staggered dates in Directive (EU)
2025/2205, and a cluster of stale provider prices.

Honesty about coverage: **not every verification pass completed.** Some verifier sessions hit
session limits before finishing, which is why three research files still have no
`-verification.json` counterpart — `ar-exams-practical`, `ar-alternatives` and `practical-exam`.
The affected documents say so explicitly in a provenance note near the top, and any figure resting
only on unverified research is marked "⚠️ unverified" at the point of use. Treat those marks as
real: they mean nobody checked the claim twice. `practical-exam.md` is the document most affected,
since neither of its two source files was ever verified.

One thing the documents themselves cannot tell you, because it happened after they were written:
the recovered verifier for `ar-berlin-process` finished late, so the provenance note in
`costs-and-driving-schools.md` claiming that file has "no verification file" **is now out of date**.
The verdicts exist, they are in `raw/ar-berlin-process-verification.json`, and they contradict the
research on several procedural points. Anything in that document sourced only from
`ar-berlin-process.json` should be re-read against them.

## Caveats

- **This is a study and planning aid, not legal advice.** It was assembled by research agents from
  public sources for the single scenario described at the top. It is not a substitute for advice from a lawyer or a
  binding statement from the authority.
- **Fees, waiting times and provider prices change**, and Berlin's backlogs move month to month.
  Every euro figure and every processing time here should be read as "check before you go" — the
  verification pass found that the commercial layer, not the statutory layer, is where facts go
  stale fastest.
- **The reform expected around early 2027 is still a draft** at the time of writing. Do not plan
  around it.
- **Always confirm your own case with LABO Berlin** (the *Fahrerlaubnisbehörde* of the Landesamt
  für Bürger- und Ordnungsangelegenheiten) before spending money or making irreversible decisions.
  Only they can tell you how your specific Argentine document will be treated.
