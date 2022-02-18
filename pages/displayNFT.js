/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Popup from './popup'
import { useRouter } from 'next/router'

import {
  tokenaddress
} from '../config'

import Token from '../artifacts/contracts/Token.sol/Token.json'

export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const router = useRouter()
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(tokenaddress, Token.abi, provider)
    const data = await tokenContract.getTokenData()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let item = {
        tokenId: i.tokenId.toNumber(),
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }



  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFT</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Name - {nft.name}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}