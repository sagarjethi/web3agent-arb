'use client'

import { ChatRequest, FunctionCallHandler } from "ai";
import { useChat, type Message } from "ai/react";
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

import { cn } from '@/app/lib/utils'
import { ChatList } from '@/app/_components/chat-list'
import { ChatPanel } from '@/app/_components/chat-panel'
import { EmptyScreen } from '@/app/_components/empty-screen'
import { ChatScrollAnchor } from '@/app/_components/chat-scroll-anchor'
import { nanoid } from '@/app/lib/utils'
import { functionSchemas } from "@/app/lib/functions/schemas";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { VerifyContractParams } from "@/app/lib/functions/types";
import LoginErrorMsg from "./LoginErrorMsg";
import React from "react";
import WebAuth from "./WebAuth";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Pleaseconnect from "./pleaseconnect";
import { useTableland } from "@/context/TablelandProvider";
import { storeJSON } from "@/utils/saveHistory";
import Loader from '@/components/Loader'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

const VALID_CHAIN_NAME = ['mainnet', 'optimism', 'arbitrum']


export function Chat({ id, initialMessages, className }: ChatProps) {
  const [verificationParams, setVerificationParams] = useState<VerifyContractParams>()
  const [polling, setPolling] = useState(false)
  const { writeTable, isLoading: tlLoading, setIsLoading } = useTableland();
  const { address, connector, isConnected } = useAccount();
  useEffect(() => {
    const verifyFunction = async (verificationParams: VerifyContractParams) => {
      if (verificationParams) {
        const publicClient = createPublicClient({
          chain: verificationParams?.viemChain,
          transport: http(verificationParams?.viemChain?.rpcUrls?.default?.http[0])
        })
        try {
          console.log("waiting for 4 confirmations")
          const transactionReceipt = await publicClient.waitForTransactionReceipt(
            { hash: verificationParams?.deployHash, confirmations: 4 }
          )
          console.log("got 4 confirmations, verifying contract")
          if (transactionReceipt) {
            const verifyResponse = await fetch(
              '/api/verify-contract',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(verificationParams)
              })
            if (verifyResponse.ok) {
              setPolling(false)
            }
          }
        } catch (e) {
          console.log('Verification failed, may need more confirmations.', e)
        }
      }
    }

    if (polling && verificationParams) {
      const interval = setInterval(() => {
        verifyFunction(verificationParams)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [polling, verificationParams])



  const functionCallHandler: FunctionCallHandler = async (
    chatMessages,
    functionCall
  ) => {
    console.log("functionCall.name ", functionCall)
    if (functionCall.name === 'deploy_contract') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?

      const response = await fetch(
        '/api/deploy-contract',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: functionCall.arguments
        })

      let content: string;
      let role: 'system' | 'function';

      if (response.ok) {
        const { explorerUrl, ipfsUrl, verificationParams } = await response.json()
        setVerificationParams(verificationParams)
        setPolling(true)
        content = JSON.stringify({ explorerUrl, ipfsUrl }) + '\n\n' + 'Your contract will be automativally verified after 4 block confirmations. Keep this tab open.'
        role = 'function'

      } else {
        const { error } = await response?.json() ?? {}
        content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'deploy_contract',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_top_nft_holder') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { contract_address: string, chain_name: string } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ args })

      if (args && args?.contract_address && args?.chain_name) {
        try {
          let _address = args.contract_address;
          let _chain_name = args.chain_name.toLowerCase();
          if (!VALID_CHAIN_NAME.includes(_chain_name)) {
            content = 'Invalid chain name'
          } else {
            response = await fetch(
              `/api/top-nft-holders?address=${_address}&chain_name=${_chain_name}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                },
              }
            )
            const { message, data } = await response.json()
            if (data && data?.length) {
              content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
            } else {
              content = 'No top nft holders found!'
            }
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_top_nft_holder',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_tokens_by_symbol') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { token_symbol: string } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ args })

      if (args && args?.token_symbol) {
        try {
          let _token_symbol = args.token_symbol.toLowerCase();;

          response = await fetch(
            `/api/tokens-by-symbol?token_symbol=${_token_symbol}&chain_name=${_token_symbol}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data } = await response.json()
          if (data && data?.length) {
            content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No Tokens found!'
          }

          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'tokens_by_symbol',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'show_list_of_protocols_for_wallet_address') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { address: string } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ args })

      if (args && args?.address) {
        try {
          response = await fetch(
            `/api/protocols?address=${args.address}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data } = await response.json()
          if (data) {
            content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No Protocols Details found!'
          }

          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_list_of_protocols_for_wallet_address',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_nft_metadata_using_contract_address_token_id_and_chain_name') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { contract_address: string, chain_name: string, token_id: string } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ args })

      if (args && args?.token_id && args?.chain_name && args?.contract_address) {
        try {
          let _contract_address = args.contract_address;
          let _token_id = args.token_id;
          let _chain_name = args.chain_name.toLowerCase();
          if (!VALID_CHAIN_NAME.includes(_chain_name)) {
            content = 'Invalid chain name'
          } else {
            response = await fetch(
              `/api/nft-metadata?contract_address=${_contract_address}&chain_name=${_chain_name}&token_id=${_token_id}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                },
              }
            )
            const { message, data } = await response.json()
            if (data) {
              content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
            } else {
              content = 'No NFT Metadata Details found!'
            }
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_nft_metadata_using_contract_address_token_id_and_chain_name',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_transaction_details_by_txn_hash_and_chain_name') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { txn_hash: string, chain_name: string } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ args })

      if (args && args?.txn_hash && args?.chain_name) {
        try {
          let _txn_hash = args.txn_hash;
          let _chain_name = args.chain_name.toLowerCase();
          if (!VALID_CHAIN_NAME.includes(_chain_name)) {
            content = 'Invalid chain name'
          } else {
            response = await fetch(
              `/api/transaction?txn_hash=${_txn_hash}&chain_name=${_chain_name}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                },
              }
            )
            const { message, data } = await response.json()
            if (data) {
              content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
            } else {
              content = 'No Transaction Details found!'
            }
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_transaction_details_by_txn_hash_and_chain_name',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'show_coins_for_wallet_address') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { address: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ address })
      if (args && args?.address) {
        try {
          response = await fetch(
            `/api/my-account-balance?address=${args.address}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data, total } = await response.json()
          if (data && data?.length) {
            content = JSON.stringify({ message, total, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No coins found!'
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_coins_for_wallet_address',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_tokens_for_wallet_address') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { address: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ address })
      if (args && args?.address) {
        try {
          response = await fetch(
            `/api/tokens?address=${args.address}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data, total } = await response.json()
          if (data && data?.length) {
            content = JSON.stringify({ message, total, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No tokens found!'
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_tokens_for_wallet_address',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_portfolio_for_wallet_address') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { address: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ address })
      if (args && args?.address) {
        try {
          response = await fetch(
            `/api/portfolio?address=${args.address}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data, total } = await response.json()
          if (data && data?.length) {
            content = JSON.stringify({ message, total, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No portfolio found!'
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_portfolio_for_wallet_address',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_my_nft_balance') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { address: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ args, address })
      if (args && args?.address) {
        try {
          response = await fetch(
            `/api/nft-balance?address=${args.address}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data } = await response.json()
          if (data && data?.length) {
            content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No nft balance found!'
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_my_nft_balance',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
    if (functionCall.name === 'show_my_detailed_account_balance') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { account: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      console.log({ address })
      if (address && address.length) {
        try {
          response = await fetch(
            `/api/my-account-balance?address=${address}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          const { message, data } = await response.json()
          if (data && data?.length) {
            content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          } else {
            content = 'No account balance found!'
          }
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "Something went wrong!!!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'show_my_detailed_account_balance',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'get_account_balance') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { account: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      if (args && args?.account && args?.chainId) {
        try {
          response = await fetch(
            `/api/account-balance?account=${args.account}&chainId=${args.chainId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            })
          const { message, data } = await response.json()
          content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "account and chain id is required!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'get_account_balance',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'get_transaction_by_hash') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { txnHash: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      if (args && args?.chainId && args?.txnHash) {
        try {
          response = await fetch(
            `/api/transaction-by-hash?txnHash=${args.txnHash}&chainId=${args.chainId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            })
          const { message, data } = await response.json()
          content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "account and chain id is required!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }
      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'get_transaction_by_hash',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'get_gas_price') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { txnHash: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      if (args && args?.chainId) {
        try {
          response = await fetch(
            `/api/gas-price?chainId=${args.chainId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            })
          const { message, data } = await response.json()
          content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "account and chain id is required!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }
      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'get_gas_price',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'get_latest_block_number') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { txnHash: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      if (args && args?.chainId) {
        try {
          response = await fetch(
            `/api/block-number?chainId=${args.chainId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            })
          const { message, data } = await response.json()
          content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
          role = 'function'
        } catch (error) {
          content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
          role = 'system'
        }
      } else {
        content = "account and chain id is required!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }
      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'get_latest_block_number',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }

    if (functionCall.name === 'get_coins_list') {
      // You now have access to the parsed arguments here (assuming the JSON was valid)
      // If JSON is invalid, return an appropriate message to the model so that it may retry?
      const args: { txnHash: string, chainId: number } = JSON.parse(functionCall?.arguments)
      let response: any;
      let content: string;
      let role: 'system' | 'function';
      // if (args && args?.chainId) {
      try {
        response = await fetch(
          `/api/coins`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          })
        const { message, data } = await response.json()
        content = JSON.stringify({ message, data }) + '\n\n' + 'Here is details.'
        role = 'function'
      } catch (error) {
        content = JSON.stringify({ error }) + '\n\n' + 'Try to fix the error and show the user the updated code.'
        role = 'system'
      }
      // } else {
      //   content = "account and chain id is required!" + '\n\n' + 'Try to fix the error and show the user the updated code.'
      //   role = 'system'
      // }
      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: 'get_coins_list',
            role: role,
            content: content,
          }
        ],
        functions: functionSchemas as any
      }

      return functionResponse

    }
  }

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      experimental_onFunctionCall: functionCallHandler,
      initialMessages,
      id,
      body: {
        id
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      }
    })
  const session: any = {}//useSession()
  if (!session) {
    return <LoginErrorMsg
      classname="flex flex-col justify-center items-center h-[calc(100vh-120px)]"
      title="Login Requires!"
      titleClassName="text-2xl font-bold my-2 text-green-600"
      subTitle="Please Login to Access Propmt!"
      subTitleClassName="text-lg font-bold my-2 text-green-500"
    />
  }
  async function makeBackUpChat() {
    if (messages) {
      const cid = await storeJSON(messages)
      writeTable({ action: 'CHAT_BACKUP', object: { timestamp: Date.now(), cid } })
    }

  }
  return (
    <>
      {tlLoading && <Loader showCloseIcon onClick={setIsLoading} />}
      {isConnected ? (<>

        {console.log({ messages })}
        <div className={cn('pb-[200px] pt-4 md:pt-10 w-full', className)}>
          {messages.length > 1 ? (
            <>
              <ChatList messages={messages} />
              <ChatScrollAnchor trackVisibility={isLoading} />
            </>
          ) : (
            <EmptyScreen setInput={setInput} />
          )}
        </div>
        <ChatPanel
          backupChat={() => {
            console.log({ messages });
            makeBackUpChat();
          }}
          id={id}
          isLoading={isLoading}
          stop={stop}
          append={append}
          reload={reload}
          messages={messages}
          input={input}
          setInput={setInput}
        />

      </>) : (<>

        {/* <div style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", fontSize:"15px"}}>
            <h1 style={{ marginBottom:"15px", fontSize:"20px", fontWeight:"initial", color:"GrayText"}} >You need to connect your wallet first!</h1>
            <ConnectButton></ConnectButton>

          </div> */}
        <Pleaseconnect></Pleaseconnect>

      </>)}

    </>
  )
}