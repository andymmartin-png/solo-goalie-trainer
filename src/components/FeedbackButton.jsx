const FEEDBACK_EMAIL = 'andy.m.martin@gmail.com';

function feedbackHref() {
  const subject = encodeURIComponent('Solo Goalie Trainer — feedback');
  const body = encodeURIComponent(
    [
      'What were you doing?',
      '',
      '',
      'What happened, or what would you change?',
      '',
      '',
      '———',
      `Device: ${navigator.userAgent}`,
      `Page: ${location.href}`,
    ].join('\n')
  );
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

export default function FeedbackButton({ className = 'feedback-link' }) {
  return (
    <a className={className} href={feedbackHref()}>💬 Send feedback</a>
  );
}
