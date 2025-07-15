/*
 *
 * Add
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import AddTag from '../../components/Manager/AddTag';
import SubPage from '../../components/Manager/SubPage';

class Add extends React.PureComponent {
  render() {
    const { history, tagFormData, formErrors, tagChange, addTag } = this.props;

    return (
      <SubPage
        title='Add Tag'
        actionTitle='Cancel'
        handleAction={() => history.goBack()}
      >
        <AddTag
          tagFormData={tagFormData}
          formErrors={formErrors}
          tagChange={tagChange}
          addTag={addTag}
        />
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    tagFormData: state.tag.tagFormData,
    formErrors: state.tag.formErrors
  };
};

export default connect(mapStateToProps, actions)(Add);
