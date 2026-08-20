import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-3';
const tableName = process.env.FIRERANKY_USERS_TABLE || 'fireranky-users-dev';
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('Missing Cognito environment variables.');
}

const verifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: 'id',
  clientId,
});

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

export type ProfileRole = 'sales' | 'company';

export type FireRankyProfile = {
  userId: string;
  email: string;
  role: ProfileRole;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  linkedinUrl?: string;
  yearsExperience?: number;
  industries?: string[];
  bio?: string;
  companyName?: string;
  website?: string;
  contactRole?: string;
};

export async function identityFromRequest(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const payload = await verifier.verify(header.slice(7));
  const role: ProfileRole = payload['custom:role'] === 'company' ? 'company' : 'sales';
  return {
    userId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    role,
  };
}

export async function getProfile(userId: string): Promise<FireRankyProfile | null> {
  const result = await ddb.send(new GetCommand({ TableName: tableName, Key: { userId } }));
  return (result.Item as FireRankyProfile | undefined) || null;
}

export async function ensureProfile(identity: {userId:string;email:string;role:ProfileRole}) {
  const existing = await getProfile(identity.userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const profile: FireRankyProfile = {
    ...identity,
    profileComplete: false,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: tableName, Item: profile, ConditionExpression: 'attribute_not_exists(userId)' }));
  return profile;
}

export async function saveProfile(identity: {userId:string;email:string;role:ProfileRole}, values: Partial<FireRankyProfile>) {
  const existing = await ensureProfile(identity);
  const now = new Date().toISOString();
  const allowed = identity.role === 'sales'
    ? ['firstName','lastName','country','city','linkedinUrl','yearsExperience','industries','bio']
    : ['companyName','website','country','contactRole'];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) if (values[key as keyof FireRankyProfile] !== undefined) clean[key] = values[key as keyof FireRankyProfile];
  const profile: FireRankyProfile = {
    ...existing,
    ...clean,
    userId: identity.userId,
    email: identity.email,
    role: identity.role,
    profileComplete: true,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: tableName, Item: profile }));
  return profile;
}
