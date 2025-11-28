import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTable, useSortBy } from 'react-table';
import { formatDate } from '../../../utils/date';
import axios from 'axios';
import { API_URL } from '../../../constants';

const CustomerTable = ({ customers, history }) => {
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers)
    ? customers
    : [];

  // Prepare data for the table
  const data = React.useMemo(
    () =>
      safeCustomers.map(customer => ({
        id: customer._id,
        name: customer.name,
        phone: customer.phoneNumber,
        address: customer.address || '',
        due: customer.due,
        purchaseHistory: customer.purchase_history, // Contains invoice IDs
        created: formatDate(customer?.created),
        createdRaw: customer?.created ? new Date(customer.created).getTime() : 0 // Raw timestamp for sorting
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
        Header: 'Address',
        accessor: 'address'
      },
      {
        Header: 'Due Amount',
        accessor: 'due'
      },
      {
        Header: 'Purchase History',
        accessor: 'purchaseHistory',
        sortType: (rowA, rowB) => {
          const countA = rowA.original.purchaseHistory?.length || 0;
          const countB = rowB.original.purchaseHistory?.length || 0;
          return countA - countB;
        },
        Cell: ({ value }) => value?.length || 0 // Show the count of purchase history
      },
      {
        Header: 'Account Created',
        accessor: 'created',
        sortType: (rowA, rowB) => {
          return rowA.original.createdRaw - rowB.original.createdRaw;
        }
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        Cell: ({ row }) => (
          <div>
            <i
              className='fa fa-edit'
              onClick={() => history.push(`/dashboard/customer/edit/${row.original.id}`)}
              title='Edit Customer'
              style={{ cursor: 'pointer', fontSize: '18px', marginRight: '15px', color: '#007bff' }}
            ></i>
            <i
              className='fa fa-history'
              onClick={() => fetchInvoiceDetails(row.original.purchaseHistory)}
              title='View History'
              style={{ cursor: 'pointer', fontSize: '18px', color: '#6c757d' }}
            ></i>
          </div>
        )
      }
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
          sortBy: [
            {
              id: 'created',
              desc: true // Sort by newest first
            }
          ]
        }
      },
      useSortBy
    );

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
                  <th {...column.getHeaderProps(column.getSortByToggleProps())} style={{ cursor: column.canSort ? 'pointer' : 'default' }}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
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
                    {item.invoice.invoiceNumber ? (
                      <Link to={`/dashboard/invoice/${item.invoice.invoiceNumber}`}>
                        {item.invoice.invoiceNumber}
                      </Link>
                    ) : (
                      'N/A'
                    )},{' '}
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
