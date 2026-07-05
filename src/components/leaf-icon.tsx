export function LeafIcon({
  size = 16,
  fill = "#95B8A3",
  className,
}: {
  size?: number;
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={fill}
      className={className}
    >
      <path d="M8 1C8 1 2.5 6 2.5 9.5C2.5 12.5 5 14.5 8 14.5C11 14.5 13.5 12.5 13.5 9.5C13.5 6 8 1 8 1Z" />
    </svg>
  );
}
