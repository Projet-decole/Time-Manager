// frontend/src/components/ui/Table.jsx

import { forwardRef } from 'react';

/**
 * Table component
 */
const Table = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});

Table.displayName = 'Table';

/**
 * Table Header
 */
const TableHeader = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <thead ref={ref} className={`[&_tr]:border-b ${className}`} {...props}>
      {children}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

/**
 * Table Body
 */
const TableBody = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={`[&_tr:last-child]:border-0 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
});

TableBody.displayName = 'TableBody';

/**
 * Table Footer
 */
const TableFooter = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <tfoot
      ref={ref}
      className={`border-t bg-gray-50 font-medium ${className}`}
      {...props}
    >
      {children}
    </tfoot>
  );
});

TableFooter.displayName = 'TableFooter';

/**
 * Table Row
 */
const TableRow = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

/**
 * Table Head Cell
 */
const TableHead = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
});

TableHead.displayName = 'TableHead';

/**
 * Table Cell
 */
const TableCell = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={`p-4 align-middle ${className}`}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';

/**
 * Table Caption
 */
const TableCaption = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <caption
      ref={ref}
      className={`mt-4 text-sm text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </caption>
  );
});

TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
};
