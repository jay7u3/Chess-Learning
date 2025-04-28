import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useLocation, useNavigate } from "react-router-dom";
import Pawn3D from './Pawn3D';
import { useEffect, useState } from 'react';
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';

function HomePage() {
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="training-container">
      {!isMenuOpen && (
        <button onClick={() => setIsMenuOpen(prev => !prev)} className="menu-toggle">
          ☰
        </button>
      )}

      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">Menu</div>
        <button onClick={() => setIsMenuOpen(false)} className="close-menu-button">
          ✕
        </button>
        {user ? (
  <>
    <p style={{ marginTop: '20px' }}>Connecté</p>
    <button onClick={handleLogout} className="main-button" style={{ marginTop: '10px' }}>
      Déconnexion
    </button>
  </>
) : (
  <>
    <a href="/login">Se connecter</a>
    <a href="/register">Créer un compte</a>
  </>
)}
        <a href="/">Accueil</a>
        <a href="/openings">Ouvertures</a>
      </div>

      <h1 className="training-title">Chess-Learning</h1>

      <Pawn3D />

      <div className="sections-wrapper">
        <div className="section-wrapper">
          <button className="bordered-title" onClick={() => navigate('/openings')}>
            Voir les ouvertures
          </button>
        </div>
        <div className="section-wrapper">
          <button className="bordered-title" onClick={() => navigate('/challenge')}>
            Défi
          </button>
        </div>
        <div className="section-wrapper">
          <button className="bordered-title" onClick={() => navigate('/editor')}>
            Créer une ouverture
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;