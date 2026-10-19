import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import HostView from './views/HostView';
import ClientView from './views/ClientView';
import DigitalLessonView from './views/DigitalLessonView';

function App() {
  return (
    <RoomProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/digital" element={<DigitalLessonView />} />
          {/* Main UI for users: directly enter PIN */}
          <Route path="/" element={<ClientView />} />
          <Route path="/client" element={<ClientView />} />
          {/* Hidden admin endpoint */}
          <Route path="/host" element={<HostView />} />
        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}

export default App;
