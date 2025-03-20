import { useEffect, useState } from 'react'
import { Contract, formatUnits, Interface, JsonRpcProvider } from "ethers";
import MULTICALL_ABI from "../abi/multicall.json"
import ERC20_ABI from "../abi/erc20_abi.json"
import UNISWAP_ABI from "../abi/uniswap_pair.json"


const FetchData = ({pairAddress}) => {
  const [totalSupply, setTotalSupply] = useState(0)
  const [token0, setToken0] = useState()
  const [token1, setToken1] = useState()
  const [token0Reserve, setToken0Reserve] = useState(0)
  const [token1Reserve, setToken1Reserve] = useState(0)
  const [token0Name, setToken0Name] = useState()
  const [token0Symbol, setToken0Symbol] = useState()
  const [token0Decimal, setToken0Decimal] = useState(0)
  const [token1Name, setToken1Name] = useState()
  const [token1Symbol, setToken1Symbol] = useState()
  const [token1Decimal, setToken1Decimal] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const multicallContractAddress = import.meta.env.VITE_MULTICALL_CONTRACT

  useEffect(() => {
    makeMultipleCalls()

    if (totalSupply && token0 && token1 && token0Reserve && token1Reserve && token0Name && 
        token0Symbol && token0Decimal && token1Name && token1Symbol && token1Decimal) {
      setLoading(false)
    } else {
      setLoading(true)
    }
  })

  const makeMultipleCalls = async () => {
    try {
      const provider = new JsonRpcProvider(import.meta.env.VITE_ALCHEMY_MAINNET_RPC)
      const uniswapAbiInterface = new Interface(UNISWAP_ABI)
      const erc20AbiInterface = new Interface(ERC20_ABI)
      const multicallContract = new Contract(
        multicallContractAddress,
        MULTICALL_ABI,
        provider
      )

    const calls = [
      {target: pairAddress, callData: uniswapAbiInterface.encodeFunctionData("token0", [])},
      {target: pairAddress, callData: uniswapAbiInterface.encodeFunctionData("token1", [])},
      {target: pairAddress, callData: uniswapAbiInterface.encodeFunctionData("getReserves", [])},
      {target: pairAddress, callData: uniswapAbiInterface.encodeFunctionData("totalSupply", [])},
    ]
    
    const resultArray = await multicallContract.aggregate.staticCall(calls)

    const results = JSON.parse(JSON.stringify(resultArray[1]))
    
    const token0Result = uniswapAbiInterface.decodeFunctionResult("token0", results[0])
    const token1Result = uniswapAbiInterface.decodeFunctionResult("token1", results[1])
    const getReservesResult = uniswapAbiInterface.decodeFunctionResult("getReserves", results[2])
    const totalSupplyResult = uniswapAbiInterface.decodeFunctionResult("totalSupply", results[3])
    setToken0(token0Result[0]);
    setToken1(token1Result[0]);
    setTotalSupply(totalSupplyResult[0]);
    setToken0Reserve(getReservesResult[0])
    setToken1Reserve(getReservesResult[1]);

    const tokenDetailsCalls = [
      {target: token0, callData: erc20AbiInterface.encodeFunctionData("name", [])},
      {target: token0, callData: erc20AbiInterface.encodeFunctionData("symbol", [])},
      {target: token0, callData: erc20AbiInterface.encodeFunctionData("decimals", [])},
      {target: token1, callData: erc20AbiInterface.encodeFunctionData("name", [])},
      {target: token1, callData: erc20AbiInterface.encodeFunctionData("symbol", [])},
      {target: token1, callData: erc20AbiInterface.encodeFunctionData("decimals", [])},
    ]
    
    const res = await multicallContract.aggregate.staticCall(tokenDetailsCalls)
    const resArr = JSON.parse(JSON.stringify(res[1]));
    
    const token0NameResult = erc20AbiInterface.decodeFunctionResult("name", resArr[0])
    const token0SymbolResult = erc20AbiInterface.decodeFunctionResult("symbol", resArr[1])
    const token0DecimalsResult = erc20AbiInterface.decodeFunctionResult("decimals", resArr[2])
    const token1NameResult = erc20AbiInterface.decodeFunctionResult("name", resArr[3])
    const token1SymbolResult = erc20AbiInterface.decodeFunctionResult("symbol", resArr[4])
    const token1DecimalsResult = erc20AbiInterface.decodeFunctionResult("decimals", resArr[5])

    setToken0Name(token0NameResult[0])
    setToken0Symbol(token0SymbolResult[0])
    setToken0Decimal(Number(token0DecimalsResult[0]))
    setToken1Name(token1NameResult[0])
    setToken1Symbol(token1SymbolResult[0])
    setToken1Decimal(Number(token1DecimalsResult[0]))
    setError("")
    } catch (error) {
      console.log("error => ", error);
      const err = error.message.split(" (")[0];
      console.error(err)
      setError(err)
    }
  }

  return (
    <div>
      {error ? <p className="bg-red text-red mt-4">{error}</p> : loading ? <p>Loading...</p> :
      <div className="grid grid-cols-1 gap-4  transition-all duration-1000 transform opacity-100 translate-y-0" 
       style={{animationName: 'fadeIn', animationDuration: '1.5s', animationTimingFunction: 'ease-out'}}>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          <strong>Token0:</strong> {token0Name} ({token0Symbol})
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          <strong>Token1:</strong> {token1Name} ({token1Symbol})
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          {token0Name} has {token0Decimal} Decimals
        </button>
        <button className="bg-pink-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          {token1Name} has {token1Decimal} Decimals 
        </button>
        <button className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          <strong>{token0Name} Reserves:</strong> {formatUnits(token0Reserve, token0Decimal)} {token0Symbol}
        </button>
        <button className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          <strong>{token1Name} Reserves:</strong>  {formatUnits(token1Reserve, token1Decimal)} {token1Symbol}
        </button>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
          <strong>Total LP Supply:</strong> {totalSupply}
        </button>
      </div>
    }
    </div>
  )
}

export default FetchData
