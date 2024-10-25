import { Keypair, StrKey, xdr, hash, Address, Account, TransactionBuilder, Operation, SorobanRpc } from "@stellar/stellar-sdk"

async function handleDeploy(bundlerKey: Keypair, contractSalt: Buffer, publicKey?: Buffer) {
    console.log(import.meta.env.VITE_PUBLIC_rpcUrl)
    const rpc = new SorobanRpc.Server(import.meta.env.VITE_PUBLIC_rpcUrl);
    const deployee = StrKey.encodeContract(hash(xdr.HashIdPreimage.envelopeTypeContractId(
        new xdr.HashIdPreimageContractId({
            networkId: hash(Buffer.from(import.meta.env.VITE_PUBLIC_networkPassphrase, 'utf-8')),
            contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
                new xdr.ContractIdPreimageFromAddress({
                    address: Address.fromString(import.meta.env.VITE_PUBLIC_factoryContractId).toScAddress(),
                    salt: contractSalt,
                })
            )
        })
    ).toXDR()));
    console.log(deployee)
    // This is a signup deploy vs a signin deploy. Look up if this contract has been already been deployed, otherwise fail
   if (!publicKey) {
        await rpc.getContractData(deployee, xdr.ScVal.scvLedgerKeyContractInstance())
        return deployee
    }

    const bundlerKeyAccount = await rpc.getAccount(bundlerKey.publicKey()).then((res) => new Account(res.accountId(), res.sequenceNumber()))
    const simTxn = new TransactionBuilder(bundlerKeyAccount, {
        fee: '100',
        networkPassphrase: import.meta.env.VITE_PUBLIC_networkPassphrase
    })
        .addOperation(
            Operation.invokeContractFunction({
                contract: import.meta.env.VITE_PUBLIC_factoryContractId,
                function: 'deploy',
                args: [
                    xdr.ScVal.scvBytes(contractSalt),
                    xdr.ScVal.scvBytes(publicKey),
                ]
            })
        )
        .setTimeout(0)
        .build();

    const sim = await rpc.simulateTransaction(simTxn)

    if (
        SorobanRpc.Api.isSimulationError(sim)
        || SorobanRpc.Api.isSimulationRestore(sim)
    ) throw sim

    const transaction = SorobanRpc.assembleTransaction(simTxn, sim).setTimeout(0).build()

    transaction.sign(bundlerKey);

    // TODO failure here is resulting in sp:deployee undefined
    // TODO handle archived entries

    const txResp = await (await fetch(`${import.meta.env.VITE_PUBLIC_horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'tx': transaction.toXDR() }),
    })).json();

    if (txResp.successful) {
        return deployee
    } else {
        throw txResp
    }
}

export { handleDeploy }
