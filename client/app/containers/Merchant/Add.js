/*
 *
 * Add
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import SubPage from '../../components/Manager/SubPage';
import AddMerchant from '../../components/Manager/AddMerchant';

class Add extends React.PureComponent {
  render() {
    const {
      history,
      merchantFormData,
      formErrors,
      isSubmitting,
      merchantChange,
      addMerchant
    } = this.props;

    return (
      <div className='add-merchant'>
        <div className="d-flex justify-content-between align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div className="d-flex align-items-center">
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
              fontSize: '20px',
              letterSpacing: '-0.5px'
            }}>
              Add Merchant
            </h2>
          </div>
          <button
            className="btn-neon btn-neon--cyan"
            onClick={() => history.goBack()}
          >
            Cancel
          </button>
        </div>
        <AddMerchant
          merchantFormData={merchantFormData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          submitTitle='Add Merchant'
          merchantChange={merchantChange}
          addMerchant={() => addMerchant(true)}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    merchantFormData: state.merchant.merchantFormData,
    formErrors: state.merchant.formErrors,
    isSubmitting: state.merchant.isSubmitting,
    isLoading: state.merchant.isLoading
  };
};

export default connect(mapStateToProps, actions)(Add);
