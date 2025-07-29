import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          success: {
            duration: 4000,
            style: {
              background: '#DCFCE7',
              color: '#166534',
              border: '1px solid #86EFAC',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#FEE2E2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
            },
          },
        }}
      />
    </>
  </React.StrictMode>
);
