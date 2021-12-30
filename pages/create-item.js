import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from "web3modal"
import { pinJSONToIPFS } from './utils/pinata.js'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import { messagePrefix } from '@ethersproject/hash'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '', address: '' })
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      console.log(url)
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }
  async function createMarket() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return

    //make metadata
    const metadata = new Object();
    metadata.name = name;
    metadata.image = fileUrl;
    metadata.description = description;
    /* first, upload to IPFS */
    // const data = JSON.stringify({
    //   name, description, image: fileUrl
    // })

    try {
      // const added = await nftStorage.store({
      //   name: name,
      //   description: description,
      //   image: new File([fileTest], `${name}.png`, { type: "image/*" }),
      // })
      // const url = `${added.url}`

      //make pinata call
      const pinataResponse = await pinJSONToIPFS(metadata);
      if (!pinataResponse.success) {
        return {
          success: false,
          status: "😢 Something went wrong while uploading your tokenURI.",
        }
      }
      const tokenURI = pinataResponse.pinataUrl;
      /* after file is uploaded to IPFS, pass the URL to save it on Testnet */

      createSale(tokenURI)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    // console.log(signer.getAddress())
    var signerAddr = await signer.getAddress();
    console.log(`Signer address: ${signerAddr}`);

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    // if(await contract.isMember("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") == false){
    //   await contract.addMember("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    // }
    if (await contract.isMember(signerAddr) == false) {
      window.alert("ban khong co quyen mint");
      return
    }
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()
    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
    await transaction.wait()
    router.push('/')
  }

  async function addToWhitelist() {
    const { address } = formInput
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    if (!address) return
    else if (await contract.isMember(`${address}`) == false) {
      await contract.addMember(`${address}`)
      console.log(address)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Address add to white list to test mint"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, address: e.target.value })}
        />
        <button onClick={addToWhitelist} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Add to white list
        </button>
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )
        }
        <button onClick={createMarket} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create Digital Asset
        </button>
      </div>
    </div>
  )
}