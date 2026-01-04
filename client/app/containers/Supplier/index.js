/*
 *
 * Supplier Container
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import List from './List';
import Add from './Add';
import SupplierOrders from './SupplierOrders';

const Supplier = props => {
    return (
        <div className='supplier-management' style={{ margin: 0, padding: 0 }}>
            <Switch>
                <Route exact path='/dashboard/supplier' component={List} />
                <Route path='/dashboard/supplier/add' component={Add} />
                <Route path='/dashboard/supplier/edit/:id' component={Add} />
                <Route path='/dashboard/supplier/orders/:id' component={SupplierOrders} />
            </Switch>
        </div>
    );
};

export default Supplier;
