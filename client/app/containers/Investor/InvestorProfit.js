import React from 'react';
import axios from 'axios';
import { API_URL } from '../../constants';
import './Investor.css';

class InvestorProfit extends React.Component {
    state = {
        investor: null,
        investments: [],
        profitStats: { summary: { totalRealizedProfit: 0 }, investments: [] },
        isLoading: true,
        shipmentModes: {}, // { [investmentId]: 'realtime' | 'projection' }
        expandedInvestment: null,
        isPayoutModalOpen: false,
        payoutAmount: '',
        payoutNote: '',
        activeTab: 'shipments' // 'shipments' | 'ledger'
    };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        const { id } = this.props.match.params;
        try {
            const [investorRes, investmentRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/investor/${id}`),
                axios.get(`${API_URL}/investment/investor/${id}`),
                axios.get(`${API_URL}/investment-stats/${id}`)
            ]);

            // Initialize modes for each investment
            const initialModes = {};
            if (investmentRes.data.investments) {
                investmentRes.data.investments.forEach(inv => {
                    initialModes[inv._id] = 'realtime';
                });
            }

            this.setState({
                investor: investorRes.data.investor,
                investments: investmentRes.data.investments,
                profitStats: statsRes.data,
                shipmentModes: initialModes,
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching investor data:', error);
            this.setState({ isLoading: false });
        }
    };

    handleModeChange = (invId, mode) => {
        this.setState(prevState => ({
            shipmentModes: {
                ...prevState.shipmentModes,
                [invId]: mode
            }
        }));
    };

    toggleDetails = (invId) => {
        this.setState({
            expandedInvestment: this.state.expandedInvestment === invId ? null : invId
        });
    };

    openPayoutModal = () => {
        this.setState({
            isPayoutModalOpen: true,
            payoutAmount: '',
            payoutNote: ''
        });
    };

    handlePayoutSubmit = async () => {
        const { payoutAmount, payoutNote, investor, profitStats } = this.state;
        const maxWithdrawable = profitStats.summary?.totalWithdrawable || 0;

        if (parseFloat(payoutAmount) > maxWithdrawable) {
            return alert(`Error: Withdrawal amount cannot exceed total withdrawable money (৳${maxWithdrawable.toLocaleString()})`);
        }

        try {
            await axios.post(`${API_URL}/investment/payout-global/${investor._id}`, {
                amount: parseFloat(payoutAmount),
                note: payoutNote
            });
            this.setState({ isPayoutModalOpen: false });
            this.fetchData(); // Refresh stats
        } catch (error) {
            console.error('Error recording payout:', error);
            alert('Error recording payout');
        }
    };

    calculateSummary = () => {
        const { investments } = this.state;
        let totalCapital = 0;
        let activeCapital = 0;

        investments.forEach(inv => {
            totalCapital += inv.capitalAmount;
            if (inv.status === 'Active') activeCapital += inv.capitalAmount;
        });

        return { totalCapital, activeCapital };
    };

    render() {
        const { investor, investments, isLoading, profitStats, shipmentModes } = this.state;
        if (isLoading || !investor) return <div className="neon-loader">Loading Investor Data...</div>;

        const summary = this.calculateSummary();
        const statsSummary = profitStats.summary || { totalRealizedProfit: 0, totalProjectedProfit: 0, totalCombinedProfit: 0 };

        return (
            <div className="investor-container">
                <div className="investor-header">
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="btn-neon" onClick={() => this.props.history.push('/dashboard/investors')}>
                            <i className="fa fa-arrow-left"></i> Back
                        </button>
                        <button className="btn-neon btn-neon--cyan" onClick={this.openPayoutModal}>
                            <i className="fa fa-money"></i> Withdraw Money
                        </button>
                    </div>
                    <div className="investor-header__title" style={{ textAlign: 'right' }}>
                        <h1>{investor.name}</h1>
                        <p>{investor.email || investor.phoneNumber}</p>
                    </div>
                </div>

                <div className="investor-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="stat-card">
                        <div className="stat-card__label">Investment Amount</div>
                        <div className="stat-card__value text-neon--cyan">৳{summary.totalCapital.toLocaleString()}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__label">Profits (Real + PRJ)</div>
                        <div className="stat-card__value text-neon--green">৳{Math.round(statsSummary.totalProfit).toLocaleString()}</div>
                        <div className="stat-card__hint">Real: ৳{Math.round(statsSummary.totalRealizedProfit).toLocaleString()}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'rgba(168, 85, 247, 0.05)', borderColor: '#a855f7' }}>
                        <div className="stat-card__label" style={{ color: '#7e22ce' }}>Total Withdrawable</div>
                        <div className="stat-card__value" style={{ color: '#9333ea' }}>৳{Math.round(statsSummary.totalWithdrawable || 0).toLocaleString()}</div>
                        <div className="stat-card__hint">Capital + Profits - Withdrawn</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__label">Total Withdrawn</div>
                        <div className="stat-card__value" style={{ color: '#f97316' }}>৳{Math.round(statsSummary.totalWithdrawn || 0).toLocaleString()}</div>
                    </div>
                </div>

                <div className="investor-tabs" style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    <button
                        className={`tab-btn ${this.state.activeTab === 'shipments' ? 'active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'shipments' })}
                        style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: this.state.activeTab === 'shipments' ? '2px solid #06b6d4' : 'none', color: this.state.activeTab === 'shipments' ? '#06b6d4' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Shipment Details
                    </button>
                    <button
                        className={`tab-btn ${this.state.activeTab === 'ledger' ? 'active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'ledger' })}
                        style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: this.state.activeTab === 'ledger' ? '2px solid #06b6d4' : 'none', color: this.state.activeTab === 'ledger' ? '#06b6d4' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Investor Ledger
                    </button>
                </div>

                {this.state.activeTab === 'shipments' ? (

                    <div className="investor-section">
                        <div className="investor-section__header">
                            <h3>Investment History</h3>
                        </div>

                        <div className="investment-list">
                            {investments.length === 0 ? (
                                <div className="empty-state">No shipments funded yet.</div>
                            ) : (
                                investments.map(inv => {
                                    const stats = profitStats.investments.find(s => s.investmentId === inv._id) || { realizedProfit: 0, quantitySold: 0, projectedProfit: 0, remainingUnits: 0 };
                                    const currentMode = shipmentModes[inv._id] || 'realtime';
                                    const isProjection = currentMode === 'projection';

                                    return (
                                        <div key={inv._id} className="investment-wrapper">
                                            <div
                                                className={`investment-item ${this.state.expandedInvestment === inv._id ? 'is-expanded' : ''}`}
                                                onClick={() => this.toggleDetails(inv._id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="investment-item__toggle" onClick={(e) => e.stopPropagation()}>
                                                    <div className="projection-toggle" style={{ fontSize: '11px' }}>
                                                        <span>Real Time</span>
                                                        <label className="switch" style={{ width: '34px', height: '18px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isProjection}
                                                                onChange={() => this.handleModeChange(inv._id, isProjection ? 'realtime' : 'projection')}
                                                            />
                                                            <span className="slider round"></span>
                                                        </label>
                                                        <span>Projection</span>
                                                    </div>
                                                </div>

                                                <div className="investment-item__main">
                                                    <div className="investment-item__title">
                                                        {inv.importOrder ? (inv.importOrder.supplier?.name || 'N/A') : 'Unknown Supplier'}
                                                        <span className="shipment-badge">{inv.shipmentId}</span>
                                                        <i className={`fa fa-chevron-${this.state.expandedInvestment === inv._id ? 'up' : 'down'}`} style={{ fontSize: '12px', color: '#94a3b8' }}></i>
                                                    </div>
                                                    <div className="investment-item__details">
                                                        <span>Shipment Date: {new Date(inv.created).toLocaleDateString()}</span>
                                                        <span>Ratio: {(inv.contributionRatio * 100).toFixed(1)}%</span>
                                                        <span className="info-tag" style={{ marginLeft: '10px', fontSize: '11px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                                                            Sold: {stats.quantitySold} / Unsold: {stats.remainingUnits}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="investment-item__stats" style={{ marginTop: '20px' }}>
                                                    <div className="item-stat">
                                                        <label>Capital</label>
                                                        <div className="value">৳{inv.capitalAmount.toLocaleString()}</div>
                                                    </div>
                                                    <div className="item-stat">
                                                        <label>{isProjection ? 'Estimated Total' : 'Sold Profit'}</label>
                                                        <div className="value text-neon--green">
                                                            {isProjection
                                                                ? `৳${Math.round(stats.realizedProfit + stats.projectedProfit).toLocaleString()}`
                                                                : `৳${Math.round(stats.realizedProfit).toLocaleString()}`
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {this.state.expandedInvestment === inv._id && (
                                                <div className="investment-details-panel">
                                                    <table className="details-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Product</th>
                                                                <th>Sold</th>
                                                                <th>Unsold</th>
                                                                <th>Profit (Real)</th>
                                                                <th>Projected</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(stats.products || []).map(p => (
                                                                <tr key={p.productId}>
                                                                    <td>{p.name} <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.shortName}</div></td>
                                                                    <td>{p.quantitySold}</td>
                                                                    <td>{p.remainingUnits}</td>
                                                                    <td className="text-neon--green">৳{Math.round(p.realizedProfit).toLocaleString()}</td>
                                                                    <td className="text-neon--purple">৳{Math.round(p.projectedProfit).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="investor-section">
                        <div className="ledger-table-container">
                            <table className="details-table ledger-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Reference</th>
                                        <th>Amount</th>
                                        <th>Balance</th>
                                        <th>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(profitStats.ledger || []).map((entry, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`ledger-badge badge-${entry.type.toLowerCase()}`}>
                                                    {entry.type}
                                                </span>
                                            </td>
                                            <td>{entry.ref}</td>
                                            <td className={entry.amount >= 0 ? 'text-neon--green' : 'text-neon--orange'} style={{ fontWeight: 'bold', color: entry.amount < 0 ? '#f97316' : '' }}>
                                                {entry.amount >= 0 ? '+' : ''}৳{entry.amount.toLocaleString()}
                                            </td>
                                            <td style={{ fontWeight: 'bold' }}>৳{Math.round(entry.balance).toLocaleString()}</td>
                                            <td style={{ fontSize: '12px', color: '#64748b' }}>{entry.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {this.state.isPayoutModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Record Profit Withdrawal</h3>
                                <button className="close-btn" onClick={() => this.setState({ isPayoutModalOpen: false })}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Withdrawal Amount (৳)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={this.state.payoutAmount}
                                        onChange={(e) => this.setState({ payoutAmount: e.target.value })}
                                        placeholder="Enter amount to withdraw"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Note (Optional)</label>
                                    <textarea
                                        className="form-input"
                                        value={this.state.payoutNote}
                                        onChange={(e) => this.setState({ payoutNote: e.target.value })}
                                        placeholder="e.g. Bank transfer, Cash payout"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-neon" onClick={() => this.setState({ isPayoutModalOpen: false })}>Cancel</button>
                                <button className="btn-neon btn-neon--cyan" onClick={this.handlePayoutSubmit}>Confirm Withdrawal</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default InvestorProfit;
