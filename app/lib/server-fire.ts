import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { identityFromRequest, getProfile } from './server-profile';

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-3';
const tableName = process.env.FIRERANKY_FIRES_TABLE || 'fireranky-fires-dev';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

export type FireApplication = {
  fireId: string;
  repId: string;
  opportunityId: string;
  companyId: string;
  status: 'PENDING' | 'CALL_REQUESTED' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
  repSnapshot: {
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    yearsExperience?: number;
    industries?: string[];
    linkedinUrl?: string;
    bio?: string;
  };
};

const COMPANY_BY_OPPORTUNITY: Record<string,string> = {
  'northstar-ai':'northstar-ai-demo',
  'vantagrid':'vantagrid-demo',
  'pulsecare':'pulsecare-demo',
};

export async function fireIdentity(request: Request){
  const identity=await identityFromRequest(request);
  if(identity.role!=='sales') throw new Error('Only sales reps can fire on opportunities.');
  const profile=await getProfile(identity.userId);
  if(!profile?.profileComplete) throw new Error('Complete your sales profile before firing.');
  return {identity,profile};
}

export async function getFire(repId:string, opportunityId:string){
  const fireId=`${repId}#${opportunityId}`;
  const result=await ddb.send(new GetCommand({TableName:tableName,Key:{fireId},ConsistentRead:true}));
  return (result.Item as FireApplication|undefined)||null;
}

export async function createFire(request:Request, opportunityId:string){
  const {identity,profile}=await fireIdentity(request);
  const fireId=`${identity.userId}#${opportunityId}`;
  const existing=await getFire(identity.userId,opportunityId);
  if(existing)return existing;
  const now=new Date().toISOString();
  const fire:FireApplication={
    fireId,
    repId:identity.userId,
    opportunityId,
    companyId:COMPANY_BY_OPPORTUNITY[opportunityId]||'demo-company',
    status:'PENDING',
    createdAt:now,
    updatedAt:now,
    repSnapshot:{firstName:profile.firstName,lastName:profile.lastName,country:profile.country,city:profile.city,yearsExperience:profile.yearsExperience,industries:profile.industries,linkedinUrl:profile.linkedinUrl,bio:profile.bio},
  };
  await ddb.send(new PutCommand({TableName:tableName,Item:fire,ConditionExpression:'attribute_not_exists(fireId)'}));
  const persisted=await getFire(identity.userId,opportunityId);
  if(!persisted) throw new Error(`Fire write was not persisted in ${tableName} (${region}).`);
  return persisted;
}
