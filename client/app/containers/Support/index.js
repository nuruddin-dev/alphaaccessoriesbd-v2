/*
 *
 * Support
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import actions from '../../actions';

import { default as SupportManager } from '../../components/Manager/Support';

class Support extends React.PureComponent {
  render() {
    const { user } = this.props;

    return (
      <div className='support'>
        <div className="d-flex justify-content-between align-items-center" style={{ background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div className="d-flex align-items-center">
            <h4 className="mb-0 font-weight-bold text-muted" style={{ fontSize: '16px' }}>
              Support
            </h4>
          </div>
          <div className="d-flex align-items-center px-4 py-2" style={{ background: '#06b6d4', color: '#fff', borderRadius: '8px', cursor: 'default', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 6px rgba(6, 182, 212, 0.2)' }}>
            <i className="fa fa-th-large mr-2"></i> Dashboard
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-3">
          <SupportManager user={user} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    resetFormData: state.resetPassword.resetFormData,
    formErrors: state.resetPassword.formErrors
  };
};

export default connect(mapStateToProps, actions)(Support);
