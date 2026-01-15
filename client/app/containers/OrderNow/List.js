// /*
//  *
//  * List
//  *
//  */

// import React from 'react';
// import { connect } from 'react-redux';
// import actions from '../../actions';
// import Button from '../../components/Common/Button';
// import '../../styles/core/_orderNow.scss'; // Import the SCSS file for styling

// class List extends React.PureComponent {
//   constructor(props) {
//     super(props);
//   }

//   componentDidMount() {
//     this.props.fetchOrderNows();
//   }

//   render() {
//     const { orders, isLoading, cancelOrderNow } = this.props;

// const getRandomColor = () => {
//   const letters = '89ABCDEF'; // Only use the higher half of hex values for lighter colors
//   let color = '#';
//   for (let i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * letters.length)];
//   }
//   return color;
// };

// const handleDelete = orderId => {
//   cancelOrderNow(orderId);
// };

// const getTimeAgo = date => {
//   const now = new Date();
//   const orderDate = new Date(date);
//   const diffMs = now - orderDate;

//   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
//   const diffHours = Math.floor(
//     (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
//   );
//   const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//   if (diffDays > 0) {
//     return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
//   } else if (diffHours > 0) {
//     return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
//   } else if (diffMinutes > 0) {
//     return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
//   } else {
//     return 'Just now';
//   }
// };

//     return (
//       <div className='orderNow-dashboard'>
//         {isLoading ? (
//           <div className='loading'>Loading orders...</div>
//         ) : orders && orders.length > 0 ? (
//           orders.map(order => (
//             <div
//               key={order._id}
//               className='order-card'
//               style={{ backgroundColor: getRandomColor() }}
//             >
//               <p className='order-field'>
//                 <strong>Name:</strong> {order.name}
//               </p>
//               <p className='order-field'>
//                 <strong>Number:</strong> {order.phoneNumber}
//               </p>
//               <p className='order-field'>
//                 <strong>Address:</strong> {order.address}
//               </p>
//               <p className='order-field'>
//                 <strong>Product:</strong> {order.productName}
//               </p>
//               <p className='order-field'>
//                 <strong>Quantity:</strong> {order.quantity}
//               </p>
//               <p className='order-field'>
//                 <strong>Price:</strong> {order.price}
//               </p>
//               <div
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'space-between'
//                 }}
//               >
//                 <Button
//                   variant='danger'
//                   size='sm'
//                   text='Delete'
//                   className='cancel-order-btn'
//                   onClick={() => handleDelete(order._id)}
//                 />
//                 <p className='order-field'>
//                   <strong>{getTimeAgo(order.createdAt)}</strong>
//                 </p>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className='no-orders'>No orders found.</div>
//         )}
//       </div>
//     );
//   }
// }
// const mapStateToProps = state => {
//   return {
//     orders: state.orderNow.orders,
//     isLoading: state.orderNow.isLoading,
//     user: state.account.user
//   };
// };

// export default connect(mapStateToProps, actions)(List);

import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination } from 'react-table';
import { connect } from 'react-redux';
import { success, error, warning } from 'react-notification-system-redux';
import actions from '../../actions';
import Button from '../../components/Common/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import '../../styles/core/_orderNow.scss';
import OrderCourierModal from './OrderCourierModal';
import '../Courier/Steadfast.css';
import { ORDER_STATUS } from '../../constants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getRandomLightColor } from '../../utils';

dayjs.extend(relativeTime);

