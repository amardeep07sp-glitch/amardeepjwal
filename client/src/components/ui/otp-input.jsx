import { useRef } from "react"

import { cn } from "@/lib/utils"

// A controlled row of single-digit boxes (value/onChange, like any other
// form field) - not N independent inputs. Typing advances focus,
// backspace on an empty box retreats, and pasting a full code fills every
// box at once, the three things that make this feel like a real OTP field
// instead of a row of plain Inputs.
function OTPInput({ length = 6, value = "", onChange, className, ...props }) {
  const inputRefs = useRef([])

  const setDigitAt = (index, digit) => {
    const next = value.padEnd(length, " ").split("")
    next[index] = digit
    onChange?.(next.join("").trimEnd())
  }

  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1)
    if (!digit) return
    setDigitAt(index, digit)
    if (index < length - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        setDigitAt(index, "")
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        setDigitAt(index - 1, "")
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    if (!pasted) return
    onChange?.(pasted)
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className={cn("flex items-center gap-2", className)} onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1} of ${length}`}
          className="h-12 w-11 rounded-input border border-input bg-transparent text-center text-lg font-semibold text-heading outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...props}
        />
      ))}
    </div>
  )
}

export { OTPInput }
