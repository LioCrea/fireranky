'use client';

import { useState } from 'react';
import { Flame, X } from 'lucide-react';
import { signIn, signUp, type FireRankyUser, type UserRole } from '../lib/auth';

type Props = {
  mode: 'signup' | 'login';
  onClose: () => void;
  onSuccess: (user: FireRankyUser) => void;
  onModeChange: (mode: 'signup' | 'login') => void;
};

export default function AuthModal({ mode, onClose, onSuccess, onModeChange }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Enter your email and password.');
    try {
      const user = mode === 'signup' ? signUp(email, password, role) : signIn(email, password);
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return <div className="authOverlay" onMouseDown={onClose}>
    <div className="authModal" onMouseDown={e=>e.stopPropagation()}>
      <button className="authClose" onClick={onClose}><X size={18}/></button>
      <div className="authLogo"><span className="brandMark"><Flame size={18} fill="currentColor"/></span><strong>FireRanky</strong></div>
      <div className="authEyebrow">{mode === 'signup' ? 'JOIN THE ARENA' : 'WELCOME BACK'}</div>
      <h2>{mode === 'signup' ? 'Create your account.' : 'Sign in.'}</h2>
      <p>{mode === 'signup' ? 'Two fields. One role. That’s it.' : 'Get back to your deals and ranking.'}</p>

      <form onSubmit={submit}>
        {mode === 'signup' && <div className="rolePicker">
          <button type="button" className={role==='sales'?'active':''} onClick={()=>setRole('sales')}><span>🔥</span><b>Sales rep</b><small>I want to sell</small></button>
          <button type="button" className={role==='company'?'active':''} onClick={()=>setRole('company')}><span>🏢</span><b>Company</b><small>I want reps</small></button>
        </div>}
        <label>Email<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label>Password<input type="password" autoComplete={mode==='signup'?'new-password':'current-password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/></label>
        {error && <div className="authError">{error}</div>}
        <button className="authSubmit" type="submit"><Flame size={17} fill="currentColor"/>{mode==='signup'?'Create account':'Sign in'}</button>
      </form>
      <div className="authSwitch">{mode==='signup'?'Already have an account?':'New to FireRanky?'} <button onClick={()=>onModeChange(mode==='signup'?'login':'signup')}>{mode==='signup'?'Sign in':'Create one'}</button></div>
    </div>
  </div>
}
