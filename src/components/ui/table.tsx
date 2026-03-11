import type { ReactNode } from "react";

type TableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
};

export default function Table({
  children,
  className = "",
  tableClassName = "min-w-full text-sm",
}: TableProps) {
  return (
    <div className={`surface-subcard overflow-x-auto rounded-2xl ${className}`}>
      <table className={tableClassName}>{children}</table>
    </div>
  );
}
