import type { FormHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type FiltersFormProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
};

type FilterFieldProps = {
  htmlFor: string;
  label: string;
  children: ReactNode;
  className?: string;
};

type FilterOption = {
  value: string;
  label: string;
};

type FilterSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: FilterOption[];
};

export function FiltersForm({ children, className = "", ...props }: FiltersFormProps) {
  return (
    <form className={`grid gap-3 ${className}`} {...props}>
      {children}
    </form>
  );
}

export function FilterField({ htmlFor, label, children, className = "" }: FilterFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterSelect({ options, className = "", ...props }: FilterSelectProps) {
  return (
    <select
      className={`w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={`${props.id || props.name || "filter"}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
