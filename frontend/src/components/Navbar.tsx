import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Text, UnstyledButton, ThemeIcon } from '@mantine/core';
import { IconHome, IconGift, IconUser } from '@tabler/icons-react';

interface NavbarProps {
  opened: boolean;
}

const Navbar = (props: NavbarProps) => {
  const { opened } = props;
  const [active, setActive] = useState('Home');
  const menuItems = [
    { icon: <IconHome size={16} />, label: 'Home', url: "/" },
    { icon: <IconGift size={16} />, label: 'Present', url: "/present" },
    { icon: <IconUser size={16} />, label: 'User', url: "/user" },
  ];

  return (
    <div hidden={!opened} className='w-64 h-full bg-white flex flex-col'>
      {menuItems.map((item) => (
        <UnstyledButton
          key={item.label}
          onClick={() => setActive(item.label)}
          className={`flex items-center p-2 rounded-md mt-4 ${active === item.label ? 'bg-blue-50' : ''}`}
        >
          <NavLink to={item.url} className="flex items-center w-full">
            <ThemeIcon size="lg" color={active === item.label ? 'blue' : 'gray'}>
              {item.icon}
            </ThemeIcon>
            <Text size="sm" className="ml-2">
              {item.label}
            </Text>
          </NavLink>
        </UnstyledButton>
      ))}
    </div>
  );
}

export default Navbar;
