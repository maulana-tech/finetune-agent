export default function SkyScene() {
  return (
    <svg
      viewBox="0 0 1600 600"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cb1ff" />
          <stop offset="60%" stopColor="#a3d8ff" />
          <stop offset="100%" stopColor="#d8efff" />
        </linearGradient>
        <linearGradient id="grass2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ad77e" />
          <stop offset="100%" stopColor="#5fa84d" />
        </linearGradient>
      </defs>
      <rect width="1600" height="600" fill="url(#sky2)" />

      {/* Clouds */}
      <g fill="#fff">
        <ellipse cx="220" cy="120" rx="80" ry="20" />
        <ellipse cx="180" cy="105" rx="40" ry="14" />
        <ellipse cx="260" cy="108" rx="50" ry="16" />

        <ellipse cx="1240" cy="160" rx="100" ry="22" />
        <ellipse cx="1300" cy="145" rx="55" ry="18" />
        <ellipse cx="1190" cy="146" rx="48" ry="16" />
      </g>

      {/* Left bushy tree */}
      <g>
        <rect x="90" y="350" width="22" height="160" fill="#6e4b2a" />
        <ellipse cx="100" cy="350" rx="120" ry="100" fill="#4f9e44" />
        <ellipse cx="50" cy="380" rx="70" ry="58" fill="#5db04d" />
        <ellipse cx="160" cy="380" rx="70" ry="58" fill="#5db04d" />
      </g>

      {/* Hills */}
      <path
        d="M0,470 C200,420 400,500 620,460 C840,420 1040,500 1280,460 C1420,440 1520,470 1600,470 L1600,600 L0,600 Z"
        fill="url(#grass2)"
      />
    </svg>
  );
}
