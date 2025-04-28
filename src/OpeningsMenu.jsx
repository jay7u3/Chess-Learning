import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';

function OpeningsMenu() {
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

  const [officialOpenings, setOfficialOpenings] = useState([]);
  const [communityOpenings, setCommunityOpenings] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOfficial, setShowOfficial] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  useEffect(() => {
    fetch('http://localhost:3001/openings')
      .then(response => response.json())
      .then(data => setOfficialOpenings(data))
      .catch(error => console.error('Erreur chargement ouvertures officielles:', error));

    fetch('http://localhost:3001/community-openings')
      .then(response => response.json())
      .then(data => {
        console.log(communityOpenings)
        setCommunityOpenings(data);
      })
      .catch(error => console.error('Erreur chargement ouvertures communauté:', error));
  }, []);

  const handleOpeningClick = (opening) => {
    if (!opening.username) {
      opening.username = "Officiel";
    }
    navigate('/training', { state: opening });
  };
  

  return (
    <div className="training-container">
      {!isMenuOpen && (
        <button onClick={toggleMenu} className="menu-toggle">
          ☰
        </button>
      )}

      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">Menu</div>
        <button onClick={toggleMenu} className="close-menu-button">
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

      <h1 className="training-title">Choisis ton ouverture</h1>

      <div className="sections-wrapper">
        <div className="section-wrapper">
          <button
            className="bordered-title"
            onClick={() => setShowOfficial(prev => !prev)}
          >
            Ouvertures Classiques {showOfficial ? '▲' : '▼'}
          </button>
          <div
            className={`dropdown-content ${showOfficial ? 'open' : ''}`}
            style={{
              maxHeight: showOfficial ? '400px' : '0',
              opacity: showOfficial ? 1 : 0,
              overflowY: showOfficial ? 'auto' : 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {officialOpenings.length === 0 ? (
              <p className="loading-text">Chargement...</p>
            ) : (
              officialOpenings.map((opening) => (
                <button
                  key={opening.id}
                  onClick={() => handleOpeningClick(opening)}
                  className="main-button"
                >
                  {opening.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="section-wrapper">
          <button
            className="bordered-title"
            onClick={() => setShowCommunity(prev => !prev)}
          >
            Ouvertures de la Communauté {showCommunity ? '▲' : '▼'}
          </button>
          <div
            className={`dropdown-content ${showCommunity ? 'open' : ''}`}
            style={{
              maxHeight: showCommunity ? '400px' : '0',
              opacity: showCommunity ? 1 : 0,
              overflowY: showCommunity ? 'auto' : 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {communityOpenings.length === 0 ? (
              <p className="loading-text">Aucune ouverture pour l'instant...</p>
            ) : (
              
              communityOpenings.map((opening) => (
                <button
                  key={opening.id}
                  onClick={() => handleOpeningClick(opening)}
                  className="main-button community-style"
                  title={`Créé par ${opening.username}`}
                >
                  {opening.name} ({opening.username})
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpeningsMenu;
