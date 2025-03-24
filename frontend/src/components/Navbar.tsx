import { useState } from 'react';
import { Text, Avatar, UnstyledButton, ThemeIcon } from '@mantine/core';
import { IconHome, IconUser } from '@tabler/icons-react';

interface NavbarProps {
  opened: boolean;
}

const Navbar = (props: NavbarProps) => {
  const { opened } = props;
  const [active, setActive] = useState('Home');
  const menuItems = [
    { icon: <IconHome size={16} />, label: 'Home' },
    { icon: <IconUser size={16} />, label: 'User' },
  ];

  return (
    <div hidden={!opened} className='w-64 h-full bg-white flex flex-col'>
      {menuItems.map((item) => (
        <UnstyledButton
          key={item.label}
          onClick={() => setActive(item.label)}
          className={`flex items-center p-2 rounded-md mt-4 ${active === item.label ? 'bg-blue-50' : ''}`}
        >
          <ThemeIcon size="lg" color={active === item.label ? 'blue' : 'gray'}>
            {item.icon}
          </ThemeIcon>
          <Text size="sm" className="ml-2">
            {item.label}
          </Text>
        </UnstyledButton>
      ))}
    </div>
  );
}

export default Navbar;
