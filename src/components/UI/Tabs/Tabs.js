/**
 * Tabs - Reusable tabs component
 */
import React, { useState } from 'react';
import classes from './Tabs.module.css';

const Tabs = ({
  tabs,
  defaultActiveTab = 0,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'default',
}) => {
  const [internalActive, setInternalActive] = useState(defaultActiveTab);

  // Determine active index: prefer controlled prop (supports id string or numeric index)
  const getActiveIndex = () => {
    if (typeof controlledActiveTab !== 'undefined') {
      if (typeof controlledActiveTab === 'number') return controlledActiveTab;
      const idx = tabs.findIndex(t => t.id === controlledActiveTab);
      return idx >= 0 ? idx : 0;
    }
    return internalActive;
  };

  const activeIndex = getActiveIndex();

  const handleTabClick = (index) => {
    // If uncontrolled, update internal state
    if (typeof controlledActiveTab === 'undefined') {
      setInternalActive(index);
    }
    if (onChange) {
      // Send the tab id and tab object to parent for convenience
      onChange(tabs[index].id, tabs[index], index);
    }
  };

  return (
    <div className={classes.TabsContainer}>
      <div className={`${classes.TabList} ${classes[variant]}`} role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.id || index}
            role="tab"
            aria-selected={activeIndex === index}
            className={`${classes.Tab} ${activeIndex === index ? classes.active : ''}`}
            onClick={() => handleTabClick(index)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className={classes.TabIcon}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={classes.Badge}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className={classes.TabPanel} role="tabpanel">
        {tabs[activeIndex]?.content}
      </div>
    </div>
  );
};

export default Tabs;
