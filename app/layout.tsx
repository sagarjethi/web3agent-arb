"use client"
import * as React from 'react';
import "./index.css";

import './globals.css'
import "./App.css";

import { Inter } from 'next/font/google'
import AuthProvider from '@/context/AuthProvider'
// import { Providers } from '../app/components/providers'
import { Providers } from './_components/providers';
import { OperationsProvider } from '../providers/operations';




import { SmartAccountProvider } from '../providers/smart-account.provider';
import { Web3Provider } from "../auth/Web3";
import SideToggle from '@/app/_components/sidetoggle';
import { TablelandProvider } from '@/context/TablelandProvider';

// const arbitrumSepolia = ({
//   id: 421614,
//   name: 'Arbitrum Sepolia Testnet',
//   network: 'arbitrum-sepolia',
//   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
//   rpcUrls: {
//     default: {
//       http: ['https://arbitrum-sepolia.blockpi.network/v1/rpc/public'],

//     },
//     public: {
//       http: ['https://arbitrum-sepolia.blockpi.network/v1/rpc/public'],

//     },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Blockscout',
//       url: 'https://sepolia-explorer.arbitrum.io',
//     },
//   },
//   testnet: true,
// } )







const inter = Inter({ subsets: ['latin'] })


// export const metadata = {
//   title: 'Web3Agent',
//   description: 'Web3 Agent AI',
// }
export default function RootLayout({

  children,
}: {
  children: React.ReactNode
}) {


  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="system" enableSystem>
          {/* <WagmiConfig client={ wagmiClient }> */}
          <Web3Provider>

            <SmartAccountProvider>
              <AuthProvider>
                <TablelandProvider>
                  <OperationsProvider>
                    {/* <Navbar /> */}
                    {/* <Header /> */}
                    {/* <Profile /> */}



                    <div className='' style={ { display: "flex", height: "screen", width: "auto" } }>
                      <div className='z-50' >
                        <SideToggle />
                      </div>
                      <div className="flex-1 p-7 ml-64"
                      
                      >
                       
                            <div
                              style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}
                              // className=' flex justify-center items-start p-6 min-h-screen'
                              // className='w-full'
                            >
                                {children}
                              </div>
                        </div>
                    </div>


                  </OperationsProvider>
                </TablelandProvider>
              </AuthProvider>
            </SmartAccountProvider>
          </Web3Provider>
        </Providers>
      </body>
    </html>
  )
}