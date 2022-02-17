/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Popup from './popup'
import { useRouter } from 'next/router'

import {
  nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [isOpen, setIsOpen] = useState(false)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '', level: '' })
  const router = useRouter()
  const togglePopup = () => {
    setIsOpen(!isOpen)
  }
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchMyNFTs()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }

  async function createSale(nft) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    const transaction = await contract.createMarketItem(nftaddress, nft.tokenId, price, { value: listingPrice })
    console.log("token id asset: ", nft.tokenId)
    await transaction.wait()
    router.push('/')
  }


  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={togglePopup}>Sell</button>
                </div>
                {isOpen && <Popup
                  content={<>
                    <b>Confirm Sell NFT</b>
                    <br />
                    <label>Name: </label>
                    <input
                      value={nft.name}
                      disabled
                    />
                    <br />
                    <label>Description: </label>
                    <input
                      value={nft.description}
                      disabled
                    />
                    <br />
                    <label>Price: </label>
                    <input
                      placeholder="Price"
                      onChange={e => updateFormInput({...formInput, price: e.target.value})}
                    />
                    <br />
                    <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => {createSale(nft)}}>Sell</button>
                  </>}
                  handleClose={togglePopup}
                />}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}