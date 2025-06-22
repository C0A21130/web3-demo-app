import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Text, UnstyledButton, ThemeIcon } from '@mantine/core';
import { IconHome, IconGift, IconUser } from '@tabler/icons-react';

interface HeaderProps {
  toggleMobile: () => void;
  toggleDesktop: () => void;
}

const Navbar = (props: HeaderProps) => {
  const { toggleMobile, toggleDesktop } = props;
  const [active, setActive] = useState('ホーム');
  const menuItems = [
    { icon: <IconHome size={16} />, label: 'ホーム', url: "/" },
    { icon: <IconGift size={16} />, label: 'プレゼント', url: "/present" },
    { icon: <IconUser size={16} />, label: 'ユーザー', url: "/user" },
  ];

  return (
    <div className='w-64 h-full p-1 bg-white flex flex-col'>
      {menuItems.map((item) => (
        <UnstyledButton
          key={item.label}
          onClick={() => {setActive(item.label); toggleMobile(); toggleDesktop();}}
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
