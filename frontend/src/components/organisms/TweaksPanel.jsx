import React from 'react';
import Icon from '../atoms/Icon.jsx';

/* TweaksPanel — schwebendes Panel rechts unten.
   Steuert: Theme, Accent, RPG, Sprache, Card-Variante. */

export default function TweaksPanel({ tweaks, setTweak, onClose }) {
  return (
    <div
      style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 100,
        width: 280, padding: 16,
        background: "var(--cc-surface)", color: "var(--cc-text)",
        border: "1px solid var(--cc-border-soft)",
        borderRadius: 14,
        boxShadow: "0 20px 50px rgba(0,0,0,.25)",
        fontSize: 13,
        maxHeight: "85vh", overflowY: "auto",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
        <strong style={{ fontSize: 14 }}>Tweaks</strong>
        <button onClick={onClose} style={{padding:4}}><Icon name="x" size={16}/></button>
      </div>

      <Sec title="Theme">
        <Seg value={tweaks.theme} onChange={v=>setTweak("theme",v)} options={[["light","Hell"],["dark","Dunkel"]]}/>
      </Sec>

      {/*
      <Sec title="Akzent">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["orange","#E9A051"],["violet","#8B5CF6"],["emerald","#10B981"],["rose","#F43F5E"],["cyan","#06B6D4"]].map(([k,c])=>(
            <button key={k} onClick={()=>setTweak("accent",k)} title={k}
              style={{
                width:28,height:28,borderRadius:"50%",background:c,
                border: tweaks.accent===k?"3px solid var(--cc-text)":"2px solid transparent",
                cursor:"pointer",
              }}/>
          ))}
        </div>
      </Sec>

      <Sec title="RPG-Theming">
        <Seg value={tweaks.rpg} onChange={v=>setTweak("rpg",v)} options={[["on","An"],["off","Aus"]]}/>
      </Sec>

      <Sec title="Sprache">
        <Seg value={tweaks.lang} onChange={v=>setTweak("lang",v)} options={[["de","DE"],["en","EN"]]}/>
      </Sec>

      <Sec title="Termin-Karte">
        <Seg value={tweaks.cardVariant} onChange={v=>setTweak("cardVariant",v)} options={[["default","Standard"],["compact","Kompakt"],["pillboxed","Akzent"]]}/>
      </Sec>

      <p style={{ fontSize: 11, color: "var(--cc-text-soft)", marginTop: 12, marginBottom: 0 }}>
        Tipp: Drag &amp; Drop in „Anstehende Termine" zum Umsortieren.
      </p>
      */}
    </div>
  );
}

function Sec({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--cc-text-soft)", marginBottom: 6, textTransform:"uppercase", letterSpacing:".06em" }}>{title}</div>
      {children}
    </div>
  );
}
function Seg({ value, onChange, options }) {
  return (
    <div style={{ display:"flex", borderRadius:6, border:"1px solid var(--cc-border-soft)", overflow:"hidden" }}>
      {options.map(([k,l])=>(
        <button key={k} onClick={()=>onChange(k)} style={{
          flex:1, padding:"6px 8px", fontSize:12, fontWeight:500,
          background: value===k ? "var(--cc-accent)" : "transparent",
          color: value===k ? "var(--cc-ink)" : "var(--cc-text)",
          cursor:"pointer",
        }}>{l}</button>
      ))}
    </div>
  );
}
