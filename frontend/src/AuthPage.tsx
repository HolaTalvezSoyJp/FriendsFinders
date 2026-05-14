import { useState } from 'react';
import { register, login } from './auth';

interface Props {
  onLogin: (token: string) => void;
}

export default function AuthPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      if (mode === 'register') {
        await register(email, password);
        setInfo('Registered! Check your email to confirm, then log in.');
        setMode('login');
      } else {
        const token = await login(email, password);
        onLogin(token);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h2>📍 Nearby Friends</h2>
      <h3>{mode === 'login' ? 'Sign In' : 'Register'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="email" placeholder="Email" value={email} required
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}
        />
        <input
          type="password" placeholder="Password" value={password} required
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', padding: 10 }}>
          {mode === 'login' ? 'Sign In' : 'Register'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {info && <p style={{ color: 'green' }}>{info}</p>}
      <p>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
          {mode === 'login' ? 'Register' : 'Sign In'}
        </button>
      </p>
    </div>
  );
}
