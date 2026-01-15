import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PeriodFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempYear, setTempYear] = useState<string>("");
  const [tempMonth, setTempMonth] = useState<string>("");

  // Gera anos disponíveis
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const yearList = [];
    for (let year = currentYear; year >= startYear; year--) {
      yearList.push(year.toString());
    }
    return yearList;
  }, []);

  // Gera meses disponíveis baseado no ano selecionado
  const months = useMemo(() => {
    if (!tempYear) return [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const selectedYear = parseInt(tempYear);
    
    const monthList = [];
    const endMonth = selectedYear === currentYear ? currentMonth : 11;
    
    for (let month = 0; month <= endMonth; month++) {
      const date = new Date(selectedYear, month, 1);
      monthList.push({
        value: String(month + 1).padStart(2, '0'),
        label: format(date, "MMMM", { locale: ptBR })
      });
    }
    
    return monthList.reverse();
  }, [tempYear]);

  const getDisplayLabel = () => {
    if (value === "all") return "Todo o Período";
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleAllPeriod = () => {
    onChange("all");
    setTempYear("");
    setTempMonth("");
    setOpen(false);
  };

  const handleApply = () => {
    if (tempYear && tempMonth) {
      onChange(`${tempYear}-${tempMonth}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal border-gray-300",
            open 
              ? "bg-primary text-white border-primary" 
              : "bg-white text-gray-900",
            className
          )}
        >
          <CalendarIcon className={cn(
            "mr-2 h-4 w-4",
            open ? "text-white" : "text-gray-900"
          )} />
          {getDisplayLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4 bg-white border-gray-300 z-50" align="center">
        <div className="space-y-4">
          <div>
            <button
              onClick={handleAllPeriod}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                value === "all" 
                  ? "bg-purple-100 text-purple-900 font-medium" 
                  : "hover:bg-gray-100 text-gray-900"
              )}
            >
              <span>Todo o Período</span>
              {value === "all" && <Check className="w-4 h-4" />}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Selecionar período específico
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">Ano</label>
                <Select value={tempYear} onValueChange={setTempYear}>
                  <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-gray-900 z-50">
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">Mês</label>
                <Select 
                  value={tempMonth} 
                  onValueChange={setTempMonth}
                  disabled={!tempYear}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-gray-900 z-50">
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleApply}
                disabled={!tempYear || !tempMonth}
                className="w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
