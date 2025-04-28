import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';

function OpeningEditor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id });
      } catch (err) {
        console.error('Token invalide', err);
        navigate('/login');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  const [game, setGame] = useState(new Chess());
  const [currentFen, setCurrentFen] = useState(new Chess().fen());
  const [moveList, setMoveList] = useState([]);
  const [openingName, setOpeningName] = useState("");
  const [startingFen, setStartingFen] = useState(new Chess().fen());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const onPieceDrop = (sourceSquare, targetSquare) => {
    const tempGame = new Chess(currentFen);
    let move = null;
    try {
      move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    } catch (error) {
      console.log('Coup illégal :', error.message);
      return false;
    }

    if (move === null) return false;

    const updatedGame = new Chess(tempGame.fen());
    setGame(updatedGame);
    setCurrentFen(updatedGame.fen());
    setMoveList([...moveList, move.san]);

    return true;
  };

  const handleSave = async () => {
    if (!openingName.trim()) {
      setNotification({ type: 'error', message: "Le nom de l'ouverture est requis." });
      return;
    }
  
    try {
      const testFen = new Chess(startingFen);
    } catch (error) {
      setNotification({ type: 'error', message: "FEN de départ invalide." });
      return;
    }
  
    try {
      const existingResponse = await fetch("http://localhost:3001/check-opening-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: openingName }),
      });
  
      if (!existingResponse.ok) {
        throw new Error("Erreur de validation du nom");
      }
  
      const existingData = await existingResponse.json();
  
      if (existingData.exists) {
        setNotification({ type: 'error', message: "Ce nom d'ouverture est déjà utilisé." });
        return;
      }
  
      const token = localStorage.getItem('token');

      const createResponse = await fetch("http://localhost:3001/create-opening", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: openingName,
          fen: startingFen,
          moves: moveList,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Erreur lors de la création de l'ouverture");
      }
  
      setNotification({ type: 'success', message: "Ouverture sauvegardée avec succès !" });
      setTimeout(() => navigate("/openings"), 1500);
    } catch (error) {
      console.error("Erreur sauvegarde ouverture:", error);
      setNotification({ type: 'error', message: error.message || "Erreur lors de la sauvegarde." });
    }
  };

  const handleReset = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentFen(newGame.fen());
    setMoveList([]);
  };

  const handleFenChange = (e) => {
    const newFen = e.target.value;
    setStartingFen(newFen);
    try {
      const newGame = new Chess(newFen);
      setGame(newGame);
      setCurrentFen(newFen);
      setMoveList([]);
    } catch (error) {
      console.log('FEN invalide:', error.message);
    }
  };

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return (
    <div className="training-container">
      {!isMenuOpen && (
        <button onClick={toggleMenu} className="menu-toggle">
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
            <button onClick={() => navigate('/login')} className="main-button" style={{ marginTop: '10px' }}>
              Se connecter
            </button>
            <button onClick={() => navigate('/register')} className="main-button" style={{ marginTop: '10px' }}>
              Créer un compte
            </button>
          </>
        )}
        <a href="/">Accueil</a>
      </div>

      <h1 className="training-title">Créer une nouvelle ouverture</h1>

      <div className="training-layout">
        <div className="chessboard-wrapper">
          <Chessboard
            position={currentFen}
            onPieceDrop={onPieceDrop}
            boardWidth={500}
          />
        </div>

        <div className="editor-form">
          <input
            type="text"
            value={openingName}
            onChange={(e) => setOpeningName(e.target.value)}
            placeholder="Nom de l'ouverture"
            className="editor-input"
          />
          <textarea
            value={startingFen}
            onChange={handleFenChange}
            placeholder="FEN de départ"
            className="editor-textarea"
            rows={2}
          />
          <textarea
            value={moveList.join(' ')}
            readOnly
            placeholder="Coups enregistrés"
            className="editor-textarea"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleSave} className="main-button">
              Sauvegarder l'Ouverture
            </button>
            <button onClick={handleReset} className="main-button">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: notification.type === 'success' ? '#3b82f6' : '#ef4444',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            zIndex: 1000
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default OpeningEditor;
