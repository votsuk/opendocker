export const colors = {
    primary: '#fab283',
    secondary: '#5c9cf5',
    accent: '#9d7cd8',
    error: '#e06c75',
    warning: '#f5a742',
    success: '#7fd88f',
    info: '#56b6c2',
    text: '#eeeeee',
    textMuted: '#808080',
    background: '#0a0a0a',
    backgroundPanel: '#141414',
    backgroundElement: '#1e1e1e',
    border: '#484848',
    yellow: '#e6db74',
    green: '#a6e22e',
    cyan: '#66d9ef',
    blue: '#66d9ef',
    purple: '#ae81ff',
    pink: '#f92672',
    diffAdded: '#4fd6be',
};

export function getColorForContainerState(isActive: boolean, status?: string, state?: string) {
    if (isActive) {
        return colors.backgroundPanel;
    }

    if (!status || !state) {
        return colors.textMuted;
    }

    switch (state) {
        case 'running':
            if (status.includes('unhealthy')) {
                return colors.warning;
            }
            if (status.includes('starting')) {
                return colors.info;
            }
            return colors.success;
        case 'exited':
            return colors.error;
        case 'created':
            return colors.info;
        default:
            return colors.textMuted;
    }
}
