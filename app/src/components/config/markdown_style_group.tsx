import { Card, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface MarkdownStyleGroupProps {
    children: ReactNode
    id: string
    label: string
}

/** Compact headed card grouping related fields in the markdown style popover. */
export function MarkdownStyleGroup(props: MarkdownStyleGroupProps) {
    const { children, id, label } = props
    const headingId = `${id}-heading`

    return (
        <Card aria-labelledby={headingId} component="section" id={id} sx={{ p: 1.5 }} variant="outlined">
            <Stack spacing={1}>
                <Typography component="h5" id={headingId} variant="subtitle2">
                    {label}
                </Typography>
                {children}
            </Stack>
        </Card>
    )
}
