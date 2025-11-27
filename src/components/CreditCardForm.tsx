import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";

interface CreditCardFormProps {
  onSubmit: (data: CreditCardData) => void;
  isLoading?: boolean;
}

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holderCpf: string;
  postalCode: string;
}

export function CreditCardForm({ onSubmit, isLoading }: CreditCardFormProps) {
  const [formData, setFormData] = useState<CreditCardData>({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    holderCpf: "",
    postalCode: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreditCardData, string>>>({});

  // Validação de Luhn para número do cartão
  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, "");
    if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Validação de CPF
  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned[10])) return false;

    return true;
  };

  // Máscaras
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleChange = (field: keyof CreditCardData, value: string) => {
    let formattedValue = value;

    if (field === "holderName") {
      formattedValue = value.toUpperCase();
    } else if (field === "number") {
      formattedValue = formatCardNumber(value.replace(/\D/g, "").slice(0, 19));
    } else if (field === "holderCpf") {
      formattedValue = formatCPF(value.slice(0, 14));
    } else if (field === "postalCode") {
      formattedValue = formatCEP(value.slice(0, 9));
    } else if (field === "expiryMonth") {
      formattedValue = value.replace(/\D/g, "").slice(0, 2);
    } else if (field === "expiryYear") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    } else if (field === "ccv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData({ ...formData, [field]: formattedValue });
    setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<Record<keyof CreditCardData, string>> = {};

    if (!formData.holderName.trim()) {
      newErrors.holderName = "Nome é obrigatório";
    }

    if (!validateCardNumber(formData.number)) {
      newErrors.number = "Número do cartão inválido";
    }

    const month = parseInt(formData.expiryMonth);
    if (!month || month < 1 || month > 12) {
      newErrors.expiryMonth = "Mês inválido (01-12)";
    }

    const year = parseInt(formData.expiryYear);
    const currentYear = new Date().getFullYear();
    if (!year || year < currentYear || year > currentYear + 20) {
      newErrors.expiryYear = "Ano inválido";
    }

    if (!formData.ccv || formData.ccv.length < 3) {
      newErrors.ccv = "CVV inválido";
    }

    if (!validateCPF(formData.holderCpf)) {
      newErrors.holderCpf = "CPF inválido";
    }

    const cleanedCEP = formData.postalCode.replace(/\D/g, "");
    if (!cleanedCEP || cleanedCEP.length !== 8) {
      newErrors.postalCode = "CEP inválido (8 dígitos)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Lock className="h-4 w-4" />
        <span className="text-sm">Pagamento seguro e criptografado</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holderName">Nome no Cartão</Label>
        <Input
          id="holderName"
          placeholder="Como está no cartão"
          value={formData.holderName}
          onChange={(e) => handleChange("holderName", e.target.value)}
          disabled={isLoading}
        />
        {errors.holderName && (
          <p className="text-sm text-destructive">{errors.holderName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">Número do Cartão</Label>
        <div className="relative">
          <Input
            id="number"
            placeholder="1234 5678 9012 3456"
            value={formData.number}
            onChange={(e) => handleChange("number", e.target.value)}
            disabled={isLoading}
            className="pr-10"
          />
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {errors.number && (
          <p className="text-sm text-destructive">{errors.number}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryMonth">Mês</Label>
          <Input
            id="expiryMonth"
            placeholder="MM"
            value={formData.expiryMonth}
            onChange={(e) => handleChange("expiryMonth", e.target.value)}
            disabled={isLoading}
          />
          {errors.expiryMonth && (
            <p className="text-sm text-destructive">{errors.expiryMonth}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryYear">Ano</Label>
          <Input
            id="expiryYear"
            placeholder="AAAA"
            value={formData.expiryYear}
            onChange={(e) => handleChange("expiryYear", e.target.value)}
            disabled={isLoading}
          />
          {errors.expiryYear && (
            <p className="text-sm text-destructive">{errors.expiryYear}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ccv">CVV</Label>
          <Input
            id="ccv"
            placeholder="123"
            value={formData.ccv}
            onChange={(e) => handleChange("ccv", e.target.value)}
            disabled={isLoading}
            type="password"
          />
          {errors.ccv && (
            <p className="text-sm text-destructive">{errors.ccv}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holderCpf">CPF do Titular</Label>
        <Input
          id="holderCpf"
          placeholder="000.000.000-00"
          value={formData.holderCpf}
          onChange={(e) => handleChange("holderCpf", e.target.value)}
          disabled={isLoading}
        />
        {errors.holderCpf && (
          <p className="text-sm text-destructive">{errors.holderCpf}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode">CEP</Label>
        <Input
          id="postalCode"
          placeholder="00000-000"
          value={formData.postalCode}
          onChange={(e) => handleChange("postalCode", e.target.value)}
          disabled={isLoading}
        />
        {errors.postalCode && (
          <p className="text-sm text-destructive">{errors.postalCode}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Processando..." : "Confirmar Pagamento"}
      </Button>
    </form>
  );
}
