export default function RocketScene() {
  return (
    <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="rocketSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="40%" stopColor="#e8845e" />
          <stop offset="100%" stopColor="#ffd5a8" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#rocketSky)" />

      {/* Distant clouds */}
      <g fill="#fff" opacity="0.85">
        <ellipse cx="120" cy="280" rx="80" ry="22" />
        <ellipse cx="80" cy="265" rx="50" ry="18" />
        <ellipse cx="940" cy="200" rx="100" ry="26" />
        <ellipse cx="990" cy="185" rx="55" ry="20" />
        <ellipse cx="1060" cy="320" rx="90" ry="22" />
      </g>

      {/* Bottom cloud bank */}
      <g fill="#fff" opacity="0.95">
        <ellipse cx="200" cy="460" rx="240" ry="60" />
        <ellipse cx="500" cy="500" rx="320" ry="80" />
        <ellipse cx="900" cy="470" rx="260" ry="70" />
        <ellipse cx="1150" cy="510" rx="180" ry="55" />
      </g>

      {/* Launch tower */}
      <g transform="translate(540,200)">
        <rect x="-2" y="0" width="4" height="220" fill="#7a8088" />
        <rect x="-12" y="40" width="24" height="6" fill="#7a8088" />
        <rect x="-12" y="100" width="24" height="6" fill="#7a8088" />
        <rect x="-12" y="160" width="24" height="6" fill="#7a8088" />
      </g>

      {/* Rocket */}
      <g transform="translate(620,140)">
        {/* nosecone */}
        <path d="M0,0 C 18,30 22,60 22,80 L-22,80 C -22,60 -18,30 0,0 Z" fill="#f3f4f6" stroke="#cdd1d7" />
        <rect x="-22" y="80" width="44" height="160" fill="#f3f4f6" stroke="#cdd1d7" />
        <circle cx="0" cy="120" r="6" fill="#86c8ff" />
        <circle cx="0" cy="145" r="4" fill="#86c8ff" />
        {/* fins */}
        <polygon points="-22,200 -50,260 -22,260" fill="#dadfe6" />
        <polygon points="22,200 50,260 22,260" fill="#dadfe6" />
        {/* exhaust */}
        <polygon points="-18,260 18,260 6,330 -6,330" fill="#ffd54d" />
        <polygon points="-10,260 10,260 0,360" fill="#ff8a3a" />
      </g>

      {/* Smoke */}
      <g fill="#fff" opacity="0.9">
        <ellipse cx="620" cy="500" rx="120" ry="30" />
        <ellipse cx="580" cy="520" rx="90" ry="22" />
        <ellipse cx="680" cy="520" rx="90" ry="22" />
      </g>
    </svg>
  );
}
