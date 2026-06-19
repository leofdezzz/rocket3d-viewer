interface TelemetrySliderProps {
  label: string
  value: number
  min?: number
  max: number
  step: number
  onChange: (value: number) => void
}

export function TelemetrySlider({
  label,
  value,
  min = 0,
  max,
  step,
  onChange,
}: TelemetrySliderProps) {
  return (
    <label className="telemetry-slider">
      <span className="telemetry-slider__header">
        <span className="telemetry-slider__label">{label}</span>
        <span className="telemetry-slider__value">{value.toFixed(3)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="telemetry-slider__input"
      />
    </label>
  )
}
