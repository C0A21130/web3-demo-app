import { useState, createContext, Dispatch, SetStateAction } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Wallet, HDNodeWallet } from 'ethers';
import { AppShell, MantineProvider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Gift from './pages/Gift';
import NotFound from './pages/NotFound';
import Score from './pages/Score';
import User from './pages/User';
import Governor from './pages/Governor';
import './index.css';
import '@mantine/core/styles.css';

export const rpcUrlIndexContext = createContext<[number, Dispatch<SetStateAction<number>>]>([0, () => { }]);
export const walletContext = createContext<[Wallet | HDNodeWallet | undefined, Dispatch<SetStateAction<Wallet | HDNodeWallet | undefined>>]>([undefined, () => { }]);
export const rpcUrls = ["http://localhost:8545"];
export const scoringEndpointUrl: string = "";
export const ipfsApiUrl = "http://localhost";
export const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const credentialContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const governanceTokenContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const governanceContractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
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
                  <Route path="/gift" element={<Gift />} />
                  <Route path="/score" element={<Score />} />
                  <Route path="/user" element={<User />} />
                  <Route path="/governor" element={<Governor />} />
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
