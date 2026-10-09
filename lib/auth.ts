import { getUser } from '@netlify/identity';
import { redirect } from 'next/navigation';
export async function currentAccount(){
 const user=await getUser();
 if(!user?.id||!user.email||!user.confirmedAt)return null;
 return {userId:user.id,email:user.email};
}
export async function requireAccount(returnTo='/'){
 const user=await currentAccount();
 if(!user)redirect('/login?returnTo='+encodeURIComponent(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/'));
 return user;
}
