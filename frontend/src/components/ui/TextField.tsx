import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, trailing, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="field">
      <label htmlFor={inputId} className="field__label">
        {label}
      </label>
      <div className={`field__control${error ? " is-invalid" : ""}`}>
        <input
          ref={ref}
          id={inputId}
          className="field__input"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});