/**
 * PS1/호러용 필름 그레인 + 비네트 오버레이.
 */
export function FilmGrain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.09] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          animation: 'bm-grain 0.35s steps(3) infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.35) 78%, rgba(0,0,0,0.62) 100%)',
        }}
      />
      <style>{`
        @keyframes bm-grain {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1.5%, 1%); }
          50% { transform: translate(1%, -1.5%); }
          75% { transform: translate(-1%, -0.5%); }
          100% { transform: translate(0.5%, 1.5%); }
        }
      `}</style>
    </div>
  )
}
