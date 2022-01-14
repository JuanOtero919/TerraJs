import {
  LCDClient,
  MnemonicKey,
  MsgExecuteContract,
  isTxError,
  Coins,
  WebSocketClient,
} from "@terra-money/terra.js";
import fetch from "isomorphic-fetch";
import {} from "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "process";

//--------------------------------------------
// LCD configuration
//--------------------------------------------
const gasPrices = await (
  await fetch("https://fcd.terra.dev/v1/txs/gas_prices")
).json();
const gasPricesCoins = new Coins(gasPrices);

const lcd = new LCDClient({
    URL: process.env.TESTNET_TERRA_NODE_URL, 
    chainID: process.env.TESTNET_TERRA_CHAIN_ID,
    gasPrices: gasPricesCoins,
    gasAdjustment: "1.5",
    gas: 10000000,
});
  
const mk = new MnemonicKey({
    mnemonic: process.env.TESTNET_MNEMONIC,
});

const wallet = lcd.wallet(mk);

// UST <> LUNA
const pool = "terra156v8s539wtz0sjpn8y8a8lfg8fhmwa7fy22aff";
//--------------------------------------------
// LCD configuration
//--------------------------------------------

//--------------------------------------------
// Socket Configuration
//--------------------------------------------
const wsclient = new WebSocketClient(
  "https://bombay.stakesystems.io:2053/websocket"
);

const tmQuery = {
  "message.action": "/terra.wasm.v1beta1.MsgExecuteContract",
  "message.sender": "terra156v8s539wtz0sjpn8y8a8lfg8fhmwa7fy22aff",
  "from_contract.contract_address": "terra156v8s539wtz0sjpn8y8a8lfg8fhmwa7fy22aff",
  "from_contract.action": "swap",
  "from_contract.offer_asset": "uusd",
  "from_contract.ask_asset": "uluna",
};

let count = 0;
//--------------------------------------------
// Socket Configuration
//--------------------------------------------

//--------------------------------------------
// Enter amount to sell
//--------------------------------------------
var answer;
let amountTX;
var valoresAceptados = /^[0-9]+$/;
const rl = readline.createInterface({ input, output });
answer = await rl.question("Amount LUNA sell: ");
console.log(`Thank you, LUNA SELL:  ${answer}`);
rl.close();

// Change to 6 zeros
amountTX = answer + "0000";

if (!amountTX.match(valoresAceptados)) {
  console.log("It's not a number ");
  throw new Error("Invalid data " + amountTX);
}
//--------------------------------------------
// Enter amount to sell
//--------------------------------------------


let contador = 0;
let cont = 0;
let beliefPriceSnipper;

//--------------------------------------------
//  TX SELL Luna to Ust
//--------------------------------------------
const main = async () => {
  console.log(
    "HORA INICIO TX: " +
      cont +
      " ----------->   " +
      new Date().toLocaleTimeString()
  );
  //Create msg execute
  const terraSwap = new MsgExecuteContract(
    wallet.key.accAddress,
    pool,
    {
      swap: {
        max_spread: "0.03",
        offer_asset: {
          info: {
            native_token: {
              denom: "uluna",
            },
          },
          amount: amountTX,
        },
        belief_price: beliefPriceSnipper,
      },
    },
    new Coins({ uluna: amountTX })
  );

  // Create and sign transaction
  const tx = await wallet.createAndSignTx({
    msgs: [terraSwap],
    memo: `Learning about Terra.js`,
  });

  // Broadcast transaction
  const txResult = await lcd.tx.broadcast(tx);

  if (isTxError(txResult)) {
    console.log("                ERROR TX!!!!!!  " + cont + " ...");
    cont++;
    console.log(
      "Failure  ----------->   " + new Date().toLocaleTimeString()
    );
    throw new Error(
      `encountered an error while running the transaction: ${txResult.code} ${txResult.codespace}`
    );
  } else {
    console.log("........................");
    console.log(".........SUCESS.........");
    console.log("........................");
    console.log(
      "HORA EXITO TX: " +
        cont +
        " ----------->   " +
        new Date().toLocaleTimeString()
    );
    cont++;
  }
};
//--------------------------------------------
//  TX SELL Luna to Ust
//--------------------------------------------

//--------------------------------------------
//  Belief Price
//--------------------------------------------
const sniper = async () => {
  // Fetch the number of each asset in the pool.
  let { assets } = await lcd.wasm.contractQuery(pool, { pool: {} });
  // Calculate belief price using pool balances.
  beliefPriceSnipper = (assets[1].amount / assets[0].amount).toFixed(18);

  console.log("Rate Pool: " + cont + " " + beliefPriceSnipper);
  console.log("HOUR SNIPPER: " + cont + " ----------->   " + new Date().toLocaleTimeString());
};
//--------------------------------------------
//  Belief Price
//--------------------------------------------


//--------------------------------------------
//  SwapTracker
//--------------------------------------------
wsclient.subscribeTx(tmQuery, (data) => {
    console.log(" ");
    console.log(" ");
    console.log("Swap sell occured! -- TIME -->"+ new Date().toLocaleTimeString() );
    console.log("HASH TX ------------> "+data.value.TxResult.txhash);
    console.log("HEIGHT TX ----------> "+data.value.TxResult.height);
    console.log(" ");
    if (count === 2) {
      wsclient.destroy();
    }
    count += 1;
    sniper()
    .then((resp) => {
      console.log("--------------------------------------------------------------------");
    })
    .then((result) => main())
    .then((resp) => {
      console.log("--------------------------------------------------------------------");
    })
    .catch((err) => {
      console.log("ERROR SNIP");
      console.log("Failure:  -----------> " + new Date().toLocaleTimeString());
    });
});
//--------------------------------------------
//  SwapTracker
//--------------------------------------------

console.log("Start: "+new Date().toLocaleTimeString());
wsclient.start();
