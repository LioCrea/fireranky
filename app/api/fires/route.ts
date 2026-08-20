import { NextResponse } from 'next/server';
import { fireIdentity, listRepFires } from '../../lib/server-fire';
export async function GET(request:Request){try{const{identity}=await fireIdentity(request);return NextResponse.json({fires:await listRepFires(identity.userId)});}catch(error){const msg=error instanceof Error?error.message:'Unexpected error';return NextResponse.json({error:msg},{status:msg==='Unauthorized'?401:400});}}
