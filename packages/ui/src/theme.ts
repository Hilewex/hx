export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    error: string;
  };
  spacing: Record<string, string>;
}

export const defaultTokens: ThemeTokens = {
  colors: {
    primary: '#0070f3',
    secondary: '#1c1c1e',
    background: '#ffffff',
    text: '#000000',
    error: '#ff0000',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  }
};
