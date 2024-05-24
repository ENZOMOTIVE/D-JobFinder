import React, { useState } from 'react';
import './App.css';

function AdminInterface() {
  const [adminCriteria, setAdminCriteria] = useState({ companySize: '', companyReviews: '', workingHours: '' });

  const handleChange = (e) => {
    setAdminCriteria({
      ...adminCriteria,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/admin-interface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminCriteria)
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="AdminInterface">
      <h1>Admin Interface</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Company Size (No of Employees):
          <input type="number" name="companySize" value={adminCriteria.companySize} onChange={handleChange} />
        </label>
        <br />
        <label>
          Company Reviews (out of 5):
          <input type="number" name="companyReviews" value={adminCriteria.companyReviews} onChange={handleChange} />
        </label>
        <br />
        <label>
          Working Hours (per week):
          <input type="number" name="workingHours" value={adminCriteria.workingHours} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default AdminInterface;
