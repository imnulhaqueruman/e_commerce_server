import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-background">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Shopper. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link to="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <Link to="/user" className="hover:text-foreground">
            Account
          </Link>
          <Link to="/cart" className="hover:text-foreground">
            Cart
          </Link>
        </nav>
      </div>
    </footer>
  );
}