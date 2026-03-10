interface HeaderProps {
    mobileOpened: boolean;
    desktopOpened: boolean;
    toggleMobile: () => void;
    toggleDesktop: () => void;
}
declare const Header: (props: HeaderProps) => import("react/jsx-runtime").JSX.Element;
export default Header;
