// Lista de rubros sugeridos para los negocios. El form permite "Otro" libre,
// así que un negocio puede tener un rubro fuera de esta lista.
export const RUBROS = [
  'Pádel',
  'Fútbol',
  'Tenis',
  'Médico',
  'Odontología',
  'Barbería',
  'Peluquería',
  'Estética',
  'Spa',
  'Gimnasio',
  'Otro',
] as const;

// Emoji por rubro, para placeholders y chips (cliente y servidor).
export const RUBRO_EMOJI: Record<string, string> = {
  Pádel: '🎾',
  Fútbol: '⚽',
  Tenis: '🎾',
  Médico: '🩺',
  Odontología: '🦷',
  Barbería: '💈',
  Peluquería: '✂️',
  Estética: '💅',
  Spa: '💆',
  Gimnasio: '🏋️',
  Otro: '🏪',
};

export function emojiFor(category: string) {
  return RUBRO_EMOJI[category] ?? '🏪';
}
