// Array de estilos de avatares genéricos
export const genericAvatars = [
  {
    id: 1,
    backgroundColor: '#8B5CF6', // púrpura
    skinTone: '#FFB5A7',
    hairColor: '#F97316',
    shirtColor: '#84CC16'
  },
  {
    id: 2,
    backgroundColor: '#3B82F6', // azul
    skinTone: '#FED7AA',
    hairColor: '#92400E',
    shirtColor: '#EF4444'
  },
  {
    id: 3,
    backgroundColor: '#10B981', // esmeralda
    skinTone: '#F3E8FF',
    hairColor: '#1F2937',
    shirtColor: '#F59E0B'
  },
  {
    id: 4,
    backgroundColor: '#F59E0B', // ámbar
    skinTone: '#FEE2E2',
    hairColor: '#7C2D12',
    shirtColor: '#06B6D4'
  },
  {
    id: 5,
    backgroundColor: '#EC4899', // rosa
    skinTone: '#DBEAFE',
    hairColor: '#FCD34D',
    shirtColor: '#8B5CF6'
  },
  {
    id: 6,
    backgroundColor: '#6366F1', // índigo
    skinTone: '#FEF3C7',
    hairColor: '#059669',
    shirtColor: '#DC2626'
  },
  {
    id: 7,
    backgroundColor: '#14B8A6', // teal
    skinTone: '#FCE7F3',
    hairColor: '#B45309',
    shirtColor: '#7C3AED'
  },
  {
    id: 8,
    backgroundColor: '#F97316', // naranja
    skinTone: '#E0E7FF',
    hairColor: '#374151',
    shirtColor: '#059669'
  }
];

// Función para obtener un avatar basado en el ID del usuario
export function getGenericAvatar(userId: string) {
  // Usar el hash del userId para seleccionar un avatar consistente
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % genericAvatars.length;
  return genericAvatars[index];
}

// Componente SVG para el avatar genérico
export function GenericAvatarSVG({ 
  avatar, 
  size = 40 
}: { 
  avatar: typeof genericAvatars[0]; 
  size?: number;
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className="rounded-full"
    >
      {/* Fondo circular */}
      <circle 
        cx="50" 
        cy="50" 
        r="50" 
        fill={avatar.backgroundColor}
      />
      
      {/* Cara */}
      <ellipse 
        cx="50" 
        cy="45" 
        rx="20" 
        ry="25" 
        fill={avatar.skinTone}
      />
      
      {/* Cabello */}
      <ellipse 
        cx="50" 
        cy="28" 
        rx="22" 
        ry="18" 
        fill={avatar.hairColor}
      />
      
      {/* Ojos */}
      <circle cx="44" cy="40" r="2" fill="#000" />
      <circle cx="56" cy="40" r="2" fill="#000" />
      
      {/* Boca */}
      <ellipse 
        cx="50" 
        cy="50" 
        rx="3" 
        ry="2" 
        fill="#000"
      />
      
      {/* Orejas */}
      <circle cx="32" cy="45" r="4" fill={avatar.skinTone} />
      <circle cx="68" cy="45" r="4" fill={avatar.skinTone} />
      
      {/* Camiseta */}
      <ellipse 
        cx="50" 
        cy="85" 
        rx="25" 
        ry="20" 
        fill={avatar.shirtColor}
      />
      
      {/* Cuello */}
      <rect 
        x="45" 
        y="65" 
        width="10" 
        height="8" 
        fill={avatar.skinTone}
      />
    </svg>
  );
}