import React, { useState } from 'react';
import AwesomeSearch from './containers/AwesomeSearch/AwesomeSearch';
import { HashRouter } from 'react-router-dom';
import { CollectionsProvider } from './context/CollectionsContext';
import { ListManagementProvider } from './context/ListManagementContext';
import './App.css';

function App() {
  const [isDark, setIsDark] = useState(localStorage.getItem('__isDark') === 'true');
  const theme = isDark ? ' solarized-dark' : '';

  return (
    <HashRouter>
      <CollectionsProvider>
        <ListManagementProvider>
          <div className={`hack${theme}`}>
            <AwesomeSearch onThemeChange={setIsDark} isDark={isDark} theme={isDark ? 'dark-theme': 'normal-theme'} />
          </div>
        </ListManagementProvider>
      </CollectionsProvider>
    </HashRouter>
  );
}
export default App;
