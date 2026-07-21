<p align="center">
  <img src="images/logo-seal.png" alt="CoZe Logo" width="160" />
</p>

<h1 align="center">CoZe — Consultant Zertifizierung</h1>

<p align="center">
  <em>The unofficial “driver’s license exam” for Microsoft 365 Copilot consultants.</em><br/>
  <strong>29 questions · 45 minutes · up to 10 mistakes · can you stomach it?</strong>
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green.svg" />
  <img alt="Static" src="https://img.shields.io/badge/deployment-GitHub%20Pages-blue.svg" />
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-none-brightgreen.svg" />
  <img alt="Languages" src="https://img.shields.io/badge/languages-EN%20%7C%20DE-orange.svg" />
</p>

---

## What is CoZe?

**CoZe (Consultant Zertifizierung)** is a satirical quiz modelled on the German driving theory exam — traffic rules swapped for the hard-to-swallow realities of **Microsoft 365 Copilot consulting**.

When grounding fails, oversharing surfaces, and a single lunch-and-learn is sold as “adoption,” CoZe is the cockpit check before you go live.

Topics include:

- 🧠 **Grounding & Prompt Engineering** — Why an agent returns nonsense when a SharePoint folder holds 6,000 neglected documents
- 🔐 **Privacy & Oversharing** — What happens when Copilot surfaces confidential HR data in a Teams search
- 🏛️ **Governance & Compliance** — How you handle a stale knowledge base that still cites deleted sites
- 📊 **Adoption & Change Management** — Why one 45-minute training session will not carry sustainable Copilot adoption
- 🤖 **AI Hallucinations** — When Copilot gets creative and invents the numbers

Each item has **one correct answer** and three plausible-but-wrong distractors. The wrong options are deliberately exaggerated — humour sticks better than another slide deck.

> **Disclaimer:** This is **not** an official Microsoft certification. It is an independent community project for learning and entertainment only. It has no affiliation with Microsoft Corporation or any employer of the author. All trademarks belong to their respective owners.

---

## Key Features

- ⚡ **Zero dependencies** — no build step, no `node_modules`, no bundler
- 🌐 **EN | DE** — UI and questions live in `locales/` JSON (`en.json`, `de.json`)
- 🏠 **Local-first** — runs entirely in the browser; no server, no backend, no data collection
- ⏱️ **45-minute countdown** — auto-submits when time is up
- ⭐ **Question flagging** — bookmark tough items and return later
- 🔄 **Review mode** — walk every answer with colour-coded corrections after submit
- 📊 **Detailed results** — mistake count, error rate, time used, per-question breakdown
- 🖼️ **Scenario images** — cockpit-style art on every question to keep the driving-exam metaphor alive
- 📱 **Responsive** — desktop, tablet, and mobile

---

## Screenshots

<p align="center">
  <img src="screenshots/q27_sample.jpg" alt="Question 27 – Outdated signposts as a metaphor for stale knowledge bases" width="420" style="border-radius:8px; margin:6px;" />
  <img src="screenshots/q28_sample.jpg" alt="Question 28 – Instructor waves goodbye after a single training session" width="420" style="border-radius:8px; margin:6px;" />
</p>

---

## Project Structure

```
CoZe/
├── index.html          # Application entry point (intro, quiz, results, modal)
├── index.css           # All styling — no CSS framework
├── index.js            # Quiz logic, question catalogue, timer, navigation
├── locales/
│   ├── en.json         # English UI strings and question content
│   └── de.json         # German UI strings and question content
├── images/
│   ├── logo-seal.png   # Capybara mascot (transparent background)
│   ├── favicon.png     # Browser tab icon
│   ├── q01.jpg         # Scenario image for question 1
│   └── …               # q02.jpg … q29.jpg
└── screenshots/        # Documentation and preview images
```

---


---

## Quick Start

No build tool or package manager required.

### Clone and open locally

```bash
git clone git@github.com:leichtin/CoZe.git
cd CoZe

open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

### VS Code Live Server (recommended for development)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Open the `CoZe` folder in VS Code.
3. Click **Go Live** in the status bar — the app reloads on save.

### GitHub Pages (production)

The `main` branch root is served via GitHub Pages. Push to `main` and the live site updates automatically.

---

## Contributing & Translations

Contributions are welcome. To add or update a language:

1. Copy an existing locale as a template:
   ```bash
   cp locales/en.json locales/<lang>.json
   ```
2. Translate all string values. Do **not** change JSON keys.
3. Register the locale in `index.js` (language-switcher section).
4. Open a pull request.

Bug reports and feature ideas: [GitHub Issues](https://github.com/leichtin/CoZe/issues).

---

## Technology Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Structure | HTML5                                            |
| Styling   | CSS3 (vanilla)                                   |
| Logic     | Vanilla JavaScript (ES2020+)                     |
| Fonts     | Google Fonts — Inter, Poppins, Share Tech Mono   |
| Icons     | Font Awesome 6                                   |
| Hosting   | GitHub Pages                                     |

---

## License

Licensed under the **MIT License** — see [LICENSE](LICENSE) for details.