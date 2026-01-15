import React from 'react';
import SteadfastCourier from './SteadfastCourier';
import './Steadfast.css';

class CourierDashboard extends React.Component {
    state = {
        selectedCourier: 'steadfast',
        view: 'dashboard'
    };

    componentDidMount() {
        if (this.props.location.state && this.props.location.state.view) {
            this.setState({ view: this.props.location.state.view });
        }
    }

    setView = (view) => {
        this.setState({ view });
    };

    render() {
        const { selectedCourier, view } = this.state;

        return (
            <div className="courier-container">
                <div className="courier-selection-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <div className="nav-shortcuts" style={{ display: 'flex', gap: '8px' }}>
                        <button className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`} onClick={() => this.setView('dashboard')}>
                            <i className="fa fa-th-large"></i> Dashboard
                        </button>
                        <button className={`nav-tab ${view === 'add_parcel' ? 'active' : ''}`} onClick={() => this.setView('add_parcel')}>
                            <i className="fa fa-plus-circle"></i> Add Parcel
                        </button>
                        <button className={`nav-tab ${view === 'consignments' ? 'active' : ''}`} onClick={() => this.setView('consignments')}>
                            <i className="fa fa-list"></i> View Parcels
                        </button>
                        <button className={`nav-tab ${view === 'payments' ? 'active' : ''}`} onClick={() => this.setView('payments')}>
                            <i className="fa fa-credit-card"></i> Payments
                        </button>
                        <button className={`nav-tab ${view === 'payment_lookup' ? 'active' : ''}`} onClick={() => this.setView('payment_lookup')}>
                            <i className="fa fa-search-plus"></i> Payment Lookup
                        </button>
                    </div>
                </div>

                <SteadfastCourier
                    view={view}
                    setView={this.setView}
                    location={this.props.location}
                />
            </div>
        );
    }
}

export default CourierDashboard;
