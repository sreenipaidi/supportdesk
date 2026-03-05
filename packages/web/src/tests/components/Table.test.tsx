import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, Pagination } from '../../components/ui/Table.js';

interface TestItem {
  id: string;
  name: string;
  email: string;
}

describe('Table', () => {
  const columns = [
    { key: 'name', header: 'Name', render: (item: TestItem) => item.name },
    { key: 'email', header: 'Email', render: (item: TestItem) => item.email },
  ];

  const data: TestItem[] = [
    { id: '1', name: 'Alice', email: 'alice@test.com' },
    { id: '2', name: 'Bob', email: 'bob@test.com' },
  ];

  it('renders column headers', () => {
    render(<Table columns={columns} data={data} keyExtractor={(i) => i.id} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<Table columns={columns} data={data} keyExtractor={(i) => i.id} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('renders empty message when no data', () => {
    render(
      <Table
        columns={columns}
        data={[]}
        keyExtractor={(i) => i.id}
        emptyMessage="No users found."
      />,
    );
    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <Table
        columns={columns}
        data={data}
        keyExtractor={(i) => i.id}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('calls onRowClick on Enter keypress', () => {
    const onRowClick = vi.fn();
    render(
      <Table
        columns={columns}
        data={data}
        keyExtractor={(i) => i.id}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getByText('Alice').closest('tr');
    if (row) fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders skeleton rows when loading', () => {
    const { container } = render(
      <Table columns={columns} data={[]} keyExtractor={(i) => i.id} isLoading />,
    );
    const skeletonRows = container.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('renders sort indicator for sorted column', () => {
    render(
      <Table
        columns={[
          { key: 'name', header: 'Name', render: (i: TestItem) => i.name, sortable: true },
          { key: 'email', header: 'Email', render: (i: TestItem) => i.email },
        ]}
        data={data}
        keyExtractor={(i) => i.id}
        sortColumn="name"
        sortDirection="asc"
      />,
    );
    // Check for ascending arrow
    expect(screen.getByText('\u2191')).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('renders page information', () => {
    render(
      <Pagination page={1} totalPages={5} total={50} perPage={10} onPageChange={() => {}} />,
    );
    expect(screen.getByText('Showing 1-10 of 50')).toBeInTheDocument();
  });

  it('disables Prev button on first page', () => {
    render(
      <Pagination page={1} totalPages={5} total={50} perPage={10} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(
      <Pagination page={5} totalPages={5} total={50} perPage={10} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('calls onPageChange when page button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={1} totalPages={5} total={50} perPage={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText('Page 2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange on Next click', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={1} totalPages={5} total={50} perPage={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('marks current page with aria-current', () => {
    render(
      <Pagination page={3} totalPages={5} total={50} perPage={10} onPageChange={() => {}} />,
    );
    expect(screen.getByLabelText('Page 3')).toHaveAttribute('aria-current', 'page');
  });
});
