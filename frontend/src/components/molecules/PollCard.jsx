import React from 'react';
import Avatar from '../atoms/Avatar.jsx';
import Button from '../atoms/Button.jsx';
import Icon from '../atoms/Icon.jsx';

/* PollCard — Terminumfrage mit Radio-Buttons und Live-Votes.
   Zeigt Balken-Visualisierung der Stimmen. */

export default function PollCard({ poll: initialPoll, currentUser, onVote, onFinalize }) {
  const [poll, setPoll] = React.useState(initialPoll);
  const [chosen, setChosen] = React.useState(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setPoll(initialPoll);
    const votedOption = initialPoll?.options?.find(o => o.voters?.includes(currentUser));
    if (votedOption) {
      setChosen(votedOption.id);
    }
  }, [initialPoll, currentUser]);

  const alreadyVoted = poll.options.some(o => o.voters?.includes(currentUser));
  const total = poll.options.reduce((s, o) => s + (o.voters?.length || o.votes || 0), 0);
  const isCreator = poll.createdBy && currentUser && poll.createdBy === currentUser;

  const vote = () => {
    if (!chosen || alreadyVoted) return;
    if (onVote) {
      onVote(chosen);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      return;
    }
    setPoll(p => ({
      ...p,
      options: p.options.map(o =>
        o.id === chosen ? { ...o, votes: (o.votes || 0) + 1, voters: [...(o.voters || []), currentUser] } : o
      ),
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleFinalize = () => {
    if (onFinalize) onFinalize();
  };

  return (
    <div
      className="cc-poll"
      style={{
        width: "100%",
        background: "var(--cc-surface)",
        border: "1px solid var(--cc-border)",
        borderRadius: 10,
        padding: "14px 16px",
        display: "grid",
        gridTemplateColumns: "40px 1fr 40px",
        gap: 14,
        alignItems: "start",
      }}
    >
      <Avatar name={poll.group} id={poll.id} size={40}/>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{poll.title}</div>
            <div style={{ fontSize: 13, color: "var(--cc-text-soft)", marginBottom: 8 }}>{poll.group}</div>
            {alreadyVoted && (
              <div style={{ fontSize: 12, color: 'var(--cc-text-soft)', marginTop: 4 }}>
                Du hast bereits abgestimmt. Weitere Änderungen sind nicht möglich.
              </div>
            )}
          </div>
          {isCreator && (
            <button
              type="button"
              onClick={handleFinalize}
              title="Umfrage auflösen"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: 'none',
                background: 'var(--cc-accent)',
                color: 'var(--cc-ink)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={18} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {poll.options.map(o => {
            const votes = o.voters?.length ?? o.votes ?? 0;
            const pct = total ? Math.round((votes / total) * 100) : 0;
            const isChosen = chosen === o.id;
            return (
              <label
                key={o.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: isChosen ? "rgba(233,160,81,.12)" : "transparent",
                  overflow: "hidden",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, rgba(233,160,81,.15), rgba(233,160,81,.05))",
                    transition: "width .4s ease",
                    borderRadius: 6,
                  }}
                />
                <input
                  type="radio"
                  name={poll.id}
                  checked={isChosen}
                  onChange={() => setChosen(o.id)}
                  disabled={alreadyVoted}
                  style={{
                    accentColor: "var(--cc-accent)",
                    margin: 0,
                    position: "relative",
                    zIndex: 1,
                    width: 16, height: 16,
                  }}
                />
                <span style={{ position: "relative", zIndex: 1, fontSize: 14, flex: 1 }}>{o.label}</span>
                <span style={{ position: "relative", zIndex: 1, fontSize: 12, color: "var(--cc-text-soft)", fontVariantNumeric: "tabular-nums" }}>
                  {votes}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {poll.options.map(o => {
            const voters = o.voters || [];
            if (voters.length === 0) return null;
            return (
              <div key={o.id} style={{ fontSize: 12, color: "var(--cc-text-soft)", lineHeight: 1.4 }}>
                <strong>{o.label}</strong>: {voters.join(', ')}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button size="sm" variant="primary" onClick={vote} disabled={!chosen || alreadyVoted}>
            {alreadyVoted ? "Abgestimmt" : saved ? "✓ Gespeichert" : "Abstimmen"}
          </Button>
          <Button size="sm" variant="ghost">Details</Button>
        </div>
      </div>
    </div>
  );
}
