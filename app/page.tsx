import { requireAccount } from '@/lib/auth';
import Studio from './studio';
export const dynamic='force-dynamic';
export default async function Home(){await requireAccount('/');return <Studio/>;}
