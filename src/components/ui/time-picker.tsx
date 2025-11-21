import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hour, setHour] = React.useState(value?.split(":")[0] || "20");
  const [minute, setMinute] = React.useState(value?.split(":")[1] || "00");

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(h);
      setMinute(m);
    }
  }, [value]);

  const handleTimeChange = (newHour: string, newMinute: string) => {
    const time = `${newHour}:${newMinute}`;
    onChange?.(time);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 brightness-0" />
          {hour && minute ? `${hour}:${minute}` : <span>Selecionar horário</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-primary" align="start">
        <div className="p-4 space-y-3">
          <div className="text-sm font-medium text-white mb-3">Selecionar Horário</div>
          <div className="flex gap-2 items-center">
            <Select
              value={hour}
              onValueChange={(h) => {
                setHour(h);
                handleTimeChange(h, minute);
              }}
            >
              <SelectTrigger className="w-20 bg-white/10 text-white border-white/20">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {hours.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-white font-bold">:</span>
            <Select
              value={minute}
              onValueChange={(m) => {
                setMinute(m);
                handleTimeChange(hour, m);
              }}
            >
              <SelectTrigger className="w-20 bg-white/10 text-white border-white/20">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
