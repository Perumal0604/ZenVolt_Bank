import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import '@fontsource-variable/inter';
import LiveBank from './LiveBank';
import bank from './bank-config';
import './style.css';

document.title = bank.name + ' | Account portal';
document.documentElement.dataset.bank = bank.theme;
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: bank.color, dark: '#173a75', light: '#eaf0ff' },
    secondary: { main: '#159b91' },
    background: { default: '#f4f7fb', paper: '#ffffff' },
    success: { main: '#16845e' },
    warning: { main: '#b7791f' },
    error: { main: '#c2415d' },
    text: { primary: '#172d4c', secondary: '#78869a' },
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  typography: {
    fontFamily: '"Inter Variable", Inter, sans-serif',
    h1: { fontWeight: 780 },
    h2: { fontWeight: 740 },
    button: { textTransform: 'none', fontWeight: 680 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 9, minHeight: 40 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 13 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 9 } } },
  },
});
const switchUrl = 'https://sriramtpsiog.github.io/SharedDB/';
createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}><CssBaseline /><LiveBank bank={bank} switchUrl={switchUrl} /></ThemeProvider>,
);
