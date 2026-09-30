import { getUser } from '@netlify/identity';
import { redirect } from 'next/navigation';
export async function currentOwner(){
 const user=await getUser();
 const expected=process.env.STUDIO_OWNER_EMAIL?.trim().toLowerCase();
 if(!expected||!user?.email||user.email.toLowerCase()!==expected)return null;
 return {userId:user.id,email:user.email};
}
export async function requireOwner(returnTo='/'){
 const user=await currentOwner();
 if(!user)redirect('/login?returnTo='+encodeURIComponent(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/'));
 return user;
}
