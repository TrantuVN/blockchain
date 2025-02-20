import React, { useState } from "react";
import { pinata } from "./config";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null); //Stores the file selected by the user for upload
  const [ipfsHash, setIpfsHash] = useState(""); //Stores the IPFS hash after the file is uploaded
  const [storedHash, setStoredHash] = useState("");//Holds a retrieved IPFS hash (possibly from a smart contract).
  const [account, setAccount] = useState(null); //Stores the Ethereum wallet address of the connected use
  const [provider, setProvider] = useState(null); //Stores the Ethereum provider (e.g., MetaMask, Infura).
  const [balance, setBalance] = useState(null); //Holds the Ethereum balance of the connected wallet
  const [isConnected, setIsConnected] = useState(false); //Tracks whether the wallet is connected (true or false)
  const [errorMessage, setErrorMessage] = useState(null); //Stores error messages related to connection or file upload failures.

  // Replace these with your deployed contract's details
  const contractAddress = "0xf54b2bd705e8025a8f93c31451cf304771a3e9e8"; //replacing contract address 
  //replacing ABI 
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
//handle, extract, update file state
  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
  };
//This function connects the user's Ethereum wallet (e.g., MetaMask) to the React app using Ethers.js
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request account access

        const signer = provider.getSigner(); // Get the signer
        const address = await signer.getAddress(); //Retrieve account address
//Update React state (if successful)
        setAccount(address); //Stores the connected wallet address
        setProvider(provider); //Saves the provider for future transactions
        setIsConnected(true); //Marks the wallet as connected
        fetchBalance(provider, address); //Fetches and updates the user's balance
        setErrorMessage(null); // Clear any previous errors
      } catch (error) {
        console.error("Error connecting:", error);
        setErrorMessage(error.message); // Set the error message for display
        setIsConnected(false); // Ensure isConnected is false in case of error
        setAccount(null); //Clears the stored Ethereum wallet address
        setBalance(null); //Clears the user's Ethereum balance
      }
    } else {
      setErrorMessage("Please install MetaMask!"); //display the error message
    }
  };
//This function resets wallet-related states to simulate a wallet disconnection in a React application
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
//This function retrieves the Ethereum balance of a connected wallet and updates the state
  const fetchBalance = async (provider, address) => {
    try {
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
//This function retrieves the Ethereum balance of a connected wallet and updates the state.
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
//This function store IPFS hash on blockchain
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
//This function retrieve IPFS hash on blockchain
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
//This React component renders a UI
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
