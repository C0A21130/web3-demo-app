import { Container, Text } from '@mantine/core';
import { Burger } from '@mantine/core';

interface HeaderProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile: () => void;
  toggleDesktop: () => void;
}

const Header = (props: HeaderProps) => {
  const { mobileOpened, desktopOpened, toggleMobile, toggleDesktop } = props;

  return (
    <header>
      <Container className="flex items-center">
        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
        <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
        <Text className="text-blue-500 font-bold text-xl">SSDLAB DAPPS</Text>
      </Container>
    </header>
  );
}

export default Header;