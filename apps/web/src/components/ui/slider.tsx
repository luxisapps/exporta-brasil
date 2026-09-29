import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export const Slider = forwardRef<ElementRef<typeof SliderPrimitive.Root>, ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className = "", ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={`shadcn-slider ${className}`} {...props}>
      <SliderPrimitive.Track className="shadcn-slider__track">
        <SliderPrimitive.Range className="shadcn-slider__range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="shadcn-slider__thumb" />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = "Slider";
