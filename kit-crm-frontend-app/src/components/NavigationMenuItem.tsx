import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { NavigationMenuItem as NavigationMenuItemType } from "../types/NavigationMenu";

interface NavigationMenuItemProps {
    item: NavigationMenuItemType;
}

const NavigationMenuItem = ({ item }: NavigationMenuItemProps) => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    const hasChildren = item.children && item.children.length > 0;

    // Generate URL based on item type
    const getUrl = (): string => {
        if (item.type === 'category' && item.categoryId) {
            return `/category/${item.categoryId}`;
        }
        return item.url || '#';
    };

    // Check if the current menu item is active
    const isActive = (): boolean => {
        const url = getUrl();
        if (url === '#') return false;
        return location.pathname === url;
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    // Check if any child is active
    const isChildActive = (): boolean => {
        if (!hasChildren) return false;
        
        const checkChildren = (children: NavigationMenuItemType[]): boolean => {
            return children.some(child => {
                const childUrl = child.type === 'category' 
                    ? `/category/${child.categoryId}` 
                    : child.url || '#';
                
                if (location.pathname === childUrl) return true;
                
                // Recursively check nested children
                if (child.children && child.children.length > 0) {
                    return checkChildren(child.children);
                }
                
                return false;
            });
        };
        
        return checkChildren(item.children!);
    };

    // If it has children, render as dropdown
    if (hasChildren) {
        const parentActive = isChildActive();
        
        return (
            <li className="nav-item dropdown">
                <a
                    className={`nav-link dropdown-toggle${isDropdownOpen ? " show" : ""}${parentActive ? " active" : ""}`}
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded={isDropdownOpen}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleDropdown();
                    }}
                >
                    {item.label}
                </a>
                <ul className={`dropdown-menu${isDropdownOpen ? " show" : ""}`}>
                    {item.children!.map((child) => (
                        <li key={child.id}>
                            {child.type === 'category' ? (
                                <Link
                                    className={`dropdown-item${location.pathname === `/category/${child.categoryId}` ? " active" : ""}`}
                                    to={`/category/${child.categoryId}`}
                                    target={child.openInNewTab ? '_blank' : undefined}
                                    rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    {child.label}
                                </Link>
                            ) : (
                                // Custom link - detect internal vs external
                                (() => {
                                    const childUrl = child.url || '#';
                                    const isInternal = childUrl.startsWith('/') && !childUrl.startsWith('//');
                                    
                                    if (isInternal && !child.openInNewTab) {
                                        return (
                                            <Link
                                                className={`dropdown-item${location.pathname === childUrl ? " active" : ""}`}
                                                to={childUrl}
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                {child.label}
                                            </Link>
                                        );
                                    }
                                    
                                    return (
                                        <a
                                            className="dropdown-item"
                                            href={childUrl}
                                            target={child.openInNewTab ? '_blank' : undefined}
                                            rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            {child.label}
                                        </a>
                                    );
                                })()
                            )}
                        </li>
                    ))}
                </ul>
            </li>
        );
    }

    // Single item without children
    if (item.type === 'category') {
        return (
            <li className="nav-item">
                <Link
                    className={`nav-link${isActive() ? " active" : ""}`}
                    to={getUrl()}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                >
                    {item.label}
                </Link>
            </li>
        );
    }

    // Custom link
    const url = getUrl();
    const isInternalLink = url.startsWith('/') && !url.startsWith('//');
    // const isExternalLink = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
    
    // Use Link for internal URLs, anchor for external
    if (isInternalLink && !item.openInNewTab) {
        return (
            <li className="nav-item">
                <Link
                    className={`nav-link${isActive() ? " active" : ""}`}
                    to={url}
                >
                    {item.label}
                </Link>
            </li>
        );
    }
    
    return (
        <li className="nav-item">
            <a
                className="nav-link"
                href={url}
                target={item.openInNewTab ? '_blank' : undefined}
                rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
            >
                {item.label}
            </a>
        </li>
    );
};

export default NavigationMenuItem;
