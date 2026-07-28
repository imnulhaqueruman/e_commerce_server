import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/api/auth';
import { useCart } from '@/api/cart';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
];

export function Navbar() {
  const { user, token } = useAuthStore();
  const logout = useLogout();
  const { data: cart } = useCart();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const cartCount = cart?.products?.length ?? 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="text-lg font-bold tracking-tight">
          Shopper
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
        <form
          onSubmit={submitSearch}
          className="ml-auto hidden flex-1 max-w-sm md:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-8"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="ghost" size="icon" aria-label="Cart">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
          {token ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Account">
                <Link to="/user">
                  <User className="h-5 w-5" />
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
            <Button asChild size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <nav className="flex flex-col gap-4">
          <Link to="/" onClick={() => setOpen(false)} className="text-base font-medium">
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setOpen(false)}
            className="text-base font-medium"
          >
            Shop
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="text-base font-medium"
            >
              Admin
            </Link>
          )}
          {token ? (
            <>
              <Link
                to="/user"
                onClick={() => setOpen(false)}
                className="text-base font-medium"
              >
                Account
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  logout.mutate();
                }}
                className="text-left text-base font-medium"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="text-base font-medium"
            >
              Sign in
            </Link>
          )}
        </nav>
      </Sheet>
    </header>
  );
}