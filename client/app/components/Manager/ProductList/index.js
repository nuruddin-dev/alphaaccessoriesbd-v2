import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductRow from './ProductRow';

const ProductList = props => {
  const { products, updateProductDetails } = props;

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'created', // Default sort column
    direction: 'desc' // Default sort direction
  });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [selectedShortName, setSelectedShortName] = useState(''); // State for shortName

  const handleOpenHistoryModal = (history, shortName) => {
    setSelectedHistory(history || []);
    setSelectedShortName(shortName || ''); // Set the shortName of the selected product
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedHistory([]);
    setSelectedShortName(''); // Reset shortName
  };

  // Function to sort products based on sortConfig
  const sortedProducts = [...products].sort((a, b) => {
    const { key, direction } = sortConfig;

    if (key === 'name' || key === 'shortName') {
      const aValue = (a[key] || '').toLowerCase();
      const bValue = (b[key] || '').toLowerCase();
      if (aValue < bValue)
        return direction === 'asc' ? -1 : 1;
      if (aValue > bValue)
        return direction === 'asc' ? 1 : -1;
      return 0;
    } else if (
      key === 'quantity' ||
      key === 'previousPrice' ||
      key === 'price' ||
      key === 'buyingPrice' ||
      key === 'wholeSellPrice'
    ) {
      return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
    } else if (key === 'created') {
      return direction === 'asc'
        ? new Date(a[key]) - new Date(b[key])
        : new Date(b[key]) - new Date(a[key]);
    }

    return 0;
  });

  // Function for handling column sorting
  const handleSort = key => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Helper: Get sort direction symbol
  const getSortSymbol = key => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
    }
    return '';
  };

  return (
    <div className='p-list'>
      <table className='table product-table'>
        <thead>
          <tr>
            <th
              scope='col'
              style={{ width: '25%', cursor: 'pointer' }}
              onClick={() => handleSort('shortName')}
            >
              Name {getSortSymbol('shortName')}
            </th>
            <th
              scope='col'
              style={{ width: '10%', cursor: 'pointer' }}
              onClick={() => handleSort('quantity')}
            >
              Quantity {getSortSymbol('quantity')}
            </th>
            <th
              scope='col'
              style={{ width: '10%', cursor: 'pointer' }}
              onClick={() => handleSort('buyingPrice')}
            >
              Buy {getSortSymbol('buyingPrice')}
            </th>
            <th
              scope='col'
              style={{ width: '10%', cursor: 'pointer' }}
              onClick={() => handleSort('wholeSellPrice')}
            >
              WholeSell {getSortSymbol('wholeSellPrice')}
            </th>
            <th
              scope='col'
              style={{ width: '10%', cursor: 'pointer' }}
              onClick={() => handleSort('price')}
            >
              Price {getSortSymbol('price')}
            </th>
            <th
              scope='col'
              style={{ width: '10%', cursor: 'pointer' }}
              onClick={() => handleSort('previousPrice')}
            >
              P Price {getSortSymbol('previousPrice')}
            </th>
            <th scope='col' style={{ width: '5%' }}>Active</th>
            <th scope='col' style={{ width: '15%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map(product => (
            <ProductRow
              key={product._id}
              product={product}
              updateProductDetails={updateProductDetails}
              handleOpenHistoryModal={handleOpenHistoryModal}
            />
          ))}
        </tbody>
      </table>
      {isHistoryModalOpen && (
        <div
          className='modal show'
          style={{
            display: 'block',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
            overflow: 'hidden'
          }}
          onClick={handleCloseHistoryModal} // Close modal on clicking outside
        >
          <div
            className='modal-dialog'
            style={{ maxWidth: '80%' }} // Double the width of the modal
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>
                  Product History ({selectedShortName || 'N/A'})
                </h5>
                <button
                  type='button'
                  className='close'
                  onClick={handleCloseHistoryModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div
                className='modal-body'
                style={{
                  maxHeight: '400px', // Limit the height of the modal body
                  overflowY: 'auto' // Enable vertical scrolling
                }}
              >
                {selectedHistory.length > 0 ? (
                  <table className='table'>
                    <thead>
                      <tr>
                        <th>Created On</th>
                        <th>Created By</th>
                        <th>Changes</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistory.map((entry, index) => (
                        <tr key={index}>
                          <td>{new Date(entry.updatedAt).toLocaleString()}</td>
                          <td>{entry.updatedBy || ''}</td>
                          <td>
                            {entry.changes &&
                              Object.entries(entry.changes).map(
                                ([key, value], i) => (
                                  <div key={i}>
                                    <strong>{key}:</strong> {value.old} →{' '}
                                    {value.new}
                                  </div>
                                )
                              )}
                          </td>
                          <td>{entry.note || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No history available for this product.</p>
                )}
              </div>
              <div className='modal-footer'>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={handleCloseHistoryModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
