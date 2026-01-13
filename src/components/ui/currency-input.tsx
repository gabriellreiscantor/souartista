import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const formatCurrency = (cents: number): string => {
      return (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Converte o valor para centavos inteiros
    const getCentsFromValue = (val: string | number): number => {
      if (typeof val === 'number') {
        return Math.round(val * 100);
      }
      const parsed = parseFloat(val.replace(',', '.')) || 0;
      return Math.round(parsed * 100);
    };

    const cents = getCentsFromValue(value);
    const displayValue = formatCurrency(cents);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Remove tudo exceto dígitos
      const digitsOnly = input.replace(/\D/g, '');
      
      // Converte para centavos
      const newCents = parseInt(digitsOnly) || 0;
      
      // Retorna o valor numérico como string (em reais)
      onChange((newCents / 100).toString());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite Backspace para apagar
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newCents = Math.floor(cents / 10);
        onChange((newCents / 100).toString());
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn("pl-10 text-right !bg-white !text-gray-900", className)}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
