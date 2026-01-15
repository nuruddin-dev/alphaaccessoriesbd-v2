import React from 'react';
import { Switch, Route } from 'react-router-dom';
import InvestorList from './List';
import InvestorProfit from './InvestorProfit';
import Page404 from '../../components/Common/Page404';

class Investor extends React.Component {
    render() {
        return (
            <Switch>
                <Route exact path="/dashboard/investors" component={InvestorList} />
                <Route path="/dashboard/investor/:id" component={InvestorProfit} />
                <Route path="*" component={Page404} />
            </Switch>
        );
    }
}

export default Investor;
