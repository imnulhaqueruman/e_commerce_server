import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function ForgotPassword() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-12 text-center">
      <Helmet>
        <title>Forgot password · Shopper</title>
      </Helmet>
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Password reset isn&apos;t available in this demo. Please contact support or
        create a new account.
      </p>
      <Link to="/login" className="mt-4 text-sm text-primary hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}