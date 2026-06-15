// Chibi snow-leopard mascot, yuru-kyara style — DeadEnd trail guide
export default function Mascot({ size = 140, className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* tail */}
      <path
        d="M40 172 C 6 150, 8 96, 46 88 C 74 82, 84 108, 62 117 C 46 124, 50 148, 68 158 C 84 167, 74 188, 52 184 Z"
        fill="#EFD9AE" stroke="#C9A055" strokeWidth="4"
      />
      <circle cx="56" cy="104" r="6" fill="#C9A055" />
      <circle cx="50" cy="136" r="5" fill="#C9A055" />

      {/* body */}
      <ellipse cx="125" cy="176" rx="58" ry="48" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />

      {/* backpack */}
      <rect x="150" y="142" width="42" height="50" rx="12" fill="#E05252" />
      <rect x="158" y="134" width="26" height="14" rx="6" fill="#E05252" />
      <circle cx="171" cy="166" r="4" fill="#DDB96A" />

      {/* arms */}
      <ellipse cx="80" cy="190" rx="14" ry="20" fill="#EFD9AE" stroke="#C9A055" strokeWidth="3" transform="rotate(-20 80 190)" />
      <ellipse cx="172" cy="196" rx="14" ry="20" fill="#EFD9AE" stroke="#C9A055" strokeWidth="3" transform="rotate(28 172 196)" />

      {/* feet */}
      <ellipse cx="100" cy="223" rx="20" ry="12" fill="#DDB96A" />
      <ellipse cx="148" cy="223" rx="20" ry="12" fill="#DDB96A" />

      {/* head */}
      <circle cx="125" cy="100" r="68" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />

      {/* ears */}
      <circle cx="78" cy="55" r="22" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />
      <circle cx="78" cy="58" r="11" fill="#4CAF7D" />
      <circle cx="172" cy="55" r="22" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />
      <circle cx="172" cy="58" r="11" fill="#4CAF7D" />

      {/* leopard spots */}
      <circle cx="90" cy="74" r="7" fill="#C9A055" />
      <circle cx="160" cy="74" r="7" fill="#C9A055" />
      <circle cx="100" cy="128" r="6" fill="#C9A055" />
      <circle cx="150" cy="128" r="6" fill="#C9A055" />

      {/* eyes */}
      <g className="mascot-eye">
        <ellipse cx="103" cy="100" rx="10" ry="13" fill="#1C1610" />
        <circle cx="106" cy="95" r="3" fill="#fff" />
      </g>
      <g className="mascot-eye">
        <ellipse cx="147" cy="100" rx="10" ry="13" fill="#1C1610" />
        <circle cx="150" cy="95" r="3" fill="#fff" />
      </g>

      {/* blush */}
      <circle cx="85" cy="116" r="8" fill="#E05252" opacity="0.35" />
      <circle cx="165" cy="116" r="8" fill="#E05252" opacity="0.35" />

      {/* nose & mouth */}
      <path d="M119 112 L131 112 L125 120 Z" fill="#1C1610" />
      <path d="M125 120 Q125 128 115 130" stroke="#1C1610" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M125 120 Q125 128 135 130" stroke="#1C1610" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Cropped head-only version of Taumaru — for avatars / chat icons
export function MascotFace({ size = 40, className = '', style = {} }) {
  return (
    <svg
      viewBox="42 24 166 152"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* head */}
      <circle cx="125" cy="100" r="68" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />

      {/* ears */}
      <circle cx="78" cy="55" r="22" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />
      <circle cx="78" cy="58" r="11" fill="#4CAF7D" />
      <circle cx="172" cy="55" r="22" fill="#EFD9AE" stroke="#C9A055" strokeWidth="4" />
      <circle cx="172" cy="58" r="11" fill="#4CAF7D" />

      {/* leopard spots */}
      <circle cx="90" cy="74" r="7" fill="#C9A055" />
      <circle cx="160" cy="74" r="7" fill="#C9A055" />
      <circle cx="100" cy="128" r="6" fill="#C9A055" />
      <circle cx="150" cy="128" r="6" fill="#C9A055" />

      {/* eyes */}
      <g className="mascot-eye">
        <ellipse cx="103" cy="100" rx="10" ry="13" fill="#1C1610" />
        <circle cx="106" cy="95" r="3" fill="#fff" />
      </g>
      <g className="mascot-eye">
        <ellipse cx="147" cy="100" rx="10" ry="13" fill="#1C1610" />
        <circle cx="150" cy="95" r="3" fill="#fff" />
      </g>

      {/* blush */}
      <circle cx="85" cy="116" r="8" fill="#E05252" opacity="0.35" />
      <circle cx="165" cy="116" r="8" fill="#E05252" opacity="0.35" />

      {/* nose & mouth */}
      <path d="M119 112 L131 112 L125 120 Z" fill="#1C1610" />
      <path d="M125 120 Q125 128 115 130" stroke="#1C1610" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M125 120 Q125 128 135 130" stroke="#1C1610" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
