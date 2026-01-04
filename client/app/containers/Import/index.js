/*
 *
 * Import Management Container
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import List from './List';
import Add from './Add';

const Import = props => {
    return (
        <div className='import-management'>
            <Switch>
                <Route exact path='/dashboard/import' component={List} />
                <Route path='/dashboard/import/add' component={Add} />
                <Route path='/dashboard/import/edit/:id' component={Add} />
            </Switch>
        </div>
    );
};

export default Import;
