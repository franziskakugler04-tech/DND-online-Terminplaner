import React from 'react';
import footerLogo from '../../assets/logosammlung-03.png';

const MAIL = 'kontakt@campaignconnect.de';

export default function Footer() {
  const [modal, setModal] = React.useState(null); // 'impressum' | 'datenschutz' | 'cookies' | 'about' | 'support'

  return (
    <>
      <footer style={{
        background: "var(--cc-dark-plum)", color: "#fff",
        padding: "40px 48px 24px",
        display: "grid",
        gridTemplateColumns: "1.8fr 1fr 1fr 1fr",
        gap: 36,
        marginTop: "auto",
      }}>
        <div>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: 130, height: 55, overflow: "hidden", position: "relative" }}>
                <img
                  src={footerLogo}
                  alt="Campaign Connect"
                  style={{ position: "absolute", left: -45, top: -59, height: 176, width: "auto", maxWidth: "none", display: "block" }}
                />
              </div>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: ".03em", lineHeight: 1, whiteSpace: "nowrap" }}>
                CAMPAIGN CONNECT
              </span>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.6 }}>
              Die Plattform für Tabletop-Gruppen. Termine koordinieren, Kampagnen verwalten, Abenteuer erleben.
            </p>
          </div>
        </div>

        <div>
          <h4 style={h4()}>Über</h4>
          <ul style={ul()}>
            <li style={link()} onClick={() => setModal('about')}>Über das Projekt</li>
            <li style={link()} onClick={() => setModal('support')}>Support</li>
          </ul>
        </div>

        <div>
          <h4 style={h4()}>Recht</h4>
          <ul style={ul()}>
            <li style={link()} onClick={() => setModal('impressum')}>Impressum</li>
            <li style={link()} onClick={() => setModal('datenschutz')}>Datenschutz</li>
            <li style={link()} onClick={() => setModal('cookies')}>Cookie-Hinweise</li>
          </ul>
        </div>

        <div>
          <h4 style={h4()}>Kontakt</h4>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.8, margin: 0 }}>
            Team swp-team2<br />
            Hochschule<br />
            <a href={`mailto:${MAIL}`} style={{ color: "var(--cc-accent)", textDecoration: "none" }}>{MAIL}</a>
          </p>
        </div>
      </footer>

      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "var(--cc-surface)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.3)", maxWidth: 580, width: "90%", maxHeight: "82vh", overflow: "auto", padding: 32 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--cc-text)" }}>
                {modal === 'impressum'  && 'Impressum'}
                {modal === 'datenschutz' && 'Datenschutzerklärung'}
                {modal === 'cookies'    && 'Cookie-Hinweise'}
                {modal === 'about'      && 'Über Campaign Connect'}
                {modal === 'support'    && 'Support'}
              </h2>
              <button onClick={() => setModal(null)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--cc-border-soft)", color: "var(--cc-text)", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ fontSize: 14, color: "var(--cc-text)", lineHeight: 1.85, display: "flex", flexDirection: "column", gap: 18 }}>
              {modal === 'impressum' && <Impressum />}
              {modal === 'datenschutz' && <Datenschutz />}
              {modal === 'cookies' && <Cookies />}
              {modal === 'about' && <About />}
              {modal === 'support' && <Support />}
            </div>
          </div>
        </div>
      )}
    </>
  );

  function h4() { return { fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--cc-accent)", textTransform: "uppercase", letterSpacing: ".06em" }; }
  function ul() { return { listStyle: "none", padding: 0, margin: 0, fontSize: 13, color: "rgba(255,255,255,.7)", lineHeight: 1.9 }; }
  function link() { return { cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,.3)" }; }
}

function Block({ title, children }) {
  return (
    <section>
      <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>
      <span style={{ color: "var(--cc-text-soft)" }}>{children}</span>
    </section>
  );
}

function Impressum() {
  return (
    <>
      <Block title="Angaben gemäß § 5 TMG">
        Campaign Connect — Studentisches Softwareprojekt<br />
        Team swp-team2<br />
        Hochschule
      </Block>
      <Block title="Kontakt">
        E-Mail: <a href={`mailto:${MAIL}`} style={{ color: "var(--cc-accent)" }}>{MAIL}</a>
      </Block>
      <Block title="Haftungsausschluss">
        Dieses Projekt ist ein studentisches Lehrprojekt und wird nicht kommerziell betrieben.
        Alle Inhalte dienen ausschließlich Demonstrations- und Lernzwecken. Trotz sorgfältiger
        inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
        Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
      </Block>
      <Block title="Urheberrecht">
        Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen
        Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Die Vervielfältigung,
        Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
        Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors.
      </Block>
    </>
  );
}

function Datenschutz() {
  return (
    <>
      <Block title="Verantwortliche Stelle">
        Team swp-team2, Hochschule — <a href={`mailto:${MAIL}`} style={{ color: "var(--cc-accent)" }}>{MAIL}</a>
      </Block>
      <Block title="Welche Daten wir speichern">
        Bei der Registrierung und Nutzung von Campaign Connect werden folgende personenbezogene
        Daten erhoben und gespeichert: Benutzername, E-Mail-Adresse, Passwort (verschlüsselt),
        Rolle (Spieler / Spielleiter), Erfahrungslevel, Zeitzone sowie ein technischer
        iCal-Token für die Kalender-Synchronisation.
      </Block>
      <Block title="Zweck der Datenverarbeitung">
        Die erhobenen Daten werden ausschließlich zur Bereitstellung der Plattformfunktionen
        verwendet: Authentifizierung, Anzeige des Profils, Koordination von Spielterminen
        und Verwaltung von Gruppen und Kampagnen. Eine Weitergabe an Dritte findet nicht statt.
      </Block>
      <Block title="Authentifizierung">
        Campaign Connect verwendet JSON Web Tokens (JWT) zur Authentifizierung. Die Tokens
        werden im lokalen Speicher (localStorage) des Browsers abgelegt und sind ausschließlich
        für die Kommunikation mit dem eigenen Backend vorgesehen.
      </Block>
      <Block title="Speicherdauer">
        Personenbezogene Daten werden so lange gespeichert, wie ein aktives Konto besteht.
        Nach Löschung des Kontos werden alle zugehörigen Daten vollständig entfernt.
      </Block>
      <Block title="Deine Rechte (DSGVO)">
        Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
        Verarbeitung deiner personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit.
        Anfragen richtest du bitte an: <a href={`mailto:${MAIL}`} style={{ color: "var(--cc-accent)" }}>{MAIL}</a>
      </Block>
      <Block title="Hinweis">
        Dies ist ein studentisches Lehrprojekt. Die Datenschutzerklärung dient der
        Transparenz im Rahmen des Projekts.
      </Block>
    </>
  );
}

function Cookies() {
  return (
    <>
      <Block title="Verwendung von Cookies und lokalem Speicher">
        Campaign Connect verwendet keine klassischen Tracking-Cookies. Stattdessen nutzen
        wir den lokalen Speicher (localStorage) des Browsers ausschließlich für technisch
        notwendige Daten.
      </Block>
      <Block title="Gespeicherte Einträge">
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cc-border-soft)", textAlign: "left" }}>
              <th style={{ padding: "4px 8px 4px 0", fontWeight: 600 }}>Schlüssel</th>
              <th style={{ padding: "4px 8px", fontWeight: 600 }}>Inhalt</th>
              <th style={{ padding: "4px 0 4px 8px", fontWeight: 600 }}>Zweck</th>
            </tr>
          </thead>
          <tbody style={{ color: "var(--cc-text-soft)" }}>
            <tr style={{ borderBottom: "1px solid var(--cc-border-soft)" }}>
              <td style={{ padding: "6px 8px 6px 0", fontFamily: "monospace", fontSize: 12 }}>cc_access</td>
              <td style={{ padding: "6px 8px" }}>JWT Access-Token</td>
              <td style={{ padding: "6px 0 6px 8px" }}>Authentifizierung bei API-Anfragen</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--cc-border-soft)" }}>
              <td style={{ padding: "6px 8px 6px 0", fontFamily: "monospace", fontSize: 12 }}>cc_refresh</td>
              <td style={{ padding: "6px 8px" }}>JWT Refresh-Token</td>
              <td style={{ padding: "6px 0 6px 8px" }}>Automatische Token-Erneuerung</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 0", fontFamily: "monospace", fontSize: 12 }}>cc_user</td>
              <td style={{ padding: "6px 8px" }}>Benutzername</td>
              <td style={{ padding: "6px 0 6px 8px" }}>Anzeige des eingeloggten Nutzers</td>
            </tr>
          </tbody>
        </table>
      </Block>
      <Block title="Drittanbieter">
        Es werden keine Tracking-, Werbe- oder Analyse-Cookies von Drittanbietern gesetzt.
        Es findet kein Datenaustausch mit externen Analyse-Diensten (z. B. Google Analytics) statt.
      </Block>
      <Block title="Löschen">
        Die gespeicherten Einträge werden beim Abmelden automatisch entfernt. Du kannst
        sie jederzeit auch manuell über die Entwicklertools deines Browsers löschen.
      </Block>
    </>
  );
}

