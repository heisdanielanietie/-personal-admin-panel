import {accountSession} from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(){
 const session=await accountSession();
 return Response.json({authenticated:!!session.account,error:session.error},{status:session.status,headers:{'Cache-Control':'no-store'}});
}
