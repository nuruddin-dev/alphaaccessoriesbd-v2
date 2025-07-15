/*
 *
 * List
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';
import { ROLES } from '../../constants';

import TagList from '../../components/Manager/TagList';
import SubPage from '../../components/Manager/SubPage';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';

class List extends React.PureComponent {
  componentDidMount() {
    this.props.fetchTags();
  }

  render() {
    const { history, tags, isLoading, user } = this.props;

    return (
      <>
        <SubPage
          title={user.role === ROLES.Admin ? 'Tags' : 'Tag'}
          actionTitle={user.role === ROLES.Admin && 'Add'}
          handleAction={() => history.push('/dashboard/tag/add')}
        >
          {isLoading ? (
            <LoadingIndicator inline />
          ) : tags.length > 0 ? (
            <TagList tags={tags} user={user} />
          ) : (
            <NotFound message='No tags found.' />
          )}
        </SubPage>
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    tags: state.tag.tags,
    isLoading: state.tag.isLoading,
    user: state.account.user
  };
};

export default connect(mapStateToProps, actions)(List);
