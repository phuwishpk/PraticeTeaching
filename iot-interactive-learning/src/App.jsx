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
          {/* Main UI for users: directly enter PIN */}
          <Route path="/" element={<ClientView />} />
          {/* Hidden admin endpoint */}
          <Route path="/host" element={<HostView />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}

export default App;
