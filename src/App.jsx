import { useState } from 'react';
import ProfileSelect   from './components/ProfileSelect';
import DrillSelect     from './components/DrillSelect';
import DrillRunner     from './components/DrillRunner';
import SessionSummary  from './components/SessionSummary';
import SessionHistory  from './components/SessionHistory';
import Onboarding      from './components/Onboarding';
import AdminDashboard  from './components/AdminDashboard';
import ProfileEditor   from './components/ProfileEditor';
import DrillEditor     from './components/DrillEditor';
import { isOnboarded } from './data/store';

export default function App() {
  const [screen,      setScreen]      = useState(isOnboarded() ? 'profile' : 'onboarding');
  const [profile,     setProfile]     = useState(null);
  const [drill,       setDrill]       = useState(null);
  const [voice,       setVoice]       = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [editTarget,  setEditTarget]  = useState(null); // profile or drill being edited

  if (screen === 'onboarding') {
    return <Onboarding onDone={() => setScreen('profile')} />;
  }

  if (screen === 'profile') {
    return (
      <ProfileSelect
        onSelect={p => { setProfile(p); setScreen('drillSelect'); }}
        onCoach={() => setScreen('admin')}
      />
    );
  }

  if (screen === 'admin') {
    return (
      <AdminDashboard
        onBack={() => setScreen('profile')}
        onNewProfile={() => { setEditTarget(null); setScreen('profileEdit'); }}
        onEditProfile={p => { setEditTarget(p); setScreen('profileEdit'); }}
        onNewDrill={() => { setEditTarget(null); setScreen('drillEdit'); }}
        onEditDrill={d => { setEditTarget(d); setScreen('drillEdit'); }}
      />
    );
  }

  if (screen === 'profileEdit') {
    return (
      <ProfileEditor
        profile={editTarget}
        onDone={() => setScreen('admin')}
      />
    );
  }

  if (screen === 'drillEdit') {
    return (
      <DrillEditor
        drill={editTarget}
        onDone={() => setScreen('admin')}
      />
    );
  }

  if (screen === 'drillSelect') {
    return (
      <DrillSelect
        profile={profile}
        onSelect={(d, v) => { setDrill(d); setVoice(v); setScreen('drill'); }}
        onHistory={() => setScreen('history')}
        onBack={() => setScreen('profile')}
      />
    );
  }

  if (screen === 'drill') {
    return (
      <DrillRunner
        profile={profile}
        drill={drill}
        voice={voice}
        onComplete={data => { setSessionData(data); setScreen('summary'); }}
        onBack={() => setScreen('drillSelect')}
      />
    );
  }

  if (screen === 'summary') {
    return (
      <SessionSummary
        profile={profile}
        drill={drill}
        data={sessionData}
        onDone={() => setScreen('drillSelect')}
      />
    );
  }

  if (screen === 'history') {
    return (
      <SessionHistory
        profile={profile}
        onBack={() => setScreen('drillSelect')}
      />
    );
  }
}
