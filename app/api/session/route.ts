import {currentAccount} from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(){const owner=await currentAccount();return Response.json({authenticated:!!owner},{status:owner?200:401,headers:{'Cache-Control':'no-store'}});}
