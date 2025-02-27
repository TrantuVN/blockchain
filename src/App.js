import React, { useState } from "react"; //Often, you’ll want your component to “remember” some information and display it
import { pinata } from "./config";
import { ethers } from "ethers";
import "./App.css"; //the styles for your components

//Now you can declare a state variable inside your component,useState is declares a state variable that you can update directly.
function App() {
  const [selectedFile, setSelectedFile] = useState(null);//You’ll get two things from useState: the current state (selectedFile), and the function that lets you update it (setSelectedFile)
  const [ipfsHash, setIpfsHash] = useState(""); //
  const [storedHash, setStoredHash] = useState("");
  const [account, setAccount] = useState(null); 
  const [provider, setProvider] = useState(null); 
  const [balance, setBalance] = useState(null); 
  const [isConnected, setIsConnected] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(null); 

  // Replace these with your deployed contract's details
  const contractAddress = "0xf54b2bd705e8025a8f93c31451cf304771a3e9e8";
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
//clearly indicates that the function handles file changes,the file is stored in the selectedFile state and its name is displayed below.
  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
  };
//This function attempts to connect to MetaMask (or another Ethereum provider) and retrieve the user's wallet address.
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum); //This creates an ethers.js Web3 provider, which allows interaction with the Ethereum blockchain.
        await provider.send("eth_requestAccounts", []); // Request account access

        const signer = provider.getSigner(); // Get the signer and allows signing transactions
        const address = await signer.getAddress(); //Retrieve account address
//Update React state (if successful)
        setAccount(address); //Stores the connected wallet address.
        setProvider(provider); //Stores the Ethereum provider (used for blockchain interactions).
        setIsConnected(true); //Updates the UI to indicate a successful connection.
        fetchBalance(provider, address); //Calls a function to retrieve and display the user's ETH balance
        setErrorMessage(null); //Clears any previous error messages
      } catch (error) {
        console.error("Error connecting:", error);//If an error occurs, it is logged in the console.
        setErrorMessage(error.message); 
        setIsConnected(false); 
        setAccount(null); 
        setBalance(null); 
      }
    } else {
      setErrorMessage("Please install MetaMask!"); 
    }
  };
//Disconnect with wallet
  const disconnectWallet = async () => {
    if (window.ethereum && provider) {
      try {
        // Reset the state to "disconnected"
        setAccount(null);
        setBalance(null);
        setProvider(null);
        setIsConnected(false);
        setErrorMessage(null);

      } catch (error) {
        console.error("Error disconnecting:", error); //If an error occurs, it is logged in the console.
      }
    }
  };
//Fetches the wallet balance from the Ethereum blockchain.
  const fetchBalance = async (provider, address) => {
    try {
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
//The function handleSubmission uploads a file to IPFS using Pinata and stores the resulting IPFS hash on the blockchain
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
//The function storeHashOnBlockchain interacts with an Ethereum smart contract to store an IPFS hash on the blockchain using ethers.js
  const storeHashOnBlockchain = async (hash) => {
    try {
      // gets the current connected wallet 
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
//Retrieve the IPFS hash from the contract
  const retrieveHashFromBlockchain = async () => {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      // Calls the smart contract function getIPFSHash(), which fetches the stored IPFS hash.
      const retrievedHash = await contract.getIPFSHash();
      //Updates the React state setStoredHash(retrievedHash) with the retrieved hash
      setStoredHash(retrievedHash);
      console.log("Retrieved IPFS hash from blockchain:", retrievedHash);
    } catch (error) {
      console.log("Failed to retrieve IPFS hash from blockchain:", error);
    }
  };
//This React component renders a UI, <button> is a JSX element. A JSX element is a combination of JavaScript code and HTML tags that describes what you’d like to display
// ClassName="" is a button property or prop that tells CSS how to style the button
// >X< is the text displayed inside of the button and </button> closes the JSX element to indicate that any following content shouldn’t be placed inside the button.
// div: group into a row
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
