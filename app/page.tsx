'use client';

import { ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronRight, Flame, Search, Sparkles, Trophy, TrendingUp, Users } from 'lucide-react';

const deals = [
  { company:'Northstar AI', initials:'N', category:'AI · B2B SaaS', title:'AI support platform for fast-growing ecommerce brands.', commission:'$1,200', basis:'per closed deal', contract:'$8k avg. contract', reps:'8 / 12 reps selected', tags:['Remote','United States'], hot:true },
  { company:'VantaGrid', initials:'V', category:'Cybersecurity', title:'Enterprise attack-surface monitoring built for lean security teams.', commission:'$2,800', basis:'per closed deal', contract:'$18k avg. contract', reps:'4 / 8 reps selected', tags:['B2B','US + Canada'], hot:true },
  { company:'PulseCare', initials:'P', category:'Healthcare SaaS', title:'Patient engagement software for independent medical practices.', commission:'20%', basis:'first-year revenue', contract:'Recurring commission', reps:'11 / 20 reps selected', tags:['Healthcare','Remote'], hot:false },
];

const leaders = [
  {rank:1,name:'Jessica K.',meta:'SaaS · New York',revenue:'$48,240',deals:31,change:'+4',initials:'JK'},
  {rank:2,name:'Marcus T.',meta:'Cybersecurity · Austin',revenue:'$43,880',deals:18,change:'+1',initials:'MT'},
  {rank:3,name:'Sarah M.',meta:'Healthcare · Miami',revenue:'$39,610',deals:27,change:'+7',initials:'SM'},
  {rank:4,name:'Jason R.',meta:'B2B SaaS · Chicago',revenue:'$34,920',deals:22,change:'+2',initials:'JR'},
  {rank:5,name:'Maya L.',meta:'Agencies · Los Angeles',revenue:'$31,450',deals:29,change:'+9',initials:'ML'},
];

export default function Home(){
  return <main>
    <nav className="nav shell">
      <a className="brand" href="#"><span className="brandMark"><Flame size={19} fill="currentColor"/></span><span>FireRanky</span></a>
      <div className="navLinks"><a href="#opportunities">Opportunities</a><a href="#leaderboard">Leaderboard</a><a href="#companies">For companies</a></div>
      <div className="navActions"><button className="ghostBtn">Sign in</button><button className="primaryBtn small">Join FireRanky <ArrowRight size={15}/></button></div>
    </nav>

    <section className="hero shell">
      <div className="eyebrow"><span className="pulseDot"/> THE MARKETPLACE FOR INDEPENDENT SALES</div>
      <h1>Pick what you sell.<br/><span>Prove you&apos;re the best.</span></h1>
      <p className="heroCopy">Discover products worth selling, join the campaigns you believe in, earn commissions and build a sales record that follows you everywhere.</p>
      <div className="heroActions"><button className="fireBtn"><Flame size={20} fill="currentColor"/> Explore opportunities</button><button className="secondaryBtn">I&apos;m a company <ChevronRight size={17}/></button></div>
      <div className="proof"><div className="avatars"><span>JK</span><span>MT</span><span>SM</span><span>+</span></div><div><strong>Sales rep access opens soon</strong><small>Companies are listing the first opportunities now.</small></div></div>
    </section>

    <section className="ticker"><div className="shell tickerInner"><span><BriefcaseBusiness size={17}/> <b>67</b> opportunities</span><i/><span><Users size={17}/> <b>128</b> rep slots open</span><i/><span><Flame size={17}/> <b>$284k+</b> available commissions</span><i/><span><TrendingUp size={17}/> New deals added daily</span></div></section>

    <section id="opportunities" className="section shell">
      <div className="sectionHead"><div><div className="kicker"><Flame size={15}/> HOT RIGHT NOW</div><h2>Deals worth firing on.</h2><p>Real products. Clear commissions. No mystery job descriptions.</p></div><button className="textBtn">View all opportunities <ArrowRight size={16}/></button></div>
      <div className="filters"><button className="active">All opportunities</button><button>SaaS</button><button>Healthcare</button><button>Cybersecurity</button><button>Services</button><button><Search size={15}/> More filters</button></div>
      <div className="dealGrid">{deals.map((deal,i)=><article className="dealCard" key={deal.company}>
        <div className="dealTop"><div className={`companyLogo logo${i}`}>{deal.initials}</div>{deal.hot&&<span className="hot"><Flame size={12} fill="currentColor"/> HOT</span>}</div>
        <div className="companyName">{deal.company} <BadgeCheck size={15}/></div><div className="category">{deal.category}</div>
        <h3>{deal.title}</h3>
        <div className="commission"><strong>{deal.commission}</strong><span>{deal.basis}</span></div>
        <div className="dealMeta"><span>{deal.contract}</span><span>{deal.reps}</span></div>
        <div className="tags">{deal.tags.map(t=><span key={t}>{t}</span>)}</div>
        <button className="cardFire"><Flame size={17} fill="currentColor"/> FIRE <ArrowRight size={16}/></button>
      </article>)}</div>
    </section>

    <section id="leaderboard" className="leaderSection"><div className="shell leaderboardLayout">
      <div className="leaderIntro"><div className="kicker"><Trophy size={15}/> THE LEADERBOARD</div><h2>Your numbers.<br/>Your reputation.</h2><p>No vague five-star profiles. FireRanky turns verified sales performance into a reputation companies can actually trust.</p><div className="rankCard"><Sparkles size={19}/><div><small>YOUR NEXT MILESTONE</small><strong>Reach the top 10% of SaaS reps</strong><span>$2,840 in verified revenue to go</span></div></div></div>
      <div className="board"><div className="boardHead"><div><strong>Top closers</strong><span>August 2026</span></div><div className="tabs"><button className="active">Month</button><button>Week</button><button>All time</button></div></div>
      <div className="rows">{leaders.map(l=><div className={`leaderRow ${l.rank<=3?'podium':''}`} key={l.rank}><span className="rank">{l.rank===1?'🥇':l.rank===2?'🥈':l.rank===3?'🥉':`#${l.rank}`}</span><span className="avatar">{l.initials}</span><span className="person"><strong>{l.name}</strong><small>{l.meta}</small></span><span className="deals"><strong>{l.deals}</strong><small>deals</small></span><span className="revenue"><strong>{l.revenue}</strong><small><TrendingUp size={11}/> {l.change} this week</small></span></div>)}</div>
      <div className="boardFoot">Think you can beat them? <button>Enter the ranking <ArrowRight size={14}/></button></div></div>
    </div></section>

    <section id="companies" className="companyCta shell"><div><div className="kicker"><Users size={15}/> FOR COMPANIES</div><h2>Don&apos;t hire a sales team.<br/><span>Put your product in front of one.</span></h2><p>List your opportunity, choose the independent reps you want representing your brand, and build a sales team around performance.</p></div><button className="fireBtn">List an opportunity — free <ArrowRight size={18}/></button></section>

    <footer><div className="shell footerInner"><a className="brand" href="#"><span className="brandMark"><Flame size={17} fill="currentColor"/></span><span>FireRanky</span></a><span>Fire. Sell. Rank.</span><span>© 2026 FireRanky</span></div></footer>
  </main>
}
