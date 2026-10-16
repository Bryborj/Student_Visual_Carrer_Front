import React, { useState, useEffect } from 'react';

export function navigate(to: string) {
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (current !== to) {
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.scrollTo(0, 0);
    }
}

export function useRouter() {
    const [pathname, setPathname] = useState<string>(() => window.location.pathname);
    const [search, setSearch] = useState<string>(() => window.location.search);
    const [hash, setHash] = useState<string>(() => window.location.hash);

    useEffect(() => {
        const handleLocationChange = () => {
            setPathname(window.location.pathname);
            setSearch(window.location.search);
            setHash(window.location.hash);
        };

        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('hashchange', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('hashchange', handleLocationChange);
        };
    }, []);

    return { pathname, search, hash, navigate };
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ to, children, className, onClick, ...props }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (onClick) onClick(e);
        if (!e.defaultPrevented && !e.button && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            navigate(to);
        }
    };

    return (
        <a href={to} onClick={handleClick} className={className} {...props}>
            {children}
        </a>
    );
};
