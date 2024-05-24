const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const { BlobServiceClient } = require('@azure/storage-blob');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
require('dotenv').config();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors());

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_SERVER_URL));
const contractABI = process.env.CONTRACT_ABI;
const contractAddress = process.env.CONTRACT_ADDRESS; //Address of the Deployed Contract
const contract = new web3.eth.Contract(contractABI, contractAddress);

const blobServiceClient = BlobServiceClient.fromConnectionString('AZURE_CONNECTION_STRING');
const containerClient = blobServiceClient.getContainerClient('AZURE_CONTAINER_NAME');

let adminCriteria = {};

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.post('/admin-interface', (req, res) => {
    adminCriteria = req.body;
    res.json({ message: 'Criteria saved successfully' });
});

app.post('/org-interface', async (req, res) => {
    const orgData = req.body;
    const { companySize, companyReview, workingHours, walletAddress } = orgData;

    console.log("Received org data:", orgData);

    const result = validateData(orgData);
    console.log("Validation result:", result);

    const fileName = `result-${Date.now()}.json`;
    console.log("File name:", fileName);

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    console.log("Block blob client:", blockBlobClient);

    try {
        const uploadResponse = await blockBlobClient.upload(
            JSON.stringify({ ...orgData, result }),
            Buffer.byteLength(JSON.stringify({ ...orgData, result }))
        );
        console.log("File uploaded successfully:", uploadResponse);

        const fileUrl = blockBlobClient.url;
        console.log("File URL:", fileUrl);

        const txData = contract.methods.storeFileMetadata(companySize, companyReview, workingHours, fileUrl).encodeABI();
        console.log("Transaction data prepared:", txData);

        res.json({
            validation: result,
            contractAddress: contractAddress,
            txData: txData,
            fileUrl: fileUrl
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Transaction failed', details: error.message });
    }
});

function validateData(orgData) {
    if (orgData.companySize >= adminCriteria.companySize &&
        orgData.companyReview >= adminCriteria.companyReview &&
        orgData.workingHours <= adminCriteria.workingHours) {
        return 'Eligible';
    } else {
        return 'Fail';
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});