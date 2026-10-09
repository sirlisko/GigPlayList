import classNames from "classnames";
import React from "react";

interface FooterProps {
  className?: string;
}

const ExternalLink = ({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) => (
  <a
    className="underline"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </a>
);

const Footer = ({ className }: FooterProps) => (
  <footer
    className={classNames(
      "pb-4 pt-10 text-center text-sm text-white/60",
      className,
    )}
  >
    <p>
      Made by <ExternalLink href="https://sirlisko.com">sirlisko</ExternalLink>.
      Setlists from{" "}
      <ExternalLink href="https://setlist.fm">setlist.fm</ExternalLink>.
    </p>
  </footer>
);

export default Footer;
