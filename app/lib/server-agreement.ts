import{DynamoDBClient}from'@aws-sdk/client-dynamodb';
import{DynamoDBDocumentClient,GetCommand,PutCommand,ScanCommand,UpdateCommand}from'@aws-sdk/lib-dynamodb';
import{identityFromRequest,getProfile}from'./server-profile';
import{publicOpportunity}from'./server-company';

const region=process.env.AWS_REGION||'eu-west-3';
const agreements=process.env.FIRERANKY_AGREEMENTS_TABLE||'fireranky-agreements-dev';
const leads=process.env.FIRERANKY_LEADS_TABLE||'fireranky-leads-dev';
const fires=process.env.FIRERANKY_FIRES_TABLE||'fireranky-fires-dev';
const ddb=DynamoDBDocumentClient.from(new DynamoDBClient({region}),{marshallOptions:{removeUndefinedValues:true}});
const normalizeAgreementId=(id:string)=>decodeURIComponent(String(id||''));
const money=(v:any)=>Number(String(v||'').replace(/[^0-9.]/g,''))||0;
const round2=(v:number)=>Math.round(v*100)/100;
const FIRERANKY_FEE_RATE=0.05;

export async function createAgreement(req:Request,fireId:string){
 const identity=await identityFromRequest(req);
 if(identity.role!=='company')throw new Error('Company account required.');
 const fr=await ddb.send(new GetCommand({TableName:fires,Key:{fireId}}));
 const fire:any=fr.Item;
 if(!fire||fire.status!=='CALL_ACCEPTED')throw new Error('Rep must accept the call first.');
 const op:any=await publicOpportunity(fire.opportunityId);
 if(!op||op.companyId!==identity.userId)throw new Error('Opportunity not owned by this company.');
 const company:any=await getProfile(identity.userId),now=new Date().toISOString(),agreementId=fireId;
 const item={agreementId,fireId,opportunityId:fire.opportunityId,companyId:identity.userId,repId:fire.repId,status:'AWAITING_REP',version:1,terms:{companyName:company?.companyName||op.companyName,repName:`${fire.repSnapshot?.firstName||''} ${fire.repSnapshot?.lastName||''}`.trim(),campaign:op.title,territory:op.territory,commission:op.commission,basis:op.basis,paymentDays:30,leadProtectionDays:90,tailDays:60,leadChallengeHours:48,firerankyFeeRate:FIRERANKY_FEE_RATE},companyAcceptedAt:now,createdAt:now,updatedAt:now};
 await ddb.send(new PutCommand({TableName:agreements,Item:item}));
 await ddb.send(new UpdateCommand({TableName:fires,Key:{fireId},UpdateExpression:'SET #s=:s, agreementId=:a, updatedAt=:u',ExpressionAttributeNames:{'#s':'status'},ExpressionAttributeValues:{':s':'AGREEMENT_PENDING',':a':agreementId,':u':now}}));
 return item;
}

export async function getAgreementFor(req:Request,agreementId:string){const identity=await identityFromRequest(req),key=normalizeAgreementId(agreementId);const r=await ddb.send(new GetCommand({TableName:agreements,Key:{agreementId:key}}));const a:any=r.Item;if(!a||![a.repId,a.companyId].includes(identity.userId))throw new Error('Agreement not found.');return a;}
export async function acceptAgreement(req:Request,agreementId:string){const identity=await identityFromRequest(req),key=normalizeAgreementId(agreementId),a:any=await getAgreementFor(req,key);if(identity.userId!==a.repId)throw new Error('Sales rep required.');const now=new Date().toISOString();const r=await ddb.send(new UpdateCommand({TableName:agreements,Key:{agreementId:key},UpdateExpression:'SET #s=:s, repAcceptedAt=:u, activatedAt=:u, updatedAt=:u',ExpressionAttributeNames:{'#s':'status'},ExpressionAttributeValues:{':s':'ACTIVE',':u':now},ReturnValues:'ALL_NEW'}));await ddb.send(new UpdateCommand({TableName:fires,Key:{fireId:a.fireId},UpdateExpression:'SET #s=:s, updatedAt=:u',ExpressionAttributeNames:{'#s':'status'},ExpressionAttributeValues:{':s':'ACTIVE_REP',':u':now}}));return r.Attributes;}
export async function listAgreements(req:Request){const identity=await identityFromRequest(req),r=await ddb.send(new ScanCommand({TableName:agreements}));return(r.Items||[]).filter((a:any)=>a.repId===identity.userId||a.companyId===identity.userId);}

