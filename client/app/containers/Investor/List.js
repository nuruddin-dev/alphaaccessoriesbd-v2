import React from 'react';
import axios from 'axios';
import { API_URL } from '../../constants';
import './Investor.css';

class InvestorList extends React.Component {
    state = {
        investors: [],
        isLoading: true,
        isAddModalOpen: false,
        newInvestor: {
            name: '',
            phoneNumber: '',
            email: '',
            defaultProfitShare: 50,
            notes: ''
        }
    };

    componentDidMount() {
        this.fetchInvestors();
    }

    fetchInvestors = async () => {
        try {
            const response = await axios.get(`${API_URL}/investor`);
            this.setState({ investors: response.data.investors, isLoading: false });
        } catch (error) {
            console.error('Error fetching investors:', error);
            this.setState({ isLoading: false });
        }
    };

    handleInputChange = (field, value) => {
        this.setState(prevState => ({
            newInvestor: { ...prevState.newInvestor, [field]: value }
        }));
    };

    handleAddInvestor = async () => {
        try {
            await axios.post(`${API_URL}/investor/add`, this.state.newInvestor);
            this.setState({
                isAddModalOpen: false,
                newInvestor: { name: '', phoneNumber: '', email: '', defaultProfitShare: 50, notes: '' }
            });
            this.fetchInvestors();
        } catch (error) {
            alert('Error adding investor');
        }
    };

    render() {
        const { investors, isLoading, isAddModalOpen, newInvestor } = this.state;

        return (
            <div className="investor-container">
                <div className="investor-header">
                    <div className="investor-header__title">
                        <h1>Investor Management</h1>
                        <p>Track investment capital and profit splitting</p>
                    </div>
                    <button className="btn-neon btn-neon--cyan" onClick={() => this.setState({ isAddModalOpen: true })}>
                        <i className="fa fa-plus"></i> Add New Investor
                    </button>
                </div>

                <div className="investor-grid">
                    {isLoading ? (
                        <div className="neon-loader">Loading...</div>
                    ) : (
                        investors.map(investor => (
                            <div
                                key={investor._id}
                                className="investor-card"
                                onClick={() => this.props.history.push(`/dashboard/investor/${investor._id}`)}
                            >
                                <div className="investor-card__glow"></div>
                                <div className="investor-card__content">
                                    <div className="investor-card__name">{investor.name}</div>
                                    <div className="investor-card__stat">
                                        <span>Profit Share:</span>
                                        <span className="text-neon--purple">{investor.defaultProfitShare}%</span>
                                    </div>
                                    <div className="investor-card__stat">
                                        <span>Contact:</span>
                                        <span>{investor.phoneNumber || 'N/A'}</span>
                                    </div>
                                    <div className="investor-card__footer">
                                        View History <i className="fa fa-arrow-right"></i>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {isAddModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content modal-content--sm" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">New Investor</h3>
                                <button className="modal-close" onClick={() => this.setState({ isAddModalOpen: false })}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newInvestor.name}
                                        onChange={(e) => this.handleInputChange('name', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newInvestor.phoneNumber}
                                        onChange={(e) => this.handleInputChange('phoneNumber', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Profit Share %</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newInvestor.defaultProfitShare}
                                        onChange={(e) => this.handleInputChange('defaultProfitShare', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-neon" onClick={() => this.setState({ isAddModalOpen: false })}>Cancel</button>
                                <button className="btn-neon btn-neon--cyan" onClick={this.handleAddInvestor}>Save Investor</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default InvestorList;
