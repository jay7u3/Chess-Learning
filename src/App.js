import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import OpeningsMenu from './OpeningsMenu';
import TrainingPage from './TrainingPage';
import OpeningEditor from './OpeningEditor';
import ChallengePage from './ChallengePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/openings" element={<OpeningsMenu />} />
      <Route path="/training" element={<TrainingPage />} />
      <Route path="/editor" element={<OpeningEditor />} />
      <Route path="/challenge" element={<ChallengePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;



