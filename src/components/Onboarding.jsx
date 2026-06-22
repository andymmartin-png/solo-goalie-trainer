import { useState } from 'react';
import { setOnboarded } from '../data/store';

const SLIDES = [
  {
    icon: '🥍',
    title: 'Solo Goalie Trainer',
    body: 'Train your reaction and footwork solo — no shooter required. The app calls out shots and cone moves with audio and a live visual.',
  },
  {
    icon: '🔊',
    title: 'Listen & React',
    body: 'Each rep, you\'ll hear a cue like "High stick-side, bounce shot." React as if it\'s live. Detail scales down as your level goes up — by Game Speed it\'s just a tone.',
  },
  {
    icon: '🎯',
    title: 'Pick Your Pace',
    body: 'Run on a timer that matches game tempo, or tap through manually. Adjust the interval and rep count to fit your session.',
  },
  {
    icon: '📈',
    title: 'Log & Level Up',
    body: 'Track your saves after each session. Log enough clean sessions and you\'ll be prompted to advance to the next level.',
  },
];

export default function Onboarding({ onDone }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function finish() {
    setOnboarded();
    onDone();
  }

  return (
    <div className="screen onboarding-screen">
      <div className="onboarding-skip-row">
        <button className="btn-ghost-sm" onClick={finish}>Skip</button>
      </div>

      <div className="onboarding-content">
        <div className="onboarding-icon">{slide.icon}</div>
        <h1 className="onboarding-title">{slide.title}</h1>
        <p className="onboarding-body">{slide.body}</p>
      </div>

      <div className="onboarding-dots">
        {SLIDES.map((_, i) => (
          <span key={i} className={`onboarding-dot ${i === index ? 'dot-active' : ''}`} />
        ))}
      </div>

      <div className="onboarding-actions">
        {isLast ? (
          <button className="btn-primary" onClick={finish}>Get Started</button>
        ) : (
          <button className="btn-primary" onClick={() => setIndex(i => i + 1)}>Next</button>
        )}
      </div>
    </div>
  );
}
