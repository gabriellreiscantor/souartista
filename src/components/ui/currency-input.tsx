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
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      // Convert initial value to formatted display
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      setDisplayValue(formatCurrency(numValue));
    }, []);

    const formatCurrency = (num: number): string => {
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Remove tudo exceto dígitos
      const digitsOnly = input.replace(/\D/g, '');
      
      if (digitsOnly === '') {
        setDisplayValue('');
        onChange('0');
        return;
      }

      // Converte para número (centavos)
      const numValue = parseInt(digitsOnly) / 100;
      
      // Formata para exibição
      const formatted = formatCurrency(numValue);
      setDisplayValue(formatted);
      
      // Retorna o valor numérico como string
      onChange(numValue.toString());
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn("pl-10", className)}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
