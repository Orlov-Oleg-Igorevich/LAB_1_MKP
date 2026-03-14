import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import GeopotentialApp from './components/GeopotentialApp';
import LunarApp from './components/LunarApp';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/geopotential" element={<GeopotentialApp />} />
        <Route path="/lunar" element={<LunarApp />} />
      </Routes>
    </BrowserRouter>
  );
}
