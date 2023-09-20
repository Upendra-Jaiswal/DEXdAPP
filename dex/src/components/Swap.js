import { React, useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import tokenList from "../tokenList.json";
import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from "wagmi";
import { sendTransaction } from "@wagmi/core";

function Swap(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [oneTokenAmount, setOneTokenAmount] = useState(null);
  const [twoTokenAmount, setTwoTokenAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setISOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  });

  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    },
  });

  useEffect(() => {
    if (txDetails.to && isConnected) {
      sendTransaction();
    }
  }, [txDetails]);

  const switchTokens = () => {
    setPrices(null);
    setOneTokenAmount(null);
    setTwoTokenAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  };

  const handleSlippage = (e) => {
    setSlippage(e.target.value);
  };

  const settings = () => (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippage}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>

          <Radio.Button value={2.5}>2.5%</Radio.Button>

          <Radio.Button value={5}>5%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  const changeAmount = (e) => {
    setOneTokenAmount(e.target.value);
    console.log(prices.usdPrices.ratio);
    if (e.target.value && prices) {
      setTwoTokenAmount((e.target.value * prices.usdPrices.ratio).toFixed(2));
    } else {
      setTwoTokenAmount(null);
    }
  };

  const openModal = (asset) => {
    setChangeToken(asset);
    setISOpen(true);
  };

  const modifyToken = (i) => {
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address);
    }
    setISOpen(false);
  };

  async function fetchPrices(one, two) {
    // const res = await axios.get("https://localhost:3001/tokenPrice", {
    //   params: { addressOne: one, addressTwo: two },
    // });
    const res = await axios.get(`http://localhost:3001/tokenPrice`, {
      params: { addressOne: one, addressTwo: two },
    });
    console.log(res.data);
    setPrices(res.data);
  }
async function fetchDexSwap(){
try{
  const allowance = await axios.get(`https://api.1inch.io/v5.0/1/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`);

if(allowance.data.allowance==="0"){
  const approve = await axios.get(`https://api.1inch.io/v5.0/1/approve/transaction?tokenAddress=${tokenOne.address}`)

  setTxDetails(approve.data)
  console.log("not approved");
  return

}
console.log("make swap")
const tx = await axios.get(
  `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${tokenOne.address}&toTokenAddress=${tokenTwo.address}&amount=${oneTokenAmount.padEnd(tokenOne.decimals+oneTokenAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
)

let decimals = Number(`1E${tokenTwo.decimals}`)
setTwoTokenAmount((Number(tx.data.toTokenAmount)/decimals).toFixed(2));

setTxDetails(tx.data.tx);
}
catch(error){
  console.log("testnets not supported, Mainnet required.")
  messageApi.open({
    type: 'error',
    content: 'testnets not supported, Mainnet required.',
    duration: 2,
  })
}

}


  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
  }, []);
  return (
    <>
     {contextHolder}
      <Modal
        footer={null}
        open={isOpen}
        onCancel={() => setISOpen(false)}
        title="Select a Token"
      >
        <div className="modalContent">
          {tokenList?.map((e, i) => {
            return (
              <>
                <div
                  className="tokenChoice"
                  key={i}
                  onClick={() => modifyToken(i)}
                >
                  <img src={e.img} alt={e.ticker} className="tokenLogo" />
                  <div className="tokenChoiceNaames">
                    <div className="tokenName">{e.name}</div>
                    <div className="tokenTicker">{e.ticker}</div>
                  </div>
                </div>
              </>
            );
          })}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            value={oneTokenAmount}
            onChange={changeAmount}
            disabled={!prices}
          />
          <Input placeholder="0" value={twoTokenAmount} disabled={true} />{" "}
          <div className="switchButton" onClick={switchTokens}>
            {" "}
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetOneLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>
        <div className="swapButton" disabled={!oneTokenAmount || !isConnected} onClick={fetchDexSwap} >
          {!isConnected ? "Connect wallet for SWAP" : "SWAP"}
        </div>
      </div>
    </>
  );
}

export default Swap;
