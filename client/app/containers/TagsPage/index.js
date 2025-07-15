/**
 *
 * TagsPage
 *
 */

import React from 'react';

import { connect } from 'react-redux';

import actions from '../../actions';

import TagList from '../../components/Store/TagList';

class TagsPage extends React.PureComponent {
  componentDidMount() {
    this.props.fetchStoreTags();
  }

  render() {
    const { tags } = this.props;

    return (
      <div className='tags-page'>
        <TagList tags={tags} />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    tags: state.tag.storeTags
  };
};

export default connect(mapStateToProps, actions)(TagsPage);
