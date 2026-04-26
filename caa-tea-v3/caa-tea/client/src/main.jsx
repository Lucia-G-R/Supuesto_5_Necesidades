import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { useStore } from './store.js';
import SelectChild  from './components/SelectChild.jsx';
import PinGate      from './components/shared/PinGate.jsx';
import ChildApp     from './components/ChildApp.jsx';
import AdultApp     from './components/adult/AdultApp.jsx';

function RequireAuth({ children }) {
  const token = useStore(s => s.token);
  return token ? children : <Navigate to="/" replace />;
}

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<SelectChild />} />
        <Route path="/child"    element={<RequireAuth><ChildApp /></RequireAuth>} />
        <Route path="/adult"    element={<PinGate />} />
        <Route path="/adult/dashboard" element={<RequireAuth><AdultApp /></RequireAuth>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
