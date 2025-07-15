import React, { useState } from 'react';
import { useTable } from 'react-table';
import { formatDate } from '../../../utils/date';
import axios from 'axios';
import { API_URL } from '../../../constants';

const CustomerTable = ({ customers, onEdit }) => {
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers?.customers)
    ? customers.customers
    : [];

  // Prepare data for the table
  const data = React.useMemo(
    () =>
      safeCustomers.map(customer => ({
        id: customer._id,
        name: customer.name,
        phone: customer.phoneNumber,
        due: customer.due,
        purchaseHistory: customer.purchase_history, // Contains invoice IDs
        created: formatDate(customer?.created)
      })),
    [safeCustomers]
  );

  // Define table columns
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name'
      },
      {
        Header: 'Phone Number',
        accessor: 'phone'
      },
      {
        Header: 'Due Amount',
        accessor: 'due'
      },
      {
        Header: 'Purchase History',
        accessor: 'purchaseHistory',
        Cell: ({ value }) => value.length // Show the count of purchase history
      },
      {
        Header: 'Account Created',
        accessor: 'created'
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button
              className='btn btn-primary'
              onClick={() => onEdit(row.original.id)}
            >
              Edit
            </button>
            <button
              className='btn btn-secondary ml-2'
              onClick={() => fetchInvoiceDetails(row.original.purchaseHistory)}
            >
              <i className='fa fa-history'></i> History
            </button>
          </div>
        )
      }
    ],
    [onEdit]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  // Fetch invoice details dynamically
  const fetchInvoiceDetails = async purchaseHistory => {
    try {
      setLoadingHistory(true);
      setShowModal(true); // Show the modal

      // Fetch details for each invoice ID
      const fetchedDetails = await Promise.all(
        purchaseHistory.map(async invoiceId => {
          const response = await axios.get(`${API_URL}/invoice/${invoiceId}`);
          return response.data; // Assuming response contains { invoiceNumber, date }
        })
      );

      console.log('Fetched invoice details:', fetchedDetails); // Debugging line

      // Store the fetched invoice details in a local array
      setInvoiceDetails(fetchedDetails);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className='table-responsive'>
      {safeCustomers.length === 0 ? (
        <p>No customers available.</p>
      ) : (
        <table className='table' {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Floating Modal for Purchase History */}
      {showModal && (
        <div className='history-modal'>
          <div className='history-modal-content'>
            <h4>Purchase History</h4>
            {loadingHistory ? (
              <p>Loading...</p>
            ) : (
              <ul>
                {invoiceDetails.map((item, index) => (
                  <li key={index}>
                    <strong>Invoice:</strong>{' '}
                    {item.invoice.invoiceNumber || 'N/A'},{' '}
                    <strong>Date:</strong>{' '}
                    {item.invoice.created
                      ? formatDateTime(item.invoice.created)
                      : 'Invalid Date'}
                  </li>
                ))}
              </ul>
            )}
            <button
              className='btn btn-secondary'
              onClick={() => {
                setShowModal(false);
                setInvoiceDetails([]); // Clear the local array
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const formatDateTime = isoString => {
  const date = new Date(isoString);

  // Extract date components
  const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  // Extract time components
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Combine into the desired format
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export default CustomerTable;
