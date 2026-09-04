import * as React from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
}

export function TimePicker({ value, onChange, id }: TimePickerProps) {
  let selectedHour = "";
  let selectedMinute = "";
  let selectedAmPm = "";

  if (value) {
    const [h, m] = value.split(":");
    const hr = parseInt(h, 10);
    selectedAmPm = hr >= 12 ? "PM" : "AM";
    const displayHr = hr % 12 || 12;
    selectedHour = displayHr.toString().padStart(2, "0");
    selectedMinute = m;
  }

  const handleSelect = (type: "hour" | "minute" | "ampm", val: string) => {
    let newHour = selectedHour || "12";
    let newMinute = selectedMinute || "00";
    let newAmPm = selectedAmPm || "AM";

    if (type === "hour") newHour = val;
    if (type === "minute") newMinute = val;
    if (type === "ampm") newAmPm = val;

    let hr24 = parseInt(newHour, 10);
    if (newAmPm === "PM" && hr24 < 12) hr24 += 12;
    if (newAmPm === "AM" && hr24 === 12) hr24 = 0;

    const formattedHr = hr24.toString().padStart(2, "0");
    onChange(`${formattedHr}:${newMinute}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));
  const ampm = ["AM", "PM"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal pl-3",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? `${selectedHour}:${selectedMinute} ${selectedAmPm}` : <span>--:--</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-2">
          {/* Hours */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase text-muted-foreground text-center">Hours</span>
            <div className="h-[200px] w-14 overflow-y-auto scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1 flex flex-col gap-1 pr-1">
              {hours.map((hour) => (
                <Button
                  key={hour}
                  variant={selectedHour === hour ? "default" : "ghost"}
                  size="sm"
                  className={cn("w-full shrink-0", selectedHour === hour && "bg-primary text-primary-foreground")}
                  onClick={() => handleSelect("hour", hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Minutes */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase text-muted-foreground text-center">Minutes</span>
            <div className="h-[200px] w-14 overflow-y-auto scrollbar-thin [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1 flex flex-col gap-1 pr-1">
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  variant={selectedMinute === minute ? "default" : "ghost"}
                  size="sm"
                  className={cn("w-full shrink-0", selectedMinute === minute && "bg-primary text-primary-foreground")}
                  onClick={() => handleSelect("minute", minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase text-muted-foreground text-center">AM/PM</span>
            <div className="flex flex-col gap-1">
              {ampm.map((ap) => (
                <Button
                  key={ap}
                  variant={selectedAmPm === ap ? "default" : "ghost"}
                  size="sm"
                  className={cn("w-full", selectedAmPm === ap && "bg-primary text-primary-foreground")}
                  onClick={() => handleSelect("ampm", ap)}
                >
                  {ap}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
