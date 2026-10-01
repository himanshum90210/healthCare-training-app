type Option = string | { value: string; label: string };

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string; // renders an empty "all" option when given
}

export function Select({ label, value, onChange, options, placeholder }: Props) {
  return (
    <select className="select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const { value: v, label: l } = typeof option === "string" ? { value: option, label: option } : option;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}