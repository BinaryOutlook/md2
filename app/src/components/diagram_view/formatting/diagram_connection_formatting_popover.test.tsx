import { ThemeProvider } from '@mui/material';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogService } from '../../../services/dialog_service';
import { createAppTheme } from '../../../theme/app_theme';
import { ConnectionFormattingPopover } from './diagram_connection_formatting_popover';

const theme = createAppTheme('dark');

function renderPopover(onApply = vi.fn(), onClose = vi.fn()) {
    const anchorElement = document.createElement('button');
    document.body.appendChild(anchorElement);
    render(
        <ThemeProvider theme={theme}>
            <ConnectionFormattingPopover
                anchorElement={anchorElement}
                kind="connection"
                label="Calls"
                onApply={onApply}
                onClose={onClose}
                value={{
                    endMarker: 'diamond',
                    font: { bold: false, color: '#d32f2f', family: 'Inter', italic: true, size: 11, underline: false },
                    line: { color: '#1976d2', thickness: 4 },
                    startMarker: 'circle',
                }}
            />
        </ThemeProvider>,
    );

    return { onApply, onClose };
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('ConnectionFormattingPopover', () => {
    it('shows groups and saved override values', async () => {
        const user = userEvent.setup();
        renderPopover();

        for (const name of ['Label font', 'Label size & color', 'Line', 'Markers']) {
            expect(screen.getByRole('region', { name })).toBeInTheDocument();
        }
        expect(screen.getByRole('combobox', { name: 'Font family' })).toHaveTextContent('Inter');
        expect(screen.getByRole('switch', { name: 'Italic' })).toBeChecked();
        expect(screen.getByRole('slider', { name: 'Font size' })).toHaveAttribute('aria-valuenow', '11');
        expect(screen.getByRole('slider', { name: 'Line thickness' })).toHaveAttribute('aria-valuenow', '4');
        for (const [label, color] of [['Font color', '#d32f2f'], ['Line color', '#1976d2']]) {
            await user.click(screen.getByRole('button', { name: label }));
            expect(screen.getByLabelText(label, { selector: 'input' })).toHaveValue(color);
            await user.keyboard('{Escape}');
        }
        expect(screen.getByRole('combobox', { name: 'Start marker' })).toHaveTextContent('Circle');
        expect(screen.getByRole('combobox', { name: 'End marker' })).toHaveTextContent('Diamond');
    });

    it('resets only chosen overrides and stores friendly marker choices as existing enums', async () => {
        const user = userEvent.setup();
        const { onApply, onClose } = renderPopover();

        await user.click(screen.getByRole('button', { name: 'Line color' }));
        await user.click(screen.getByRole('button', { name: 'Use default colour' }));
        await user.keyboard('{Escape}');
        await user.click(screen.getByRole('switch', { name: 'Custom Font size' }));
        await user.click(screen.getByRole('combobox', { name: 'End marker' }));
        await user.click(screen.getByRole('option', { name: 'Filled arrow' }));
        await user.click(screen.getByRole('button', { name: 'Apply' }));

        expect(onApply).toHaveBeenCalledOnce();
        expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
            endMarker: 'filled-arrow',
            font: expect.objectContaining({ color: '#d32f2f', size: undefined }),
            line: { color: undefined, thickness: 4 },
            startMarker: 'circle',
        }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('keeps draft open when Apply fails and reports through dialogService', async () => {
        const user = userEvent.setup();
        const onApply = vi.fn(() => { throw new Error('Invalid formatting'); });
        const onClose = vi.fn();
        const reportError = vi.spyOn(dialogService, 'error').mockReturnValue({critical: false, id: 1, message: 'Invalid formatting', severity: 'error', title: 'Error'});
        renderPopover(onApply, onClose);

        const fontFamily = screen.getByRole('combobox', { name: 'Font family' });
        await user.click(fontFamily);
        await user.click(screen.getByRole('option', { name: 'Serif' }));
        await user.click(screen.getByRole('button', { name: 'Apply' }));

        expect(reportError).toHaveBeenCalledWith(expect.any(Error), { fallbackMessage: 'Diagram formatting could not be applied' });
        expect(onClose).not.toHaveBeenCalled();
        expect(fontFamily).toHaveTextContent('Serif');
        expect(screen.getByText('Format Calls connections')).toBeInTheDocument();
    });

    it('discards through Cancel without applying', async () => {
        const user = userEvent.setup();
        const { onApply, onClose } = renderPopover();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onApply).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledOnce();
    });
});
