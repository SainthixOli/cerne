import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard'; // Importe o arquivo novo

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Rota Professor */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* NOVA Rota Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;