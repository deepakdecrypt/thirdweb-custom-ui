import { createThirdwebClient } from "thirdweb";
import "./App.css";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useConnect,
} from "thirdweb/react";
import { createWallet, injectedProvider, WalletId, privateKeyToAccount } from "thirdweb/wallets";
import { useState } from "react";
import { createAuth } from "thirdweb/auth";

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_CLIENT_ID,
});
let privateKey = import.meta.env.VITE_PRIVATE_KEY;

const thirdwebAuth = createAuth({
  domain: "localhost:5173",
  client,
  adminAccount: privateKeyToAccount({ client, privateKey }),
});

type WalletOption = {
  name: string;
  walletId: WalletId;
};

const walletOptions: WalletOption[] = [
  {
    name: "Metamask",
    walletId: "io.metamask",
  },
  {
    name: "Coinbase",
    walletId: "com.coinbase.wallet",
  },
  {
    name: "WalletConnect",
    walletId: "walletConnect",
  },
];

function App() {
  const { connect, isConnecting, error } = useConnect();
  const [selectedWalletId, setSelectedWalletId] = useState<WalletId>();
  const account = useActiveAccount();
  const connectedWallet = useActiveWallet();
  const [loggedIn, setLoggedIn] = useState(false);

  const connectWithWallet = (walletId: WalletId) => {
    connect(async () => {
      const wallet = createWallet(walletId); // pass the wallet id

      // if user has metamask installed, connect to it
      if (injectedProvider(walletId)) {
        await wallet.connect({ client });
      }
      // open wallet connect modal so user can scan the QR code and connect
      else {
        await wallet.connect({
          client,
          walletConnect: { showQrModal: true },
        });
      }
      // return the wallet
      return wallet;
    });
  };

  return (
    <>
      {account ? (
        <>
          <ConnectButton client={client}
          auth={{
            getLoginPayload: async (params) => {
              return thirdwebAuth.generatePayload(params);
            },
            doLogin: async (params) => {
              const verifiedPayload =
                await thirdwebAuth.verifyPayload(params);
              setLoggedIn(verifiedPayload.valid);
            },
            isLoggedIn: async () => {
              return loggedIn;
            },
            doLogout: async () => {
              setLoggedIn(false);
            },
          }}
          
          />
          {connectedWallet && (
            <div
              style={{
                marginTop: "12px",
                textAlign: "left",
                border: "1px solid black",
                padding: "4px",
                maxWidth: "251px",
              }}
            >
              <div>Connected wallet:</div>
              <pre style={{ overflowX: "auto" }}>
                {JSON.stringify(connectedWallet, null, 2)}
              </pre>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {walletOptions.map((wallet) => (
              <button
                key={wallet.walletId}
                // Disable the buttons during the connecting process
                disabled={isConnecting}
                onClick={() => {
                  connectWithWallet(wallet.walletId);
                  setSelectedWalletId(wallet.walletId);
                }}
              >
                {isConnecting && selectedWalletId === wallet.walletId
                  ? "Connecting..."
                  : `Connect with ${wallet.name}`}
              </button>
            ))}
          </div>

          {error && Object.keys(error).length > 0 && (
            <div
              style={{
                marginTop: "12px",
                textAlign: "left",
                border: "1px solid black",
                padding: "4px",
                maxWidth: "251px",
              }}
            >
              <div>Error:</div>
              <pre style={{ overflowX: "auto" }}>
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default App;
