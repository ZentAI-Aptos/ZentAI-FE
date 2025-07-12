import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";



const aptos = new Aptos(new AptosConfig({ network: "testnet" }));

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  return aptos;
}
