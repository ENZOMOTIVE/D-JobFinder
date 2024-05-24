const express = require('express');
const bodyParser = require('body-parser');  // used to parse data in HTTP requests
const {Web3} = require('web3');
const { BlobServiceClient, BlockBlobClient } = require('@azure/storage-blob');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
require('dotenv').config();  


app.use(morgan('dev')); // Log requests to the console
app.use(bodyParser.json());
app.use(cors());

//integration with the blockchain
const web3 = new Web3(new Web3.providers.HttpProvider('RPC_SERVER_LINK'));
const contractABI= ['MY_CONTRACT_ABI'];
const contractAddress = 'MY_CONTRACT_ADDRESS'; //contract deply address
const contract = new web3.eth.Contract(contractABI,contractAddress);
const systemAddress = 'MY_WALLET_ADDRESS'; //wallet address


//Microsoft Azure Integration
const blobServiceClient = BlobServiceClient.fromConnectionString('AZURE-CONNECTION-STRING'); //Azure storage connection string
const containerClient = blobServiceClient.getContainerClient('AZURE-CONTAINER-NAME'); //Container name

//Admin criteria
let adminCriteria = {};


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.post('/admin-interface',(req, res) => {
    adminCriteria = req.body;
    res.json({ message: 'Criteria saved succesfully'});
});

app.post('/user-interface', async (req, res) => {
    const userData = req.body;
    const { ph, temp, turbidity, walletAddress } = userData;

    console.log("Received user data:", userData);

    // Validation
    const result = validateData(userData);
    console.log("Validation result:", result);

    // Save JSON file to the blob storage
    const fileName = `result-${Date.now()}.json`;
    console.log("File name:", fileName);

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    console.log("Block blob client:", blockBlobClient);

    try {
        const uploadResponse = await blockBlobClient.upload(
            JSON.stringify({ ...userData, result }),
            Buffer.byteLength(JSON.stringify({ ...userData, result }))
        );
        console.log("File uploaded successfully:", uploadResponse);

        // Get the file URL
        const fileUrl = blockBlobClient.url;
        console.log("File URL:", fileUrl);

        // Prepare transaction data for MetaMask
        const tx = contract.methods.storeFileMetadata(ph, temp, turbidity, fileUrl);
        const txData = tx.encodeABI();
        console.log("Transaction data prepared:", txData);

        // Send transaction using the user's wallet address
        const nonce = await web3.eth.getTransactionCount(systemAddress);
        console.log("Nonce:", nonce);

        const gasLimit = await contract.methods.storeFileMetadata(ph, temp, turbidity, fileUrl).estimateGas({ from: systemAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const txObject = {
            nonce: web3.utils.toHex(nonce),
            to: contractAddress,
            gasLimit: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(gasPrice),
            data: txData
        };
        console.log("Transaction object:", txObject);

        const signedTx = await web3.eth.accounts.signTransaction(txObject, process.env.PRIVATE_KEY);
        console.log("Transaction signed:", signedTx);

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log("Transaction sent, receipt:", receipt);

        // Get the transaction hash
        const transactionHash = receipt.transactionHash;

        // Update the blob storage with the transaction hash
        const updatedUploadResponse = await blockBlobClient.upload(
            JSON.stringify({ ...userData, result, transactionHash }),
            Buffer.byteLength(JSON.stringify({ ...userData, result, transactionHash })),
            { overwrite: true } // Overwrite the previous file
        );
        console.log("File updated successfully with transaction hash:", updatedUploadResponse);

        res.json({
            validation: result,
            contractAddress: contractAddress,
            transactionHash: transactionHash,
            fileUrl: fileUrl
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Transaction failed', details: error.message });
    }
});

function validateData(userData) {
    //we can implement the logic
    if (userData.ph > adminCriteria.ph && userData.temp > adminCriteria.temp && userData.turbidity === adminCriteria.turbidity) {
        return 'Good';
    } else {
        return 'Bad';
    }
}


// Start the server
const PORT = process.env.PORT || 3000 ;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});