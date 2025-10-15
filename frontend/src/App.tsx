import { useState, createContext, Dispatch, SetStateAction } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Wallet, HDNodeWallet } from 'ethers';
import { AppShell, MantineProvider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Present from './pages/Present';
import NotFound from './pages/NotFound';
import Score from './pages/Score';
import User from './pages/User';
import './index.css';
import '@mantine/core/styles.css';

export const rpcUrlIndexContext = createContext<[number, Dispatch<SetStateAction<number>>]>([0, () => { }]);
export const walletContext = createContext<[Wallet | HDNodeWallet | undefined, Dispatch<SetStateAction<Wallet | HDNodeWallet | undefined>>]>([undefined, () => { }]);
export const rpcUrls = ["http://localhost:8545"];
export const ipfsApiUrl = "http://localhost";
export const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const receiveAccountPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function App() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(false);
  const [wallet, setWallet] = useState<Wallet | HDNodeWallet>();

  return (
    <BrowserRouter>
      <MantineProvider>
        <walletContext.Provider value={[wallet, setWallet]}>
          <rpcUrlIndexContext.Provider value={useState(0)}>
            <AppShell
              navbar={{
                width: 200,
                breakpoint: 'sm',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
              }}
              padding="md"
            >
              <AppShell.Header>
                <Header mobileOpened={mobileOpened} desktopOpened={desktopOpened} toggleMobile={toggleMobile} toggleDesktop={toggleDesktop} />
              </AppShell.Header>
              <AppShell.Navbar className='mt-8'>
                <Navbar toggleMobile={toggleMobile} toggleDesktop={toggleDesktop} />
              </AppShell.Navbar>
              <AppShell.Main>
                <Routes>
                  <Route index path="/" element={<Home />} />
                  <Route path="/present" element={<Present />} />
                  <Route path="/score" element={<Score />} />
                  <Route path="/user" element={<User />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell.Main>
            </AppShell>
          </rpcUrlIndexContext.Provider>
        </walletContext.Provider>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App;
