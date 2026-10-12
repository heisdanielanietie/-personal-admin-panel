import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Next's request cookies are reliable inside the Netlify Next.js adapter.
// Verify with Identity's /user endpoint; never trust decoded JWT claims alone.
export async function accountSession(){
 const token=(await cookies()).get('nf_jwt')?.value;
 if(!token)return {account:null,status:401,error:'Your sign-in session is missing. Please enable cookies and sign in again.'};
 try{
  const response=await fetch(`${process.env.STUDIO_IDENTITY_URL}/user`,{
   headers:{Authorization:`Bearer ${token}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),
  });
  if(response.status===401||response.status===403)return {account:null,status:401,error:'Your session has expired or is invalid. Please sign in again.'};
  if(!response.ok)throw new Error('Identity unavailable');
  const user=await response.json();
  if(typeof user.id!=='string'||!user.id||typeof user.email!=='string'||!user.email)throw new Error('Invalid Identity response');
  if(!user.confirmed_at)return {account:null,status:403,error:'Please confirm your email address. Use Resend confirmation email if needed.'};
  return {account:{userId:user.id,email:user.email},status:200,error:null};
 }catch{
  return {account:null,status:503,error:'The sign-in service could not be reached. Please try again shortly.'};
 }
}
export async function currentAccount(){return (await accountSession()).account;}
export async function requireAccount(returnTo='/'){
 const user=await currentAccount();
 if(!user)redirect('/login?returnTo='+encodeURIComponent(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/'));
 return user;
}
