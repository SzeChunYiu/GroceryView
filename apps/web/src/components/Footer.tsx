import Link from 'next/link';

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

const socialLinks = [
  {
    href: 'https://github.com/SzeChunYiu/GroceryView',
    label: 'GitHub',
  },
  {
    href: 'mailto:hello@groceryview.io',
    label: 'Contact',
  },
];

export function Footer() {
  return (
    <footer className="gv-footer">
      <div className="gv-footer__inner">
        <p className="gv-footer__brand">GroceryView</p>
        <nav aria-label="Footer navigation" className="gv-footer__links">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="gv-footer__socials" aria-label="Social links">
          {socialLinks.map((link) => (
            <a
              href={link.href}
              key={link.label}
              rel="noreferrer"
              target={link.href.startsWith('http') ? '_blank' : undefined}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

