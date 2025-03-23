import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import Header from './components/Header';
import Home from './pages/Home';
import './index.css';
import '@mantine/core/styles.css';

function App() {

  return (
    <BrowserRouter w-full>
      <MantineProvider w-full>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App;
