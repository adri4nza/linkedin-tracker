import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/analytics" replace />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        {/* Additional routes (Dashboard, Results, Settings) will be added here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
