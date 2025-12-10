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
import actions from '../../actions';
import Button from '../../components/Common/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import '../../styles/core/_orderNow.scss';
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
  deleteOrderNow // Add delete functionality
}) => {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [notes, setNotes] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null); // Track selected order for updating note
  const [updatedNote, setUpdatedNote] = useState(''); // Track the updated note
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal visibility

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
          note: notes[order._id] || order.note || '',
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          backgroundColor: getRandomLightColor()
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
          Cell: ({ value }) => dayjs(value).fromNow() // Timeago format
        },
        {
          Header: 'Note',
          accessor: 'note',
          Cell: ({ value, row }) => (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%'
              }}
            >
              <div
                style={{
                  width: '85%',
                  marginRight: '10px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  padding: '5px',
                  borderRadius: '4px'
                }}
              >
                {value || ''}
              </div>
              <i
                className='fa fa-plus-square'
                style={{
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#007bff'
                }}
                onClick={() => openModal(row.original)}
              />
            </div>
          )
        },
        {
          Header: 'Delete',
          accessor: 'delete',
          Cell: ({ row }) => (
            <i
              className='fa fa-trash'
              style={{
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: '#dc3545',
                display: 'flex',
                justifyContent: 'center', // Centers horizontally
                alignItems: 'center', // Centers vertically
                height: '100%',
                width: '100%'
              }}
              onClick={() => handleDeleteOrder(row.original.id)}
            />
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
      <div>
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
            {page.map(row => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  style={{
                    backgroundColor: row.original.backgroundColor // Apply the random light background color here
                  }}
                >
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className='pagination'>
          <button onClick={previousPage} disabled={!canPreviousPage}>
            Previous
          </button>
          <button onClick={nextPage} disabled={!canNextPage}>
            Next
          </button>
          <span>
            Page <strong>{pageIndex + 1}</strong>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className='orderNow-dashboard'>
      <div className='tabs'>
        {['All', ...Object.values(ORDER_STATUS)].map(status => (
          <Button
            key={status}
            text={status}
            variant={selectedStatus === status ? 'primary' : 'secondary'}
            onClick={() => setSelectedStatus(status)}
          />
        ))}
      </div>
      {isLoading ? (
        <div className='loading'>Loading orders...</div>
      ) : filteredOrders.length > 0 ? (
        <Table orders={filteredOrders} />
      ) : (
        <div className='no-orders'>No orders found.</div>
      )}

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
    </div>
  );
};

const mapStateToProps = state => ({
  orders: state.orderNow.orders,
  isLoading: state.orderNow.isLoading
});

export default connect(mapStateToProps, actions)(List);
