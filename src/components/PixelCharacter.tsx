import React from 'react';

interface PixelCharacterProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animationState?: 'idle' | 'walk' | 'celebrate';
  facingLeft?: boolean;
  equipped?: {
    weapon?: string;
    headgear?: string;
    armor?: string;
    pet?: string;
  };
  showPet?: boolean;
}

export const PixelCharacter: React.FC<PixelCharacterProps> = ({
  size = 'md',
  animationState = 'idle',
  facingLeft = false,
  equipped,
  showPet = true
}) => {
  const scaleMap = {
    sm: 2,   // 32px height
    md: 3,   // 48px height
    lg: 4.5, // 72px height
    xl: 6    // 96px height
  };

  const scale = scaleMap[size];
  const weapon = equipped?.weapon || 'wood_sword';
  const headgear = equipped?.headgear || 'wanderer_cap';
  const armor = equipped?.armor || 'linen_tunic';
  const pet = equipped?.pet || 'cat_companion';

  // Custom animation styles based on state
  const animClass = 
    animationState === 'celebrate' ? 'animate-bounce' :
    animationState === 'walk' ? 'animate-bounce-slow' : 'animate-float';

  return (
    <div className={`relative inline-flex items-end justify-center ${animClass} ${facingLeft ? '-scale-x-100' : ''}`}>
      {/* Character Pixel Canvas / SVG */}
      <svg
        width={16 * scale}
        height={24 * scale}
        viewBox="0 0 16 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pixel-art drop-shadow-md"
      >
        {/* Shadow */}
        <ellipse cx="8" cy="22" rx="5" ry="1.5" fill="rgba(15, 23, 42, 0.45)" />

        {/* Legs / Boots */}
        <rect x="5" y="17" width="2" height="4" fill="#334155" />
        <rect x="9" y="17" width="2" height="4" fill="#334155" />
        <rect x="4" y="20" width="3" height="2" fill="#1e293b" />
        <rect x="9" y="20" width="3" height="2" fill="#1e293b" />

        {/* Base Body / Armor */}
        {armor === 'knight_armor' ? (
          // Knight Armor (Steel & Gold Trim)
          <>
            <rect x="4" y="10" width="8" height="7" fill="#64748b" />
            <rect x="5" y="11" width="6" height="5" fill="#94a3b8" />
            <rect x="7" y="11" width="2" height="5" fill="#cbd5e1" />
            <rect x="4" y="15" width="8" height="2" fill="#d97706" />
          </>
        ) : armor === 'scholar_robe' ? (
          // Scholar Robe (Deep Indigo / Violet with gold rune)
          <>
            <rect x="4" y="10" width="8" height="9" fill="#312e81" />
            <rect x="5" y="10" width="6" height="8" fill="#4338ca" />
            <rect x="7" y="11" width="2" height="7" fill="#818cf8" />
            <rect x="6" y="14" width="4" height="2" fill="#fbbf24" />
          </>
        ) : (
          // Default Linen Tunic (Earthy teal & leather belt)
          <>
            <rect x="4" y="10" width="8" height="7" fill="#0d9488" />
            <rect x="5" y="11" width="6" height="5" fill="#14b8a6" />
            <rect x="4" y="14" width="8" height="2" fill="#78350f" />
            <rect x="7" y="14" width="2" height="2" fill="#fbbf24" />
          </>
        )}

        {/* Arms */}
        <rect x="2" y="11" width="2" height="5" fill="#0d9488" />
        <rect x="2" y="15" width="2" height="2" fill="#fbcfe8" /> {/* Hand */}

        <rect x="12" y="11" width="2" height="5" fill="#0d9488" />
        <rect x="12" y="15" width="2" height="2" fill="#fbcfe8" /> {/* Hand */}

        {/* Head / Skin */}
        <rect x="4" y="4" width="8" height="7" fill="#fed7aa" />
        <rect x="5" y="5" width="6" height="5" fill="#ffedd5" />
        {/* Cheerful Pixel Eyes */}
        <rect x="5" y="6" width="2" height="2" fill="#1e293b" />
        <rect x="9" y="6" width="2" height="2" fill="#1e293b" />
        <rect x="6" y="6" width="1" height="1" fill="#ffffff" />
        <rect x="10" y="6" width="1" height="1" fill="#ffffff" />
        {/* Rosy Cheeks */}
        <rect x="4" y="8" width="1" height="1" fill="#f43f5e" />
        <rect x="11" y="8" width="1" height="1" fill="#f43f5e" />
        {/* Smile */}
        <rect x="7" y="8" width="2" height="1" fill="#b45309" />

        {/* Hair base */}
        <rect x="3" y="3" width="10" height="3" fill="#92400e" />
        <rect x="3" y="5" width="1" height="3" fill="#92400e" />
        <rect x="12" y="5" width="1" height="3" fill="#92400e" />

        {/* Headgear Customization */}
        {headgear === 'wizard_hat' ? (
          // Pointy Wizard Hat
          <>
            <polygon points="2,4 14,4 8,0" fill="#3730a3" />
            <polygon points="4,4 12,4 8,1" fill="#4f46e5" />
            <rect x="1" y="3" width="14" height="2" fill="#312e81" />
            <rect x="7" y="1" width="2" height="2" fill="#facc15" />
          </>
        ) : headgear === 'crown_mastery' ? (
          // Golden Crown
          <>
            <rect x="3" y="2" width="10" height="2" fill="#eab308" />
            <rect x="3" y="0" width="2" height="2" fill="#fde047" />
            <rect x="7" y="0" width="2" height="2" fill="#fde047" />
            <rect x="11" y="0" width="2" height="2" fill="#fde047" />
            <rect x="7" y="2" width="2" height="1" fill="#ef4444" /> {/* Ruby */}
          </>
        ) : headgear === 'flower_crown' ? (
          // Flower Garland
          <>
            <rect x="3" y="3" width="10" height="2" fill="#15803d" />
            <rect x="4" y="2" width="2" height="2" fill="#ec4899" />
            <rect x="7" y="2" width="2" height="2" fill="#fef08a" />
            <rect x="10" y="2" width="2" height="2" fill="#38bdf8" />
          </>
        ) : (
          // Wanderer Cap (Default)
          <>
            <rect x="3" y="2" width="10" height="2" fill="#b45309" />
            <rect x="4" y="1" width="8" height="2" fill="#d97706" />
            <rect x="10" y="3" width="4" height="1" fill="#78350f" /> {/* Visor */}
            <rect x="5" y="0" width="2" height="2" fill="#10b981" /> {/* Feather */}
          </>
        )}

        {/* Equipped Weapon / Tool in Right Hand */}
        {weapon === 'iron_pickaxe' ? (
          // Mining Pickaxe
          <>
            <rect x="13" y="9" width="1" height="9" fill="#78350f" />
            <rect x="11" y="7" width="5" height="2" fill="#94a3b8" />
            <rect x="10" y="8" width="2" height="2" fill="#cbd5e1" />
            <rect x="15" y="8" width="1" height="2" fill="#64748b" />
          </>
        ) : weapon === 'scholar_wand' ? (
          // Mystic Wand with Glowing Orb
          <>
            <rect x="13" y="8" width="1" height="10" fill="#78350f" />
            <circle cx="13.5" cy="7" r="2" fill="#38bdf8" />
            <rect x="13" y="6.5" width="1" height="1" fill="#ffffff" />
          </>
        ) : weapon === 'artisan_brush' ? (
          // Painter Brush
          <>
            <rect x="13" y="8" width="1" height="9" fill="#78350f" />
            <rect x="12.5" y="6" width="2" height="3" fill="#ec4899" />
            <rect x="13" y="5" width="1" height="2" fill="#f43f5e" />
          </>
        ) : weapon === 'celestial_blade' ? (
          // Glowing Celestial Blade
          <>
            <rect x="13" y="13" width="1" height="5" fill="#facc15" />
            <rect x="11" y="13" width="5" height="1" fill="#d97706" />
            <rect x="13" y="3" width="2" height="10" fill="#67e8f9" />
            <rect x="13.5" y="2" width="1" height="11" fill="#ffffff" />
          </>
        ) : (
          // Wooden Sword (Default)
          <>
            <rect x="13" y="13" width="1" height="4" fill="#78350f" />
            <rect x="11" y="13" width="5" height="1" fill="#92400e" />
            <rect x="13" y="6" width="1" height="7" fill="#b45309" />
            <rect x="13" y="5" width="1" height="2" fill="#d97706" />
          </>
        )}
      </svg>

      {/* Accompanying Pet */}
      {showPet && pet && (
        <div 
          className="absolute -right-5 bottom-0 animate-bounce-slow"
          style={{ width: 12 * (scale * 0.75), height: 12 * (scale * 0.75) }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 12 12"
            fill="none"
            className="pixel-art drop-shadow"
          >
            {pet === 'green_slime' ? (
              // Bouncy Green Slime
              <>
                <ellipse cx="6" cy="11" rx="4" ry="1" fill="rgba(0,0,0,0.3)" />
                <rect x="2" y="5" width="8" height="6" rx="2" fill="#22c55e" />
                <rect x="3" y="4" width="6" height="2" fill="#4ade80" />
                <rect x="4" y="6" width="1" height="2" fill="#052e16" />
                <rect x="7" y="6" width="1" height="2" fill="#052e16" />
                <rect x="3" y="5" width="2" height="1" fill="#bbf7d0" />
              </>
            ) : pet === 'baby_dragon' ? (
              // Tiny Red Dragon
              <>
                <ellipse cx="6" cy="11" rx="4" ry="1" fill="rgba(0,0,0,0.3)" />
                <rect x="3" y="5" width="6" height="5" fill="#ef4444" />
                <rect x="4" y="4" width="4" height="2" fill="#f87171" />
                <rect x="1" y="4" width="2" height="3" fill="#f97316" /> {/* Wing */}
                <rect x="9" y="4" width="2" height="3" fill="#f97316" /> {/* Wing */}
                <rect x="5" y="6" width="1" height="1" fill="#fef08a" /> {/* Horn */}
                <rect x="7" y="6" width="1" height="1" fill="#fef08a" />
                <rect x="5" y="7" width="1" height="1" fill="#450a0a" />
                <rect x="7" y="7" width="1" height="1" fill="#450a0a" />
              </>
            ) : (
              // Cute Pixel Tabby Cat
              <>
                <ellipse cx="6" cy="11" rx="4" ry="1" fill="rgba(0,0,0,0.3)" />
                <rect x="3" y="6" width="6" height="5" fill="#f59e0b" />
                <rect x="4" y="4" width="4" height="4" fill="#fbbf24" />
                <polygon points="3,4 5,4 4,2" fill="#b45309" /> {/* Ear */}
                <polygon points="7,4 9,4 8,2" fill="#b45309" /> {/* Ear */}
                <rect x="4" y="5" width="1" height="1" fill="#1e293b" /> {/* Eye */}
                <rect x="7" y="5" width="1" height="1" fill="#1e293b" />
                <rect x="5.5" y="6" width="1" height="1" fill="#ec4899" /> {/* Nose */}
                <rect x="9" y="7" width="2" height="2" fill="#d97706" /> {/* Tail */}
              </>
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
