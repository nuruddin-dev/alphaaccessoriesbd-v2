import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
import { useTable, useSortBy } from 'react-table';
import axios from 'axios';
import { API_URL } from '../../../constants';
import PaymentModal from '../PaymentModal';
import CustomerLedgerModal from '../CustomerLedgerModal';

const CustomerTable = ({ customers, history }) => {
  const dispatch = useDispatch();
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInvoice, setDiscountInvoice] = useState(null);
  const [discountAmount, setDiscountAmount] = useState('');

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
        created: customer?.created ? formatShortDate(customer.created) : '',
        createdRaw: customer?.created ? new Date(customer.created).getTime() : 0 // Raw timestamp for sorting
      })),
    [safeCustomers]
  );

  // Define table columns
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row }) => <div style={{ fontWeight: '600', color: '#1e293b' }}>{row.original.name}</div>
      },
      {
        Header: 'Due Amount',
        accessor: 'due',
        sortType: (rowA, rowB) => {
          const dueA = rowA.original.due || 0;
          const dueB = rowB.original.due || 0;
          return dueA - dueB;
        },
        Cell: ({ value }) => (
          <div className="d-flex align-items-center">
            <span
              className={`font-weight-bold`}
              style={{
                color: value > 0 ? '#ef4444' : '#10b981',
                background: value > 0 ? '#fef2f2' : '#ecfdf5',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              ৳{value?.toLocaleString() || 0}
            </span>
          </div>
        )
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
        Header: 'Purchase History',
        accessor: 'purchaseHistory',
        sortType: (rowA, rowB) => {
          const countA = rowA.original.purchaseHistory?.length || 0;
          const countB = rowB.original.purchaseHistory?.length || 0;
          return countA - countB;
        },
        Cell: ({ value }) => (
          <span className="badge badge-light" style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            {value?.length || 0} Invoices
          </span>
        )
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              className='action-icon edit'
              onClick={() => history.push(`/dashboard/customer/edit/${row.original.id}`)}
              title='Edit Customer'
              style={{ cursor: 'pointer', color: '#64748b' }}
            >
              <i className='fa fa-edit'></i>
            </div>
            <div
              className='action-icon money'
              onClick={() => {
                const customer = safeCustomers.find(c => c._id === row.original.id);
                setSelectedCustomer(customer);
                setIsPaymentModalOpen(true);
              }}
              title='Record Payment'
              style={{ cursor: 'pointer', color: '#64748b' }}
            >
              <i className='fa fa-money'></i>
            </div>
            <div
              className='action-icon ledger'
              onClick={() => {
                const customer = safeCustomers.find(c => c._id === row.original.id);
                setSelectedCustomer(customer);
                setIsLedgerModalOpen(true);
              }}
              title='View Ledger'
              style={{ cursor: 'pointer', color: '#64748b' }}
            >
              <i className='fa fa-book'></i>
            </div>
            <div
              className='action-icon history'
              onClick={() => fetchInvoiceDetails(row.original.purchaseHistory)}
              title='View History'
              style={{ cursor: 'pointer', color: '#64748b' }}
            >
              <i className='fa fa-history'></i>
            </div>
          </div>
        )
      }
    ],
    [safeCustomers, history] // Added history to dependency array
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
          sortBy: [
            {
              id: 'due',
              desc: true // Sort by highest due first
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

      // Sort by created date descending (newest first)
      fetchedDetails.sort((a, b) => new Date(b.invoice.created) - new Date(a.invoice.created));

      // Store the fetched invoice details in a local array
      setInvoiceDetails(fetchedDetails);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className='customer-table-wrap'>
      <style>{`
        .customer-table-wrap .user-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .customer-table-wrap .user-table th {
          background: #f8fafc;
          padding: 12px 20px;
          font-weight: 600;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .customer-table-wrap .user-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          color: #475569;
          font-size: 14px;
        }
        .customer-table-wrap .user-table tr:hover td {
          background: #fdfdfd;
        }
        .customer-table-wrap .user-table tr:last-child td {
          border-bottom: none;
        }
        .action-icon {
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .action-icon:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            background: #fff;
        }
        .action-icon.edit:hover { border-color: #3b82f6; color: #3b82f6 !important; }
        .action-icon.money:hover { border-color: #22c55e; color: #22c55e !important; }
        .action-icon.ledger:hover { border-color: #f59e0b; color: #f59e0b !important; }
        .action-icon.history:hover { border-color: #06b6d4; color: #06b6d4 !important; }
      `}</style>

      {safeCustomers.length === 0 ? (
        <div className="text-center p-5">
          <p className="text-muted">No customers available.</p>
        </div>
      ) : (
        <table className='user-table' {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())} style={{ cursor: column.canSort ? 'pointer' : 'default' }}>
                    <div className="d-flex align-items-center">
                      {column.render('Header')}
                      <span className="ml-2" style={{ color: '#06b6d4', opacity: column.isSorted ? 1 : 0.3 }}>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? <i className="fa fa-caret-down"></i>
                            : <i className="fa fa-caret-up"></i>
                          : <i className="fa fa-sort"></i>}
                      </span>
                    </div>
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
          <div className='history-modal-content' style={{ width: '80%', maxWidth: '1000px' }}>
            <h4>Purchase History</h4>
            {loadingHistory ? (
              <p>Loading...</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className='table table-striped'>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Today's Total</th>
                      <th>Discount</th>
                      <th>Previous Due</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.invoice.invoiceNumber ? (
                            <Link to={`/dashboard/invoice/${item.invoice.invoiceNumber}`}>
                              {item.invoice.invoiceNumber}
                            </Link>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>৳{item.invoice.subTotal || 0}</td>
                        <td>৳{item.invoice.discount || 0}</td>
                        <td>৳{item.invoice.previousDue || 0}</td>
                        <td>৳{item.invoice.grandTotal || 0}</td>
                        <td>৳{item.invoice.paid || 0}</td>
                        <td style={{ color: item.invoice.due > 0 ? 'red' : 'green' }}>
                          ৳{item.invoice.due || 0}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {item.invoice.created
                            ? formatDateTime(item.invoice.created)
                            : 'Invalid Date'}
                        </td>
                        <td>
                          <button
                            className='btn btn-sm btn-primary'
                            onClick={() => {
                              setDiscountInvoice(item.invoice);
                              setDiscountAmount(item.invoice.discount || 0);
                              setShowDiscountModal(true);
                            }}
                          >
                            Discount
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className='history-modal'>
          <div className='history-modal-content' style={{ width: '400px', maxWidth: '90%' }}>
            <h4>Update Discount</h4>
            <p>Invoice #: {discountInvoice?.invoiceNumber}</p>
            <div className='form-group'>
              <label>Discount Amount</label>
              <input
                type='number'
                className='form-control'
                value={discountAmount}
                onChange={e => setDiscountAmount(e.target.value)}
              />
            </div>
            <div className='d-flex justify-content-end mt-3'>
              <button
                className='btn btn-secondary mr-2'
                onClick={() => {
                  setShowDiscountModal(false);
                  setDiscountInvoice(null);
                }}
              >
                Cancel
              </button>
              <button
                className='btn btn-primary'
                onClick={async () => {
                  if (!discountInvoice) return;
                  try {
                    const discount = parseFloat(discountAmount) || 0;
                    const subTotal = parseFloat(discountInvoice.subTotal) || 0;
                    const previousDue = parseFloat(discountInvoice.previousDue) || 0;
                    const paid = parseFloat(discountInvoice.paid) || 0;

                    // Recalculate based on formula: GrandTotal = SubTotal + PreviousDue - Discount
                    const grandTotal = subTotal + previousDue - discount;
                    const due = grandTotal - paid;

                    const updateData = {
                      discount,
                      grandTotal,
                      due
                    };

                    await axios.put(`${API_URL}/invoice/${discountInvoice._id}`, updateData);

                    // Update local state
                    const updatedDetails = invoiceDetails.map(item => {
                      if (item.invoice._id === discountInvoice._id) {
                        return {
                          ...item,
                          invoice: {
                            ...item.invoice,
                            ...updateData
                          }
                        };
                      }
                      return item;
                    });
                    setInvoiceDetails(updatedDetails);
                    setShowDiscountModal(false);
                    dispatch(success({ title: 'Discount updated successfully!', position: 'tr', autoDismiss: 3 }));

                  } catch (err) {
                    console.error('Error updating discount:', err);
                    dispatch(error({ title: 'Failed to update discount.', position: 'tr', autoDismiss: 5 }));
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onRequestClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSuccess={() => {
          // Optionally refresh customer list
          window.location.reload();
        }}
      />

      {/* Customer Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onRequestClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customerId={selectedCustomer?._id}
      />
    </div>
  );
};

// Short date format for table display (DD-MM-YYYY)
const formatShortDate = isoString => {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = isoString => {
  const date = new Date(isoString);

  // Extract date components
  const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  // Extract time components
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');

  // Combine into the desired format
  return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
};

export default CustomerTable;
