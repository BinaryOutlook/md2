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
import { ColorPickerButton } from '../color_picker_button'
import { MarkdownStyleGroup } from './markdown_style_group'

type MarkdownStyleTextField = 'fontFamily' | 'fontSize' | 'lineHeight' | 'marginBottom' | 'marginTop'
type MarkdownStyleFormattingField = keyof MarkdownSectionStyle['formatting']

const POPOVER_WIDTH = 390
const HALF_WIDTH_SX = { flex: '1 1 0', minWidth: 0 }

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
                <Stack spacing={1}>
                    <Typography component="h4" variant="subtitle2">{`${label} style`}</Typography>
                    <MarkdownStyleGroup id={`markdown-${section}-font`} label="Font">
                        <TextField
                            fullWidth
                            label="Font family"
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
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
                    </MarkdownStyleGroup>
                    <MarkdownStyleGroup id={`markdown-${section}-size-color`} label="Size & color">
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                            <TextField
                                fullWidth
                                label="Font size"
                                name="fontSize"
                                onChange={handleTextChange}
                                required
                                size="small"
                                sx={HALF_WIDTH_SX}
                                value={style.fontSize}
                            />
                            <Box sx={HALF_WIDTH_SX}>
                                <ColorPickerButton label="Color" onChange={handleColorChange} value={colorValue} />
                            </Box>
                        </Stack>
                    </MarkdownStyleGroup>
                    <MarkdownStyleGroup id={`markdown-${section}-spacing`} label="Spacing">
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth
                                label="Line height"
                                name="lineHeight"
                                onChange={handleTextChange}
                                required
                                size="small"
                                value={style.lineHeight}
                            />
                            <TextField
                                fullWidth
                                label="Space before"
                                name="marginTop"
                                onChange={handleTextChange}
                                required
                                size="small"
                                value={style.marginTop}
                            />
                            <TextField
                                fullWidth
                                label="Space after"
                                name="marginBottom"
                                onChange={handleTextChange}
                                required
                                size="small"
                                value={style.marginBottom}
                            />
                        </Stack>
                    </MarkdownStyleGroup>
                </Stack>
            </Box>
        </Popover>
    )
}
