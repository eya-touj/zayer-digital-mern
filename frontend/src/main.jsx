import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CmsProvider } from './context/CmsContext';
import { LangProvider } from './context/LangContext';
import './styles/app.css';
import './styles/navbar.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <CmsProvider><LangProvider><App /></LangProvider></CmsProvider>,
);
