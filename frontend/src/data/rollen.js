/* Kleiner Helper für die Rollen-Prüfung, damit der Check nicht überall
   dupliziert wird. */
export function istLeiter(rolle) {
  return rolle === 'spielleiter' || rolle === 'admin';
}
