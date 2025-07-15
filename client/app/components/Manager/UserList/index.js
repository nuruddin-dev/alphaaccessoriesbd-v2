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
import UserRole from '../UserRole';

const UserTable = ({ users }) => {
  const data = React.useMemo(
    () =>
      users.map(user => ({
        name: user?.firstName ? `${user?.firstName} ${user?.lastName}` : 'N/A',
        email: user?.email ?? '-',
        provider: user?.provider ?? '-',
        created: formatDate(user?.created),
        role: user // Pass the whole user object to render the role using the UserRole component
      })),
    [users]
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name'
      },
      {
        Header: 'Email',
        accessor: 'email'
      },
      {
        Header: 'Provider',
        accessor: 'provider'
      },
      {
        Header: 'Account Created',
        accessor: 'created'
      },
      {
        Header: 'Role',
        accessor: 'role',
        Cell: ({ value }) => (
          <UserRole user={value} className='d-inline-block mt-2' />
        )
      }
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <div className='table-responsive'>
      <table className='table' {...getTableProps()}>
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
