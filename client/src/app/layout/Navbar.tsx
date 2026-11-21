import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Sheet } from '@/shared/ui/primitives/sheet';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLogout } from '@/features/auth/api/auth';
import { useCart } from '@/features/cart/api/cart';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
];

export function Navbar() {
  const { user, token } = useAuthStore();
  const logout = useLogout();
  const { data: cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const cartCount = cart?.products?.length ?? 0;
  const isAdmin = user?.role === 'admin';

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setSearch('');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-3">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Shopper</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              Admin
            </NavLink>
          ) : null}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:block">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="pl-8"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {token ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
                <Link to="/user?tab=wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Cart">
                <Link to="/cart" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {cartCount}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Account">
                <Link to="/user">
                  <UserIcon className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Log out"
                onClick={() => logout.mutate()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Shopper</span>
          <button
            onClick={closeMenu}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submitSearch} className="mt-4">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="pl-8"
            />
          </div>
        </form>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className="rounded-md px-2 py-2 text-base font-medium hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}

          {isAdmin ? (
            <>
              <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Admin
              </p>
              {ADMIN_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-base font-medium hover:bg-accent"
                >
                  {link.to === '/admin' ? (
                    <LayoutDashboard className="h-4 w-4" />
                  ) : null}
                  {link.label}
                </Link>
              ))}
            </>
          ) : null}

          {token ? (
            <>
              <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Account
              </p>
              <Link
                to="/user"
                onClick={closeMenu}
                className="rounded-md px-2 py-2 text-base font-medium hover:bg-accent"
              >
                Profile & orders
              </Link>
              <button
                onClick={() => {
                  closeMenu();
                  logout.mutate();
                }}
                className="rounded-md px-2 py-2 text-left text-base font-medium hover:bg-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild onClick={closeMenu}>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" onClick={closeMenu}>
                <Link to="/register">Create account</Link>
              </Button>
            </div>
          )}
        </nav>
      </Sheet>
    </header>
  );
}
