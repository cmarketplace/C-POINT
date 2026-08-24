interface DetailStatusIconProps {
  variant: "availability" | "supplier" | "delivery" | "standard";
  className?: string;
}

export default function DetailStatusIcon({
  variant,
  className = "h-5 w-5",
}: DetailStatusIconProps) {
  if (variant === "availability") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="10" className="fill-highlight-strong" />
        <path
          d="m7.6 12.2 2.8 2.8 6.2-6.4"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === "supplier") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path
          d="M12 2.5 20 5.8v5.5c0 5.1-3.4 8.6-8 10.2-4.6-1.6-8-5.1-8-10.2V5.8L12 2.5Z"
          className="fill-primary"
        />
        <path
          d="m7.8 12.1 2.7 2.7 5.8-6"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === "delivery") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="M2.5 5h11.8v10.5H2.5z" className="fill-primary" />
        <path d="M14.3 8h3.4l3.8 4v3.5h-7.2z" className="fill-primary-light" />
        <path d="M16 9.6h1.2l2 2.2H16z" fill="white" />
        <circle cx="7" cy="17.3" r="2.2" className="fill-primary" />
        <circle cx="18.2" cy="17.3" r="2.2" className="fill-primary" />
        <circle cx="7" cy="17.3" r="0.8" fill="white" />
        <circle cx="18.2" cy="17.3" r="0.8" fill="white" />
        <path d="M4.5 8h5.8M4.5 10.5h4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d="m12 2.5 9 4.7-9 4.7-9-4.7 9-4.7Z" className="fill-primary-light" />
      <path d="m3 7.2 9 4.7v9.6l-9-4.8V7.2Z" className="fill-primary" />
      <path d="m21 7.2-9 4.7v9.6l9-4.8V7.2Z" className="fill-primary-dark" />
      <path d="M12 11.9v9.6M7.3 5l9.1 4.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".85" />
      <path
        d="m14.5 15.8 1.4 1.4 2.8-3"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
