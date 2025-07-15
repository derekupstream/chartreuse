// for links that should not be clickable, but still have the same styling as a link
export function DisabledLink({ children, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href='#'
      onClick={e => {
        e.preventDefault();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
