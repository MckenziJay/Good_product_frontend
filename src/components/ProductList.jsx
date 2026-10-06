import { useCallback, useEffect, useState } from 'react';
import { getProducts, deleteProduct, errorMessage } from '../api.js';
import ProductForm from './ProductForm.jsx';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export default function ProductList({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formFor, setFormFor] = useState(null); // null = closed, {} = add, product = edit
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((current) => current.filter((item) => item.id !== p.id));
      setNotice('Product deleted.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleSaved = (msg, savedProduct) => {
    setFormFor(null);
    setNotice(msg);

    setProducts((current) => {
      if (!savedProduct) return current;
      const idx = current.findIndex((item) => item.id === savedProduct.id);
      if (idx >= 0) {
        const next = [...current];
        next[idx] = savedProduct;
        return next;
      }
      return [savedProduct, ...current];
    });
  };

  return (
    <div className="container">
      <header>
        <h1>Products</h1>
        <div className="header-right">
          <span className="muted">Signed in as <strong>{user.username}</strong></span>
          <button className="secondary" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success" onClick={() => setNotice('')}>{notice}</div>}

      {isAdmin && (
        <div className="toolbar">
          <button onClick={() => setFormFor({})}>+ Add product</button>
        </div>
      )}

      <div className="card table-wrap">
        {loading ? <p className="center">Loading…</p> : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                <th>Created</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={isAdmin ? 7 : 6} className="center muted">No products yet.</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td><strong>{p.product_name}</strong></td>
                  <td className="muted">{p.description}</td>
                  <td className="num">{peso.format(p.price)}</td>
                  <td className="num">{p.quantity}</td>
                  <td className="muted">{p.created_at}</td>
                  {isAdmin && (
                    <td className="actions">
                      <button className="secondary small" onClick={() => setFormFor(p)}>Edit</button>
                      <button className="danger small" onClick={() => handleDelete(p)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          onSaved={handleSaved}
          onCancel={() => setFormFor(null)}
        />
      )}
    </div>
  );
}
