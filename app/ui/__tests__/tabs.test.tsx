import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs Component', () => {
  test('renders tabs with className prop', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger 
            value="tab1" 
            className="custom-class"
          >
            Tab 1
          </TabsTrigger>
          <TabsTrigger 
            value="tab2"
            className="another-class"
          >
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    const tab2 = screen.getByText('Tab 2');
    
    // Check if the tabs are rendered
    expect(tab1).toBeInTheDocument();
    expect(tab2).toBeInTheDocument();
    
    // Check if the className is applied
    expect(tab1.closest('button')).toHaveClass('custom-class');
    expect(tab2.closest('button')).toHaveClass('another-class');
    
    // Check if the content is rendered correctly
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    
    // Click on the second tab
    fireEvent.click(tab2);
    
    // Check if the content is updated
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  test('handles onClick prop', () => {
    const handleClick = jest.fn();
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger 
            value="tab1" 
            onClick={handleClick}
          >
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    
    // Click on the tab
    fireEvent.click(tab1);
    
    // Check if the onClick handler is called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});