function About() {
  return (
    <>
      <Block title="Was ist Campaign Connect?">
        Campaign Connect ist eine Webanwendung für Tabletop-Rollenspiel-Gruppen. Die Plattform
        erleichtert die Organisation von Spielabenden, die Verwaltung von Kampagnen und die
        Koordination zwischen Spielern und Spielleitern — alles an einem Ort.
      </Block>
      <Block title="Funktionen">
        <ul style={{ margin: "4px 0 0 16px", padding: 0, lineHeight: 2 }}>
          <li>Terminplanung mit Abstimmungsfunktion (Umfragen)</li>
          <li>Gruppen- und Kampagnenverwaltung</li>
          <li>Freundesliste und Spielersuche</li>
          <li>Kalender-Synchronisation via iCal (Google Calendar, Apple Kalender, Outlook)</li>
          <li>Community-Board zur Suche nach neuen Mitspielern</li>
          <li>Persönliches Profil mit Rolle und Erfahrungslevel</li>
        </ul>
      </Block>
      <Block title="Hintergrund">
        Campaign Connect entstand im Rahmen eines studentischen Softwareprojekts (SWP).
        Ziel war es, eine vollständige Webanwendung von der Idee bis zur Deployment-fähigen
        Version zu entwickeln — mit modernem Tech-Stack, agiler Arbeitsweise und realem
        Projektmanagement.
      </Block>
      <Block title="Tech-Stack">
        Frontend: React 18 + Vite · Backend: Django + Django REST Framework · Datenbank: MySQL ·
        Authentifizierung: JWT · Containerisierung: Docker
      </Block>
      <Block title="Team">
        Entwickelt von Team swp-team2 im Rahmen des Softwarepraktikums.
      </Block>
    </>
  );
}

