import React from 'react';
import { getI18n } from '../data/i18n.js';
import Icon from '../components/atoms/Icon.jsx';
import Logo from '../components/atoms/Logo.jsx';

/* Branding — Logo-Variationen & Brand-Voice */

export default function Branding({ tweaks }) {
  const i18n = getI18n(tweaks.lang);

  const taglines = [
    "Connect the Party.",
    "Roll for Availability.",
    "Nat20 in Koordination.",
    "Don't let scheduling be the final boss.",
    "Weil Helden auch Kalender brauchen.",
    "Advantage auf Terminplanung.",
    "Die Runde sitzt. Der Rest auch.",
    "Long rest war gestern.",
    "Weil die beste Session die ist, die auch stattfindet.",
    "Lass deine Termine nicht dein Endgegner sein.",
  ];

  return (
    <div style={{ background: "var(--cc-dark-plum)", color: "#fff", minHeight: "100vh", padding: "0 0 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", padding: "40px 0 80px" }}>
          <Logo size="hero" onDark/>
          <p className="display" style={{
            fontSize: "clamp(20px, 2.4vw, 32px)",
            color: "var(--cc-accent)",
            marginTop: 24,
            letterSpacing: ".05em",
          }}>
            {i18n.b.tagline}
          </p>
        </div>

        {/* Logo variants */}
        <Section dark title="Logo-Varianten">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
            <Swatch bg="#FFFFFF"  label="Light"   onDark={false}><Logo size="md"/></Swatch>
            <Swatch bg="#13101B"  label="Dark"    onDark><Logo size="md" onDark/></Swatch>
            <Swatch bg="#E9A051"  label="Accent"  onDark={false}><Logo size="md"/></Swatch>
          </div>
        </Section>

        {/* Color palette */}
        <Section dark title="Farbpalette">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
            <Color hex="#E9A051" name="Orange"/>
            <Color hex="#B45127" name="Orange Deep"/>
            <Color hex="#1D1B20" name="Ink"/>
            <Color hex="#2D2139" name="Plum"/>
            <Color hex="#13101B" name="Night"/>
            <Color hex="#FFFFFF" name="White" dark/>
          </div>
        </Section>

        {/* Typography */}
        <Section dark title="Typografie">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={typeCard()}>
              <div className="display" style={{fontSize:64, color:"var(--cc-accent)"}}>Aa</div>
              <div style={{fontSize:13, color:"rgba(255,255,255,.7)"}}>Display</div>
              <div style={{fontSize:18, fontFamily:"var(--cc-font-display)", marginTop:6}}>Koulen</div>
            </div>
            <div style={typeCard()}>
              <div style={{fontSize:64, fontWeight:500}}>Aa</div>
              <div style={{fontSize:13, color:"rgba(255,255,255,.7)"}}>UI &amp; Body</div>
              <div style={{fontSize:18, fontWeight:500, marginTop:6}}>Roboto</div>
            </div>
          </div>
        </Section>

        {/* Voice */}
        <Section dark title="Brand Voice">
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
            gap:12,
          }}>
            {taglines.map((t,i)=>(
              <div key={i} className="display" style={{
                padding:18,
                background:"rgba(255,255,255,.04)",
                border:"1px solid rgba(255,255,255,.1)",
                borderRadius:12,
                fontSize:18,
                color: i % 3 === 0 ? "var(--cc-accent)" : "#fff",
                lineHeight:1.3,
              }}>
                {tweaks.rpg === "on" && i % 4 === 0 && <Icon name="dice" size={20} style={{marginRight:8, verticalAlign:"middle", color:"var(--cc-accent)"}}/>}
                {t}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );

  function Section({ title, children }) {
    return (
      <section style={{ marginBottom: 56 }}>
        <h2 className="display" style={{ fontSize: 28, color:"var(--cc-accent)", marginBottom: 18, letterSpacing: ".04em" }}>
          {title}
        </h2>
        {children}
      </section>
    );
  }
  function Swatch({ bg, label, onDark, children }) {
    return (
      <div style={{
        background:bg, padding:"32px 20px", borderRadius:14,
        border:"1px solid rgba(255,255,255,.1)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:10,
      }}>
        {children}
        <div style={{fontSize:11, color:onDark?"rgba(255,255,255,.7)":"rgba(0,0,0,.5)", letterSpacing:".1em", textTransform:"uppercase", fontWeight:600}}>{label}</div>
      </div>
    );
  }
  function Color({ hex, name, dark }) {
    return (
      <div style={{borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{background:hex, height:80}}/>
        <div style={{padding:"8px 10px", background:"rgba(255,255,255,.04)"}}>
          <div style={{fontSize:13, fontWeight:600}}>{name}</div>
          <div style={{fontSize:11, color:"rgba(255,255,255,.6)", fontFamily:"monospace"}}>{hex}</div>
        </div>
      </div>
    );
  }
  function typeCard() {
    return {
      padding:24, background:"rgba(255,255,255,.04)",
      border:"1px solid rgba(255,255,255,.1)", borderRadius:14,
      display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6,
    };
  }
}
