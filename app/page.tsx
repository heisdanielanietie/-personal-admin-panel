import { requireOwner } from '@/lib/auth';
import Studio from './studio';
export const dynamic='force-dynamic';
export default async function Home(){await requireOwner('/');return <Studio/>;}
