import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SitePage from './pages/SitePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    // Было basename="/binhai" — нужно было для xoppop888.github.io/binhai.
    // На своём домене сайт живёт в корне, поэтому basename убран.
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SitePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
