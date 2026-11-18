import React from 'react';
import Avatar from '../atoms/Avatar.jsx';
import Icon from '../atoms/Icon.jsx';

/* ChatListItem — eine Zeile im "Chats"-Widget */

export default function ChatListItem({ chat, onOpen, onPin, onArchive }) {
  return (
    <div
      className="cc-chat-item"
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr auto",
        alignItems: "center",
        gap: 10,
        padding: "8px 4px",
        borderRadius: 6,
        cursor: "pointer",
      }}
      onClick={onOpen}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(233,160,81,.08)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <Avatar name={chat.name} id={chat.id} size={28} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--cc-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {chat.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: chat.hasNew ? "var(--cc-accent)" : "var(--cc-text-soft)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {chat.hasNew ? "Neue Nachrichten" : chat.lastMsg}
        </div>
      </div>
    </div>
  );
}
