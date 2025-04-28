import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';

function TrainingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const { fen, moves, name, username, challengeMode, id: openingId } = location.state || {}; 

  const [game, setGame] = useState(new Chess(fen));
  const [currentFen, setCurrentFen] = useState(fen);
  const [moveList, setMoveList] = useState(moves);
  const [currentMove, setCurrentMove] = useState(0);
  const [openingName, setOpeningName] = useState(name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');

  const [playerSide, setPlayerSide] = useState('w');

  useEffect(() => {
    const tempGame = new Chess(currentFen);
    if (tempGame.turn() !== playerSide) {
      const nextMove = moveList[currentMove];
      if (nextMove) {
        setTimeout(() => {
          tempGame.move(nextMove);
          const newGame = new Chess(tempGame.fen());
          setGame(newGame);
          setCurrentFen(newGame.fen());
          setCurrentMove(prev => prev + 1);
        }, 500);
      }
    }
  }, [playerSide, currentFen]);
  

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

  useEffect(() => {
    if (openingId) {
      fetch(`http://localhost:3001/comments/${openingId}`)
        .then(response => response.json())
        .then(data => setComments(data))
        .catch(error => console.error('Erreur chargement commentaires:', error));
    }
  }, [openingId]);

  useEffect(() => {
    setPlayerSide(Math.random() < 0.5 ? 'w' : 'b');
  }, []);

  const isUserTurn = () => {
    const tempGame = new Chess(currentFen);
    return (tempGame.turn() === playerSide);
  };

  const cleanSan = (san) => san.replace(/[x+#]/g, '');

  const fetchRandomOpening = async () => {
    try {
      const response = await fetch('http://localhost:3001/openings');
      const openings = await response.json();
      const randomOpening = openings[Math.floor(Math.random() * openings.length)];

      const newChess = new Chess(randomOpening.fen);
      setGame(newChess);
      setCurrentFen(newChess.fen());
      setMoveList(randomOpening.moves);
      setCurrentMove(0);
      setOpeningName(randomOpening.name);
    } catch (error) {
      console.error('Erreur de chargement d\'une ouverture :', error);
      navigate('/');
    }
  };

  const handleEndOfOpening = () => {
    setTimeout(() => {
      if (challengeMode) {
        fetchRandomOpening();
      } else {
        navigate('/');
      }
    }, 1000);
  };

  const handleOpponentMove = (updatedGame) => {
    const nextMove = moveList[currentMove + 1];

    if (nextMove) {
      if (updatedGame.turn() !== playerSide) {
        setTimeout(() => {
          updatedGame.move(nextMove);
          const newGame = new Chess(updatedGame.fen());
          setGame(newGame);
          setCurrentFen(newGame.fen());

          if (!moveList[currentMove + 2]) {
            handleEndOfOpening();
          }
        }, 500);
      }
    } else {
      handleEndOfOpening();
    }
  };

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (!isUserTurn()) {
      console.log('Ce n\'est pas ton tour.');
      return false;
    }
  
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
  
    if (move === null) {
      return false;
    }
  
    const playedMove = cleanSan(move.san);
    const expectedMove = cleanSan(moveList[currentMove]);
  
    if (playedMove === expectedMove) {
      const updatedGame = new Chess(tempGame.fen());
      setGame(updatedGame);
      setCurrentFen(updatedGame.fen());
      setCurrentMove(prev => prev + 1);
  
      handleOpponentMove(updatedGame);
      return true;
    } else {
      console.log('Mauvais coup attendu:', expectedMove, 'Coup joué:', playedMove);
      return false;
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newComment.trim().length === 0) {
      setError('Commentaire vide.');
      return;
    }
    if (newComment.length > 200) {
      setError('200 caractères maximum.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ openingId: openingId, message: newComment.trim() })
      });

      if (!response.ok) {
        throw new Error('Erreur envoi commentaire');
      }

      setNewComment('');
      const updatedComments = await fetch(`http://localhost:3001/comments/${openingId}`)
        .then(res => res.json());
      setComments(updatedComments);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'envoi');
    }
  };

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

      <h1 className="training-title">
        Révision : {openingName}
        {username && (
          <span style={{ fontSize: '1rem', fontWeight: 'normal', marginLeft: '10px' }}>
            (créé par {username})
          </span>
        )}
      </h1>

      <div className="training-layout">
        <div className="chessboard-wrapper">
          <Chessboard
            position={currentFen}
            onPieceDrop={onPieceDrop}
            boardWidth={500}
            boardOrientation={playerSide === 'w' ? 'white' : 'black'}
          />
        </div>

        <div className="move-list">
          <h2 className="move-list-title">Coups à jouer</h2>
          <ul>
            {moveList.slice(currentMove).map((move, index) => (
              <li key={index} className="spoiler-move">{move}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '60px', width: '100%', maxWidth: '600px' }}>
        <h2 className="move-list-title">Commentaires</h2>

        {comments.map((comment) => (
          <div key={comment.id} style={{ backgroundColor: '#2d3748', padding: '10px', marginBottom: '10px', borderRadius: '10px' }}>
            <strong>{comment.username || 'Anonyme'}</strong>
            <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
              {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}
            </div>
            <p style={{ marginTop: '5px' }}>{comment.message}</p>
          </div>
        ))}

        {user ? (
          <form onSubmit={handleCommentSubmit} style={{ marginTop: '20px' }}>
            <textarea
              className="editor-textarea"
              placeholder="Ton commentaire (max 200 caractères)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={200}
            />
            <button type="submit" className="main-button" style={{ marginTop: '10px' }}>
              Poster le commentaire
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          </form>
        ) : (
          <p style={{ marginTop: '20px' }}>Connecte-toi pour poster un commentaire !</p>
        )}
      </div>
    </div>
  );
}

export default TrainingPage;