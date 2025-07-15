/*
 *
 * Edit
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import EditTag from '../../components/Manager/EditTag';
import SubPage from '../../components/Manager/SubPage';
import NotFound from '../../components/Common/NotFound';

class Edit extends React.PureComponent {
  componentDidMount() {
    const tagId = this.props.match.params.id;
    this.props.fetchTag(tagId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      const tagId = this.props.match.params.id;
      this.props.fetchTag(tagId);
    }
  }

  render() {
    const {
      history,
      user,
      tag,
      formErrors,
      tagEditChange,
      updateTag,
      deleteTag,
      activateTag
    } = this.props;

    return (
      <SubPage
        title='Edit Tag'
        actionTitle='Cancel'
        handleAction={history.goBack}
      >
        {tag?._id ? (
          <EditTag
            user={user}
            tag={tag}
            tagChange={tagEditChange}
            formErrors={formErrors}
            updateTag={updateTag}
            deleteTag={deleteTag}
            activateTag={activateTag}
          />
        ) : (
          <NotFound message='No tag found.' />
        )}
      </SubPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.account.user,
    tag: state.tag.tag,
    formErrors: state.tag.editFormErrors
  };
};

export default connect(mapStateToProps, actions)(Edit);
