import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ChallengePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const startChallenge = async () => {
      try {
        const response = await fetch('http://localhost:3001/openings');
        const openings = await response.json();

        if (openings.length === 0) {
          alert("Aucune ouverture officielle disponible !");
          navigate('/'); // Retour accueil si aucun opening
          return;
        }

        // Choisir une ouverture aléatoire
        const randomOpening = openings[Math.floor(Math.random() * openings.length)];

        // Lancer TrainingPage directement avec l'ouverture choisie
        navigate('/training', { state: { ...randomOpening, challengeMode: true } });

      } catch (error) {
        console.error('Erreur chargement défi :', error);
        alert('Erreur en lançant le défi !');
        navigate('/');
      }
    };

    startChallenge();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl">Chargement du Défi...</h1>
    </div>
  );
}

export default ChallengePage;
