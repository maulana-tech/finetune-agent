export default function HeroScene() {
  return (
    <svg
      viewBox="0 0 1600 700"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6cbfff" />
          <stop offset="60%" stopColor="#a8dcff" />
          <stop offset="100%" stopColor="#d6efff" />
        </linearGradient>
        <linearGradient id="hills" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ad77e" />
          <stop offset="100%" stopColor="#6cb157" />
        </linearGradient>
        <linearGradient id="hillsDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#74bf60" />
          <stop offset="100%" stopColor="#4f9e44" />
        </linearGradient>
        <pattern id="grassDots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.6" fill="#5fa84d" opacity="0.7" />
        </pattern>
      </defs>

      <rect width="1600" height="700" fill="url(#sky)" />

      {/* Clouds */}
      <g fill="#ffffff">
        <ellipse cx="220" cy="120" rx="80" ry="22" />
        <ellipse cx="270" cy="105" rx="50" ry="18" />
        <ellipse cx="180" cy="105" rx="40" ry="14" />

        <ellipse cx="900" cy="80" rx="120" ry="26" />
        <ellipse cx="960" cy="65" rx="70" ry="20" />
        <ellipse cx="860" cy="65" rx="55" ry="18" />

        <ellipse cx="1380" cy="160" rx="95" ry="22" />
        <ellipse cx="1430" cy="145" rx="55" ry="18" />
        <ellipse cx="1330" cy="148" rx="48" ry="16" />
      </g>

      {/* Distant city skyline */}
      <g fill="#7fb1d8" opacity="0.85">
        <rect x="380" y="330" width="18" height="80" />
        <rect x="406" y="310" width="22" height="100" />
        <rect x="436" y="290" width="14" height="120" />
        <polygon points="450,290 458,260 466,290" />
        <rect x="460" y="270" width="3" height="20" />
        <rect x="478" y="320" width="22" height="90" />
        <rect x="510" y="300" width="16" height="110" />
        <rect x="534" y="325" width="20" height="85" />
        <polygon points="554,325 562,305 570,325" />
      </g>

      {/* Right tree (large) */}
      <g>
        <rect x="1410" y="200" width="40" height="380" fill="#6e4b2a" />
        <ellipse cx="1430" cy="180" rx="200" ry="160" fill="#4f9e44" />
        <ellipse cx="1330" cy="220" rx="110" ry="90" fill="#5db04d" />
        <ellipse cx="1520" cy="220" rx="120" ry="90" fill="#5db04d" />
      </g>

      {/* Hills */}
      <path
        d="M0,520 C200,470 360,560 560,510 C760,460 940,560 1140,510 C1340,460 1500,560 1600,520 L1600,700 L0,700 Z"
        fill="url(#hills)"
      />
      <path
        d="M0,560 C200,520 400,610 620,560 C840,510 1040,610 1280,560 C1420,530 1520,580 1600,560 L1600,700 L0,700 Z"
        fill="url(#hillsDark)"
      />
      <rect x="0" y="600" width="1600" height="100" fill="url(#grassDots)" opacity="0.5" />

      {/* Small trees left */}
      <g>
        <rect x="60" y="430" width="10" height="80" fill="#5a3b1f" />
        <ellipse cx="65" cy="430" rx="50" ry="42" fill="#5db04d" />
        <rect x="140" y="450" width="8" height="60" fill="#5a3b1f" />
        <ellipse cx="144" cy="450" rx="40" ry="34" fill="#6abf58" />
      </g>

      {/* Bench */}
      <g transform="translate(150,520)">
        <rect x="0" y="0" width="80" height="6" fill="#7a5a3b" />
        <rect x="0" y="14" width="80" height="6" fill="#7a5a3b" />
        <rect x="6" y="0" width="6" height="30" fill="#6a4a2b" />
        <rect x="68" y="0" width="6" height="30" fill="#6a4a2b" />
      </g>

      {/* Laptop on grass */}
      <g transform="translate(880,430)">
        {/* base */}
        <rect x="0" y="80" width="180" height="14" rx="3" fill="#cfd6e0" />
        <rect x="0" y="80" width="180" height="4" fill="#9aa6b5" />
        {/* screen */}
        <rect x="14" y="0" width="152" height="84" rx="6" fill="#0f1115" />
        <rect x="20" y="6" width="140" height="72" rx="3" fill="#1a2230" />
        {/* code lines */}
        <g fill="#7bd4ff" opacity="0.95">
          <rect x="26" y="14" width="60" height="3" rx="1" />
          <rect x="26" y="22" width="90" height="3" rx="1" />
          <rect x="34" y="30" width="70" height="3" rx="1" />
          <rect x="34" y="38" width="50" height="3" rx="1" />
          <rect x="26" y="46" width="100" height="3" rx="1" />
          <rect x="26" y="54" width="40" height="3" rx="1" />
          <rect x="34" y="62" width="80" height="3" rx="1" />
          <rect x="34" y="70" width="60" height="3" rx="1" />
        </g>
      </g>

      {/* Book / journal */}
      <g transform="translate(1100,495)">
        <rect x="0" y="0" width="170" height="40" rx="3" fill="#caa46e" />
        <rect x="6" y="6" width="158" height="28" rx="2" fill="#e2c08a" />
        <rect x="6" y="18" width="158" height="2" fill="#a98555" />
      </g>

      {/* Sunflower */}
      <g transform="translate(700,470)">
        <rect x="14" y="20" width="3" height="60" fill="#3d7a2e" />
        <g transform="translate(15,18)">
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i * 36 * Math.PI) / 180;
            const x = Math.cos(a) * 14;
            const y = Math.sin(a) * 14;
            return <ellipse key={i} cx={x} cy={y} rx="7" ry="4" transform={`rotate(${i * 36})`} fill="#ffcc3a" />;
          })}
          <circle r="7" fill="#7a4a1a" />
        </g>
      </g>

      {/* Tiny butterflies/insects */}
      <g fill="#e94e4e">
        <circle cx="640" cy="600" r="3" />
        <circle cx="660" cy="610" r="3" />
      </g>
    </svg>
  );
}
