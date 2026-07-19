// State Variables
let questions = [];
let currentIndex = 0;
let userAnswers = {}; // Maps index to selected answer index (array of single index)
let starredQuestions = {}; // Maps index to boolean (starred/bookmarked)
let resolvedQuestions = {}; // Maps index to boolean (whether "Auflösung" was clicked for this question)
let timeLeft = 2700; // 45 minutes in seconds
let timerInterval = null;
let reviewMode = false;
let isSubmitted = false;

// Copilot Consultant Theorieprüfung Question Pool (29 Questions)
// Each question has one correct answer. Correct answers are placed first and marked as correct:true.
// Option prefixes (A, B, C, D) are prepended dynamically. Suffix "(richtige Antwort)" is removed.
const copilotQuestionsPool = [
    {
        number: "Frage 1",
        points: 4,
        text: "Ein Fachanwender nutzt einen unstrukturierten SharePoint-Ordner (6.000 historische Dokumente) als Wissensbasis für seinen Copilot-Agenten. Wegen irrelevanter und widersprüchlicher KI-Antworten beschwert er sich über die Qualität. Wie reagieren Sie?",
        picture: "sharepoint-collision.jpg",
        image: "images/q01.jpg",
        pictureDesc: "Szenario: Datenflut! Ein riesiger unstrukturierter Ordner blockiert die Groundedness des Copilot Agents.",
        isVideo: false,
        answers: [
            { text: "Dem Mitarbeiter raten, nur eine gezielt ausgewählte Auswahl relevanter Dokumente zu nutzen, statt pauschal den gesamten Ordner anzubinden.", correct: true },
            { text: "Ich führe eine Gefahrenbeschleunigung aus, um der Datenflut zu entkommen.", correct: false },
            { text: "Dem Mitarbeiter raten, weitere 6.000 unstrukturierte Dokumente hinzuzufügen, da eine größere Datenmenge die Qualität der Antworten optimiert.", correct: false },
            { text: "Dem Mitarbeiter versprechen, dass Copilot das bald unterstützen wird, um den Call zu beenden.", correct: false }
        ]
    },
    {
        number: "Frage 2",
        points: 5,
        text: "Ein Kunde verlangt die Echtzeit-Anbindung einer 20 Jahre alten On-Premises-Datenbank ohne REST-Schnittstelle an den M365 Copilot. Was ist zu beachten?",
        picture: "onprem-obstacle.jpg",
        image: "images/q02.jpg",
        pictureDesc: "Szenario: Eine veraltete On-Prem Datenbank verstopft die moderne Datenautobahn des M365 Copilot.",
        isVideo: false,
        answers: [
            { text: "Das Vorhaben erfordert den Aufbau eines Data Gateways.", correct: true },
            { text: "Ich versuche, die Daten manuell während der Fahrt per Excel-Schnittstelle einzutippen.", correct: false },
            { text: "Ein solches Hindernis darf ignoriert werden; der Copilot errät die Daten im Zweifel.", correct: false },
            { text: "Ich hupe laut, ziehe die Handbremse und starte Outlook neu.", correct: false }
        ]
    },
    {
        number: "Frage 3",
        points: 4,
        text: "Die Fachabteilungen fangen an, eigenmächtig und ohne IT-Freigabe externe, kostenlose LLM-Tools mit internen Firmendaten zu füttern (Shadow IT). Welche Sofortmaßnahme greift?",
        picture: "shadow-it-glare.jpg",
        image: "images/q03.jpg",
        pictureDesc: "Szenario: Blendende Scheinwerfer durch unautorisierten Abfluss von Firmendaten in kostenlose LLMs.",
        isVideo: false,
        answers: [
            { text: "Bereitstellung einer sicheren, firmeninternen Alternative (wie M365 Copilot) und Sperrung unsicherer KI-URLs via Cloud App Security (Defender for Cloud Apps).", correct: true },
            { text: "Ich hänge mich in den Windschatten des Fahrzeugs und nutze deren Logins für meine privaten Prompts.", correct: false },
            { text: "Ich blende den Gegenverkehr mit Fernlicht, um von der Situation abzulenken.", correct: false },
            { text: "Ich ignoriere das Problem, solange die Projekt Deadlines eingehalten werden.", correct: false }
        ]
    },
    {
        number: "Frage 4",
        points: 3,
        text: "Sie treten einem einstündigen Teams-Meeting 45 Minuten zu spät bei. Wie verschaffen Sie sich schnell einen Überblick, ohne die anderen zu stören?",
        picture: "teams-tunnel.jpg",
        image: "images/q04.jpg",
        pictureDesc: "Szenario: Sie fahren verspätet in ein laufendes Teams-Meeting ein.",
        isVideo: true,
        answers: [
            { text: "Ich frage Copilot im Chat: 'Fasse das Meeting bis hierhin zusammen und liste offene Aufgaben auf.'", correct: true },
            { text: "Ich unterbreche den Redner lautstark und verlange eine persönliche Zusammenfassung.", correct: false },
            { text: "Ich fahre rechts ran, schalte das Mikrofon stumm und tue so, als wäre meine Verbindung abgebrochen.", correct: false },
            { text: "Ich verhalte mich unauffällig und hoffe darauf, nichts beitragen zu müssen.", correct: false }
        ]
    },
    {
        number: "Frage 5",
        points: 3,
        text: "Nach zwei Wochen Urlaub warten 450 ungelesene E-Mails in Ihrem Posteingang. Wie hilft Ihnen Copilot in Outlook, den Stau aufzulösen?",
        picture: "outlook-trafficjam.jpg",
        image: "images/q05.jpg",
        pictureDesc: "Szenario: Stau im Posteingang. 450 ungelesene Nachrichten versperren die Weiterarbeit.",
        isVideo: false,
        answers: [
            { text: "Ich nutze die Funktion 'Zusammenfassung durch Copilot', um lange Mailverläufe schnell zu erfassen.", correct: true },
            { text: "Ich markiere alle E-Mails als gelesen und hoffe, dass es nichts Wichtiges war.", correct: false },
            { text: "Ich antworte auf jede Mail pauschal mit 'Ok', um Aktivität vorzutäuschen.", correct: false },
            { text: "Ich melde mich sofort krank. Die Themen regeln sich schon von alleine.", correct: false }
        ]
    },
    {
        number: "Frage 6",
        points: 4,
        text: "Sie müssen aus einem bestehenden Word-Konzept sofort eine anschauliche PowerPoint-Präsentation für den Kunden erstellen. Wie beschleunigen Sie?",
        picture: "word-ppt-speed.jpg",
        image: "images/q06.jpg",
        pictureDesc: "Szenario: Zeitnot! Ein Word-Dokument muss zügig in PowerPoint Folien transformiert werden.",
        isVideo: false,
        answers: [
            { text: "Ich öffne PowerPoint und weise Copilot an: 'Erstelle eine Präsentation basierend auf der Datei [Link zum Dokument].'", correct: true },
            { text: "Ich kopiere den gesamten Text manuell in Schriftgröße 8 auf eine einzige weiße Folie.", correct: false },
            { text: "Ich zeichne die Folien während der Fahrt mit dem Finger auf die beschlagene Seitenscheibe.", correct: false },
            { text: "Ich fahre einfach geradeaus weiter und ignoriere den Termin komplett.", correct: false }
        ]
    },
    {
        number: "Frage 7",
        points: 2,
        text: "Sie sind verärgert über eine Mail und wollen eine schroffe Antwort tippen. Wie nutzen Sie Copilot in Outlook richtig?",
        picture: "outlook-roadrage.jpg",
        image: "images/q07.jpg",
        pictureDesc: "Szenario: Erhöhtes Aggressionspotential im E-Mail-Verkehr.",
        isVideo: false,
        answers: [
            { text: "Ich tippe meine Rohfassung und nutze Copilots 'Rewrite'-Funktion, um den Tonfall auf 'Professionell' anzupassen.", correct: true },
            { text: "Ich lasse Copilot die Mail mit maximal vielen Ausrufezeichen und in Großbuchstaben umschreiben.", correct: false },
            { text: "Ich drücke blind auf die Hupe und jage die wütende Rohfassung ungelesen raus.", correct: false },
            { text: "Ich finde den Absender und halte mein Lenkrad gerade und fest.", correct: false }
        ]
    },
    {
        number: "Frage 8",
        points: 3,
        text: "Sie möchten Copilot nach einem Teams-Meeting Fragen zum Inhalt stellen, merken aber, dass die Aufzeichnung und das Transkript nicht gestartet wurden. Was ist die Folge?",
        picture: "teams-fog.jpg",
        image: "images/q08.jpg",
        pictureDesc: "Szenario: Schlechte Sicht. Dem Copilot fehlt die Datenbasis mangels Aufzeichnung.",
        isVideo: false,
        answers: [
            { text: "Copilot hat keine Datenbasis und kann mir im Nachgang keine Fragen zum Meeting beantworten.", correct: true },
            { text: "Copilot erfindet einfach ein paar plausible Beschlüsse, um mich glücklich zu machen.", correct: false },
            { text: "Ich mache nichts: kein Transkript bedeutet keine Aufgaben.", correct: false },
            { text: "Ich frage Copilot trotzdem und beschwere mich lautstark über unzureichende Antworten.", correct: false }
        ]
    },
    {
        number: "Frage 9",
        points: 3,
        text: "Im Teams-Gruppenprojekt wird seit Stunden wild diskutiert. Sie sehen den Wald vor lauter Bäumen nicht mehr. Wie hilft Copilot?",
        picture: "teams-chaos.jpg",
        image: "images/q09.jpg",
        pictureDesc: "Szenario: Unübersichtliche Lage im Gruppenchat durch zu viele Wortmeldungen.",
        isVideo: true,
        answers: [
            { text: "Ich klicke im Chat oben auf das Copilot-Icon und frage nach den wichtigsten Entscheidungen der letzten 24 Stunden.", correct: true },
            { text: "Ich scrolle 400 Nachrichten manuell hoch und verpasse dabei den Rest des Arbeitstages.", correct: false },
            { text: "Ich verlasse den Chat kommentarlos und blockiere alle Teilnehmer.", correct: false },
            { text: "Ich betätige die Lichthupe im Rhythmus des Teams Ruftons und lasse die Kollegen einfach machen.", correct: false }
        ]
    },
    {
        number: "Frage 10",
        points: 4,
        text: "Copilot schlägt Ihnen in einer Zusammenfassung einen Projektschritt vor, der Ihnen völlig unlogisch erscheint. Wie verhalten Sie sich?",
        picture: "copilot-hallucination.jpg",
        image: "images/q10.jpg",
        pictureDesc: "Szenario: Mögliche optische Täuschung (Halluzination) durch das System.",
        isVideo: false,
        answers: [
            { text: "Ich überprüfe die genannten Quellen ('Zitate') im Text kritisch, da KI halluzinieren kann.", correct: true },
            { text: "Ich vertraue der KI blind – wenn Copilot das sagt, wird die Giraffe da schon hingehören.", correct: false },
            { text: "Ich lösche das gesamte Dokument und fange von vorne auf Papier an.", correct: false },
            { text: "Ich übernehme den Vorschlag, da ich von Menschen schon weitaus unlogischere Entscheidungen gesehen habe.", correct: false }
        ]
    },
    {
        number: "Frage 11",
        points: 4,
        text: "Der Vorstand stellt nach 3 Monaten Copilot die Sinnfrage, weil noch keine messbaren Umsatzsteigerungen vorliegen. Wie reagieren Sie als Consultant?",
        picture: "vorstand-barrier.jpg",
        image: "images/q11.jpg",
        pictureDesc: "Szenario: Kontrolle durch die Chefetage bezüglich der Investitionen.",
        isVideo: false,
        answers: [
            { text: "Aufzeigen realistischer Time-to-Value-Horizonte, Definition von qualitativen Leading Indicators (z. B. Zeitersparnis bei E-Mails) statt rein monetärer KPIs im Frühstadium.", correct: true },
            { text: "Ich fälsche eine Excel-Tabelle und behaupte, die Mitarbeiter hätten 400.000 Stunden gespart.", correct: false },
            { text: "Ich drehe den Bass voll auf und übertöne die Frage des Vorstands mit experimentellem Dubstep, um strategische Dominanz zu beweisen.", correct: false },
            { text: "Ich manipuliere den Tacho, damit es so aussieht, als würden wir 320 km/h fahren.", correct: false }
        ]
    },
    {
        number: "Frage 12",
        points: 5,
        text: "Das Unternehmen nutzt keine Microsoft Purview Sensitivity Labels. Copilot fasst nun bereitwillig ein ungeschütztes Dokument mit Gehaltsangaben für alle User zusammen. Was ist der Fehler?",
        picture: "purview-leak.jpg",
        image: "images/q12.jpg",
        pictureDesc: "Szenario: Offenes Gehaltsdokument liegt ungeschützt auf der Gegenfahrbahn des Suchindex.",
        isVideo: false,
        answers: [
            { text: "Die Datenklassifizierung wurde vor dem Rollout übersprungen; das Fehlen von Purview Labels gepaart mit weit verbreiteten „Jeder mit dem Link“-Freigaben (Anyone Links) ermöglicht Copilot den ungehinderten Zugriff.", correct: true },
            { text: "Der Copilot hat eine zu hohe Neugierde Einstellung.", correct: false },
            { text: "Ich schreibe eine E-Mail an alle Mitarbeiter, sie mögen bitte nicht nach 'Gehaltstabelle' suchen.", correct: false },
            { text: "Ich versuche sofort, genau dieses Dokument via Copilot zu finden, um für die anstehende Gehaltsverhandlung strategisch bestens vorbereitet zu sein.", correct: false }
        ]
    },
    {
        number: "Frage 13",
        points: 4,
        text: "Copilot generiert hartnäckig Antworten basierend auf völlig veralteten HR-Richtlinien, die in einer seit Jahren verwaisten SharePoint-Site liegen. Was ist die Lösung?",
        picture: "hr-oldtimer.jpg",
        image: "images/q13.jpg",
        pictureDesc: "Szenario: Ein veraltetes Dokument blockiert den richtigen Informationsfluss.",
        isVideo: false,
        answers: [
            { text: "Etablierung eines konsequenten Information Lifecycles: Veraltete Sites archivieren, löschen oder aus der Microsoft Search ausschließen.", correct: true },
            { text: "Dem Copilot im Prompt verbieten, alte Dinge zu lesen.", correct: false },
            { text: "Den Mitarbeitern sagen, sie sollen einfach das Gegenteil von dem tun, was Copilot sagt.", correct: false },
            { text: "Ich schlage vor, die aktuellen Richtlinien an die Antworten von Copilot anzupassen.", correct: false }
        ]
    },
    {
        number: "Frage 14",
        points: 4,
        text: "Die Usage-Metriken zeigen: 95 % der User nutzen Copilot ausschließlich, um Teams-Meetings zusammenzufassen. Tiefere Use-Cases fehlen komplett. Was tun Sie?",
        picture: "usage-monoculture.jpg",
        image: "images/q14.jpg",
        pictureDesc: "Szenario: Einseitige Fahrzeugnutzung. Wichtige Assistenzsysteme bleiben ungenutzt.",
        isVideo: false,
        answers: [
            { text: "Ich starte gezielte Use-Case-Workshops pro Abteilung und bilde ein Copilot-Champions-Netzwerk auf.", correct: true },
            { text: "Ich sperre die Zusammenfassungsfunktion, um die User zu zwingen, kreativ zu werden.", correct: false },
            { text: "Ich ignoriere es, da die Lizenzkosten sowieso für ein Jahr im Voraus bezahlt sind.", correct: false },
            { text: "Ich schlage vor, alle Meetings zukünftig nur noch persönlich stattfinden zu lassen.", correct: false }
        ]
    },
    {
        number: "Frage 15",
        points: 4,
        text: "Ein Kunde fragt direkt: „Werden meine Prompts genutzt, um die öffentlichen KI-Modelle zu trainieren?“ Wie lautet die korrekte Antwort im Firmenkontext?",
        picture: "multi-tenant-border.jpg",
        image: "images/q15.jpg",
        pictureDesc: "Szenario: Vertraulicher Datenschutz-Schutzwall. Kein Modell-Training mit Kundendaten.",
        isVideo: false,
        answers: [
            { text: "Nein. Bei Microsoft 365 Copilot ist das Training mit Kundendaten vertraglich und technisch ausgeschlossen. Alle Daten bleiben geschützt im eigenen Firmen-Tenant.", correct: true },
            { text: "Ich empfehle, Prompts nur noch als kryptische Rätsel zu formulieren, damit das Sprachmodell beim Training Migräne bekommt.", correct: false },
            { text: "Ja, es sei denn, man schreibt in Caps-Lock 'DÜRFT IHR NICHT SPEICHERN!!!' vor jede Anfrage.", correct: false },
            { text: "Das lässt sich erst nach einem dreimonatigen Lenkungsausschuss und der Gründung einer Prompt-Metadaten-Taskforce beantworten.", correct: false }
        ]
    },
    {
        number: "Frage 16",
        points: 4,
        text: "Der Kunde hat im Überschwang 1.000 Copilot-Lizenzen gekauft, sich aber nicht um das Onboarding gekümmert. Aktuell sind nur 50 Lizenzen zugewiesen. Was ist die Konsequenz?",
        picture: "license-shelfware.jpg",
        image: "images/q16.jpg",
        pictureDesc: "Szenario: 950 bezahlte Fahrzeuge stehen ungenutzt im Depot.",
        isVideo: false,
        answers: [
            { text: "Ein massiver finanzieller Verlust ('Shelfware'), der den Business Case der IT-Abteilung beim nächsten Budget-Review zerstören wird.", correct: true },
            { text: "Das M365-System wird schneller, weil 950 Lizenzen ungenutzt im Hintergrund ruhen.", correct: false },
            { text: "Microsoft storniert die Lizenzen automatisch nach 30 Tagen Inaktivität.", correct: false },
            { text: "Ich verteile die verbliebenen Lizenzen an zufällig ausgewählte Mitarbeiter.", correct: false }
        ]
    },
    {
        number: "Frage 17",
        points: 5,
        text: "Ein stark regulierter Enterprise-Kunde fordert aus Datenschutzgründen, dass M365 Copilot zwingend auf lokalen Servern im eigenen Keller (On-Prem) laufen muss. Wie reagieren Sie?",
        picture: "cellar-hosting.jpg",
        image: "images/q17.jpg",
        pictureDesc: "Szenario: Der Kunde verlangt den Cloud-Betrieb im Keller-Viertel.",
        isVideo: false,
        answers: [
            { text: "Ich stelle klar, dass M365 Copilot ein reiner Cloud-Service ist und On-Prem-Hosting architektonisch ausgeschlossen ist.", correct: true },
            { text: "Ich verspreche dem Kunden, dass wir die Azure-Cloud auf einen USB-Stick ziehen können.", correct: false },
            { text: "Ich verlege die Firmengrenze des Kunden offiziell in ein Azure Rechenzentrum in Frankfurt.", correct: false },
            { text: "Ich schlage das Verlegen eines langen LAN-Kabels vom Keller direkt in das Azure-Rechenzentrum vor.", correct: false }
        ]
    },
    {
        number: "Frage 18",
        points: 3,
        text: "Nach dem Rollout stellt sich heraus, dass die Mitarbeiter zwar die Copilot-Lizenz haben, aber überhaupt nicht wissen, wie man einen effektiven Prompt schreibt. Die Nutzung bricht ein. Was ist der nächste Schritt?",
        picture: "prompt-fail.jpg",
        image: "images/q18.jpg",
        pictureDesc: "Szenario: Die Mitarbeiter sitzen im Auto, wissen aber nicht, wie man lenkt.",
        isVideo: false,
        answers: [
            { text: "Bereitstellung einer zentralen Prompt-Bibliothek und Durchführung von abteilungsspezifischen Prompt-Engineering-Schulungen.", correct: true },
            { text: "Den Mitarbeitern mit Kündigung drohen, wenn sie nicht mindestens 5 Prompts pro Tag absetzen.", correct: false },
            { text: "Ich erstelle einen Agenten, der die Mitarbeiter ungefragt im Teams Chat anschreibt und nervt.", correct: false },
            { text: "Ich kann bedenkenlos weiterfahren, da wir eh geplant haben, für alles Agents zu bauen.", correct: false }
        ]
    },
    {
        number: "Frage 19",
        points: 3,
        text: "Während eines längeren Chats vergisst der Copilot plötzlich Anweisungen, die der User ganz zu Beginn des Gesprächs gegeben hat. Woran liegt das?",
        picture: "memory-forget.jpg",
        image: "images/q19.jpg",
        pictureDesc: "Szenario: Nach einer längeren Fahrt vergisst das Navigationsgerät den Startpunkt.",
        isVideo: false,
        answers: [
            { text: "Die Konversation hat das maximale Limit des Chat-Verlaufs innerhalb einer Session erreicht; der ältere Kontext wird aus dem Speicher des LLM-Fensters verdrängt.", correct: true },
            { text: "Es fehlt das emotionale Drama. Der Prompt braucht den Zusatz, dass bei einem Fehler das gesamte Projektteam am Wochenende weinend Überstunden machen muss.", correct: false },
            { text: "Der User hat zwischendurch ein Wort mit dem Buchstaben 'X' getippt, was den Cache löscht.", correct: false },
            { text: "Es wurde vergessen, das magische 'Make no mistakes!' als geheimen System-Prompt mitzugeben.", correct: false }
        ]
    },
    {
        number: "Frage 20",
        points: 4,
        text: "Ein europäischer Kunde aus dem Finanzsektor will absolut sicherstellen, dass keine Daten zur Verarbeitung die EU verlassen. Welche Microsoft-Garantie greift hier beim Copilot-Einsatz?",
        picture: "eu-border.jpg",
        image: "images/q20.jpg",
        pictureDesc: "Szenario: Regulatorische Grenzschranke für sensible Finanzdaten.",
        isVideo: false,
        answers: [
            { text: "Die Einhaltung der EU Data Boundary, die sicherstellt, dass Daten europäischer Kunden innerhalb der EU gespeichert und verarbeitet werden.", correct: true },
            { text: "Keine, die Daten werden standardmäßig immer via Satellit über die USA umgeleitet.", correct: false },
            { text: "Der Admin muss jeden Abend manuell bestätigen, dass die Daten in Europa bleiben.", correct: false },
            { text: "Ich empfehle den Einsatz eines VPN mit Servern in der EU.", correct: false }
        ]
    },
    {
        number: "Frage 21",
        points: 4,
        text: "Der Copilot beantwortet Fragen zu aktuellen Marktpreisen von Mitbewerbern mit internen, drei Jahre alten Vertriebsberichten statt mit aktuellen Webdaten. Was ist falsch konfiguriert?",
        picture: "bing-offline.jpg",
        image: "images/q21.jpg",
        pictureDesc: "Szenario: Veralteter Offline-Navigationsplan statt Echtzeit-Verkehrsdaten.",
        isVideo: false,
        answers: [
            { text: "Die Websuche (Web Grounding via Bing) ist im Admin-Center deaktiviert, weshalb Copilot rein auf den internen Graph-Index zurückgreift.", correct: true },
            { text: "Das Getriebe des Laptops hat einen mechanischen Schaden im KI-Modul.", correct: false },
            { text: "Ich weise darauf hin, das dies kein Anwendungsfall für KI ist. Hier reicht eine Internetsuche vollkommen aus.", correct: false },
            { text: "Ich schalte das Radio auf einen Nachrichtensender um und hoffe, das Mikrofon der KI hört den aktuellen Marktbericht.", correct: false }
        ]
    },
    {
        number: "Frage 22",
        points: 4,
        text: "Ein Geschäftsführer beschwert sich, dass der Copilot in Outlook seine alten E-Mails nicht durchsucht. Es stellt sich heraus, dass diese in lokalen .pst-Dateien auf seiner Festplatte liegen. Wie lösen Sie das?",
        picture: "pst-archive.jpg",
        image: "images/q22.jpg",
        pictureDesc: "Szenario: Lokale Koffer versperren den Zugriff auf die Laderampe.",
        isVideo: false,
        answers: [
            { text: "Lokale .pst-Archive müssen zwingend in das M365-Online-Postfach migriert werden, da Copilot nur Cloud-indizierte Daten analysieren kann.", correct: true },
            { text: "Die Festplatte ausbauen und mit der Post nach Redmond schicken, damit Microsoft sie einscannt.", correct: false },
            { text: "Dem Geschäftsführer raten, die Emails auszudrucken und in die “German Cloud” aus Leitz Ordnern und Aktenschrank zu migrieren.", correct: false },
            { text: "Ich steige aus, setze mich an den Straßenrand und fange an, die Mails laut vorzulesen, damit das Smartphone-Mikrofon sie mitschneidet.", correct: false }
        ]
    },
    {
        number: "Frage 23",
        points: 4,
        text: "Ein User stellt eine komplexe, mehrteilige Frage. Die Orchestration Engine des Copiloten verwechselt die Reihenfolge der Verarbeitungsschritte und liefert ein logisch fehlerhaftes Ergebnis. Wie optimieren Sie das System?",
        picture: "prompt-chaining.jpg",
        image: "images/q23.jpg",
        pictureDesc: "Szenario: Gangschaltung blockiert bei einer zu schnellen Gangfolge.",
        isVideo: false,
        answers: [
            { text: "Aufsplittung komplexer Prompts in logische Teilschritte (Prompt Chaining) und Nutzung von klaren Übergangssätzen in der Benutzerführung.", correct: true },
            { text: "Ich bitte den User den Prompt einfach so lange erneut einzugeben, bis das gewünschte Ergebnis da ist.", correct: false },
            { text: "Dem User verbieten, Sätze mit mehr als einem Komma zu bilden.", correct: false },
            { text: "Ich gebe vor, in einen dringenden Call zu müssen, um das Gespräch zu beenden.", correct: false }
        ]
    },
    {
        number: "Frage 24",
        points: 4,
        text: "Die Rechtsabteilung sorgt sich, dass der Copilot beim Generieren von Marketingtexten urheberrechtlich geschützte Texte eins-zu-eins reproduziert. Welche Microsoft-Garantie schützt den Kunden?",
        picture: "copyright-insurance.jpg",
        image: "images/q24.jpg",
        pictureDesc: "Szenario: Juristische Absicherung bei eventuellen Auffahrunfällen mit geschütztem Material.",
        isVideo: false,
        answers: [
            { text: "Das Customer Copyright Commitment, sofern der User die eingebauten Content-Filter und Sicherheitsregeln nicht bewusst umgangen hat.", correct: true },
            { text: "Die automatische Löschung aller kreativen Wörter aus der M365 Datenbank.", correct: false },
            { text: "Die Enterprise Data Protection.", correct: false },
            { text: "Es gibt keine Garantie. Ich entziehe dem Marketing Team sofort die Copilot Lizenz.", correct: false }
        ]
    },
    {
        number: "Frage 25",
        points: 3,
        text: "Ein User nutzt seit drei Wochen dieselbe einzige Copilot-Chat-Session für all seine Aufgaben. Copilot reagiert inzwischen extrem träge und verwechselt ständig die Themen. Was ist die Ursache?",
        picture: "chat-session.jpg",
        image: "images/q25.jpg",
        pictureDesc: "Szenario: Drei Wochen Dauerfahrt ohne Motorneustart überlastet den Motor.",
        isVideo: false,
        answers: [
            { text: "Die maximale Token-Kapazität des Chat-Verlaufs ist überladen; für neue Themenbereiche MUSS eine neue Chat-Session gestartet werden, um den Kontext sauber zu halten.", correct: true },
            { text: "Ich werfe mein Handy aus dem Fahrerfenster, um die lokale Netzlast zu verringern.", correct: false },
            { text: "Der Rechner muss einfach wieder neu gestartet werden.", correct: false },
            { text: "Ab Woche 4 fängt sich der Copilot in der Regel wieder.", correct: false }
        ]
    },
    {
        number: "Frage 26",
        points: 4,
        text: "Mitarbeiter nutzen exzessiv die Funktion \"Jeder mit dem Link kann bearbeiten\", um SharePoint-Dateien intern zu teilen. Copilot findet diese Links und spuckt die Daten nun bei Kollegen aus, die sie nie sehen sollten. Wie greifen Sie ein?",
        picture: "anyone-share.jpg",
        image: "images/q26.jpg",
        pictureDesc: "Szenario: Offenes Parkhaus ohne Schranke. Alle können jedes Auto benutzen.",
        isVideo: false,
        answers: [
            { text: "Deaktivierung von globalen Freigabelinks (\"Anyone\"-Links) im SharePoint-Admin-Center und Durchsetzung von benannten Berechtigungen.", correct: true },
            { text: "Ich erkläre, dass dies kein Copilot Thema sei und verlasse das Meeting fluchtartig.", correct: false },
            { text: "Die Mitarbeiter darauf hinweisen, nur nach Dokumenten zu suchen, die sie sehen dürfen.", correct: false },
            { text: "Ich bitte die Mitarbeiter die unerlaubt gefundenen Dokumente per Email zurückzusenden.", correct: false }
        ]
    },
    {
        number: "Frage 27",
        points: 4,
        text: "Ein Copilot-Agent greift auf eine Wissensbasis zu, deren Dokumente seit Jahren nicht mehr gepflegt wurden. Die Antworten enthalten veraltete Telefonnummern und gelöschte Standorte. Wie lautet die Governance-Maßnahme?",
        picture: "governance-loop.jpg",
        image: "images/q27.jpg",
        pictureDesc: "Szenario: Irreführende, veraltete Wegweiser am Straßenrand.",
        isVideo: false,
        answers: [
            { text: "Einführung von automatisierten Data-Lifecycle-Richtlinien mit Ablaufdaten (TTL) und regelmäßigen Review-Schleifen für Content-Owner.", correct: true },
            { text: "Ich stelle einen Werkstudenten ein, der die Antworten als Human-in-the-Loop manuell prüft.", correct: false },
            { text: "Alle alten Standorte einfach wieder neu eröffnen, um die Datenkonsistency zu wahren.", correct: false },
            { text: "Keine Maßnahme erforderlich. Das ist ein klassischer Fall von KI Halluzination.", correct: false }
        ]
    },
    {
        number: "Frage 28",
        points: 4,
        text: "Ein Unternehmen bietet nach dem Copilot-Go-Live eine einzige, optionale 45-minütige Teams-Schulung an. Danach wird das ACM-Projekt offiziell für „erfolgreich beendet“ erklärt. Drei Monate später sinkt die Nutzung gegen Null. Was ist der Fehler?",
        picture: "learning-stop.jpg",
        image: "images/q28.jpg",
        pictureDesc: "Szenario: Fahrunterricht nach der ersten Theoriestunde beendet. Auto fährt nicht von alleine.",
        isVideo: false,
        answers: [
            { text: "Ein fundamentaler Mangel an kontinuierlicher Begleitung (Continuous Learning). Adoption ist kein Einmal-Event, sondern ein iterativer Prozess mit dauerhaften Feedback-Schleifen und fortlaufenden Use-Case-Deep-Dives.", correct: true },
            { text: "Kein Fehler. Auf der PowerPoint steht klar und deutlich “erfolgreich beendet”.", correct: false },
            { text: "Man hätte die Schulung auf 46 Minuten verlängern müssen.", correct: false },
            { text: "Ich zitiere panisch den Gartner Hype Cycle und erkläre, dass wir bereits im Tal der Enttäuschung sind.", correct: false }
        ]
    },
    {
        number: "Frage 29",
        points: 4,
        text: "Das ACM-Team versucht, die Adoptions-Inhalte rein zentral über eine angestaubte Intranet-News-Seite zu verbreiten. In den einzelnen Fachabteilungen kommt davon absolut nichts an. Welche Struktur fehlt hier?",
        picture: "champion-network.jpg",
        image: "images/q29.jpg",
        pictureDesc: "Szenario: Zentraler Radiosender sendet ohne lokale Antennen (Champion-Netzwerk) in den Tälern.",
        isVideo: false,
        answers: [
            { text: "Ein aktives „Champion-Netzwerk“. Es braucht lokale Multiplikatoren und Key-User in den Abteilungen, die das Wissen organisch, auf Augenhöhe und praxisnah an die Kollegen weitergeben.", correct: true },
            { text: "Der Flurfunk des Unternehmens wurde unzureichend als Kommunikationskanal genutzt.", correct: false },
            { text: "Die Intranetseite wurde nicht ausgedruckt an die Mitarbeiter verteilt.", correct: false },
            { text: "Es fehlt ein LinkedIn Post, der diese Inhalte als Theorieprüfung für „Copilot Consultants“ im Stil der Führerscheinprüfung vorstellt.", correct: false }
        ]
    }
];

