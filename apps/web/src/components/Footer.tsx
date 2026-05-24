import Link from 'next/link';

const internalLinks = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: 'https://github.com/SzeChunYiu/GroceryView', label: 'GitHub', external: true }
];

export function Footer() {
  return (
    <footer className="gv-footer" aria-label="Site footer">
      <div className="gv-footer__container">
        <p className="gv-footer__logo">GroceryView</p>
        <ul className="gv-footer__links" aria-label="Footer links">
          {internalLinks.map((item) => (
            <li key={item.label}>
              {item.external ? (
                <a href={item.href} rel="noreferrer" target="_blank">
                  {item.label}
                </a>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          ))}
          <li>
            <a href="mailto:support@groceryview.com">Contact</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
