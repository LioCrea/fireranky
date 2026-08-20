'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Check, Flame, Loader2, Sparkles, UserRound } from 'lucide-react';
import { getCurrentUser, getIdToken, type FireRankyUser } from '../lib/auth';

const INDUSTRIES = ['SaaS','AI','Healthcare','Cybersecurity','Finance','Agencies','Ecommerce','Consulting','Real Estate','HR Tech','Marketing'];

type Profile = {
  profileComplete?: boolean;
  firstName?: string; lastName?: string; country?: string; city?: string; linkedinUrl?: string;
  yearsExperience?: number; industries?: string[]; bio?: string;
  companyName?: string; website?: string; contactRole?: string;
};

function getSafeNext(){
  if(typeof window==='undefined') return '/';
  const raw=new URLSearchParams(window.location.search).get('next')||'/';
  return raw.startsWith('/')&&!raw.startsWith('//')?raw:'/';
}

export default function OnboardingPage(){
  const [user,setUser] = useState<FireRankyUser|null>(null);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [form,setForm] = useState<Profile>({industries:[]});

  useEffect(()=>{(async()=>{
    const current = await getCurrentUser();
    if(!current){window.location.href='/';return;}
    setUser(current);
    try{
      const token=await getIdToken();
      const res=await fetch('/api/profile',{headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok) throw new Error((await res.json()).error || 'Unable to load profile');
      const data=await res.json();
      setForm({...data.profile,industries:data.profile.industries||[]});
      if(data.profile.profileComplete) window.location.href=getSafeNext();
    }catch(err){setError(err instanceof Error?err.message:'Unable to load profile');}
    finally{setLoading(false);}
  })()},[]);

  const selected = useMemo(()=>new Set(form.industries||[]),[form.industries]);
  function set<K extends keyof Profile>(key:K,value:Profile[K]){setForm(prev=>({...prev,[key]:value}))}
  function toggleIndustry(industry:string){const nextSet=new Set(selected);nextSet.has(industry)?nextSet.delete(industry):nextSet.add(industry);set('industries',Array.from(nextSet).slice(0,5));}

  async function submit(e:React.FormEvent){
    e.preventDefault(); if(!user)return; setError('');
    if(user.role==='sales' && (!form.firstName||!form.lastName||!form.country||!form.city||!form.yearsExperience||!(form.industries?.length))) return setError('Complete the required fields to create your sales profile.');
    if(user.role==='company' && (!form.companyName||!form.website||!form.country||!form.contactRole)) return setError('Complete the required company fields.');
    setSaving(true);
    try{
      const token=await getIdToken();
      const res=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(form)});
      if(!res.ok) throw new Error((await res.json()).error || 'Unable to save profile');
      window.location.href=getSafeNext();
    }catch(err){setError(err instanceof Error?err.message:'Unable to save profile');setSaving(false)}
  }

  if(loading)return <main className="onboardPage"><div className="onboardLoading"><Loader2 className="spin"/> Loading your FireRanky profile…</div></main>;
  if(!user)return null;

  return <main className="onboardPage"><div className="onboardShell">
    <aside className="onboardSide"><a className="brand" href="/"><span className="brandMark"><Flame size={18} fill="currentColor"/></span><span>FireRanky</span></a><div className="onboardSideCopy"><div className="kicker"><Sparkles size={14}/> ONE LAST STEP</div><h1>{user.role==='sales'?'Build your sales identity.':'Tell reps who they’ll sell for.'}</h1><p>{user.role==='sales'?'Companies need more than an email before they trust you with their brand. Keep it sharp — you can enrich it later.':'A clean company profile makes every opportunity you publish feel more credible from day one.'}</p></div><div className="onboardMini"><span>{user.role==='sales'?<UserRound size={18}/>:<Building2 size={18}/>}</span><div><small>ACCOUNT TYPE</small><strong>{user.role==='sales'?'Independent sales rep':'Company'}</strong><em>{user.email}</em></div></div></aside>

    <section className="onboardCard"><div className="onboardHeader"><span>PROFILE SETUP</span><strong>{user.role==='sales'?'Sales rep profile':'Company profile'}</strong><small>About 60 seconds</small></div>
      <form onSubmit={submit}>
        {user.role==='sales'?<>
          <div className="fieldGrid two"><label>First name *<input value={form.firstName||''} onChange={e=>set('firstName',e.target.value)} placeholder="Alex"/></label><label>Last name *<input value={form.lastName||''} onChange={e=>set('lastName',e.target.value)} placeholder="Morgan"/></label></div>
          <div className="fieldGrid two"><label>Country *<input value={form.country||''} onChange={e=>set('country',e.target.value)} placeholder="United States"/></label><label>City *<input value={form.city||''} onChange={e=>set('city',e.target.value)} placeholder="Austin"/></label></div>
          <div className="fieldGrid two"><label>Years in sales *<input type="number" min="1" max="60" value={form.yearsExperience||''} onChange={e=>set('yearsExperience',Number(e.target.value))} placeholder="5"/></label><label>LinkedIn <input value={form.linkedinUrl||''} onChange={e=>set('linkedinUrl',e.target.value)} placeholder="linkedin.com/in/…"/></label></div>
          <div className="industryField"><span>Industries * <small>Pick up to 5</small></span><div className="industryChips">{INDUSTRIES.map(ind=><button type="button" key={ind} className={selected.has(ind)?'selected':''} onClick={()=>toggleIndustry(ind)}>{selected.has(ind)&&<Check size={13}/>} {ind}</button>)}</div></div>
          <label>About your sales experience <textarea maxLength={300} value={form.bio||''} onChange={e=>set('bio',e.target.value)} placeholder="Enterprise SaaS closer, used to outbound and founder-led sales…"/><small className="counter">{(form.bio||'').length}/300</small></label>
        </>:<>
          <label>Company name *<input value={form.companyName||''} onChange={e=>set('companyName',e.target.value)} placeholder="Acme Inc."/></label>
          <div className="fieldGrid two"><label>Website *<input value={form.website||''} onChange={e=>set('website',e.target.value)} placeholder="https://acme.com"/></label><label>Country *<input value={form.country||''} onChange={e=>set('country',e.target.value)} placeholder="United States"/></label></div>
          <label>Your role *<input value={form.contactRole||''} onChange={e=>set('contactRole',e.target.value)} placeholder="Founder, VP Sales, Sales Manager…"/></label>
        </>}
        {error&&<div className="onboardError">{error}</div>}
        <button className="onboardSubmit" disabled={saving}>{saving?<Loader2 className="spin" size={18}/>:<Flame size={18} fill="currentColor"/>}{saving?'Saving…':user.role==='sales'?'Create my sales profile':'Create company profile'}<ArrowRight size={17}/></button>
      </form>
    </section>
  </div></main>
}