// Helper: Shuffle Array (Fisher-Yates)
function shuffle(array) {
    let copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    checkDatabaseLoading();
    setupEventListeners();
});

// Setup Questions pool
function checkDatabaseLoading() {
    const statusText = document.querySelector("#db-load-status .status-text");
    const statusBox = document.getElementById("db-load-status");
    const startBtn = document.getElementById("start-exam-btn");

    setTimeout(() => {
        // Load Copilot Questions Pool directly
        questions = []; // populated at startExam
        statusBox.classList.add("loaded");
        statusText.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> Copilot-Datenbank geladen (${copilotQuestionsPool.length} Fragen bereit).`;
        startBtn.disabled = false;
    }, 800);
}

// Setup Event Listeners
function setupEventListeners() {
    // Welcome / Reset Buttons
    document.getElementById("start-exam-btn").addEventListener("click", startExam);
    document.getElementById("restart-exam-btn").addEventListener("click", restartExam);

    // Header buttons
    document.getElementById("abort-btn").addEventListener("click", confirmAbort);



    // Footer actions
    document.getElementById("btn-cancel").addEventListener("click", confirmAbort);
    document.getElementById("btn-star").addEventListener("click", toggleStar);

    // Main Weiter button above footer
    const btnNextMain = document.getElementById("btn-next-main");
    if (btnNextMain) {
        btnNextMain.addEventListener("click", () => {
            if (currentIndex < questions.length - 1) {
                loadQuestion(currentIndex + 1);
            } else if (!reviewMode) {
                openSubmitModal();
            } else {
                showResultScreen();
            }
        });
    }

    // Question Dropdown for Main
    const dropdown = document.getElementById("question-dropdown-main");
    if (dropdown) {
        dropdown.addEventListener("change", (e) => {
            loadQuestion(parseInt(e.target.value));
        });
    }

    // Submit dialog modal
    document.getElementById("modal-cancel-btn").addEventListener("click", closeSubmitModal);
    document.getElementById("modal-confirm-btn").addEventListener("click", submitExam);
    document.getElementById("submit-modal").addEventListener("click", (e) => {
        if (e.target.id === "submit-modal") closeSubmitModal();
    });

    // Legal Disclaimer modal
    const openLegalBtn = document.getElementById("open-legal-modal-btn");
    if (openLegalBtn) {
        openLegalBtn.addEventListener("click", openLegalModal);
    }
    const closeLegalBtn = document.getElementById("close-legal-modal-btn");
    if (closeLegalBtn) {
        closeLegalBtn.addEventListener("click", closeLegalModal);
    }
    const closeLegalX = document.getElementById("close-legal-modal-x");
    if (closeLegalX) {
        closeLegalX.addEventListener("click", closeLegalModal);
    }
    const legalModal = document.getElementById("legal-modal");
    if (legalModal) {
        legalModal.addEventListener("click", (e) => {
            if (e.target.id === "legal-modal") closeLegalModal();
        });
    }

    // Results screen
    document.getElementById("review-answers-btn").addEventListener("click", enterReviewMode);
}

// Start Quiz Session
function startExam() {
    currentIndex = 0;
    userAnswers = {};
    starredQuestions = {};
    resolvedQuestions = {};
    timeLeft = 2700;
    reviewMode = false;
    isSubmitted = false;

    // Load all questions from the Copilot pool in shuffled order
    let selectedQs = shuffle(copilotQuestionsPool);
    
    // For each selected question, clone it and shuffle its answers
    questions = selectedQs.map(q => {
        return {
            number: q.number,
            points: q.points,
            text: q.text,
            picture: q.picture,
            image: q.image,
            pictureDesc: q.pictureDesc,
            isVideo: q.isVideo,
            answers: shuffle(q.answers) // Shuffle answers so correct one is not always A
        };
    });

    document.getElementById("intro-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");

    buildNavigationFooter();
    loadQuestion(0);
    
    // Timer setup
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function confirmAbort() {
    if (reviewMode) {
        clearInterval(timerInterval);
        document.getElementById("quiz-screen").classList.add("hidden");
        document.getElementById("intro-screen").classList.remove("hidden");
    } else {
        if (confirm("Möchten Sie die Prüfung abbrechen? Ihr Fortschritt wird gelöscht.")) {
            clearInterval(timerInterval);
            document.getElementById("quiz-screen").classList.add("hidden");
            document.getElementById("intro-screen").classList.remove("hidden");
        }
    }
}

function restartExam() {
    startExam();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const display = document.getElementById("timer-display-header");
    display.textContent = formatted;

    if (timeLeft < 300) {
        display.classList.add("timer-warning");
    } else {
        display.classList.remove("timer-warning");
    }
}

// Load Question at Index
function loadQuestion(index) {
    currentIndex = index;
    const q = questions[index];

    // Meta updates
    document.getElementById("question-id").textContent = `Frage ${index + 1}`;
    
    // Sync dropdown
    const dropdown = document.getElementById("question-dropdown-main");
    if (dropdown) {
        dropdown.value = index;
    }
    document.getElementById("current-q-points").textContent = q.points;
    document.getElementById("question-text").textContent = q.text;

    // Media Blueprint boxes
    const filenameLabel = document.getElementById("media-filename");
    const descLabel = document.getElementById("media-description");
    const mediaBox = document.getElementById("exam-media-box");
    const blueprintInfo = mediaBox.querySelector(".blueprint-info");
    const blueprintElements = mediaBox.querySelectorAll(".blueprint-lines, .blueprint-mirror, .blueprint-speedometer, .blueprint-steering-wheel, .blueprint-road-path");

    // Remove any existing real image
    const existingImg = mediaBox.querySelector(".real-question-image");
    if (existingImg) existingImg.remove();

    if (q.image) {
        // Show real image
        const img = document.createElement("img");
        img.src = q.image;
        img.alt = q.pictureDesc || "Situationsbild";
        img.className = "real-question-image";
        img.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:5;";
        mediaBox.appendChild(img);
        // Hide blueprint elements
        blueprintInfo.style.display = "none";
        blueprintElements.forEach(el => el.style.display = "none");
        mediaBox.style.backgroundColor = "#000";
    } else if (q.picture) {
        // Show blueprint placeholder
        blueprintInfo.style.display = "";
        blueprintElements.forEach(el => el.style.display = "");
        filenameLabel.textContent = q.picture;
        descLabel.textContent = q.pictureDesc || "Situationsbild zur aktuellen Prüfungsfrage.";
        mediaBox.style.backgroundColor = "#111e29"; // Blueprint blue
    } else {
        blueprintInfo.style.display = "";
        blueprintElements.forEach(el => el.style.display = "");
        filenameLabel.textContent = "Kein Bild";
        descLabel.textContent = "Für diese Frage ist kein Bild erforderlich. Antworten Sie anhand der Textbeschreibung.";
        mediaBox.style.backgroundColor = "#0f171e"; // Dark slate
    }


    // Star state
    const starBtn = document.getElementById("btn-star");
    if (starredQuestions[index]) {
        starBtn.classList.add("starred");
        starBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
    } else {
        starBtn.classList.remove("starred");
        starBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
    }

    // Answers Column
    const answersContainer = document.getElementById("answers-container");
    answersContainer.innerHTML = "";

    const isResolved = reviewMode;

    // Render Multiple-Choice options with dynamic A), B), C), D) prefixes
    q.answers.forEach((ans, aIdx) => {
        const option = document.createElement("div");
        option.className = "answer-option";

        const isSelected = userAnswers[index] && userAnswers[index].includes(aIdx);
        if (isSelected) option.classList.add("selected");

        // Convert index 0, 1, 2, 3 to A), B), C), D)
        const prefixLetter = String.fromCharCode(65 + aIdx) + ") ";

        option.innerHTML = `
            <div class="checkbox-square">
                <i class="fa-solid fa-check"></i>
            </div>
            <div class="answer-text">
                <span style="font-weight:bold;color:#002a46">${prefixLetter}</span>${ans.text}
            </div>
        `;

        if (isResolved) {
            const isCorrect = ans.correct;

            if (isCorrect) {
                if (isSelected) {
                    option.classList.add("correct-choice"); // Correctly selected
                } else {
                    option.classList.add("missed-choice"); // Missed correct answer
                }
            } else if (isSelected) {
                option.classList.add("incorrect-choice"); // Wrong selection
            }

            const badge = document.createElement("span");
            if (isCorrect) {
                badge.className = "review-badge-inline correct";
                badge.innerHTML = '<i class="fa-solid fa-check"></i> Richtig';
            } else {
                badge.className = "review-badge-inline incorrect";
                badge.innerHTML = '<i class="fa-solid fa-xmark"></i> Falsch';
            }
            option.querySelector(".answer-text").appendChild(badge);
        } else {
            option.addEventListener("click", () => {
                toggleAnswerSelection(index, aIdx);
                loadQuestion(index);
            });
        }

        answersContainer.appendChild(option);
    });



    // Update main Weiter button in the footer
    const btnNextMain = document.getElementById("btn-next-main");
    if (btnNextMain) {
        if (index === questions.length - 1) {
            if (reviewMode) {
                btnNextMain.textContent = "Auswertung";
            } else {
                btnNextMain.textContent = "Abgeben";
            }
        } else {
            btnNextMain.textContent = "Weiter";
        }
    }
}

// Single choice selection toggling
function toggleAnswerSelection(qIdx, aIdx) {
    userAnswers[qIdx] = [aIdx]; // Strictly single-choice: replaces any previous selections
    updateNavigationFooter();
}

// Star Bookmark Toggling
function toggleStar() {
    starredQuestions[currentIndex] = !starredQuestions[currentIndex];
    loadQuestion(currentIndex);
    updateNavigationFooter();
}

// Build Navigation Footer
function buildNavigationFooter() {
    const dropdown = document.getElementById("question-dropdown-main");
    if (dropdown) {
        dropdown.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = `Frage ${i + 1}`;
            dropdown.appendChild(opt);
        }
    }
}

function updateNavigationFooter() {
    const dropdown = document.getElementById("question-dropdown-main");
    if (!dropdown) return;
    const options = dropdown.options;
    
    for (let idx = 0; idx < questions.length; idx++) {
        const ans = userAnswers[idx];
        const isAnswered = ans !== undefined && ans.length > 0;

        if (options && options[idx]) {
            let label = `Frage ${idx + 1}`;
            let symbols = [];
            if (starredQuestions[idx]) {
                symbols.push("★");
            }
            if (reviewMode) {
                const isCorrect = checkQuestionCorrectness(idx);
                symbols.push(isCorrect ? "✓" : "✗");
            } else if (isAnswered) {
                symbols.push("●");
            }
            if (symbols.length > 0) {
                label += ` [${symbols.join(" ")}]`;
            }
            options[idx].textContent = label;
        }
    }
}

// Submit Modal Confirmations
function openSubmitModal() {
    let answered = 0;
    for (let i = 0; i < questions.length; i++) {
        const ans = userAnswers[i];
        if (ans !== undefined && ans.length > 0) {
            answered++;
        }
    }

    document.getElementById("answered-count").textContent = `${answered}/${questions.length}`;
    document.getElementById("unanswered-count").textContent = questions.length - answered;
    document.getElementById("submit-modal").classList.remove("hidden");
}

function closeSubmitModal() {
    document.getElementById("submit-modal").classList.add("hidden");
}

function openLegalModal() {
    const modal = document.getElementById("legal-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeLegalModal() {
    const modal = document.getElementById("legal-modal");
    if (modal) modal.classList.add("hidden");
}

function autoSubmitExam() {
    alert("Prüfungszeit abgelaufen! Die Prüfung wird automatisch abgegeben.");
    submitExam();
}

// Check Correctness for Question (Single choice correctness check)
function checkQuestionCorrectness(qIdx) {
    const q = questions[qIdx];
    const userAns = userAnswers[qIdx];

    if (!userAns || userAns.length === 0) return false;

    const selectedIdx = userAns[0];
    return q.answers[selectedIdx].correct === true;
}

// Submit Quiz and show Results
function submitExam() {
    clearInterval(timerInterval);
    closeSubmitModal();
    isSubmitted = true;

    let totalErrorPoints = 0;
    let wrongQuestionsCount = 0;
    let detailsRows = "";

    questions.forEach((q, idx) => {
        const isCorrect = checkQuestionCorrectness(idx);
        let errorPoints = 0;
        let statusHtml = "";

        if (isCorrect) {
            statusHtml = '<span class="badge-status correct"><i class="fa-solid fa-circle-check"></i> Richtig</span>';
        } else {
            errorPoints = q.points;
            totalErrorPoints += q.points;
            wrongQuestionsCount++;
            statusHtml = '<span class="badge-status incorrect"><i class="fa-solid fa-circle-xmark"></i> Falsch</span>';
        }

        detailsRows += `
            <tr>
                <td>Frage ${idx + 1}</td>
                <td>${q.points}</td>
                <td style="color:${errorPoints > 0 ? '#b32117' : 'inherit'}; font-weight:${errorPoints > 0 ? 'bold' : 'normal'}">${errorPoints}</td>
                <td>${statusHtml}</td>
            </tr>
        `;
    });

    // Pass standard: Max 10 error points allowed
    const isPassed = totalErrorPoints <= 10;
    
    const badge = document.getElementById("result-badge");
    badge.className = "result-badge " + (isPassed ? "success" : "danger");
    badge.innerHTML = isPassed 
        ? '<i class="fa-solid fa-circle-check"></i> <span>BESTANDEN</span>'
        : '<i class="fa-solid fa-circle-xmark"></i> <span>NICHT BESTANDEN</span>';

    document.getElementById("res-error-points").textContent = totalErrorPoints;
    document.getElementById("res-wrong-count").textContent = `${wrongQuestionsCount} / ${questions.length}`;
    document.getElementById("res-wrong-pct").textContent = `${Math.round((wrongQuestionsCount / questions.length) * 100)}% Fehlerquote`;

    const minutesLeft = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;
    document.getElementById("res-time-left").textContent = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;

    document.getElementById("results-table-body").innerHTML = detailsRows;

    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
}

// Enter Review/Correction Mode
function enterReviewMode() {
    reviewMode = true;
    currentIndex = 0;
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("quiz-screen").classList.remove("hidden");
    
    document.getElementById("abort-btn").innerHTML = '<i class="fa-solid fa-home"></i>';
    document.getElementById("abort-btn").title = "Prüfung beenden";

    loadQuestion(0);
    updateNavigationFooter();
}
