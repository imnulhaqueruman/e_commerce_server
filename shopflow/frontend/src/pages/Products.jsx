import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/products/');
      setProducts(data);
      const stockEntries = await Promise.all(
        data.map(async (p) => {
          try {
            const r = await api.get(`/inventory/${p._id}`);
            return [p._id, r.data];
          } catch {
            return [p._id, { product_id: p._id, quantity: 0 }];
          }
        }),
      );
      setStocks(Object.fromEntries(stockEntries));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>Products</h2>
      {products.length === 0 && <p className="muted">No products yet.</p>}
      {products.map((p) => {
        const stock = stocks[p._id] || { quantity: 0 };
        const inStock = stock.quantity > 0;
        return (
          <div className="card" key={p._id}>
            <h3>{p.name}</h3>
            <p className="muted">{p.category}</p>
            <p>{p.description || <span className="muted">No description</span>}</p>
            <p>
              <strong>${p.price.toFixed(2)}</strong>{' '}
              <span className={`tag${inStock ? '' : ' out'}`}>
                {inStock ? `${stock.quantity} in stock` : 'Out of stock'}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}