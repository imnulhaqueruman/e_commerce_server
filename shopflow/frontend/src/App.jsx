import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Products from './pages/Products.jsx';

function Nav() {
  const navigate = useNavigate();
  const token = localStorage.getItem('shopflow_token');

  function logout() {
    localStorage.removeItem('shopflow_token');
    localStorage.removeItem('shopflow_user');
    navigate('/login');
  }

  return (
    <nav className="nav">
      <Link to="/" className="brand">ShopFlow</Link>
      <Link to="/products">Products</Link>
      <span className="spacer" />
      {token ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  const token = localStorage.getItem('shopflow_token');

  return (
    <>
      <Nav />
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/products"
            element={token ? <Products /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </>
  );
}