function Support() {
  return (
    <>
      <Block title="Du brauchst Hilfe?">
        Bei Fragen, Problemen oder Feedback zur Plattform erreichst du uns per E-Mail.
        Wir antworten so schnell wie möglich.
      </Block>
      <Block title="Kontakt">
        <a href={`mailto:${MAIL}`} style={{ color: "var(--cc-accent)", fontWeight: 600 }}>{MAIL}</a>
      </Block>
      <Block title="Häufige Fragen">
        <ul style={{ margin: "4px 0 0 16px", padding: 0, lineHeight: 2.2 }}>
          <li><strong>Passwort vergessen?</strong> — Bitte per E-Mail melden, wir helfen manuell.</li>
          <li><strong>iCal-Feed funktioniert nicht?</strong> — Auf dem Questboard den Sync-Button klicken und die webcal://-URL in deinen Kalender eintragen.</li>
          <li><strong>Gruppe wird nicht angezeigt?</strong> — Seite neu laden oder kurz aus- und einloggen.</li>
          <li><strong>Bug gefunden?</strong> — Gerne per E-Mail mit Screenshot melden.</li>
        </ul>
      </Block>
      <Block title="Hinweis">
        Campaign Connect ist ein studentisches Lehrprojekt. Der Support-Umfang ist
        entsprechend begrenzt. Wir danken für dein Verständnis.
      </Block>
    </>
  );
}
