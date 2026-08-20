'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileSignature,
  Flame,
  Loader2,
  LockKeyhole,
  Paperclip,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { getCurrentUser, getIdToken } from '../../lib/auth';

const STEPS = [
  'REGISTERED',
  'QUALIFIED',
  'PROPOSAL',
  'WON_CLAIMED',
  'COMMISSION_DUE',
  'PAID_PENDING_CONFIRMATION',
  'PAID',
];

export default function Agreement() {
  const params = useParams<{ agreementId: string }>();
  const agreementId = decodeURIComponent(params.agreementId);

  const [a, setA] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [role, setRole] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [adding, setAdding] = useState(false);
  const [actionLead, setActionLead] = useState<any>(null);
  const [action, setAction] = useState('');
  const [form, setForm] = useState({ companyName: '', contactName: '', contactEmail: '' });
  const [actionForm, setActionForm] = useState({ contractValue: '', note: '', paymentReference: '' });
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const u = await getCurrentUser();
    setRole(u?.role || 'sales');
    const token = await getIdToken();

    const [agreementRes, leadsRes] = await Promise.all([
      fetch(`/api/agreements/${encodeURIComponent(agreementId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (agreementRes.ok) setA((await agreementRes.json()).agreement);
    if (leadsRes.ok) {
      const body = await leadsRes.json();
      setLeads(
        (body.leads || []).filter(
          (lead: any) => decodeURIComponent(lead.agreementId || '') === agreementId,
        ),
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [agreementId]);

  async function accept() {
    setBusy('accept');
    const token = await getIdToken();
    await fetch(`/api/agreements/${encodeURIComponent(agreementId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'ACCEPT' }),
    });
    setBusy('');
    await load();
  }

  async function addLead() {
    setBusy('add');
    const token = await getIdToken();
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ agreementId, ...form }),
    });

    if (response.ok) {
      setAdding(false);
      setForm({ companyName: '', contactName: '', contactEmail: '' });
      await load();
    }
    setBusy('');
  }

  async function runAction() {
    if (!actionLead) return;
    setBusy('action');
    const token = await getIdToken();

    const response = await fetch(`/api/leads/${encodeURIComponent(actionLead.leadId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...actionForm }),
    });

    if (response.ok && file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('label', action);
      await fetch(`/api/leads/${encodeURIComponent(actionLead.leadId)}/evidence`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
    }

    if (response.ok) {
      setActionLead(null);
      setAction('');
      setActionForm({ contractValue: '', note: '', paymentReference: '' });
      setFile(null);
      await load();
    }
    setBusy('');
  }

  async function downloadEvidence(leadId: string, evidence: any) {
    try {
      setBusy(`evidence-${evidence.attachmentId}`);
      const token = await getIdToken();
      const response = await fetch(
        `/api/leads/${encodeURIComponent(leadId)}/evidence?attachmentId=${encodeURIComponent(evidence.attachmentId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Unable to download evidence');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a');
      el.href = url;
      el.download = evidence.name || 'evidence';
      document.body.appendChild(el);
      el.click();
      el.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to download evidence');
    } finally {
      setBusy('');
    }
  }

  function openAction(lead: any, nextAction: string) {
    setActionLead(lead);
    setAction(nextAction);
    setActionForm({
      contractValue: lead.contractValue || '',
      note: '',
      paymentReference: '',
    });
    setFile(null);
  }

  if (loading) {
    return (
      <main className="agreementPage">
        <div className="onboardLoading">
          <Loader2 className="spin" /> Loading agreement…
        </div>
      </main>
    );
  }
  if (!a) return null;

  const terms = a.terms;
  const back = role === 'company' ? '/company' : '/account#deals';
  const feePct = Math.round(Number(terms.firerankyFeeRate ?? 0.05) * 100);

  return (
    <main className="agreementPage">
      <div className="agreementShell">
        <a href={back} className="detailBack">
          <ArrowLeft /> Back
        </a>

        <header>
          <div className="kicker"><FileSignature /> SALES AGREEMENT</div>
          <h1>{terms.companyName} × {terms.repName}</h1>
          <p>{terms.campaign}</p>
          <span className={`agreementStatus ${a.status.toLowerCase()}`}>
            {a.status.replaceAll('_', ' ')}
          </span>
        </header>

        <section className="agreementTerms">
          <div className="termsHead">
            <div>
              <LockKeyhole />
              <strong>Terms locked by FireRanky</strong>
              <span>Version {a.version} · Company accepted {new Date(a.companyAcceptedAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="termsGrid">
            <article><small>COMMISSION</small><strong>{terms.commission}</strong><span>{terms.basis}</span></article>
            <article><small>FIRERANKY FEE</small><strong>{feePct}%</strong><span>deducted from earned commission</span></article>
            <article><small>TERRITORY</small><strong>{terms.territory}</strong></article>
            <article><small>PAYMENT</small><strong>{terms.paymentDays} days</strong><span>after commission becomes due</span></article>
            <article><small>LEAD PROTECTION</small><strong>{terms.leadProtectionDays} days</strong><span>from registration</span></article>
            <article><small>CHALLENGE WINDOW</small><strong>{terms.leadChallengeHours} hours</strong><span>company must contest attribution</span></article>
            <article><small>TAIL PERIOD</small><strong>{terms.tailDays} days</strong><span>protected after relationship ends</span></article>
          </div>

          {a.status === 'AWAITING_REP' && role === 'sales' && (
            <div className="agreementAccept">
              <ShieldCheck />
              <div>
                <strong>Review before accepting.</strong>
                <p>By accepting, both parties lock this version of the commercial terms in FireRanky.</p>
              </div>
              <button disabled={!!busy} onClick={accept}>
                {busy ? <Loader2 className="spin" /> : <Check />} ACCEPT AGREEMENT
              </button>
            </div>
          )}

          {a.status === 'ACTIVE' && (
            <div className="agreementActive"><Check /> AGREEMENT ACTIVE · LEAD PROTECTION ENABLED</div>
          )}
        </section>

        {a.status === 'ACTIVE' && (
          <section className="ledger">
            <div className="ledgerHead">
              <div>
                <div className="kicker"><Flame /> PROTECTED SALES LEDGER</div>
                <h2>From prospect to paid commission.</h2>
                <p>Every critical step is timestamped. Evidence can be attached whenever it matters.</p>
              </div>
              {role === 'sales' && (
                <button onClick={() => setAdding(true)}><Plus /> REGISTER PROSPECT</button>
              )}
            </div>

            {leads.length === 0 ? (
              <div className="ledgerEmpty">No prospects registered yet.</div>
            ) : (
              <div className="leadCards">
                {leads.map((lead) => {
                  const idx = Math.max(0, STEPS.indexOf(lead.status));
                  return (
                    <article className="leadCard" key={lead.leadId}>
                      <div className="leadCardTop">
                        <div>
                          <small>PROSPECT</small>
                          <strong>{lead.prospectCompany}</strong>
                          <span>{lead.contactName || 'No contact'} {lead.contactEmail && `· ${lead.contactEmail}`}</span>
                        </div>
                        <div className={`leadBadge ${lead.status.toLowerCase()}`}>
                          {lead.status.replaceAll('_', ' ')}
                        </div>
                      </div>

                      <div className="leadProgress">
                        {STEPS.map((step, i) => (
                          <span key={step} className={i <= idx ? 'done' : ''}>
                            <i />{step.replaceAll('_', ' ')}
                          </span>
                        ))}
                      </div>

                      <div className="leadMeta">
                        <span>Protected until <b>{new Date(lead.protectionUntil).toLocaleDateString()}</b></span>
                        {lead.contractValue && <span>Contract <b>${Number(lead.contractValue).toLocaleString()}</b></span>}
                        {lead.grossCommission != null && (
                          <>
                            <span>Gross commission <b>${Number(lead.grossCommission).toLocaleString()}</b></span>
                            <span>FireRanky fee ({Math.round(Number(lead.firerankyFeeRate || 0.05) * 100)}%) <b>−${Number(lead.firerankyFee).toLocaleString()}</b></span>
                            <span>Rep net <b>${Number(lead.repNetCommission).toLocaleString()}</b></span>
                          </>
                        )}
                        {lead.paymentDueAt && <span>Due <b>{new Date(lead.paymentDueAt).toLocaleDateString()}</b></span>}
                      </div>

                      {lead.commissionFormula && (
                        <div className="commissionBreakdown">
                          <small>COMMISSION CALCULATION</small>
                          <strong>{lead.commissionFormula} = ${Number(lead.grossCommission).toLocaleString()}</strong>
                          <span>
                            ${Number(lead.grossCommission).toLocaleString()} gross − {Math.round(Number(lead.firerankyFeeRate || 0.05) * 100)}% FireRanky fee (${Number(lead.firerankyFee).toLocaleString()}) = <b>${Number(lead.repNetCommission).toLocaleString()} net to rep</b>
                          </span>
                        </div>
                      )}

                      {(lead.evidence || []).length > 0 && (
                        <div className="evidenceList">
                          {lead.evidence.map((evidence: any) => (
                            <button
                              key={evidence.attachmentId}
                              type="button"
                              disabled={busy === `evidence-${evidence.attachmentId}`}
                              onClick={() => downloadEvidence(lead.leadId, evidence)}
                            >
                              <Paperclip /> {evidence.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="leadActions">
                        {role === 'sales' && lead.status === 'REGISTERED' && (
                          <button onClick={() => openAction(lead, 'QUALIFY')}>Mark qualified</button>
                        )}
                        {role === 'sales' && ['REGISTERED', 'QUALIFIED'].includes(lead.status) && (
                          <button onClick={() => openAction(lead, 'SEND_PROPOSAL')}>Proposal sent</button>
                        )}
                        {role === 'sales' && ['QUALIFIED', 'PROPOSAL'].includes(lead.status) && (
                          <button className="primary" onClick={() => openAction(lead, 'CLAIM_WON')}>Claim won</button>
                        )}
                        {role === 'company' && ['REGISTERED', 'QUALIFIED', 'PROPOSAL'].includes(lead.status) && Date.now() < new Date(lead.challengeDeadline).getTime() && (
                          <button className="danger" onClick={() => openAction(lead, 'CHALLENGE')}>Challenge attribution</button>
                        )}
                        {role === 'company' && lead.status === 'WON_CLAIMED' && (
                          <button className="primary" onClick={() => openAction(lead, 'CONFIRM_WON')}>Confirm won</button>
                        )}
                        {role === 'company' && lead.status === 'COMMISSION_DUE' && (
                          <button className="primary" onClick={() => openAction(lead, 'MARK_PAID')}>
                            Mark ${Number(lead.repNetCommission || lead.commissionDue).toLocaleString()} paid
                          </button>
                        )}
                        {role === 'sales' && lead.status === 'PAID_PENDING_CONFIRMATION' && (
                          <button className="primary" onClick={() => openAction(lead, 'CONFIRM_RECEIPT')}>Confirm payment received</button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {adding && (
        <div className="dealComposerOverlay">
          <div className="dealComposer">
            <h2>Register a prospect</h2>
            <p>This creates a timestamped attribution claim before the prospect becomes a client.</p>
            <div className="composerGrid">
              <label>Prospect company<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
              <label>Contact name<input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></label>
              <label className="wide">Contact email<input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></label>
            </div>
            <button className="publishDeal" disabled={!form.companyName || !!busy} onClick={addLead}>REGISTER & PROTECT</button>
            <button className="ledgerCancel" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {actionLead && (
        <div className="dealComposerOverlay">
          <div className="dealComposer">
            <h2>{action.replaceAll('_', ' ')}</h2>
            <p>{actionLead.prospectCompany} · This action will be timestamped in the ledger.</p>

            <div className="composerGrid">
              {action === 'CLAIM_WON' && (
                <label className="wide">
                  Contract value
                  <input
                    type="number"
                    value={actionForm.contractValue}
                    onChange={(e) => setActionForm({ ...actionForm, contractValue: e.target.value })}
                    placeholder="18000"
                  />
                </label>
              )}

              {action === 'MARK_PAID' && (
                <>
                  <div className="paymentSummary wide">
                    <small>AMOUNT TO REP</small>
                    <strong>${Number(actionLead.repNetCommission || actionLead.commissionDue || 0).toLocaleString()}</strong>
                    <span>
                      Gross ${Number(actionLead.grossCommission || 0).toLocaleString()} − {Math.round(Number(actionLead.firerankyFeeRate || 0.05) * 100)}% FireRanky fee
                    </span>
                  </div>
                  <label className="wide">
                    Payment reference
                    <input
                      value={actionForm.paymentReference}
                      onChange={(e) => setActionForm({ ...actionForm, paymentReference: e.target.value })}
                      placeholder="Wire transfer / invoice reference"
                    />
                  </label>
                </>
              )}

              <label className="wide">
                Note (optional)
                <textarea value={actionForm.note} onChange={(e) => setActionForm({ ...actionForm, note: e.target.value })} />
              </label>

              <label className="wide evidenceInput">
                <Paperclip /> Evidence attachment (optional)
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <small>PDF, image, TXT or DOCX · max 10 MB</small>
              </label>
            </div>

            <button
              className="publishDeal"
              disabled={
                !!busy ||
                (action === 'CLAIM_WON' && !actionForm.contractValue) ||
                (action === 'CHALLENGE' && !actionForm.note)
              }
              onClick={runAction}
            >
              {busy ? <Loader2 className="spin" /> : <Check />} CONFIRM ACTION
            </button>
            <button className="ledgerCancel" onClick={() => setActionLead(null)}>Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
