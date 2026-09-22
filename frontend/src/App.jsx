import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import VerifyRegisterOtp from './components/pages/VerifyRegisterOtp';
import ForgotPassword from './components/pages/ForgotPassword';
import VerifyResetOtp from './components/pages/VerifyResetOtp';
import ResetPassword from './components/pages/ResetPassword';
import Dashboard from './components/pages/Dashboard';
import Playlists from './components/pages/Playlists';
import PlaylistDetail from './components/pages/PlaylistDetail';
import PublicPlaylist from './components/pages/PublicPlaylist';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-cream">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Home />
                  <Footer />
                </>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/verify" element={<VerifyRegisterOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password/verify" element={<VerifyResetOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:id" element={<PlaylistDetail />} />
            <Route path="/p/:shareCode" element={<PublicPlaylist />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;