import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './styles/global.css';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id });
    } catch (err) {
      console.error('Erreur décodage token', err);
      setUser(null);
    }
  }
}, []);

const handleLogout = () => {
  localStorage.removeItem('token');
  setUser(null);
  navigate('/');
};


  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur serveur');
    }
  };

  return (
    <div className="training-container">
      <h1 className="training-title">Créer un compte</h1>
      <form className="editor-form" onSubmit={handleRegister}>
        <input
          className="editor-input"
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="editor-input"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="main-button" type="submit">Créer un compte</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
    </div>
  );
}

export default RegisterPage;
