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
      <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <table className='table table-borderless align-middle mb-0' style={{ color: '#475569', minWidth: '1000px' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <tr>
              <th
                scope='col'
                style={{ width: '22%', cursor: 'pointer', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => handleSort('shortName')}
              >
                Product Name {getSortSymbol('shortName')}
              </th>
              <th
                scope='col'
                style={{ width: '10%', cursor: 'pointer', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => handleSort('quantity')}
              >
                Stock {getSortSymbol('quantity')}
              </th>
              <th
                scope='col'
                style={{ width: '10%', cursor: 'pointer', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => handleSort('buyingPrice')}
              >
                Cost {getSortSymbol('buyingPrice')}
              </th>
              <th
                scope='col'
                style={{ width: '10%', cursor: 'pointer', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => handleSort('wholeSellPrice')}
              >
                Wholesale {getSortSymbol('wholeSellPrice')}
              </th>
              <th
                scope='col'
                style={{ width: '10%', cursor: 'pointer', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => handleSort('price')}
              >
                S. Price {getSortSymbol('price')}
              </th>
              <th
                scope='col'
                style={{ width: '10%', cursor: 'pointer', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => handleSort('previousPrice')}
              >
                P. Price {getSortSymbol('previousPrice')}
              </th>
              <th scope='col' style={{ width: '8%', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th scope='col' style={{ width: '20%', padding: '16px 20px', color: '#64748b', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ background: '#fff' }}>
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
      </div>

      <style>{`
        .table-row-hover:hover {
          background-color: #f8fafc;
        }
        .qty-input {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          transition: all 0.2s;
          width: 90px;
        }
        .qty-input:focus {
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
          text-decoration: none;
        }
        .icon-edit { color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
        .icon-edit:hover { background: #06b6d4; color: #fff; }
        .icon-history { color: #64748b; background: rgba(100, 116, 139, 0.1); }
        .icon-history:hover { background: #64748b; color: #fff; }
        .icon-check { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .icon-check:hover { background: #10b981; color: #fff; }
      `}</style>
      {isHistoryModalOpen && (
        <div
          className='modal show'
          style={{
            display: 'flex',
            backgroundColor: 'rgba(15, 23, 42, 0.4)', // Slate-900 with opacity
            backdropFilter: 'blur(4px)',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleCloseHistoryModal}
        >
          <div
            className='modal-dialog modal-dialog-centered'
            style={{ maxWidth: '900px', width: '95%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className='modal-content' style={{ border: 'none', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
              <div className='modal-header' style={{ borderBottom: '1px solid #f1f5f9', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="d-flex align-items-center">
                  <div style={{ width: '4px', height: '24px', background: '#06b6d4', borderRadius: '2px', marginRight: '16px' }}></div>
                  <h5 className='modal-title' style={{ fontWeight: '800', color: '#1e293b', fontSize: '20px', letterSpacing: '-0.5px' }}>
                    Activity Logs: <span style={{ color: '#0891b2' }}>{selectedShortName || 'Product'}</span>
                  </h5>
                </div>
                <button
                  type='button'
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', width: '36px', height: '36px', color: '#64748b', transition: 'all 0.2s' }}
                  onClick={handleCloseHistoryModal}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>
              <div
                className='modal-body'
                style={{
                  padding: '0',
                  maxHeight: '60vh',
                  overflowY: 'auto'
                }}
              >
                {selectedHistory.length > 0 ? (
                  <table className='table table-borderless mb-0'>
                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #f1f5f9' }}>
                      <tr>
                        <th style={{ padding: '16px 32px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Timestamp</th>
                        <th style={{ padding: '16px 32px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Updated By</th>
                        <th style={{ padding: '16px 32px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Modifications</th>
                        <th style={{ padding: '16px 32px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHistory.map((entry, index) => (
                        <tr key={index} style={{ borderBottom: index !== selectedHistory.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <td style={{ padding: '20px 32px', fontSize: '13px', color: '#64748b', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: '600', color: '#475569' }}>{new Date(entry.updatedAt).toLocaleDateString()}</div>
                            <div style={{ fontSize: '11px' }}>{new Date(entry.updatedAt).toLocaleTimeString()}</div>
                          </td>
                          <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '600', color: '#1e293b', verticalAlign: 'top' }}>
                            {entry.updatedBy || 'System'}
                          </td>
                          <td style={{ padding: '20px 32px', verticalAlign: 'top' }}>
                            {entry.changes &&
                              Object.entries(entry.changes).map(
                                ([key, value], i) => (
                                  <div key={i} style={{ marginBottom: '6px', fontSize: '13px' }}>
                                    <span style={{ fontWeight: '700', color: '#334155', textTransform: 'capitalize' }}>{key}:</span>
                                    <span style={{ color: '#ef4444', textDecoration: 'line-through', margin: '0 8px' }}>{value.old}</span>
                                    <i className="fa fa-long-arrow-right" style={{ color: '#94a3b8' }}></i>
                                    <span style={{ color: '#10b981', fontWeight: '700', marginLeft: '8px' }}>{value.new}</span>
                                  </div>
                                )
                              )}
                          </td>
                          <td style={{ padding: '20px 32px', fontSize: '13px', color: '#64748b', verticalAlign: 'top', maxWidth: '200px' }}>
                            {entry.note || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No notes provided</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-5">
                    <i className="fa fa-folder-open mb-3" style={{ fontSize: '48px', color: '#e2e8f0' }}></i>
                    <p style={{ color: '#64748b', fontWeight: '500' }}>No activity history found for this product.</p>
                  </div>
                )}
              </div>
              <div className='modal-footer' style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                <button
                  type='button'
                  className='btn-neon btn-neon--cyan'
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                  onClick={handleCloseHistoryModal}
                >
                  Close History
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
