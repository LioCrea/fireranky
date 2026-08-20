'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Flame, Loader2, MapPin, Target, Users } from 'lucide-react';
import { getCurrentUser, getIdToken, type FireRankyUser } from '../../lib/auth';

const data: Record<string, {company:string;category:string;commission:string;basis:string;title:string;description:string;contract:string;territory:string;slots:string}> = {
  'northstar-ai':{company:'Northstar AI',category:'AI · B2B SaaS',commission:'$1,200',basis:'per closed deal',title:'AI support platform for fast-growing ecommerce brands.',description:'Northstar AI helps ecommerce teams automate support while keeping a human-quality customer experience. The ideal rep is comfortable selling SaaS to founders, heads of CX and ecommerce operators.',contract:'$8,000 average contract',territory:'United States · Remote',slots:'4 rep slots left'},
  'vantagrid':{company:'VantaGrid',category:'Cybersecurity',commission:'$2,800',basis:'per closed deal',title:'Enterprise attack-surface monitoring for lean security teams.',description:'VantaGrid gives security teams continuous visibility into exposed infrastructure and misconfigurations. This campaign is looking for independent reps with B2B or cybersecurity experience.',contract:'$18,000 average contract',territory:'US + Canada · Remote',slots:'4 rep slots left'},
  'pulsecare':{company:'PulseCare',category:'Healthcare SaaS',commission:'20%',basis:'first-year revenue',title:'Patient engagement software for independent medical practices.',description:'PulseCare helps independent practices automate patient follow-up, reminders and communication. Healthcare sales experience is a plus but not required.',contract:'Recurring commission',territory:'United States · Remote',slots:'9 rep slots left'},
};

export default function OpportunityPage(){
  const params=useParams<{slug:string}>();
  const [user,setUser]=useState<FireRankyUser|null>(null);
  const [fired,setFired]=useState(false);
  const [checking,setChecking]=useState(true);
  const deal=data[params.slug]||data['vantagrid'];

  useEffect(()=>{(async()=>{
    const current=await getCurrentUser();
    if(!current){window.location.href='/';return;}
    setUser(current);
    try{
      const token=await getIdToken();
      const res=await fetch('/api/profile',{headers:{Authorization:`Bearer ${token}`}});
      const body=await res.json();
      if(!res.ok||!body.profile?.profileComplete){window.location.href=`/onboarding?next=${encodeURIComponent(`/opportunities/${params.slug}`)}`;return;}
    }catch{
      window.location.href=`/onboarding?next=${encodeURIComponent(`/opportunities/${params.slug}`)}`;return;
    }
    setChecking(false);
  })()},[params.slug]);

  if(checking)return <main className="detailPage"><div className="onboardLoading"><Loader2 className="spin"/> Checking your profile…</div></main>;

  return <main className="detailPage"><div className="detailShell"><a className="detailBack" href="/"><ArrowLeft size={16}/> Back to opportunities</a><div className="detailGrid"><section className="detailMain"><div className="detailCompany"><div className="detailLogo">{deal.company[0]}</div><div><strong>{deal.company} <BadgeCheck size={16}/></strong><span>{deal.category}</span></div></div><h1>{deal.title}</h1><p className="detailDesc">{deal.description}</p><div className="detailInfo"><div><Target size={18}/><span><small>AVERAGE CONTRACT</small><b>{deal.contract}</b></span></div><div><MapPin size={18}/><span><small>TERRITORY</small><b>{deal.territory}</b></span></div><div><Users size={18}/><span><small>TEAM</small><b>{deal.slots}</b></span></div></div><div className="detailBlock"><small>WHAT HAPPENS NEXT</small><h2>You fire. They review. You talk.</h2><p>Fire on the opportunity and the company receives your profile. If there’s a fit, they invite you for a short call before validating you for the campaign.</p></div></section><aside className="detailAside"><div className="detailKicker"><Flame size={14} fill="currentColor"/> YOUR UPSIDE</div><strong className="detailCommission">{deal.commission}</strong><span className="detailBasis">{deal.basis}</span><div className="detailMini">No salary. No mystery. You know the upside before you start.</div><button className={fired?'detailFire fired':'detailFire'} onClick={()=>setFired(true)} disabled={fired}><Flame size={19} fill="currentColor"/>{fired?'FIRED — COMPANY NOTIFIED':'FIRE ON THIS DEAL'}</button><small className="detailUser">Signed in as {user?.email||'your account'}</small></aside></div></div></main>
}
