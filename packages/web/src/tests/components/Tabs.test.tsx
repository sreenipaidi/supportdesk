import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabPanel } from '../../components/ui/Tabs.js';

describe('Tabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab One' },
    { id: 'tab2', label: 'Tab Two' },
    { id: 'tab3', label: 'Tab Three', count: 5 },
  ];

  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />);
    expect(screen.getByText('Tab One')).toBeInTheDocument();
    expect(screen.getByText('Tab Two')).toBeInTheDocument();
    expect(screen.getByText('Tab Three')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />);
    const activeTab = screen.getByRole('tab', { name: /Tab One/ });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    const inactiveTab = screen.getByRole('tab', { name: /Tab Two/ });
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Tab Two/ }));
    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });

  it('renders count badge when provided', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('has correct ARIA roles', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });
});

describe('TabPanel', () => {
  it('renders content when active', () => {
    render(
      <TabPanel id="panel1" activeTab="panel1">
        <p>Panel content</p>
      </TabPanel>,
    );
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('does not render content when inactive', () => {
    render(
      <TabPanel id="panel1" activeTab="panel2">
        <p>Panel content</p>
      </TabPanel>,
    );
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <TabPanel id="panel1" activeTab="panel1">
        <p>Content</p>
      </TabPanel>,
    );
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'tabpanel-panel1');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-panel1');
  });
});
