import type { WaveBar } from "@/lib/profile-stats";

type Props = {
  streak: number;
  learnedCount: number;
  masteredCount: number;
  waves: WaveBar[];
};

function waveTitle(wave: WaveBar): string {
  return wave.wave === 1 ? "Intro to Python" : wave.label;
}

export function ProfileStats({
  streak,
  learnedCount,
  masteredCount,
  waves,
}: Props) {
  const activeWaves = waves.filter((w) => w.total > 0);
  const chartWaves = activeWaves.slice(0, 8);
  const ring = 2 * Math.PI * 34;

  return (
    <section className="lt-profile-stats" aria-label="Learning progress">
      <div className="lt-profile-stats-head">
        <div className="lt-streak">
          <p className="lt-streak-value">{streak}</p>
          <p className="lt-streak-label">day streak</p>
        </div>
        <div className="lt-profile-stats-meta">
          <p>
            <span>{learnedCount}</span> skills in toolkit
          </p>
          <p>
            <span>{masteredCount}</span> mastered
          </p>
        </div>
      </div>

      <div className="lt-progress-graph" role="img" aria-label="Progress by wave">
        {chartWaves.map((wave) => {
          const pct = Math.round(wave.fill * 100);
          const title = waveTitle(wave);
          const shown = Math.max(pct, wave.seen > 0 ? 4 : 0);
          return (
            <div
              key={wave.wave}
              className="lt-progress-donut"
              title={`${title}: ${pct}%`}
            >
              <svg className="lt-donut-svg" viewBox="0 0 96 96" aria-hidden="true">
                <circle
                  className="lt-donut-track"
                  cx="48"
                  cy="48"
                  r="34"
                  fill="none"
                  strokeWidth="10"
                />
                <circle
                  className="lt-donut-fill"
                  cx="48"
                  cy="48"
                  r="34"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${ring}`}
                  strokeDashoffset={`${ring * (1 - shown / 100)}`}
                  transform="rotate(-90 48 48)"
                />
                <text className="lt-donut-pct" x="48" y="53" textAnchor="middle">
                  {pct}%
                </text>
              </svg>
              <div className="lt-donut-copy">
                <span className="lt-donut-name">{title}</span>
                <span className="lt-donut-meta">{pct}% complete</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="lt-progress-caption">Path progress</p>
    </section>
  );
}
