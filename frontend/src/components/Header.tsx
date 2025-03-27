import { Container, Text } from '@mantine/core';
import { Burger } from '@mantine/core';

interface HeaderProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}

const Header = (props: HeaderProps) => {
  const { opened, setOpened } = props;

  return (
    <header>
      <Container className="flex justify-between items-center">
        <Text className="w-1/6 text-blue-500 font-bold text-xl">Mantine</Text>
        <Burger opened={opened} onClick={() => setOpened(opened ? false : true )} />
      </Container>
    </header>
  );
}

export default Header;