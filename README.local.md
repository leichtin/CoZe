<p align="center">
  <img src="images/logo-seal.png" alt="CoZe Logo" width="160" />
</p>

<h1 align="center">Consultant Zertifizierung (kurz CoZe)</h1>

<p align="center">
  <em>Die inoffizielle „Führerscheinprüfung" für Microsoft 365 Copilot Consultants.</em><br/>
  <strong>29 Fragen · 45 Minuten · 10 Fehlerpunkte erlaubt · Bestehst du?</strong>
</p>

<p align="center">
  📝 <strong>29 Fragen</strong> &nbsp;·&nbsp; 
  ⏱️ <strong>45 Minuten</strong> &nbsp;·&nbsp; 
  ⚡ <strong>Vanilla JS</strong> &nbsp;·&nbsp; 
  🌐 <strong>Static HTML</strong>
</p>

---

## 🚗 Was ist das?

Die **Consultant Zertifizierung (CoZe)** ist ein satirisches Quiz im Stil der deutschen Fahrschul-Theorieprüfung — nur dreht sich hier alles um **Microsoft 365 Copilot Consulting**.

Statt Verkehrsregeln werden Themen abgefragt wie:
- 🧠 **Grounding & Prompt Engineering** — Warum liefert der Agent Unsinn, wenn der SharePoint-Ordner 6.000 ungepflegte Dokumente enthält?
- 🔐 **Datenschutz & Oversharing** — Was passiert, wenn der Copilot vertrauliche HR-Daten in der Team-Suche ausspuckt?
- 🏛️ **Governance & Compliance** — Wie reagiert man auf veraltete Wissensdatenbanken, die gelöschte Standorte zurückgeben?
- 📊 **Adoption & Change Management** — Warum reicht eine einzige 45-Minuten-Schulung nicht für nachhaltige Copilot-Nutzung?
- 🤖 **KI-Halluzinationen** — Wenn der Copilot kreativ wird und Zahlen erfindet
- 💡 **Lizenzierung & Architektur** — E3 vs. E5, Multi-Tenant-Grenzen, Legacy-Systeme ohne REST-API

Jede Frage hat **eine richtige Antwort** und drei humorvolle, aber lehrreiche Distraktoren. Die Distraktoren sind absichtlich überspitzt formuliert — denn Humor bleibt im Gedächtnis.

---

## 🎯 Ziel & Motivation

| Ziel | Beschreibung |
|------|-------------|
| **Wissen testen** | Copilot Consultants können ihr Praxiswissen in realistischen Szenarien überprüfen |
| **Lernen durch Lachen** | Satirische Falschantworten machen typische Denkfehler und Anti-Patterns sichtbar |
| **Team-Einstufung** | Kann als lockerer Einstufungstest in Workshops oder Onboardings eingesetzt werden |
| **Diskussionsgrundlage** | Jede Frage eignet sich als Gesprächsstarter für tiefergehende Fachgespräche |

> **Hinweis:** Dies ist ausdrücklich **keine offizielle Microsoft-Zertifizierung**. Es ist ein privates Community-Projekt zu Lern- und Unterhaltungszwecken.

---

## ✨ Features

- 🎨 **Authentisches Fahrschul-Design** — Grünes Farbschema, Timer, Fehlerpunkte-System, Fortschritts-Navigation
- 🖼️ **29 Szenario-Bilder** — Jede Frage hat ein thematisches Cockpit-Bild aus Fahrerperspektive als visuelle Metapher
- ⏱️ **45-Minuten-Countdown** — Automatische Abgabe bei Zeitablauf
- ⭐ **Fragen markieren** — Schwierige Fragen für später vormerken
- 📊 **Detaillierte Auswertung** — Fehlerpunkte, Fehlerquote, Zeitverbrauch, Einzelergebnisse
- 🔄 **Review-Modus** — Nach Abgabe alle Fragen mit farblicher Korrektur durchgehen
- 📱 **Responsive Design** — Funktioniert auf Desktop, Tablet und Smartphone
- 🛡️ **Rechtlicher Disclaimer** — Integriertes Modal mit vollständigem Haftungsausschluss
- 🐾 **Chill Capybara Maskottchen** — Weil jede gute Prüfung ein Maskottchen braucht

---

## 🖼️ Szenario-Bilder

Jede Frage wird von einem thematisch passenden Bild begleitet, das die Fahrschul-Metapher visuell transportiert:

