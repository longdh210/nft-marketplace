import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from "web3modal"
import { pinJSONToIPFS } from './pinata.js'
import { NFTStorage, Blob } from 'nft.storage';
import fs from 'fs';
var jsonObj = require("./metadata.json")

const clientInfura = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
const client = new NFTStorage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGE3MjI3MDE2NmYyQWI1ZDEzN2VkMGI4ZTJEQWE2NDc3MDVlMEFDQUEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzOTM4Mjc2NjUxMCwibmFtZSI6Im1pbnRORlQifQ.28rUXkCbSUX4t51EzSG2bj0pKSHJ0ZA-w5H_vvEu_Uc" });

import {
    tokenaddress
} from '../config'

import Token from '../artifacts/contracts/Token.sol/Token.json'
import { messagePrefix } from '@ethersproject/hash'

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '', address: '' })
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await clientInfura.add(
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
        // try {
        //   const fileCid = await client.storeBlob(new Blob([file]));
        //   const url = "https://ipfs.io/ipfs/" + fileCid;
        //   console.log(url)
        //   setFileUrl(url)
        // }
        // catch (error) {
        //   console.log('Error uploading file: ', error)
        // }
    }
    async function createMarket() {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        var signerAddr = await signer.getAddress();
        // console.log("Signer: ", signerAddr);

        const { name, description } = formInput
        if (!name || !description || !fileUrl) return

        //make metadata
        const metadata = new Object();
        metadata.name = name;
        metadata.image = fileUrl;
        metadata.description = description;
        metadata.addressOwner = "0xD337A3a6A24df02384297db32205EFEF17f1B099";
        // const obj = {
        //   "Name": name,
        //   "Description": description,
        //   "Level": level,
        //   "file_url": fileUrl
        // };
        /* first, upload to IPFS */
        // const data = JSON.stringify({
        //   name, description, image: fileUrl
        // })

        try {
            //make pinata call
            const pinataResponse = await pinJSONToIPFS(metadata);
            if (!pinataResponse.success) {
                return {
                    success: false,
                    status: "😢 Something went wrong while uploading your tokenURI.",
                }
            }
            const tokenURI = pinataResponse.pinataUrl;
            // const metadata = new Blob([JSON.stringify(obj)], { type: 'application/json' });
            // const metadataCid = await client.storeBlob(metadata);
            // const metadataUrl = "https://ipfs.io/ipfs/" + metadataCid;
            /* after file is uploaded to IPFS, pass the URL to save it on Testnet */

            console.log("tokenURI:", tokenURI)
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
        // var signerAddr = await signer.getAddress();
        // console.log(`Signer address: ${signerAddr}`);

        /* next, create the item */
        let contract = new ethers.Contract(tokenaddress, Token.abi, signer)
        await contract.mintNFT(url)
        router.push('/displayNFT')
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
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