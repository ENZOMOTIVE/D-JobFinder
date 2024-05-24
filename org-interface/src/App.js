import React, { useState } from 'react';
import './App.css';

function OrgInterface() {
  const [orgData, setOrgData] = useState({ companySize: '', companyReviews: '', workingHours: '' });

  const handleChange = (e) => {
    setOrgData({
      ...orgData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Handle form submission here
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="OrgInterface">
      <h1>Organisation Interface</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Company Size:
          <input type="number" name="companySize" value={orgData.companySize} onChange={handleChange} />
        </label>
        <br />
        <label>
          Company Reviews (out of 5):
          <input type="number" name="companyReviews" value={orgData.companyReviews} onChange={handleChange} />
        </label>
        <br />
        <label>
          Working Hours per Week:
          <input type="number" name="workingHours" value={orgData.workingHours} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default OrgInterface;
