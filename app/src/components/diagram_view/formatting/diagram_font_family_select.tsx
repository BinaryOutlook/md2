import { MenuItem, TextField } from '@mui/material';
import type { ChangeEvent } from 'react';
import { fontFamilyOptions } from '../../../theme/theme_config';

interface DiagramFontFamilySelectProps {
    onChange(value: string): void;
    value: string;
}

/** Font select with theme default and any saved custom family. */
export function DiagramFontFamilySelect({ onChange, value }: DiagramFontFamilySelectProps) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value);

    return (
        <TextField autoFocus fullWidth label="Font family" onChange={handleChange} select size="small" value={value}>
            <MenuItem value="">Theme default</MenuItem>
            {fontFamilyOptions(value).map((option) => (
                <MenuItem key={option.value} sx={{ fontFamily: option.value }} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    );
}