<p align="center">
  <img src="images/q27.jpg" alt="Frage 27 – Veraltete Wegweiser" width="420" style="border-radius:8px; margin:6px;" />
  <img src="images/q28.jpg" alt="Frage 28 – Fahrlehrer geht" width="420" style="border-radius:8px; margin:6px;" />
</p>
<p align="center">
  <em>Links: Veraltete Wegweiser als Metapher für ungepflegte Wissensdatenbanken (Q27)<br/>
  Rechts: Der Fahrlehrer winkt und geht — nach nur einer Schulung (Q28)</em>
</p>

---

## 🚀 Installation & Start

Kein Build-Tool, kein Framework, keine Abhängigkeiten. Einfach klonen und öffnen:

```bash
# Repository klonen
git clone https://github.com/<DEIN-USERNAME>/cc-pruefung.git
cd cc-pruefung

# Im Browser öffnen
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Alternativ: Die Dateien auf einen beliebigen Webserver (GitHub Pages, Netlify, etc.) hochladen — es handelt sich um eine rein statische Anwendung.

### Voraussetzungen

- Ein moderner Browser (Chrome, Firefox, Safari, Edge)
- Das war's. 🎉

---

## 📁 Projektstruktur

```
cc-pruefung/
├── index.html          # Haupt-HTML (Intro, Quiz, Modal, Ergebnisse)
├── index.css           # Vollständiges Styling (kein Framework)
├── index.js            # Quiz-Logik, Fragenkatalog, Timer, Navigation
└── images/
    ├── logo-seal.png   # Capybara-Maskottchen (transparenter Hintergrund)
    ├── favicon.png     # Browser-Tab-Icon
    ├── q01.jpg          # Szenario-Bild Frage 1
    ├── q02.jpg          # Szenario-Bild Frage 2
    ├── ...
    └── q29.jpg          # Szenario-Bild Frage 29
```

---

## 🎓 Themengebiete

| # | Bereich | Beispielfragen |
|---|---------|---------------|
| 1–3 | **Grounding & Datenqualität** | Unstrukturierter SharePoint, Legacy-Datenbanken, Prompt Engineering |
| 4–6 | **M365-Werkzeuge** | Teams-Copilot, Outlook-Zusammenfassungen, Word/PowerPoint-Agenten |
| 7–9 | **Architektur & Grenzen** | Copilot Studio vs. M365, Kanalgrenzen, Kontextwechsel |
| 10–12 | **Risiken & Compliance** | KI-Halluzinationen, Oversharing, Purview-Labels |
| 13–15 | **Governance & Datenschutz** | Audit-Logs, Multi-Tenant, Prompt-Datenschutztraining |
| 16–18 | **Lizenzierung & Infrastruktur** | E3 vs. E5, Tiefgaragen-Netzwerk, Hands-off-Steuerung |
| 19–21 | **Adoption & Change Management** | Widerstände, KPI-Definitionen, Use-Case-Priorisierung |
| 22–24 | **Praxis-Szenarien** | Dokumenten-Overload, Prompt-Chaining, Meeting-Protokolle |
| 25–27 | **Troubleshooting & Lifecycle** | Performance-Probleme, Rollout-Strategie, Data-Lifecycle |
| 28–29 | **Continuous Learning** | Nachhaltige Enablement-Programme, Stakeholder-Management |

---

## ⚖️ Disclaimer

> **Diese Anwendung ist ein inoffizieller, satirisch-funktionaler Fragenkatalog.**
>
> Sie steht in **keinerlei Verbindung zur Microsoft Corporation**, zu Microsoft Deutschland oder zu aktuellen bzw. ehemaligen Arbeitgebern des Erstellers. Alle genannten Marken (Microsoft, Copilot, Teams, SharePoint, Outlook, Purview u. a.) sind Eigentum ihrer jeweiligen Rechteinhaber.
>
> Testergebnisse stellen **keine offizielle Zertifizierung** oder rechtlich bindende Qualifikation dar.
>
> Der „§ 365 der KI-Betriebssicherheitsverordnung" ist ein fiktives Parodie-Konstrukt.

---

## 🛠️ Technologie

- **HTML5 / CSS3 / Vanilla JavaScript** — Zero Dependencies
- **Google Fonts** (Inter, Poppins, Share Tech Mono)
- **Font Awesome 6** für Icons
- Optimierte JPEG-Bilder (~155 KB pro Bild, 4,6 MB gesamt)

---

## 📄 Lizenz

Dieses Projekt ist ein privates Community-Projekt. Fragen zur Nutzung gerne per Issue.