export async function registerLead(req:Request,agreementId:string,body:any){const identity=await identityFromRequest(req),key=normalizeAgreementId(agreementId),a:any=await getAgreementFor(req,key);if(identity.userId!==a.repId||a.status!=='ACTIVE')throw new Error('Active rep agreement required.');const name=String(body.companyName||'').trim();if(!name)throw new Error('Prospect company is required.');const now=new Date().toISOString(),leadId=`${key}#${Date.now().toString(36)}`;const item={leadId,agreementId:key,opportunityId:a.opportunityId,companyId:a.companyId,repId:a.repId,prospectCompany:name,contactName:String(body.contactName||''),contactEmail:String(body.contactEmail||''),status:'REGISTERED',registeredAt:now,challengeDeadline:new Date(Date.now()+a.terms.leadChallengeHours*3600000).toISOString(),protectionUntil:new Date(Date.now()+a.terms.leadProtectionDays*86400000).toISOString(),timeline:[{status:'REGISTERED',at:now,by:identity.userId,note:'Prospect registered and attribution protection started.'}],evidence:[],createdAt:now,updatedAt:now};await ddb.send(new PutCommand({TableName:leads,Item:item}));return item;}
export async function listLeads(req:Request){const identity=await identityFromRequest(req),r=await ddb.send(new ScanCommand({TableName:leads}));return(r.Items||[]).filter((l:any)=>l.repId===identity.userId||l.companyId===identity.userId).sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt));}
export async function getLeadFor(req:Request,leadId:string){const identity=await identityFromRequest(req),r=await ddb.send(new GetCommand({TableName:leads,Key:{leadId:decodeURIComponent(leadId)}})),lead:any=r.Item;if(!lead||![lead.repId,lead.companyId].includes(identity.userId))throw new Error('Lead not found.');return{identity,lead};}

export async function transitionLead(req:Request,leadId:string,body:any){
 const{identity,lead}=await getLeadFor(req,leadId),action=String(body.action||''),now=new Date().toISOString();
 const rep=identity.userId===lead.repId,company=identity.userId===lead.companyId;
 let next='',note=String(body.note||'').trim(),extra:any={};
 if(action==='QUALIFY'&&rep&&lead.status==='REGISTERED')next='QUALIFIED';
 else if(action==='SEND_PROPOSAL'&&rep&&['REGISTERED','QUALIFIED'].includes(lead.status))next='PROPOSAL';
 else if(action==='CLAIM_WON'&&rep&&['QUALIFIED','PROPOSAL'].includes(lead.status)){next='WON_CLAIMED';extra.contractValue=money(body.contractValue);if(!extra.contractValue)throw new Error('Contract value is required.');extra.wonClaimedAt=now;}
 else if(action==='CHALLENGE'&&company&&['REGISTERED','QUALIFIED','PROPOSAL'].includes(lead.status)){if(Date.now()>new Date(lead.challengeDeadline).getTime())throw new Error('Challenge window has expired.');next='CHALLENGED';if(!note)throw new Error('Challenge reason is required.');}
 else if(action==='CONFIRM_WON'&&company&&lead.status==='WON_CLAIMED'){
   const a:any=await getAgreementFor(req,lead.agreementId),raw=String(a.terms.commission||''),percent=raw.includes('%');
   const grossCommission=percent?round2((lead.contractValue||0)*(money(raw)/100)):round2(money(raw));
   const feeRate=Number(a.terms.firerankyFeeRate??FIRERANKY_FEE_RATE),firerankyFee=round2(grossCommission*feeRate),repNetCommission=round2(grossCommission-firerankyFee);
   next='COMMISSION_DUE';extra.commissionFormula=percent?`${money(raw)}% × $${Number(lead.contractValue||0).toLocaleString('en-US')}`:`${raw} ${a.terms.basis||''}`.trim();extra.grossCommission=grossCommission;extra.firerankyFeeRate=feeRate;extra.firerankyFee=firerankyFee;extra.repNetCommission=repNetCommission;extra.commissionDue=repNetCommission;extra.commissionDueAt=now;extra.paymentDueAt=new Date(Date.now()+(a.terms.paymentDays||30)*86400000).toISOString();
 }
 else if(action==='MARK_PAID'&&company&&lead.status==='COMMISSION_DUE'){next='PAID_PENDING_CONFIRMATION';extra.paidDeclaredAt=now;extra.paymentReference=String(body.paymentReference||'').trim();}
 else if(action==='CONFIRM_RECEIPT'&&rep&&lead.status==='PAID_PENDING_CONFIRMATION'){next='PAID';extra.paidConfirmedAt=now;}
 else throw new Error('This transition is not allowed.');
 const timeline=[...(lead.timeline||[]),{status:next,at:now,by:identity.userId,note:note||undefined}];
 const values:any={':s':next,':u':now,':timeline':timeline};let update='SET #s=:s, updatedAt=:u, timeline=:timeline';for(const[k,v]of Object.entries(extra)){update+=`, ${k}=:${k}`;values[`:${k}`]=v;}
 const r=await ddb.send(new UpdateCommand({TableName:leads,Key:{leadId:lead.leadId},UpdateExpression:update,ExpressionAttributeNames:{'#s':'status'},ExpressionAttributeValues:values,ReturnValues:'ALL_NEW'}));return r.Attributes;
}

export async function attachEvidence(req:Request,leadId:string,meta:any){const{identity,lead}=await getLeadFor(req,leadId),now=new Date().toISOString(),evidence=[...(lead.evidence||[]),{...meta,uploadedAt:now,uploadedBy:identity.userId}];const r=await ddb.send(new UpdateCommand({TableName:leads,Key:{leadId:lead.leadId},UpdateExpression:'SET evidence=:e, updatedAt=:u',ExpressionAttributeValues:{':e':evidence,':u':now},ReturnValues:'ALL_NEW'}));return r.Attributes;}
