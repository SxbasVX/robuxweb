// Generador de nombres aleatorios estilo Xbox gamertag
// Inspirado en los nombres que genera Xbox automáticamente

const adjectives = [
  'Silent', 'Swift', 'Brave', 'Wild', 'Cool', 'Smart', 'Bold', 'Quick',
  'Dark', 'Bright', 'Strong', 'Fast', 'Calm', 'Sharp', 'Wise', 'Fierce',
  'Noble', 'Epic', 'Magic', 'Crystal', 'Storm', 'Fire', 'Ice', 'Thunder',
  'Shadow', 'Light', 'Golden', 'Silver', 'Mystic', 'Cyber', 'Neon', 'Cosmic',
  'Rebel', 'Alpha', 'Beta', 'Delta', 'Omega', 'Phoenix', 'Dragon', 'Wolf',
  'Eagle', 'Shark', 'Tiger', 'Lion', 'Hawk', 'Raven', 'Viper', 'Falcon'
];

const nouns = [
  'Hunter', 'Warrior', 'Knight', 'Mage', 'Archer', 'Fighter', 'Guardian',
  'Defender', 'Champion', 'Hero', 'Legend', 'Master', 'Ghost', 'Phantom',
  'Ranger', 'Scout', 'Sniper', 'Pilot', 'Captain', 'Admiral', 'General',
  'Commander', 'Agent', 'Ninja', 'Samurai', 'Viking', 'Spartan', 'Titan',
  'Storm', 'Blaze', 'Frost', 'Thunder', 'Lightning', 'Eclipse', 'Nova',
  'Comet', 'Meteor', 'Star', 'Galaxy', 'Cosmos', 'Void', 'Prism', 'Nexus',
  'Matrix', 'Core', 'Edge', 'Pulse', 'Wave', 'Surge', 'Force', 'Power'
];

// Colores para avatares
const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  '#F1948A', '#85C1E9', '#D7BDE2', '#A9DFBF', '#F9E79F', '#AED6F1'
];

// Emojis para avatares
const avatarEmojis = [
  '🎮', '🚀', '⭐', '🔥', '⚡', '🌟', '💎', '🎯', '🎪', '🎨',
  '🎵', '🎲', '🎸', '🎭', '🎺', '🎻', '🏆', '🏅', '🎖️', '👑',
  '🦄', '🦋', '🦅', '🦊', '🐺', '🦁', '🐅', '🦈', '🐉', '🔮',
  '💫', '🌈', '🍀', '🌸', '🌺', '🌻', '🍄', '🌵', '🎃', '❄️'
];

export function generateRandomGamertag(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
}

export function generateRandomAvatar(): { color: string; emoji: string } {
  const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  const emoji = avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
  
  return { color, emoji };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'delegado':
      return 'Delegado';
    case 'usuario':
      return 'Estudiante';
    default:
      return 'Invitado';
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'from-purple-500 to-pink-500';
    case 'delegado':
      return 'from-blue-500 to-cyan-500';
    case 'usuario':
      return 'from-green-500 to-teal-500';
    default:
      return 'from-gray-500 to-gray-600';
  }
}

export function getRoleIcon(role: string): string {
  switch (role) {
    case 'admin':
      return '👑';
    case 'delegado':
      return '🎯';
    case 'usuario':
      return '📚';
    default:
      return '👤';
  }
}