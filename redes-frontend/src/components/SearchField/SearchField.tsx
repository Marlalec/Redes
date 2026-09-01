interface SearchFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: SearchFieldProps) {
  return (
    <label className="search-field" htmlFor={id}>
      <span className="search-field__label">{label}</span>
      <span className="search-field__control">
        <span className="search-field__icon" aria-hidden="true" />
        <input
          id={id}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button type="button" onClick={() => onChange("")} aria-label="Limpiar búsqueda">
            ×
          </button>
        ) : null}
      </span>
    </label>
  );
}

