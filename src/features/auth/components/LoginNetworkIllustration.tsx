function LoginNetworkIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 760 440"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-14 h-[52%] w-full"
    >
      <defs>
        <linearGradient id="login-scene-ground" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8058df" />
          <stop offset=".48" stopColor="#49318f" />
          <stop offset="1" stopColor="#142b62" />
        </linearGradient>
      </defs>
      <circle cx="568" cy="96" r="34" fill="#e9e1ff" opacity=".92" />
      <circle cx="568" cy="96" r="57" fill="#c4a3d9" opacity=".12" />
      <g fill="#fff" opacity=".8">
        <circle cx="91" cy="69" r="2" />
        <circle cx="165" cy="112" r="2.5" />
        <circle cx="302" cy="58" r="2" />
        <circle cx="421" cy="116" r="2" />
        <circle cx="674" cy="159" r="2" />
        <circle cx="711" cy="66" r="2.5" />
      </g>
      <path
        d="M0 283 135 210l115 51 129-98 128 86 101-49 152 64v176H0z"
        fill="#38266f"
        opacity=".82"
      />
      <path
        d="m0 337 139-88 124 76 128-111 123 99 114-74 132 71v130H0z"
        fill="#4a3290"
        opacity=".9"
      />
      <path
        d="M0 374 150 298l135 69 125-87 158 84 93-47 99 40v83H0z"
        fill="url(#login-scene-ground)"
      />
      <path d="M0 404h760" stroke="#fff" strokeOpacity=".14" />
    </svg>
  )
}

export default LoginNetworkIllustration
