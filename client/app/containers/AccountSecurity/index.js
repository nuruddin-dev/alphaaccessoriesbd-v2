/*
 *
 * AccountSecurity
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import actions from '../../actions';

import SubPage from '../../components/Manager/SubPage';
import ResetPasswordForm from '../../components/Common/ResetPasswordForm';

class AccountSecurity extends React.PureComponent {
  componentDidMount() { }

  render() {
    const {
      resetFormData,
      formErrors,
      resetPasswordChange,
      resetAccountPassword
    } = this.props;

    return (
      <div className='account-security'>
        <div className="d-flex align-items-center" style={{ background: '#fff', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
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
              Account Security
            </h2>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-3">
          <div className='reset-form'>
            <h4>Reset Password</h4>
            <ResetPasswordForm
              resetFormData={resetFormData}
              formErrors={formErrors}
              resetPasswordChange={resetPasswordChange}
              resetPassword={resetAccountPassword}
            />
          </div>
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

export default connect(mapStateToProps, actions)(AccountSecurity);
