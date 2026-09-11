import Link from 'next/link';
import styles from './MiniGameArcade.module.css';

export default function MiniGameArcade() {
  return <section aria-labelledby="minigiochi-title" className={styles.arcade}>
    <header><h2 id="minigiochi-title">Almeno qui servi a qualcosa.</h2><span>GIOCA · GUADAGNA XP</span></header>
    <div className={styles.shelf}>
      {[
        { name: 'Corsa clandestina', label: 'Corsa', description: 'Scappa. I problemi corrono.', href: '/runner', poster: 'runner', theme: styles.runner },
        { name: 'Bullet Hell', label: 'Bullet Hell', description: 'Il bosco ha fame. Tu hai una raffica.', href: '/bullet-hell', poster: 'bullet', theme: styles.bullet },
        { name: 'Grigliata del panico', label: 'Grigliata', description: 'Sfama gli altri. Rischia la denuncia.', href: '/scorribanda', poster: 'grigliata', theme: styles.grill },
        { name: 'Merge', label: 'Merge', description: 'Fondi frutta. Spreca vita.', href: '/allenamento', poster: 'merge', theme: styles.merge },
      ].map(game => <Link key={game.href} href={game.href} aria-label={`Gioca a ${game.name}`} className={`${styles.card} ${game.theme}`}>
        <img src={`/locandinegiochi/${game.poster}.jpeg`} alt={game.name} loading="lazy" decoding="async" draggable={false} />
        <div className={styles.caption}><h3>{game.label}</h3><p>{game.description}</p></div>
        <span className={styles.play}><span aria-hidden="true">▶</span> GIOCA</span>
      </Link>)}
    </div>
  </section>;
}
