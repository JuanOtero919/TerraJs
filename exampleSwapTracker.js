import {
    LCDClient,
    MnemonicKey,
    MsgExecuteContract,
    Coins,
    WebSocketClient,
    Tx,
} from "@terra-money/terra.js";
import fetch from "isomorphic-fetch";
  
const gasPrices = await (await fetch('https://bombay-fcd.terra.dev/v1/txs/gas_prices')).json();
const gasPricesCoins = new Coins(gasPrices);
  
const lcd = new LCDClient({
    URL: "https://lcd.terra.dev",
    chainID: "columbus-5",
    gasPrices: gasPricesCoins,
    gasAdjustment: "1.5",
    gas: 10000000,
});


const wsclient =new WebSocketClient('wss://terra-node.mcontrol.ml/websocket');
//const wsclient =new WebSocketClient('wss://terra-rpc.easy2stake.com/websocket');
//const wsclient =new WebSocketClient('wss://terra.stakesystems.io:2053/websocket');
//const wsclient =new WebSocketClient('wss://http://public-node.terra.dev:26657/websocket');

// Record purchases in the LP pair
const tmQuery = {
    "message.action": "/terra.wasm.v1beta1.MsgExecuteContract",
    "message.sender": "terra1m6ywlgn6wrjuagcmmezzz2a029gtldhey5k552",
    "from_contract.contract_address": "terra1m6ywlgn6wrjuagcmmezzz2a029gtldhey5k552",
    "from_contract.action": "swap",
    "from_contract.offer_asset": "uusd",
    "from_contract.ask_asset": "uluna"
};

// Record sales in the LP pair  
// const tmQuery = {
//     "message.action": "/terra.wasm.v1beta1.MsgExecuteContract",
//     "message.sender": "terra1m6ywlgn6wrjuagcmmezzz2a029gtldhey5k552",
//     "from_contract.contract_address": "terra1m6ywlgn6wrjuagcmmezzz2a029gtldhey5k552",
//     "from_contract.action": "swap",
//     "from_contract.offer_asset": "uluna",
//     "from_contract.ask_asset": "uusd"
// };

let count = 0;
  
  // swap tracker
wsclient.subscribeTx(tmQuery, async data => {
    console.log("Swap occured! ---Hour--->"+ new Date().toLocaleTimeString() );
    //console.log("HASH TX ------------> "+data.value.TxResult.txhash);
    //console.log("HEIGHT TX ----------> "+data.value.TxResult.height);
    const txInfo = await lcd.tx.txInfo(data.value.TxResult.txhash);
    if (txInfo.logs) {
      // console.log(txInfo);
      // console.log(txInfo.logs[0].eventsByType);
      console.log("*************************************************************");
      console.log("HASH TX ------------> "+data.value.TxResult.txhash);
      console.log("HEIGHT TX ----------> "+data.value.TxResult.height);
      console.log("*************************************************************");
      console.log("Contract LP: -------> "+txInfo.logs[0].events[3].attributes.find(valor => valor.key === "contract_address").value);
      console.log("Receiver Address: --> "+txInfo.logs[0].events[3].attributes.find(valor => valor.key === "receiver").value);
      console.log("Offer_asset: -------> "+txInfo.logs[0].events[3].attributes.find(valor => valor.key === "offer_asset").value);
      console.log("ask_asset: ---------> "+txInfo.logs[0].events[3].attributes.find(valor => valor.key === "ask_asset").value);
      console.log("Offer_amount: ------> "+parseFloat(txInfo.logs[0].events[3].attributes.find(valor => valor.key === "offer_amount").value)/1000000);
      console.log("Return_amount: -----> "+parseFloat(txInfo.logs[0].events[3].attributes.find(valor => valor.key === "return_amount").value)/1000000);
      console.log("*************************************************************");
      console.log(" ");
      console.log(" ");
    }
    
    count += 1;
    if (count === 3) {
      wsclient.destroy();
    }
  
});
  
console.log("Start time -->"+ new Date().toLocaleTimeString() );
wsclient.start();