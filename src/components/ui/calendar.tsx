import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: "light" | "primary";
};

function Calendar({ className, classNames, showOutsideDays = true, variant = "primary", ...props }: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.month || new Date());

  const CustomCaption = (captionProps: CaptionProps) => {
    const { displayMonth } = captionProps;
    const currentYear = displayMonth.getFullYear();
    const currentMonth = displayMonth.getMonth();

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const weekdaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const handleYearChange = (year: string) => {
      const newDate = new Date(parseInt(year), currentMonth, 1);
      setMonth(newDate);
    };

    const handleMonthChange = (monthValue: string) => {
      const newDate = new Date(currentYear, parseInt(monthValue), 1);
      setMonth(newDate);
    };

    const selectClassName = variant === "light" 
      ? "h-8 bg-white border-gray-300 text-gray-900"
      : "h-8 bg-secondary/50 border-primary/20";

    const contentClassName = variant === "light"
      ? "bg-white border-gray-300 text-gray-900 z-50"
      : "bg-popover border-primary/20 z-50";

    return (
      <div className="flex justify-center gap-2 mb-2">
        <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className={cn(selectClassName, "w-[110px]")}>
            <SelectValue>
              {months[currentMonth]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={contentClassName}>
            {months.map((monthName, index) => (
              <SelectItem key={index} value={index.toString()}>
                {monthName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className={cn(selectClassName, "w-[90px]")}>
            <SelectValue>
              {currentYear}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={cn(contentClassName, "max-h-[200px]")}>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const daySelectedClass = variant === "light"
    ? "bg-purple-500 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white"
    : "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground";

  const dayTodayClass = variant === "light"
    ? "bg-gray-100 text-gray-900"
    : "bg-accent text-accent-foreground";

  const textClass = variant === "light" ? "text-gray-900" : "text-white";
  const mutedClass = variant === "light" ? "text-gray-500" : "text-white/60";
  const bgClass = variant === "light" ? "bg-white" : "bg-background";
  const outsideClass = variant === "light" ? "text-gray-400" : "text-white/40";

  const weekdays = variant === "light" 
    ? undefined 
    : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", bgClass, textClass, className)}
      weekStartsOn={0}
      labels={{
        labelWeekday: (date) => weekdays ? weekdays[date.getDay()] : date.toLocaleDateString('pt-BR', { weekday: 'short' })
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn("text-sm font-medium", textClass),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          variant === "light" && "text-gray-900 border-gray-300"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn("rounded-md w-9 font-normal text-[0.8rem]", mutedClass),
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100", textClass),
        day_range_end: "day-range-end",
        day_selected: daySelectedClass,
        day_today: dayTodayClass,
        day_outside: cn(
          "day-outside aria-selected:bg-accent/50",
          variant === "light" ? "text-gray-400 opacity-50" : "text-white/40"
        ),
        day_disabled: "opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
