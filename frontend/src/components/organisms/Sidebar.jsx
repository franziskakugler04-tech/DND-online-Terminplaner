import React from 'react';
import { getI18n } from '../../data/i18n.js';
import Button from '../atoms/Button.jsx';
import Icon from '../atoms/Icon.jsx';

/* Sidebar - Filter sidebar for Community screen */
export default function Sidebar({ filters, setFilters }) {
  const i18n = getI18n(/*lang*/null || "de");
  return (
    <aside style={{
      width: 280, padding: 18,
      background: "var(--cc-surface)",
      border: "1px solid var(--cc-border-soft)",
      borderRadius: 14,
      display: "flex", flexDirection: "column", gap: 16,
      alignSelf: "start",
    }}>
      <div>
        <label style={lbl()}>{i18n.c.period}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={inp()} placeholder={i18n.c.start}/>
          <input style={inp()} placeholder={i18n.c.end}/>
        </div>
      </div>
      <div>
        <label style={lbl()}>{i18n.c.keywords}</label>
        <input style={inp()} placeholder="z.B. D&D, einsteigerfreundlich"/>
      </div>
      <div>
        <label style={lbl()}>{i18n.c.placeSet}</label>
        <input style={inp()} placeholder={i18n.c.placeLook}/>
      </div>
      <div>
        <label style={lbl()}>{i18n.c.range}</label>
        <input type="range" min="0" max="100" defaultValue="25" style={{ width: "100%", accentColor: "var(--cc-accent)" }}/>
        <div style={{ fontSize: 11, color: "var(--cc-text-soft)" }}>{i18n.c.rangeSub}</div>
      </div>
      <div>
        <label style={lbl()}>{i18n.c.role}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={chip(filters.role==="player")} onClick={()=>setFilters({...filters, role:"player"})}>{i18n.c.player}</button>
          <button style={chip(filters.role==="dm")}     onClick={()=>setFilters({...filters, role:"dm"})}>{i18n.c.dm}</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={chip(filters.mode==="onsite")} onClick={()=>setFilters({...filters, mode:"onsite"})}>{i18n.c.onSite}</button>
        <button style={chip(filters.mode==="online")} onClick={()=>setFilters({...filters, mode:"online"})}>{i18n.c.online}</button>
      </div>
      <Button variant="primary" leading={<Icon name="filter" size={14}/>}>{i18n.c.filter}</Button>
    </aside>
  );
  function lbl(){return{fontSize:12,fontWeight:600,color:"var(--cc-text-soft)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"};}
  function inp(){return{width:"100%",padding:"8px 10px",border:"1px solid var(--cc-border-soft)",borderRadius:6,fontSize:13,fontFamily:"inherit",background:"var(--cc-surface)",color:"var(--cc-text)"};}
  function chip(active){return{flex:1,padding:"6px 10px",borderRadius:5,fontSize:12,fontWeight:500,background:active?"var(--cc-accent)":"transparent",color:active?"var(--cc-ink)":"var(--cc-text)",border:active?"none":"1px solid var(--cc-border-soft)",cursor:"pointer"};}
}