const List = ({
  orders,
  isLoading,
  fetchOrderNows,
  updateOrderNote,
  updateOrderStatus,
  deleteOrderNow, // Add delete functionality
  success,
  error,
  warning
}) => {
  const history = useHistory();
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [notes, setNotes] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null); // Track selected order for updating note
  const [updatedNote, setUpdatedNote] = useState(''); // Track the updated note
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal visibility
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierOrder, setCourierOrder] = useState(null);

  useEffect(() => {
    fetchOrderNows();
  }, [fetchOrderNows]);

  const filteredOrders = useMemo(() => {
    const filtered =
      selectedStatus === 'All'
        ? orders
        : orders.filter(order => order.status === selectedStatus);

    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [orders, selectedStatus]);

  const openModal = order => {
    setSelectedOrder(order);
    setUpdatedNote(order.note || ''); // Pre-fill with current note or empty
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setUpdatedNote('');
    setIsModalOpen(false);
  };

  const toggleCourierModal = (order = null) => {
    setCourierOrder(order);
    setIsCourierModalOpen(!isCourierModalOpen);
  };

  const handleNoteUpdate = () => {
    if (selectedOrder) {
      updateOrderNote(selectedOrder.id, updatedNote); // Dispatch updateOrderNote action
      closeModal();
    }
  };

  const handleDeleteOrder = orderId => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrderNow(orderId); // Dispatch deleteOrderNow action
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const Table = ({ orders }) => {
    const data = useMemo(
      () =>
        orders.map(order => ({
          id: order._id,
          name: order.name,
          phoneNumber: order.phoneNumber,
          address: order.address,
          productName: order.productName,
          quantity: order.quantity,
          price: order.price,
          status: order.status,
          createdAt: order.createdAt,
          note: notes[order._id] || order.note || ''
        })),
      [orders, notes]
    );

    const columns = useMemo(
      () => [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Number', accessor: 'phoneNumber' },
        { Header: 'Address', accessor: 'address' },
        { Header: 'Product', accessor: 'productName' },
        { Header: 'Quantity', accessor: 'quantity' },
        { Header: 'Price', accessor: 'price' },
        {
          Header: 'Status',
          accessor: 'status',
          Cell: ({ value, row }) => (
            <select
              className="status-select"
              value={value}
              onChange={e =>
                handleStatusChange(row.original.id, e.target.value)
              }
            >
              {Object.values(ORDER_STATUS).map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )
        },
        {
          Header: 'Created',
          accessor: 'createdAt',
          Cell: ({ value }) => (
            <span style={{ fontWeight: '500', color: '#64748b' }}>
              {dayjs(value).fromNow()}
            </span>
          )
        },
        {
          Header: 'Note',
          accessor: 'note',
          Cell: ({ value, row }) => (
            <div
              className="d-flex align-items-center gap-2"
              style={{ minWidth: '150px' }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  flexGrow: 1
                }}
              >
                {value || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No note</span>}
              </div>
              <div className="action-icon action-icon-plus" onClick={() => openModal(row.original)}>
                <i className='fa fa-plus-square' />
              </div>
            </div>
          )
        },
        {
          Header: 'Actions',
          accessor: 'delete',
          Cell: ({ row }) => (
            <div className="d-flex justify-content-center gap-2">
              <div
                className="action-icon action-icon-courier"
                onClick={() => toggleCourierModal(row.original)}
                title="Add to Courier"
              >
                <i className='fa fa-truck' />
              </div>
              <div className="action-icon action-icon-trash" onClick={() => handleDeleteOrder(row.original.id)}>
                <i className='fa fa-trash' />
              </div>
            </div>
          )
        }
      ],
      [notes]
    );

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
      page,
      nextPage,
      previousPage,
      canNextPage,
      canPreviousPage,
      state: { pageIndex }
    } = useTable(
      { columns, data, initialState: { pageIndex: 0 } },
      usePagination
    );

    return (
      <div className="table-container" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <div style={{ overflowY: 'auto' }}>
          <table className='table table-borderless align-middle mb-0' {...getTableProps()} style={{ color: '#475569', minWidth: '1000px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()} style={{
                      padding: '16px 20px',
                      color: '#64748b',
                      fontWeight: '700',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} style={{ background: '#fff' }}>
              {page.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} style={{ padding: '16px 20px', fontSize: '14px' }}>
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <style>{`
          .table-row-hover:hover {
            background-color: #f8fafc;
          }
          .status-select {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 13px;
            font-weight: 600;
            color: #0891b2;
            background: #e0f7fa;
            cursor: pointer;
            transition: all 0.2s;
          }
          .status-select:focus {
            outline: none;
            border-color: #06b6d4;
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
          }
          .action-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s;
            cursor: pointer;
          }
          .action-icon-plus {
            color: #06b6d4;
            background: rgba(6, 182, 212, 0.1);
          }
          .action-icon-plus:hover {
            background: #06b6d4;
            color: #fff;
          }
          .action-icon-trash {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
          }
          .action-icon-trash:hover {
            background: #ef4444;
            color: #fff;
          }
          .action-icon-courier {
            color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
          }
          .action-icon-courier:hover {
            background: #f59e0b;
            color: #fff;
          }
          .pagination-btn {
            border: 1px solid #e2e8f0;
            background: #fff;
            color: #64748b;
            padding: 6px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
          }
          .pagination-btn:hover:not(:disabled) {
            border-color: #06b6d4;
            color: #06b6d4;
            background: #f0f9ff;
          }
          .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>

        <div className='d-flex justify-content-between align-items-center p-4 bg-white' style={{ borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Showing page <strong>{pageIndex + 1}</strong>
          </div>
          <div className='d-flex gap-2' style={{ gap: '10px' }}>
            <button className="pagination-btn" onClick={previousPage} disabled={!canPreviousPage}>
              <i className="fa fa-chevron-left mr-1"></i> Previous
            </button>
            <button className="pagination-btn" onClick={nextPage} disabled={!canNextPage}>
              Next <i className="fa fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='orderNow-dashboard' style={{ padding: '0 24px 24px 24px', backgroundColor: '#f3f4f6', minHeight: 'calc(100vh - 80px)' }}>
      <div className="courier-selection-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div className="d-flex align-items-center">
          <button className="nav-tab mr-3" onClick={() => history.push('/dashboard')}>
            <i className="fa fa-arrow-left"></i> Back
          </button>
          <div style={{
            width: '4px',
            height: '24px',
            background: '#06b6d4',
            borderRadius: '2px',
            marginRight: '12px'
          }}></div>
          <h2 className="mb-0" style={{
            fontWeight: '700',
            color: '#1e293b',
            fontSize: '18px',
            letterSpacing: '-0.5px'
          }}>
            Order Requests
          </h2>
        </div>

        <div className="nav-shortcuts d-flex flex-wrap" style={{ gap: '8px' }}>
          {['All', ...Object.values(ORDER_STATUS)].map(status => (
            <button
              key={status}
              className={`nav-tab ${selectedStatus === status ? 'active' : ''}`}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        {isLoading ? (
          <div className='loading'>Loading orders...</div>
        ) : filteredOrders.length > 0 ? (
          <Table orders={filteredOrders} />
        ) : (
          <div className='no-orders'>No orders found.</div>
        )}
      </div>

      {/* Modal for Note Update */}
      <Modal isOpen={isModalOpen} toggle={closeModal}>
        <ModalHeader toggle={closeModal}>Update Note</ModalHeader>
        <ModalBody>
          <Input
            type='textarea'
            value={updatedNote}
            onChange={e => setUpdatedNote(e.target.value)}
            rows='5'
          />
        </ModalBody>
        <ModalFooter>
          <Button text='Update' variant='success' onClick={handleNoteUpdate} />
          <Button text='Cancel' variant='secondary' onClick={closeModal} />
        </ModalFooter>
      </Modal>

      <OrderCourierModal
        isOpen={isCourierModalOpen}
        toggle={() => toggleCourierModal()}
        order={courierOrder}
        onSuccess={fetchOrderNows}
        success={success}
        error={error}
      />
    </div>
  );
};

const mapStateToProps = state => ({
  orders: state.orderNow.orders,
  isLoading: state.orderNow.isLoading
});

const mapDispatchToProps = dispatch => ({
  ...actions(dispatch),
  success: opts => dispatch(success(opts)),
  error: opts => dispatch(error(opts)),
  warning: opts => dispatch(warning(opts)),
  dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(List);
