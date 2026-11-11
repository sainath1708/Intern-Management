import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              borderRadius: '10px',
              padding: '10px 14px',
              maxWidth: '380px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#0f172a' } },
            error: { iconTheme: { primary: '#fb7185', secondary: '#0f172a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
