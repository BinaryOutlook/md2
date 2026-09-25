import {
    Box,
    FormControlLabel,
    MenuItem,
    Popover,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material'
import type { ChangeEvent } from 'react'
import {
    MARKDOWN_FONT_FAMILIES,
    MARKDOWN_INHERIT_COLOR,
    type MarkdownSection,
    type MarkdownSectionStyle,
} from '../../theme/theme_config'
import { OptionalColorPickerField } from '../optional_color_picker_field'
import { ConfigSubsection } from './config_subsection'

type MarkdownStyleTextField = 'fontFamily' | 'fontSize' | 'lineHeight' | 'marginBottom' | 'marginTop'
type MarkdownStyleFormattingField = keyof MarkdownSectionStyle['formatting']

const POPOVER_WIDTH = 520

interface MarkdownSectionEditorProps {
    anchorElement: HTMLElement
    label: string
    onChange: (section: MarkdownSection, style: MarkdownSectionStyle) => void
    onClose: () => void
    section: MarkdownSection
    style: MarkdownSectionStyle
}

/** Returns the predefined font families, plus the current one when it is not predefined so the select can show it. */
function fontFamilyOptions(fontFamily: string) {
    const isPredefined = MARKDOWN_FONT_FAMILIES.some((option) => option.value === fontFamily)
    if (isPredefined) return MARKDOWN_FONT_FAMILIES

    return [...MARKDOWN_FONT_FAMILIES, { label: fontFamily, value: fontFamily }]
}

/** Live style editor for one markdown section, shown as a popover anchored to its preview element. */
export function MarkdownSectionEditor(props: MarkdownSectionEditorProps) {
    const { anchorElement, label, onChange, onClose, section, style } = props
    const colorValue = style.color === MARKDOWN_INHERIT_COLOR ? undefined : style.color

    const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
        const field = event.target.name as MarkdownStyleTextField
        onChange(section, { ...style, [field]: event.target.value })
    }

    const handleColorChange = (color: string | undefined) => {
        onChange(section, { ...style, color: color ?? MARKDOWN_INHERIT_COLOR })
    }

    const handleFormattingChange = (event: ChangeEvent<HTMLInputElement>) => {
        const field = event.target.name as MarkdownStyleFormattingField
        onChange(section, { ...style, formatting: { ...style.formatting, [field]: event.target.checked } })
    }

    return (
        <Popover anchorEl={anchorElement} onClose={onClose} open>
            <Box sx={{ maxHeight: '70vh', overflowY: 'auto', p: 2, width: POPOVER_WIDTH }}>
                <Stack spacing={2}>
                    <Typography component="h4" variant="subtitle2">{`${label} style`}</Typography>
                    <ConfigSubsection description="Typeface and emphasis." id={`markdown-${section}-font`} label="Font">
                        <TextField
                            fullWidth
                            label={`Font family for ${label}`}
                            name="fontFamily"
                            onChange={handleTextChange}
                            required
                            select
                            size="small"
                            value={style.fontFamily}
                        >
                            {fontFamilyOptions(style.fontFamily).map((option) => (
                                <MenuItem key={option.value} sx={{ fontFamily: option.value }} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
                            <FormControlLabel
                                control={<Switch checked={style.formatting.bold} name="bold" onChange={handleFormattingChange} />}
                                label="Bold"
                            />
                            <FormControlLabel
                                control={<Switch checked={style.formatting.italic} name="italic" onChange={handleFormattingChange} />}
                                label="Italic"
                            />
                            <FormControlLabel
                                control={<Switch checked={style.formatting.underline} name="underline" onChange={handleFormattingChange} />}
                                label="Underline"
                            />
                        </Stack>
                    </ConfigSubsection>
                    <ConfigSubsection description="Text size and color." id={`markdown-${section}-size-color`} label="Size & color">
                        <TextField
                            fullWidth
                            label={`Font size for ${label}`}
                            name="fontSize"
                            onChange={handleTextChange}
                            required
                            size="small"
                            value={style.fontSize}
                        />
                        <OptionalColorPickerField
                            helperText="Uses the surrounding text color by default."
                            label={`Color for ${label}`}
                            onChange={handleColorChange}
                            value={colorValue}
                        />
                    </ConfigSubsection>
                    <ConfigSubsection description="Line height and space around the element." id={`markdown-${section}-spacing`} label="Spacing">
                        <TextField
                            fullWidth
                            label={`Line height for ${label}`}
                            name="lineHeight"
                            onChange={handleTextChange}
                            required
                            size="small"
                            value={style.lineHeight}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth
                                label={`Space before ${label}`}
                                name="marginTop"
                                onChange={handleTextChange}
                                required
                                size="small"
                                value={style.marginTop}
                            />
                            <TextField
                                fullWidth
                                label={`Space after ${label}`}
                                name="marginBottom"
                                onChange={handleTextChange}
                                required
                                size="small"
                                value={style.marginBottom}
                            />
                        </Stack>
                    </ConfigSubsection>
                </Stack>
            </Box>
        </Popover>
    )
}
