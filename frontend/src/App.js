import './App.css';
import { useEffect, useState } from "react";
import "./App.css";
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, web3, utils, BN } from "@project-serum/anchor";
import { Buffer } from "buffer";
window.Buffer = Buffer;


const { SystemProgram } = web3;
const programID = new PublicKey(idl.metadata.address);
const netword = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  const getProvider = () => {
    const connection = new Connection(netword, opts.preflightCommitment);
    // window.solana   connected wallet
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment);
    console.log("provider", provider);
    return provider;
  }



  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana && solana.isPhantom) {
        console.log("solana wallet found");
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(
          "connected with wallet public key : ",
          response.publicKey.toString()
        );
        setWalletAddress(response.publicKey.toString());
      } else {
        alert("get Phantom wallet please");
      }
    } catch (error) {
      console.error(error);
    }
  }

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log(
        "connected with wallet public key : ",
        response.publicKey.toString()
      );
      setWalletAddress(response.publicKey.toString());
    }
  }


  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect Wallet</button>
  )


  const renderCreateCampaign = () => (
    <>
      <button className="cta-button connect-wallet-button" onClick={createCampaign}>Create Campagin </button>
      <br />
      <button className="cta-button connect-wallet-button" onClick={getCampaigns}>Get Campagins </button>
      <br />
	    <div className="campaign-dev">
          <p>Campagin Admin : Bcfv9rWiz4v9rALeuLaSndZGzvTpnstfQVbs7Uo6ZrDi</p>
          <p>Campagin ID : 8XDeqDAFQdWab6Bp7RhVTrXi8yTnjTBKk6nJvwVZYQ</p>
          <p>
            Balance: 0.02
          </p>
          <p>Test Education</p>
          <p>Test Education.description</p>
          <button >Donate 0.2 SOLs</button> <br />
          <button>Withdraw</button>
        </div>
		
      {campaigns.map((campaign) => (
        <div className="campaign-dev" key={campaign.pubkey.toString()}>
          <p>Campagin Admin : {campaign.admin.toString()}</p>
          <p>Campagin ID : {campaign.pubkey.toString()}</p>
          <p>
            Balance: {(campaign.amountDonated / LAMPORTS_PER_SOL).toString()}
          </p>
          <p>{campaign.name}</p>
          <p>{campaign.description}</p>
          <button onClick={() => { donate(campaign.pubkey) }}>Donate 0.2 SOLs</button> <br />
          <button onClick={() => { withdraw(campaign.pubkey) }}>Withdraw</button>
        </div>
      )
      )}
    </>

  )



  const getCampaigns = async () => {
    const connection = new Connection(netword, opts.preflightCommitment);
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    Promise.all((await connection.getProgramAccounts(programID)).map(
      async (campaign) => {
        return {
          ...await program.account.campaign.fetch(campaign.pubkey),
          pubkey: campaign.pubkey
        }
      })).then((campaigns) => {
        console.log(campaigns);
        setCampaigns(campaigns);
      });

  }


  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const [campaign] = await PublicKey.findProgramAddress([
        utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
        provider.wallet.publicKey.toBuffer()
      ],
        program.programId);

      await program.rpc.create(
        "Campaign Title0",
        "Campaign description for the first campaign in crowdfunding0",
        {
          accounts: {
            campaign,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId
          }

        });
      console.log("created campagin with address :", campaign.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const donate = async (pubkey) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const amount = 0.2;

      await program.rpc.donate(
        new BN(amount * LAMPORTS_PER_SOL),
        {
          accounts: {
            campaign: pubkey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId
          }

        });
      console.log(`Dontated ${amount} SOLS to campagin with address : ${pubkey.toString()}`);
      getCampaigns();
    } catch (error) {
      console.error("Error Donating", error);
    }
  }


  const withdraw = async (pubkey) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const amount = 0.3;

      await program.rpc.withdraw(
        new BN(amount * LAMPORTS_PER_SOL),
        {
          accounts: {
            campaign: pubkey,
            user: provider.wallet.publicKey,
          }

        });
      console.log(`withdrawn ${amount} SOLs from  Campain with address : ${pubkey.toString()}`);
      getCampaigns();
    } catch (error) {
      console.error("Error Withdrawing", error);
    }
  }




  useEffect(() => {
    const onload = async () => {
      await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onload);

    return () => window.removeEventListener('load', onload);
  }, []);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">Donate Kart</p>
          <p className="sub-text">Crowdfunding</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderCreateCampaign()}
        </div>
      </div>
    </div>
  );
};

export default App;