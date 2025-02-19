import React, { useState } from "react";
import { pinata } from "./config";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [storedHash, setStoredHash] = useState("");
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Replace these with your deployed contract's details
  const contractAddress = "0xf54b2bd705e8025a8f93c31451cf304771a3e9e8";
  const contractABI = [
    {
      "inputs": [],
      "name": "getIPFSHash",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        }
      ],
      "name": "setIPFSHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request account access

        const signer = provider.getSigner(); // Get the signer
        const address = await signer.getAddress();

        setAccount(address);
        setProvider(provider);
        setIsConnected(true);
        fetchBalance(provider, address);
        setErrorMessage(null); // Clear any previous errors
      } catch (error) {
        console.error("Error connecting:", error);
        setErrorMessage(error.message); // Set the error message for display
        setIsConnected(false); // Ensure isConnected is false in case of error
        setAccount(null);
        setBalance(null);
      }
    } else {
      setErrorMessage("Please install MetaMask!");
    }
  };

  const disconnectWallet = async () => {
    if (window.ethereum && provider) {
      try {
        // No direct disconnect in MetaMask, but you can reset state
        setAccount(null);
        setBalance(null);
        setProvider(null);
        setIsConnected(false);
        setErrorMessage(null);

      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    }
  };

  const fetchBalance = async (provider, address) => {
    try {
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleSubmission = async () => {
    try {
      if (!selectedFile) {
        console.error("No file selected");
        return;
      }

      const response = await pinata.upload.file(selectedFile);
      const ipfsHash = response.IpfsHash;
      setIpfsHash(ipfsHash);

      await storeHashOnBlockchain(ipfsHash);
    } catch (error) {
      console.log("File upload failed:", error);
    }
  };

  const storeHashOnBlockchain = async (hash) => {
    try {
      // Get the signer
      const signer = provider.getSigner();

      // Create a contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Send the transaction to store the IPFS hash on the blockchain
      const tx = await contract.setIPFSHash(hash);
      await tx.wait();

      console.log("IPFS hash stored on blockchain:", hash);
    } catch (error) {
      console.log("Failed to store IPFS hash on blockchain:", error);
    }
  };

  const retrieveHashFromBlockchain = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      // Retrieve the IPFS hash from the blockchain
      const retrievedHash = await contract.getIPFSHash();
      setStoredHash(retrievedHash);

      console.log("Retrieved IPFS hash from blockchain:", retrievedHash);
    } catch (error) {
      console.log("Failed to retrieve IPFS hash from blockchain:", error);
    }
  };

  return (
    <div className="app-container">
      <h1>MetaMask Connection</h1>
      {!isConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected Account: {account}</p>
          <p>Balance: {balance} ETH</p>
          <div className="upload-section">
            <label className="form-label">Choose File</label>
            <input type="file" onChange={changeHandler} className="file-input" />
            <button onClick={handleSubmission} className="submit-button">
              Submit
            </button>
          </div>

          {ipfsHash && (
            <div className="result-section">
              <p>
                <strong>IPFS Hash:</strong> {ipfsHash}
              </p>
            </div>
          )}

          <div className="retrieve-section">
            <button onClick={retrieveHashFromBlockchain} className="retrieve-button">
              Retrieve Stored Hash
            </button>
            {storedHash && (
              <p>
                <strong>Stored IPFS Hash:</strong> {storedHash}
              </p>
            )}
          </div>
          <button onClick={disconnectWallet}>Disconnect MetaMask</button>
        </div>
      )}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>} {/* Display error message */}

    </div>
  );
}

export default App;


//https://gateway.pinata.cloud/ipfs/
