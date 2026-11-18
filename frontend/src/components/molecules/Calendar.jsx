import React from 'react';
import { getI18n } from '../../data/i18n.js';
import Icon from '../atoms/Icon.jsx';

/* Calendar — Monats- und Wochenansicht mit Availability-Heatmap.
   Props: year, month, availability, onDayClick, selectedDay, view ('month'|'week') */

export default function Calendar({ year, month, availability = {}, onDayClick, selectedDay, view = 'month' }) {
  const i18n = getI18n("de");
  const [curYear, setCurYear] = React.useState(year);
  const [curMonth, setCurMonth] = React.useState(month);

  const prevMonth = () => {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); }
    else setCurMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); }
    else setCurMonth(m => m + 1);
  };

  if (view === 'week') {
    return <WeekView year={curYear} month={curMonth} availability={availability} onDayClick={onDayClick} selectedDay={selectedDay} i18n={i18n} onPrev={prevMonth} onNext={nextMonth} />;
  }

  // Month view
  const first = new Date(curYear, curMonth, 1);
  const startDow = (first.getDay() + 6) % 7; // Mo=0
  const days = new Date(curYear, curMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  return (
    <div className="cc-cal" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {i18n.months[curMonth]} {curYear}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={btn()} onClick={prevMonth}><Icon name="chevron" size={14} style={{ transform: "rotate(90deg)" }} /></button>
          <button style={btn()} onClick={nextMonth}><Icon name="chevron" size={14} style={{ transform: "rotate(-90deg)" }} /></button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {i18n.weekdays.map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, color: "var(--cc-text-soft)" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const key = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const count = availability[key] || 0;
          const isSelected = selectedDay === key;
          const pct = count / 6;
          const bg = count
            ? `rgba(233,160,81, ${0.18 + pct * 0.55})`
            : "transparent";
          return (
            <button
              key={i}
              onClick={() => onDayClick && onDayClick(key, d)}
              style={{
                aspectRatio: "1 / 1",
                border: isSelected ? "2px solid var(--cc-accent)" : "1px solid var(--cc-border-soft)",
                borderRadius: 6,
                background: bg,
                fontSize: 13,
                color: "var(--cc-text)",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <span>{d}</span>
              {count > 0 && (
                <span style={{ fontSize: 9, color: "var(--cc-accent-deep)", fontWeight: 600 }}>{count}/6</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  function btn() {
    return {
      width: 24, height: 24, borderRadius: 4,
      background: "var(--cc-accent-deep)", color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: "none", cursor: "pointer",
    };
  }
}

function WeekView({ year, month, availability, onDayClick, selectedDay, i18n, onPrev, onNext }) {
  // Get today (or a reference date)
  const today = new Date(year, month, 1);
  const dayOfWeek = (today.getDay() + 6) % 7; // Mo=0
  const mondayOffset = dayOfWeek;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - mondayOffset);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  return (
    <div className="cc-cal-week" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {weekDays[0].getDate()}. {i18n.months[weekDays[0].getMonth()]} - {weekDays[6].getDate()}. {i18n.months[weekDays[6].getMonth()]} {year}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={weekBtn()} onClick={onPrev}><Icon name="chevron" size={14} style={{ transform: "rotate(90deg)" }} /></button>
          <button style={weekBtn()} onClick={onNext}><Icon name="chevron" size={14} style={{ transform: "rotate(-90deg)" }} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {weekDays.map((d, i) => {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const count = availability[key] || 0;
          const isSelected = selectedDay === key;
          const pct = count / 6;
          const bg = count
            ? `rgba(233,160,81, ${0.18 + pct * 0.55})`
            : "transparent";
          const isToday = new Date().toDateString() === d.toDateString();

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ textAlign: "center", fontSize: 11, color: "var(--cc-text-soft)", fontWeight: 500 }}>
                {i18n.weekdays[i]}
              </div>
              <button
                onClick={() => onDayClick && onDayClick(key, d.getDate())}
                style={{
                  aspectRatio: "1 / 1.3",
                  border: isSelected ? "2px solid var(--cc-accent)" : (isToday ? "2px solid var(--cc-text-soft)" : "1px solid var(--cc-border-soft)"),
                  borderRadius: 8,
                  background: bg,
                  fontSize: 14,
                  fontWeight: isToday ? 600 : 400,
                  color: "var(--cc-text)",
                  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  position: "relative",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <span>{d.getDate()}</span>
                {count > 0 && (
                  <span style={{ fontSize: 9, color: "var(--cc-accent-deep)", fontWeight: 600, marginTop: 2 }}>{count}/6</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  function weekBtn() {
    return {
      width: 24, height: 24, borderRadius: 4,
      background: "var(--cc-accent-deep)", color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: "none", cursor: "pointer",
    };
  }
}
