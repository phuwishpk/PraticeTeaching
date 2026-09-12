import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import HostView from './views/HostView';
import ClientView from './views/ClientView';

function App() {
  return (
    <RoomProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/host" element={<HostView />} />
          <Route path="/client" element={<ClientView />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}

function Landing() {
  return (
    <div className="full-screen flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '3rem', textAlign: 'center' }}>IoT Interactive Learning</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Link to="/host" style={{ textDecoration: 'none' }}>
          <button className="neu-button" style={{ padding: '24px 48px', fontSize: '1.5rem' }}>
            👨‍🏫 Host (Teacher)
          </button>
        </Link>
        <Link to="/client" style={{ textDecoration: 'none' }}>
          <button className="neu-button" style={{ padding: '24px 48px', fontSize: '1.5rem' }}>
            📱 Client (Student)
          </button>
        </Link>
      </div>
    </div>
  );
}

export default App;
