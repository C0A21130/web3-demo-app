import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell, MantineProvider } from '@mantine/core';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import './index.css';
import '@mantine/core/styles.css';

function App() {
  const [opened, setOpened] = useState(false);

  return (
    <BrowserRouter>
      <MantineProvider>
        <AppShell>
          <AppShell.Header>
            <Header opened={opened} setOpened={setOpened} />
          </AppShell.Header>
          <AppShell.Navbar className='mt-8'>
            <Navbar opened={opened} />
          </AppShell.Navbar>
          <AppShell.Main>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App;
