import React, { useState, useEffect } from 'react';

export function navigate(to: string) {
    const current = window.location.pathname + window.location.hash;
    if (current !== to && window.location.pathname !== to) {
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.scrollTo(0, 0);
    }
}

export function useRouter() {
    const [pathname, setPathname] = useState<string>(() => window.location.pathname);
    const [hash, setHash] = useState<string>(() => window.location.hash);

    useEffect(() => {
        const handleLocationChange = () => {
            setPathname(window.location.pathname);
            setHash(window.location.hash);
        };

        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('hashchange', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('hashchange', handleLocationChange);
        };
    }, []);

    return { pathname, hash, navigate };
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
