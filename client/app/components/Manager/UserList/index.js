// /**
//  *
//  * UserList
//  *
//  */

// import React from 'react';

// import { formatDate } from '../../../utils/date';
// import UserRole from '../UserRole';

// const UserList = props => {
//   const { users } = props;

//   return (
//     <div className='u-list'>
//       {users.map((user, index) => (
//         <div key={index} className='mt-3 px-4 py-3 user-box'>
//           <label className='text-black'>Name</label>
//           <p className='fw-medium'>
//             {user?.firstName ? `${user?.firstName} ${user?.lastName}` : 'N/A'}
//           </p>
//           <label className='text-black'>Email</label>
//           <p>{user?.email ?? '-'}</p>
//           <label className='text-black'>Provider</label>
//           <p>{user?.provider}</p>
//           <label className='text-black'>Account Created</label>
//           <p>{formatDate(user?.created)}</p>
//           <label className='text-black'>Role</label>
//           <p className='mb-0'>
//             <UserRole user={user} className='d-inline-block mt-2' />
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default UserList;

import React from 'react';
import { useTable } from 'react-table';

import { formatDate } from '../../../utils/date';
import { ROLES } from '../../../constants';
import UserRole from '../UserRole';

const UserTable = ({ users, updateUserRole }) => {
  const data = React.useMemo(
    () =>
      users.map(user => ({
        _id: user?._id,
        name: user?.firstName ? `${user?.firstName} ${user?.lastName}` : 'N/A',
        email: user?.email ?? '-',
        provider: user?.provider ?? '-',
        created: formatDate(user?.created),
        role: user?.role, // Just the role string
        user: user // Whole user for complex cells
      })),
    [users]
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row, value }) => (
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {row.original._id}</div>
          </div>
        )
      },
      {
        Header: 'Email',
        accessor: 'email',
        Cell: ({ value }) => (
          <div style={{ color: '#475569' }}>{value}</div>
        )
      },
      {
        Header: 'Provider',
        accessor: 'provider',
        Cell: ({ value }) => (
          <span className="badge badge-light" style={{ textTransform: 'capitalize' }}>{value}</span>
        )
      },
      {
        Header: 'Account Created',
        accessor: 'created'
      },
      {
        Header: 'Role',
        accessor: 'user',
        Cell: ({ value }) => {
          const isAdmin = value.role === ROLES.Admin;
          return (
            <div className="d-flex align-items-center gap-2">
              <UserRole user={value} />
              <div className="custom-control custom-switch ml-2">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id={`roleSwitch-${value._id}`}
                  checked={isAdmin}
                  onChange={(e) => {
                    const newRole = e.target.checked ? ROLES.Admin : ROLES.Member;
                    if (window.confirm(`Are you sure you want to change ${value.firstName}'s role to ${newRole}?`)) {
                      updateUserRole(value._id, newRole);
                    }
                  }}
                />
                <label className="custom-control-label" htmlFor={`roleSwitch-${value._id}`} style={{ cursor: 'pointer' }}>
                  Admin
                </label>
              </div>
            </div>
          );
        }
      }
    ],
    [updateUserRole]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <div className='table-responsive'>
      <style>{`
        .user-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .user-table th {
          background: #f8fafc;
          padding: 12px 20px;
          font-weight: 600;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .user-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          color: #475569;
          font-size: 14px;
        }
        .user-table tr:hover td {
          background: #fdfdfd;
        }
        .user-table tr:last-child td {
          border-bottom: none;
        }
        .custom-control-input:checked ~ .custom-control-label::before {
          background-color: #06b6d4;
          border-color: #06b6d4;
        }
      `}</style>
      <table className='user-table' {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
