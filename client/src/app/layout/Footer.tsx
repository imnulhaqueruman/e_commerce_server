import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

const FOOTER_SECTIONS = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'All products' },
      { to: '/shop?sort=price&order=asc', label: 'Best value' },
      { to: '/search', label: 'Search' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/user', label: 'My account' },
      { to: '/user?tab=orders', label: 'Orders' },
      { to: '/user?tab=wishlist', label: 'Wishlist' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </span>
            Shopper
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            A curated catalogue of electronics and everyday essentials,
            delivered to your door.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="text-sm font-semibold">{section.title}</p>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Shopper. All rights reserved.</p>
          <p>Powered by the Shopper API.</p>
        </div>
      </div>
    </footer>
  );
}
