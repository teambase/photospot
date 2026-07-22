import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isAdminEmail } from './lib/firebase';
import { LoginScreen } from './components/LoginScreen';
import { SpotDashboard } from './components/SpotDashboard';
import './App.css';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setCheckedAuth(true);
  }), []);

  if (!checkedAuth) return null;

  if (!user || !isAdminEmail(user.email)) {
    return <LoginScreen deniedEmail={user?.email ?? undefined} />;
  }

  return <SpotDashboard email={user.email!} />;
}
