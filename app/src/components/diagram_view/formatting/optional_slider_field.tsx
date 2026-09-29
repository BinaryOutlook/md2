import { Slider, Stack, Switch, Typography } from '@mui/material';
import { useId, useState, type ChangeEvent } from 'react';

interface OptionalSliderFieldProps {
    initialCustomValue: number;
    label: string;
    maximum: number;
    minimum: number;
    onChange(value: number | undefined): void;
    unit: string;
    value?: number;
}

/** Bounded slider with explicit default/custom state for optional diagram formatting. */
export function OptionalSliderField(props: OptionalSliderFieldProps) {
    const { initialCustomValue, label, maximum, minimum, onChange, unit, value } = props;
    const labelId = useId();
    const [customValue, setCustomValue] = useState(value ?? initialCustomValue);
    const displayedValue = value ?? customValue;
    const handleChange = (_event: Event, nextValue: number | number[]) => {
        if (Array.isArray(nextValue)) throw new Error(`${label} requires one slider value`);
        setCustomValue(nextValue);
        onChange(nextValue);
    };
    const handleCustomChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
        onChange(checked ? customValue : undefined);
    };

    return (
        <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography color="text.secondary" id={labelId} variant="caption">{label}</Typography>
                <Typography aria-label={`${label} value`} variant="body2">
                    {value === undefined ? 'Default' : `${value} ${unit}`}
                </Typography>
                <Switch checked={value !== undefined} onChange={handleCustomChange} slotProps={{ input: { 'aria-label': `Custom ${label}` } }} />
            </Stack>
            <Slider
                aria-labelledby={labelId}
                disabled={value === undefined}
                max={maximum}
                min={minimum}
                onChange={handleChange}
                value={displayedValue}
                valueLabelDisplay="auto"
            />
        </Stack>
    );
}
