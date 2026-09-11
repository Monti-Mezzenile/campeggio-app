'use client';

import { useRouter } from 'next/navigation';
import BulletHell from '@/components/games/bullet/BulletHell';
import styles from '@/components/games/bullet/BulletHell.module.css';

export default function BulletHellPage() {
  const router = useRouter();
  return <main className={styles.page}>
    <BulletHell onClose={() => router.push('/mascotte')} />
  </main>;
}
