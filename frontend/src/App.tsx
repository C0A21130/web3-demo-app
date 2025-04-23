import { useState, createContext, Dispatch, SetStateAction } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Wallet, HDNodeWallet } from 'ethers';
import { AppShell, MantineProvider } from '@mantine/core';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Present from './pages/Present';
import User from './pages/User';
import './index.css';
import '@mantine/core/styles.css';

export const rpcUrlIndexContext = createContext<[number, Dispatch<SetStateAction<number>>]>([0, () => { }]);
export const walletContext = createContext<[Wallet | HDNodeWallet | undefined, Dispatch<SetStateAction<Wallet | HDNodeWallet | undefined>>]>([undefined, () => { }]);
export const rpcUrls = ["http://localhost:8545"];
export const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const receiveAccountPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function App() {
  const [opened, setOpened] = useState(false);
  const [wallet, setWallet] = useState<Wallet | HDNodeWallet>();

  return (
    <BrowserRouter>
      <MantineProvider>
        <walletContext.Provider value={[wallet, setWallet]}>
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
                <Route path="/present" element={<Present />} />
                <Route path="/user" element={<User />} />
              </Routes>
            </AppShell.Main>
          </AppShell>
        </walletContext.Provider>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App;
