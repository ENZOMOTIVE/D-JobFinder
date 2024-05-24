import React, { useState } from 'react';
import {Web3} from 'web3';
import './App.css';

function OrgInterface() {
  const [orgData, setOrgData] = useState({ companySize: '', companyReview: '', workingHours: '' });
  const [response, setResponse] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const web3 = new Web3(Web3.givenProvider);

  const handleChange = (e) => {
    setOrgData({
      ...orgData,
      [e.target.name]: e.target.value
    });
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        console.log('Connected to wallet:', accounts[0]);
      } catch (error) {
        console.error('User rejected the request.');
      }
    } else {
      console.error('MetaMask is not installed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/org-interface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orgData)
      });
      const data = await res.json();
      
      if (data.validation === 'Eligible') {
        const tx = {
          to: data.contractAddress,
          data: data.txData,
          gas: data.gasLimit,
          gasPrice: data.gasPrice
        };
        
        const signedTx = await web3.eth.sendTransaction(tx, walletAddress);
        console.log('Transaction signed:', signedTx);
        
        setResponse('Eligible');
      } else {
        setResponse('Fail');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="OrgInterface">
      <h1>Organization Interface</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      {walletAddress && <p>Connected: {walletAddress}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Company Size:
          <input type="number" name="companySize" value={orgData.companySize} onChange={handleChange} />
        </label>
        <br />
        <label>
          Company Review:
          <input type="number" name="companyReview" value={orgData.companyReview} onChange={handleChange} />
        </label>
        <br />
        <label>
          Working Hours:
          <input type="number" name="workingHours" value={orgData.workingHours} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
      {response && (
        <div className={response === 'Eligible' ? 'score-eligible' : 'score-fail'}>
          Score: {response}
        </div>
      )}
    </div>
  );
}

export default OrgInterface;
