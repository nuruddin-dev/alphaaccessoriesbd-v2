/**
 *
 * SubPage
 *
 */

import React from 'react';

import Button from '../../Common/Button';

const SubPage = props => {
  const { title, actionTitle, handleAction, children, actionComponent } = props;

  return (
    <div className='sub-page'>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{
        background: '#fff',
        padding: '12px 24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="d-flex align-items-center">
          {handleAction && (
            <button
              className="btn-neon btn-neon--cyan mr-3"
              onClick={handleAction}
              style={{
                width: '36px',
                height: '36px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
            >
              <i className="fa fa-arrow-left"></i>
            </button>
          )}
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
            fontSize: '18px',
            letterSpacing: '-0.5px'
          }}>
            {title}
          </h2>
        </div>
        <div className='action d-flex align-items-center' style={{ gap: '10px' }}>
          {actionComponent}
          {actionTitle && (
            <button
              className={`btn-neon ${actionTitle.toLowerCase() === 'cancel' ? 'btn-neon--red' : 'btn-neon--cyan'}`}
              onClick={handleAction}
              style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '8px' }}
            >
              {actionTitle}
            </button>
          )}
        </div>
      </div>
      <div className='subpage-body'>{children}</div>
    </div>
  );
};

export default SubPage;
